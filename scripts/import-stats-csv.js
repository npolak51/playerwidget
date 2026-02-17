import fs from "node:fs";
import path from "node:path";

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeText(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  let headerIdx = lines.findIndex((l) => l.includes("Number") && l.includes("Last") && l.includes("First"));
  if (headerIdx === -1) headerIdx = 0;

  const header = parseCsvLine(lines[headerIdx]).map((h) => h.trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => (c ?? "").trim() === "")) continue;
    rows.push(cols);
  }
  return { header, rows };
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function isBlankOrInvalid(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return !s || s === "-" || s === "n/a" || s === "#n/a" || s.includes("#n/a");
}

function normRate(s) {
  const v = String(s ?? "").trim();
  if (isBlankOrInvalid(v)) return "";
  if (v.startsWith("0.")) return v.slice(1);
  return v;
}

function toInt(s) {
  const v = String(s ?? "").trim();
  if (isBlankOrInvalid(v)) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function parseIPToOuts(ipStr) {
  const v = String(ipStr ?? "").trim();
  if (isBlankOrInvalid(v)) return 0;
  const [wholeStr, fracStr] = v.split(".");
  const whole = Number(wholeStr) || 0;
  const frac = Number(fracStr || "0") || 0;
  return whole * 3 + (frac === 1 ? 1 : frac === 2 ? 2 : 0);
}

function formatOutsToIP(outs) {
  const o = Math.max(0, Math.trunc(outs));
  const whole = Math.floor(o / 3);
  const rem = o % 3;
  return `${whole}.${rem}`;
}

function pickYearFromFilename(csvPath) {
  const base = path.basename(csvPath);
  const m = base.match(/(19|20)\d{2}/);
  return m ? m[0] : null;
}

function inferTeamFromFilename(csvPath) {
  const base = path.basename(csvPath).toLowerCase();
  if (base.includes("junior varsity")) return "JV";
  if (base.includes("varsity")) return "Var.";
  return "";
}

function normalizeTeam(t) {
  const v = String(t ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v.includes("junior") || v === "jv") return "JV";
  if (v.startsWith("var")) return "Var.";
  return v.toUpperCase();
}

function toGradYear(v) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return null;
  // Expect 4-digit year like 2025
  if (n >= 1900 && n <= 2100) return n;
  return null;
}

function deriveClassLabel({ gradYear, seasonYear }) {
  const g = toGradYear(gradYear);
  const s = Number(String(seasonYear ?? "").trim());
  if (!g || !Number.isFinite(s)) return "";

  // If gradYear is 2025:
  // 2025 => Sr., 2024 => Jr., 2023 => So., 2022 => Fr.
  const delta = g - s;
  if (delta === 0) return "Sr.";
  if (delta === 1) return "Jr.";
  if (delta === 2) return "So.";
  if (delta === 3) return "Fr.";
  return "";
}

function migrateYearToYYYY(y) {
  const v = String(y ?? "").trim();
  if (/^(19|20)\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})-(\d{2})$/);
  if (m) {
    const endYY = Number(m[2]);
    if (Number.isFinite(endYY)) return String(2000 + endYY);
  }
  return v;
}

function computeBattingTotals(seasons, teamLabel = "") {
  let PA = 0, H = 0, RBI = 0, R = 0, SB = 0, SO = 0, BB = 0, HBP = 0, SF = 0, AB = 0, TB = 0, XBH = 0;
  for (const s of seasons) {
    PA += toInt(s.PA);
    H += toInt(s.H);
    RBI += toInt(s.RBI);
    R += toInt(s.R);
    SB += toInt(s.SB);
    SO += toInt(s.SO);
    BB += toInt(s.BB);
    HBP += toInt(s.HBP);
    SF += toInt(s.SF);
    AB += toInt(s.AB);
    TB += toInt(s.TB);
    XBH += toInt(s.XBH);
  }

  const avg = AB > 0 ? (H / AB) : 0;
  const obpDen = AB + BB + HBP + SF;
  const obp = obpDen > 0 ? ((H + BB + HBP) / obpDen) : 0;
  const slg = AB > 0 ? (TB / AB) : 0;

  return {
    team: normalizeTeam(teamLabel),
    PA,
    AB,
    H,
    RBI,
    R,
    XBH,
    KBB: `${SO}/${BB}`,
    SB,
    AVG: avg ? normRate(avg.toFixed(3)) : "",
    OBP: obp ? normRate(obp.toFixed(3)) : "",
    SLG: slg ? normRate(slg.toFixed(3)) : ""
  };
}

