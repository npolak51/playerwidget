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

function normRate(s) {
  const v = String(s ?? "").trim();
  if (!v || v === "-" || v.toLowerCase() === "n/a") return "";
  if (v.startsWith("0.")) return v.slice(1);
  return v;
}

function toInt(s) {
  const v = String(s ?? "").trim();
  if (!v || v === "-" || v.toLowerCase() === "n/a") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function parseIPToOuts(ipStr) {
  const v = String(ipStr ?? "").trim();
  if (!v || v.toLowerCase() === "n/a" || v === "-") return 0;
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
  let outs = 0, H = 0, R = 0, ER = 0, BB = 0, K = 0, HBP = 0;
  let estAB = 0;

  for (const s of seasons) {
    outs += parseIPToOuts(s.IP);
    H += toInt(s.H);
    R += toInt(s.R);
    ER += toInt(s.ER);
    BB += toInt(s.BB);
    K += toInt(s.K);
    HBP += toInt(s.HBP);

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
    ERA: era ? era.toFixed(2) : "",
    WHIP: whip ? whip.toFixed(2) : "",
    BAA: baa ? normRate(baa.toFixed(3)) : ""
  };
}

function safeGet(row, idx) {
  return idx >= 0 && idx < row.length ? row[idx] : "";
}

function main() {
  const csvPathArg = process.argv.find((a) => a.startsWith("--csv="));
  const yearArg = process.argv.find((a) => a.startsWith("--year="));
  const csvPath = csvPathArg ? csvPathArg.slice("--csv=".length) : "src/data/stats-csv/Tahoma Varsity Bears Spring 2025 Stats.csv";
  const inferredYear = pickYearFromFilename(csvPath);
  const year = yearArg ? yearArg.slice("--year=".length) : inferredYear;
  if (!year) {
    console.error("Could not determine year. Pass --year=2025 or include a 4-digit year in the CSV filename.");
    process.exit(1);
  }

  const teamFromFile = inferTeamFromFilename(csvPath);

  const playersPath = "src/data/players.json";
  const statsPath = "src/data/stats.json";

  const players = JSON.parse(readText(playersPath));
  const playerIds = new Set(Object.keys(players.players || {}));

  const existing = fs.existsSync(statsPath) ? JSON.parse(readText(statsPath)) : { players: {} };
  if (!existing.players) existing.players = {};

  const { header, rows } = parseCsv(readText(csvPath));

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
  const ipHeaderIndex = header.indexOf("IP");
  const findAfter = (startName, targetName) => {
    const start = header.indexOf(startName);
    if (start < 0) return -1;
    for (let i = start + 1; i < header.length; i++) {
      if (header[i] === targetName) return i;
    }
    return -1;
  };
  void ipHeaderIndex; // for readability
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

  let updatedPlayers = 0;

  for (const row of rows) {
    const last = safeGet(row, iLast).trim();
    const first = safeGet(row, iFirst).trim();
    if (!last || !first) continue;
    if (last.toLowerCase() === "last" || first.toLowerCase() === "first") continue;

    const playerId = slugify(`${first}-${last}`);
    if (!playerIds.has(playerId)) continue;

    const num = safeGet(row, iNum).trim();
    const gradYear = players.players?.[playerId]?.class ?? "";
    const classLabel = deriveClassLabel({ gradYear, seasonYear: year });

    const BB = toInt(safeGet(row, iBB_bat));
    const SO = toInt(safeGet(row, iSO_bat));
    const XBH = toInt(safeGet(row, i2B)) + toInt(safeGet(row, i3B)) + toInt(safeGet(row, iHR));

    const battingSeason = {
      year: String(year),
      class: classLabel,
      team: normalizeTeam(teamFromFile),
      number: num || "",
      PA: toInt(safeGet(row, iPA)),
      H: toInt(safeGet(row, iH)),
      RBI: toInt(safeGet(row, iRBI)),
      R: toInt(safeGet(row, iR)),
      XBH,
      SB: toInt(safeGet(row, iSB)),
      KBB: `${SO}/${BB}`,
      AVG: normRate(safeGet(row, iAVG)),
      OBP: normRate(safeGet(row, iOBP)),
      SLG: normRate(safeGet(row, iSLG)),
      AB: toInt(safeGet(row, iAB)),
      BB,
      SO,
      HBP: toInt(safeGet(row, iHBP_bat)),
      SF: toInt(safeGet(row, iSF_bat)),
      TB: toInt(safeGet(row, iTB))
    };

    const pitchingSeason = {
      year: String(year),
      class: classLabel,
      team: normalizeTeam(teamFromFile),
      number: num || "",
      IP: String(safeGet(row, iIP)).trim(),
      H: toInt(safeGet(row, iH_pitch)),
      R: toInt(safeGet(row, iR_pitch)),
      ER: toInt(safeGet(row, iER_pitch)),
      BB: toInt(safeGet(row, iBB_pitch)),
      K: toInt(safeGet(row, iSO_pitch)),
      ERA: String(safeGet(row, iERA)).trim(),
      WHIP: String(safeGet(row, iWHIP)).trim(),
      BAA: normRate(safeGet(row, iBAA)),
      HBP: toInt(safeGet(row, iHBP_pitch))
    };

    const p = existing.players[playerId] || {};
    existing.players[playerId] = p;

    p.batting = p.batting || { seasons: [], careerTotals: null };
    p.pitching = p.pitching || { seasons: [], careerTotals: null };

    // Normalize/migrate existing seasons
    p.batting.seasons = (p.batting.seasons || []).map((s) => ({
      ...s,
      year: migrateYearToYYYY(s.year),
      team: normalizeTeam(s.team)
    }));
    p.pitching.seasons = (p.pitching.seasons || []).map((s) => ({
      ...s,
      year: migrateYearToYYYY(s.year),
      team: normalizeTeam(s.team)
    }));

    // Upsert season rows by year+team (since JV/Var can both exist for same year across different files)
    p.batting.seasons = p.batting.seasons.filter(
      (s) => !(String(s.year) === String(year) && normalizeTeam(s.team) === normalizeTeam(teamFromFile))
    );
    p.batting.seasons.push(battingSeason);
    p.batting.seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

    p.pitching.seasons = p.pitching.seasons.filter(
      (s) => !(String(s.year) === String(year) && normalizeTeam(s.team) === normalizeTeam(teamFromFile))
    );
    if (parseIPToOuts(pitchingSeason.IP) > 0) {
      p.pitching.seasons.push(pitchingSeason);
    }
    p.pitching.seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

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
  console.log(`Imported year ${year} from CSV: ${csvPath}`);
  console.log(`Updated players: ${updatedPlayers}`);
}

main();