function computePitchingTotals(seasons, teamLabel = "") {
  let outs = 0, H = 0, R = 0, ER = 0, BB = 0, K = 0, HBP = 0, WP = 0;
  let estAB = 0;

  for (const s of seasons) {
    outs += parseIPToOuts(s.IP);
    H += toInt(s.H);
    R += toInt(s.R);
    ER += toInt(s.ER);
    BB += toInt(s.BB);
    K += toInt(s.K);
    HBP += toInt(s.HBP);
    WP += toInt(s.WP);

    const baa = String(s.BAA || "").trim();
    const baaNum = baa ? Number(baa.startsWith(".") ? `0${baa}` : baa) : NaN;
    if (Number.isFinite(baaNum) && baaNum > 0) {
      estAB += Math.round(toInt(s.H) / baaNum);
    }
  }

  const ip = outs / 3;
  const era = ip > 0 ? ((ER * 7) / ip) : 0; // HS uses 7 inning ERA
  const whip = ip > 0 ? ((BB + H) / ip) : 0;
  const baa = estAB > 0 ? (H / estAB) : 0;

  return {
    team: normalizeTeam(teamLabel),
    IP: formatOutsToIP(outs),
    H,
    R,
    ER,
    BB,
    K,
    HBP,
    WP,
    ERA: era ? era.toFixed(2) : "",
    WHIP: whip ? whip.toFixed(2) : "",
    BAA: baa ? normRate(baa.toFixed(3)) : ""
  };
}

function safeGet(row, idx) {
  return idx >= 0 && idx < row.length ? row[idx] : "";
}

function listCsvFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".csv"))
    .map((e) => path.join(dir, e.name));
}

function groupCsvsByYearAndTeam(csvPaths) {
  const groups = new Map(); // key `${year}::${team}` -> [paths]
  for (const p of csvPaths) {
    const year = pickYearFromFilename(p);
    const team = inferTeamFromFilename(p);
    if (!year || !team) continue;
    const key = `${year}::${normalizeTeam(team)}`;
    const arr = groups.get(key) || [];
    arr.push(p);
    groups.set(key, arr);
  }
  // Sort each group for deterministic merges.
  for (const [k, arr] of groups.entries()) {
    arr.sort((a, b) => String(a).localeCompare(String(b)));
    groups.set(k, arr);
  }
  return groups;
}

function sumSeasonBatting(a, b) {
  // Combine two batting season objects by summing count stats and recomputing rates.
  const A = a || {};
  const B = b || {};
  const PA = toInt(A.PA) + toInt(B.PA);
  const AB = toInt(A.AB) + toInt(B.AB);
  const H = toInt(A.H) + toInt(B.H);
  const R = toInt(A.R) + toInt(B.R);
  const RBI = toInt(A.RBI) + toInt(B.RBI);
  const SB = toInt(A.SB) + toInt(B.SB);
  const BB = toInt(A.BB) + toInt(B.BB);
  const SO = toInt(A.SO) + toInt(B.SO);
  const HBP = toInt(A.HBP) + toInt(B.HBP);
  const SF = toInt(A.SF) + toInt(B.SF);
  const TB = toInt(A.TB) + toInt(B.TB);
  const HR = toInt(A.HR) + toInt(B.HR);
  const XBH = toInt(A.XBH) + toInt(B.XBH);

  const avg = AB > 0 ? (H / AB) : 0;
  const obpDen = AB + BB + HBP + SF;
  const obp = obpDen > 0 ? ((H + BB + HBP) / obpDen) : 0;
  const slg = AB > 0 ? (TB / AB) : 0;

  return {
    ...A,
    ...B,
    PA,
    AB,
    H,
    R,
    RBI,
    SB,
    BB,
    SO,
    HBP,
    SF,
    TB,
    HR,
    XBH,
    KBB: `${SO}/${BB}`,
    AVG: avg ? normRate(avg.toFixed(3)) : "",
    OBP: obp ? normRate(obp.toFixed(3)) : "",
    SLG: slg ? normRate(slg.toFixed(3)) : "",
  };
}

function sumSeasonPitching(a, b) {
  // Combine two pitching season objects by summing count stats and recomputing rate stats.
  const A = a || {};
  const B = b || {};
  const outs = parseIPToOuts(A.IP) + parseIPToOuts(B.IP);
  const H = toInt(A.H) + toInt(B.H);
  const R = toInt(A.R) + toInt(B.R);
  const ER = toInt(A.ER) + toInt(B.ER);
  const BB = toInt(A.BB) + toInt(B.BB);
  const K = toInt(A.K) + toInt(B.K);
  const HBP = toInt(A.HBP) + toInt(B.HBP);
  const WP = toInt(A.WP) + toInt(B.WP);

  // Weighted estimate for BAA.
  const estAB =
    (A.__estAB || 0) +
    (B.__estAB || 0);

  const ip = outs / 3;
  const era = ip > 0 ? ((ER * 7) / ip) : 0;
  const whip = ip > 0 ? ((BB + H) / ip) : 0;
  const baa = estAB > 0 ? (H / estAB) : 0;

  return {
    ...A,
    ...B,
    IP: formatOutsToIP(outs),
    H,
    R,
    ER,
    BB,
    K,
    HBP,
    WP,
    ERA: era ? era.toFixed(2) : "",
    WHIP: whip ? whip.toFixed(2) : "",
    BAA: baa ? normRate(baa.toFixed(3)) : "",
    __estAB: estAB,
  };
}

function main() {
  const csvPathArg = process.argv.find((a) => a.startsWith("--csv="));
  const csvDirArg = process.argv.find((a) => a.startsWith("--csvDir="));
  const yearArg = process.argv.find((a) => a.startsWith("--year="));
  const csvDir = csvDirArg ? csvDirArg.slice("--csvDir=".length) : "";

  const defaultCsv = "src/data/stats-csv/Tahoma Varsity Bears Spring 2025 Stats.csv";
  const csvPath = csvPathArg ? csvPathArg.slice("--csv=".length) : defaultCsv;

  // If a directory is provided and the user didn't explicitly specify --year,
  // we treat this as "import all years" (do NOT default to the year in defaultCsv).
  const inferredYear = pickYearFromFilename(csvPath);
  const year = yearArg ? yearArg.slice("--year=".length) : csvDir ? null : inferredYear;

  const inputCsvPaths = csvDir
    ? year
      ? listCsvFiles(csvDir).filter((p) => String(p).includes(String(year)))
      : listCsvFiles(csvDir)
    : [csvPath];

  if (!inputCsvPaths.length) {
    console.error(`No CSV files found${year ? ` for year ${year}` : ""}${csvDir ? ` in ${csvDir}` : ""}.`);
    process.exit(1);
  }

  if (!year && !csvDir) {
    console.error("Could not determine year. Pass --year=2025 or use --csvDir to import all years in a folder.");
    process.exit(1);
  }

  const playersPath = "src/data/players.json";
  const statsPath = "src/data/stats.json";

  const players = JSON.parse(readText(playersPath));
  const playerIds = new Set(Object.keys(players.players || {}));

  const existing = fs.existsSync(statsPath) ? JSON.parse(readText(statsPath)) : { players: {} };
  if (!existing.players) existing.players = {};

  const groups = csvDir
    ? groupCsvsByYearAndTeam(inputCsvPaths)
    : groupCsvsByYearAndTeam([csvPath]);

  if (!groups.size) {
    console.error("No importable CSVs found (need filename year + Varsity/Junior Varsity in name).");
    process.exit(1);
  }

  // Accumulate seasons across ALL CSVs (so multiple JV teams combine), keyed by player+year+team.
  const seasonAgg = new Map(); // `${playerId}::${year}::${team}` -> { battingSeason, pitchingSeason }

  let updatedPlayers = 0;
  for (const [groupKey, csvs] of groups.entries()) {
    const [groupYear, groupTeam] = String(groupKey).split("::");
    if (!groupYear || !groupTeam) continue;

    for (const oneCsvPath of csvs) {
      const teamFromFile = inferTeamFromFilename(oneCsvPath);
      const { header, rows } = parseCsv(readText(oneCsvPath));

      // Find the *first* header line "Number,Last,First,..."
      const headerMap = new Map();
      header.forEach((h, i) => {
        const key = String(h || "").trim();
        if (!key) return;
        if (!headerMap.has(key)) headerMap.set(key, i);
      });
      const idx = (name) => (headerMap.has(name) ? headerMap.get(name) : -1);

      const iNum = idx("Number");
      const iLast = idx("Last");
      const iFirst = idx("First");

      // Batting fields (first occurrence)
      const iPA = idx("PA");
      const iAB = idx("AB");
      const iH = idx("H");
      const iRBI = idx("RBI");
      const iR = idx("R");
      const i2B = idx("2B");
      const i3B = idx("3B");
      const iHR = idx("HR");
      const iSB = idx("SB");
      const iAVG = idx("AVG");
      const iOBP = idx("OBP");
      const iSLG = idx("SLG");
      const iBB_bat = idx("BB");
      const iSO_bat = idx("SO");
      const iHBP_bat = idx("HBP");
      const iSF_bat = idx("SF");
      const iTB = idx("TB");

      // Pitching fields: locate columns after the Pitching "IP" header
      const findAfter = (startName, targetName) => {
        const start = header.indexOf(startName);
        if (start < 0) return -1;
        for (let i = start + 1; i < header.length; i++) {
          if (header[i] === targetName) return i;
        }
        return -1;
      };
      const iIP = header.indexOf("IP");
      const iH_pitch = findAfter("IP", "H");
      const iR_pitch = findAfter("IP", "R");
      const iER_pitch = findAfter("IP", "ER");
      const iBB_pitch = findAfter("IP", "BB");
      const iSO_pitch = findAfter("IP", "SO");
      const iHBP_pitch = findAfter("IP", "HBP");
      const iERA = findAfter("IP", "ERA");
      const iWHIP = findAfter("IP", "WHIP");
      const iBAA = findAfter("IP", "BAA");
      const iWP = findAfter("IP", "WP");

      for (const row of rows) {
        const last = safeGet(row, iLast).trim();
        const first = safeGet(row, iFirst).trim();
        if (!last || !first) continue;
        if (last.toLowerCase() === "last" || first.toLowerCase() === "first") continue;

        const playerId = slugify(`${first}-${last}`);
        if (!playerIds.has(playerId)) continue;

        const num = safeGet(row, iNum).trim();
        const gradYear = players.players?.[playerId]?.class ?? "";
        const classLabel = deriveClassLabel({ gradYear, seasonYear: groupYear });

        const BB = toInt(safeGet(row, iBB_bat));
        const SO = toInt(safeGet(row, iSO_bat));
        const HR = toInt(safeGet(row, iHR));
        const d2B = toInt(safeGet(row, i2B));
        const d3B = toInt(safeGet(row, i3B));
        const XBH = d2B + d3B + HR;
        const H = toInt(safeGet(row, iH));
        const AB = toInt(safeGet(row, iAB));

        let TB = toInt(safeGet(row, iTB));
        if (TB === 0 && AB > 0 && H > 0) {
          TB = H + d2B + 2 * d3B + 3 * HR;
        }

        const battingSeason = {
          year: String(groupYear),
          class: classLabel,
          team: normalizeTeam(groupTeam),
          number: num || "",
          PA: toInt(safeGet(row, iPA)),
          H,
          RBI: toInt(safeGet(row, iRBI)),
          R: toInt(safeGet(row, iR)),
          XBH,
          HR,
          SB: toInt(safeGet(row, iSB)),
          KBB: `${SO}/${BB}`,
          AVG: normRate(safeGet(row, iAVG)),
          OBP: normRate(safeGet(row, iOBP)),
          SLG: normRate(safeGet(row, iSLG)),
          AB,
          BB,
          SO,
          HBP: toInt(safeGet(row, iHBP_bat)),
          SF: toInt(safeGet(row, iSF_bat)),
          TB,
        };

        const ipStr = String(safeGet(row, iIP)).trim();
        const hPitch = toInt(safeGet(row, iH_pitch));
        const baa = normRate(safeGet(row, iBAA));
        const baaNum = baa ? Number(baa.startsWith(".") ? `0${baa}` : baa) : NaN;
        const estAB = Number.isFinite(baaNum) && baaNum > 0 ? Math.round(hPitch / baaNum) : 0;

        const pitchingSeason = {
          year: String(groupYear),
          class: classLabel,
          team: normalizeTeam(groupTeam),
          number: num || "",
          IP: ipStr,
          H: hPitch,
          R: toInt(safeGet(row, iR_pitch)),
          ER: toInt(safeGet(row, iER_pitch)),
          BB: toInt(safeGet(row, iBB_pitch)),
          K: toInt(safeGet(row, iSO_pitch)),
          ERA: String(safeGet(row, iERA)).trim(),
          WHIP: String(safeGet(row, iWHIP)).trim(),
          BAA: baa,
          HBP: toInt(safeGet(row, iHBP_pitch)),
          WP: toInt(safeGet(row, iWP)),
          __estAB: estAB,
        };

        const key = `${playerId}::${groupYear}::${normalizeTeam(groupTeam)}`;
        const prev = seasonAgg.get(key) || { battingSeason: null, pitchingSeason: null };
        const mergedBat = prev.battingSeason ? sumSeasonBatting(prev.battingSeason, battingSeason) : battingSeason;
        const mergedPit = prev.pitchingSeason ? sumSeasonPitching(prev.pitchingSeason, pitchingSeason) : pitchingSeason;
        seasonAgg.set(key, { battingSeason: mergedBat, pitchingSeason: mergedPit });
      }
    }
  }

  // Apply aggregates to stats.json (upsert year+team, but using merged seasons).
  for (const [key, agg] of seasonAgg.entries()) {
    const [playerId, y, team] = key.split("::");
    if (!playerId || !team || !y) continue;
    const p = existing.players[playerId] || {};
    existing.players[playerId] = p;

    p.batting = p.batting || { seasons: [], careerTotals: null };
    p.pitching = p.pitching || { seasons: [], careerTotals: null };

    // Normalize/migrate existing seasons
    p.batting.seasons = (p.batting.seasons || []).map((s) => ({
      ...s,
      year: migrateYearToYYYY(s.year),
      team: normalizeTeam(s.team),
    }));
    p.pitching.seasons = (p.pitching.seasons || []).map((s) => ({
      ...s,
      year: migrateYearToYYYY(s.year),
      team: normalizeTeam(s.team),
    }));

    // Upsert season rows by year+team
    p.batting.seasons = p.batting.seasons.filter(
      (s) => !(String(s.year) === String(y) && normalizeTeam(s.team) === normalizeTeam(team))
    );
    if (agg.battingSeason) {
      p.batting.seasons.push(agg.battingSeason);
      p.batting.seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }

    p.pitching.seasons = p.pitching.seasons.filter(
      (s) => !(String(s.year) === String(y) && normalizeTeam(s.team) === normalizeTeam(team))
    );
    if (agg.pitchingSeason && parseIPToOuts(agg.pitchingSeason.IP) > 0) {
      p.pitching.seasons.push(agg.pitchingSeason);
      p.pitching.seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }

    updatedPlayers++;
  }

  // Migrate any existing dual-career schema -> single careerTotals using Varsity-first rule
  for (const pid of Object.keys(existing.players)) {
    const p = existing.players[pid];
    for (const blockKey of ["batting", "pitching"]) {
      const block = p?.[blockKey];
      if (!block) continue;

      // If we have dual totals, prefer Var then JV
      const varTotals = block.careerTotalsVar ?? null;
      const jvTotals = block.careerTotalsJV ?? null;

      if (varTotals || jvTotals) {
        block.careerTotals = varTotals || jvTotals;
        delete block.careerTotalsVar;
        delete block.careerTotalsJV;
      }
    }
  }

  // Recompute careerTotals using Varsity-first rule
  for (const pid of Object.keys(existing.players)) {
    const p = existing.players[pid];
    const gradYear = players.players?.[pid]?.class ?? "";

    if (p?.batting?.seasons) {
      const seasons = p.batting.seasons.map((s) => ({
        ...s,
        team: normalizeTeam(s.team),
        year: migrateYearToYYYY(s.year),
        class:
          String(s.class ?? "").trim() ||
          deriveClassLabel({ gradYear, seasonYear: migrateYearToYYYY(s.year) })
      }));
      const varSeasons = seasons.filter((s) => s.team === "Var.");
      const jvSeasons = seasons.filter((s) => s.team === "JV");
      const careerSeasons = varSeasons.length ? varSeasons : jvSeasons;
      // Persist backfilled class labels
      p.batting.seasons = seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      p.batting.careerTotals = careerSeasons.length ? computeBattingTotals(careerSeasons, careerSeasons[0].team) : null;
    }

    if (p?.pitching?.seasons) {
      const seasons = p.pitching.seasons.map((s) => ({
        ...s,
        team: normalizeTeam(s.team),
        year: migrateYearToYYYY(s.year),
        class:
          String(s.class ?? "").trim() ||
          deriveClassLabel({ gradYear, seasonYear: migrateYearToYYYY(s.year) })
      }));
      const varSeasons = seasons.filter((s) => s.team === "Var.");
      const jvSeasons = seasons.filter((s) => s.team === "JV");
      const careerSeasons = varSeasons.length ? varSeasons : jvSeasons;
      p.pitching.seasons = seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      p.pitching.careerTotals = careerSeasons.length ? computePitchingTotals(careerSeasons, careerSeasons[0].team) : null;
    }
  }

  writeText(statsPath, JSON.stringify(existing, null, 2) + "\n");
  console.log(
    csvDir
      ? year
        ? `Imported year ${year} from CSV dir: ${csvDir} (${inputCsvPaths.length} files)`
        : `Imported all years from CSV dir: ${csvDir} (${inputCsvPaths.length} files)`
      : `Imported year ${year} from CSV: ${csvPath}`
  );
  console.log(`Updated players: ${updatedPlayers}`);
}

main();


