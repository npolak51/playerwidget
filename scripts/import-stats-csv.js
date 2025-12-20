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
      // Escaped quote
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
  // Some exports have a decorative first row; real header is usually the next line.
  // We'll use the first line that includes "Number,Last,First".
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
  // Turn 0.333 -> .333
  if (v.startsWith("0.")) return v.slice(1);
  return v;
}

function toInt(s) {
  const v = String(s ?? "").trim();
  if (!v || v === "-" || v.toLowerCase() === "n/a") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function toNum(s) {
  const v = String(s ?? "").trim();
  if (!v || v === "-" || v.toLowerCase() === "n/a") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseIPToOuts(ipStr) {
  const v = String(ipStr ?? "").trim();
  if (!v || v.toLowerCase() === "n/a" || v === "-") return 0;
  const [wholeStr, fracStr] = v.split(".");
  const whole = Number(wholeStr) || 0;
  const frac = Number(fracStr || "0") || 0;
  // GameChanger uses .1 and .2 for outs
  const outs = whole * 3 + (frac === 1 ? 1 : frac === 2 ? 2 : 0);
  return outs;
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
  if (!m) return null;
  return m[0];
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

function pickCareerSeasons(seasons) {
  const hasVarsity = seasons.some((s) => normalizeTeam(s.team) === "Var.");
  if (hasVarsity) return seasons.filter((s) => normalizeTeam(s.team) === "Var.");
  const hasJV = seasons.some((s) => normalizeTeam(s.team) === "JV");
  if (hasJV) return seasons.filter((s) => normalizeTeam(s.team) === "JV");
  return [];
}

function migrateYearToYYYY(y) {
  const v = String(y ?? "").trim();
  // If already a 4-digit year, keep it
  if (/^(19|20)\d{2}$/.test(v)) return v;
  // Convert "21-22" => "2022", "24-25" => "2025"
  const m = v.match(/^(\d{2})-(\d{2})$/);
  if (m) {
    const endYY = Number(m[2]);
    if (Number.isFinite(endYY)) return String(2000 + endYY);
  }
  return v;
}

function migrateExistingStats(existing) {
  if (!existing || !existing.players) return;
  for (const pid of Object.keys(existing.players)) {
    const p = existing.players[pid];
    for (const key of ["batting", "pitching"]) {
      const block = p?.[key];
      if (!block || !Array.isArray(block.seasons)) continue;
      block.seasons = block.seasons.map((s) => ({
        ...s,
        year: migrateYearToYYYY(s.year),
        team: normalizeTeam(s.team)
      }));
      // Re-sort after migration
      block.seasons.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }
  }
}

function safeGet(row, idx) {
  return idx >= 0 && idx < row.length ? row[idx] : "";
}

function buildIndex(header) {
  const idx = new Map();
  header.forEach((h, i) => {
    const key = String(h || "").trim();
    if (!key) return;
    // First occurrence wins
    if (!idx.has(key)) idx.set(key, i);
  });
  return (name) => (idx.has(name) ? idx.get(name) : -1);
}

function computeBattingTotals(seasons) {
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
    team: "Var.",
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

function computePitchingTotals(seasons) {
  let outs = 0, H = 0, R = 0, ER = 0, BB = 0, K = 0, HBP = 0, BF = 0;
  // We'll estimate AB against via H/BAA when available
  let estAB = 0;

  for (const s of seasons) {
    outs += parseIPToOuts(s.IP);
    H += toInt(s.H);
    R += toInt(s.R);
    ER += toInt(s.ER);
    BB += toInt(s.BB);
    K += toInt(s.K);
    HBP += toInt(s.HBP);
    BF += toInt(s.BF);

    const baa = String(s.BAA || "").trim();
    const baaNum = baa ? Number(baa.startsWith(".") ? `0${baa}` : baa) : NaN;
    if (Number.isFinite(baaNum) && baaNum > 0) {
      estAB += Math.round(toInt(s.H) / baaNum);
    }
  }

  const ip = outs / 3;
  const era = ip > 0 ? ((ER * 7) / ip) : 0; // GameChanger HS uses 7-inning ERA
  const whip = ip > 0 ? ((BB + H) / ip) : 0;
  const baa = estAB > 0 ? (H / estAB) : 0;

  return {
    team: "Var.",
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

  const playersPath = "src/data/players.json";
  const statsPath = "src/data/stats.json";
  const inferredTeam = inferTeamFromFilename(csvPath);

  const players = JSON.parse(readText(playersPath));
  const playerIds = new Set(Object.keys(players.players || {}));

  const existing = fs.existsSync(statsPath) ? JSON.parse(readText(statsPath)) : { players: {} };
  if (!existing.players) existing.players = {};
  migrateExistingStats(existing);

  const { header, rows } = parseCsv(readText(csvPath));
  const idx = buildIndex(header);

  const iLast = idx("Last");
  const iFirst = idx("First");
  const iNum = idx("Number");

  // Batting needed
  const iPA = idx("PA");
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
  const iAB = idx("AB");
  const iHBP_bat = idx("HBP");
  const iSF_bat = idx("SF");
  const iTB = idx("TB");

  // Pitching needed (these headers exist in the combined export)
  const iIP = idx("IP");
  const iH_p = idx("H"); // ambiguous; but we will find pitching H via "H" after IP section? can't with name-only.
  // Because headers include duplicated names (H, R, ER, BB, SO...) for pitching,
  // buildIndex takes first occurrence (batting). We'll instead locate pitching fields by scanning header.
  const findAfter = (startName, targetName) => {
    const start = header.indexOf(startName);
    if (start < 0) return -1;
    for (let i = start + 1; i < header.length; i++) {
      if (header[i] === targetName) return i;
    }
    return -1;
  };

  // The pitching section starts at the second "IP" (after batting CI). We'll locate the *first* "IP" header,
  // then use that as the start of pitching metrics (next columns include GP, GS, BF, #P, ... H, R, ER, BB, SO, ... ERA, WHIP, ... BAA).
  const ipHeaderIndex = header.indexOf("IP");
  const iBF = findAfter("IP", "BF");
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
    const num = safeGet(row, iNum).trim();
    if (!last || !first) continue;
    if (last.toLowerCase() === "last" || first.toLowerCase() === "first") continue;

    const playerId = slugify(`${first}-${last}`);
    if (!playerId) continue;

    // Only import players that exist in players.json
    if (!playerIds.has(playerId)) continue;

    // Batting season row
    const BB = toInt(safeGet(row, iBB_bat));
    const SO = toInt(safeGet(row, iSO_bat));
    const twoB = toInt(safeGet(row, i2B));
    const threeB = toInt(safeGet(row, i3B));
    const HR = toInt(safeGet(row, iHR));
    const XBH = twoB + threeB + HR;

    const battingSeason = {
      year: String(year),
      class: "",
      team: inferredTeam,
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
      // extras for totals
      AB: toInt(safeGet(row, iAB)),
      BB,
      SO,
      HBP: toInt(safeGet(row, iHBP_bat)),
      SF: toInt(safeGet(row, iSF_bat)),
      TB: toInt(safeGet(row, iTB))
    };

    // Pitching season row (may be blank for non-pitchers)
    const ipVal = safeGet(row, iIP).trim();
    const pitchingSeason = {
      year: String(year),
      class: "",
      team: inferredTeam,
      number: num || "",
      IP: ipVal,
      H: toInt(safeGet(row, iH_pitch)),
      R: toInt(safeGet(row, iR_pitch)),
      ER: toInt(safeGet(row, iER_pitch)),
      BB: toInt(safeGet(row, iBB_pitch)),
      K: toInt(safeGet(row, iSO_pitch)),
      ERA: String(safeGet(row, iERA)).trim(),
      WHIP: String(safeGet(row, iWHIP)).trim(),
      BAA: normRate(safeGet(row, iBAA)),
      // extras for totals
      BF: toInt(safeGet(row, iBF)),
      HBP: toInt(safeGet(row, iHBP_pitch))
    };

    const existingPlayer = existing.players[playerId] || {};
    existing.players[playerId] = existingPlayer;

    // Batting
    existingPlayer.batting = existingPlayer.batting || { seasons: [], careerTotals: null };
    const bSeasons = Array.isArray(existingPlayer.batting.seasons) ? existingPlayer.batting.seasons : [];
    const bFiltered = bSeasons.filter((s) => String(migrateYearToYYYY(s.year)) !== String(year));
    bFiltered.push(battingSeason);
    // Sort by year desc numeric
    bFiltered.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    existingPlayer.batting.seasons = bFiltered;
    {
      const careerSeasons = pickCareerSeasons(bFiltered);
      existingPlayer.batting.careerTotals = careerSeasons.length ? computeBattingTotals(careerSeasons) : null;
      if (existingPlayer.batting.careerTotals) {
        existingPlayer.batting.careerTotals.team = normalizeTeam(careerSeasons[0]?.team) || "";
      }
    }

    // Pitching
    existingPlayer.pitching = existingPlayer.pitching || { seasons: [], careerTotals: null };
    const pSeasons = Array.isArray(existingPlayer.pitching.seasons) ? existingPlayer.pitching.seasons : [];
    const pFiltered = pSeasons.filter((s) => String(migrateYearToYYYY(s.year)) !== String(year));
    // Only include pitching season if IP has value and > 0 outs
    if (parseIPToOuts(pitchingSeason.IP) > 0) {
      pFiltered.push(pitchingSeason);
    }
    pFiltered.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    existingPlayer.pitching.seasons = pFiltered;
    {
      const careerSeasons = pickCareerSeasons(pFiltered);
      existingPlayer.pitching.careerTotals = careerSeasons.length ? computePitchingTotals(careerSeasons) : null;
      if (existingPlayer.pitching.careerTotals) {
        existingPlayer.pitching.careerTotals.team = normalizeTeam(careerSeasons[0]?.team) || "";
      }
    }

    updatedPlayers++;
  }

  // Recompute career totals for all players using the Varsity-first rule, in case this run
  // didn't touch a given player but the year/team conventions changed.
  for (const pid of Object.keys(existing.players)) {
    const p = existing.players[pid];

    if (p?.batting?.seasons) {
      const b = p.batting.seasons.map((s) => ({ ...s, team: normalizeTeam(s.team), year: migrateYearToYYYY(s.year) }));
      b.sort((a, b2) => (Number(b2.year) || 0) - (Number(a.year) || 0));
      p.batting.seasons = b;
      const careerSeasons = pickCareerSeasons(b);
      p.batting.careerTotals = careerSeasons.length ? computeBattingTotals(careerSeasons) : null;
      if (p.batting.careerTotals) p.batting.careerTotals.team = normalizeTeam(careerSeasons[0]?.team) || "";
    }

    if (p?.pitching?.seasons) {
      const ps = p.pitching.seasons.map((s) => ({ ...s, team: normalizeTeam(s.team), year: migrateYearToYYYY(s.year) }));
      ps.sort((a, b2) => (Number(b2.year) || 0) - (Number(a.year) || 0));
      p.pitching.seasons = ps;
      const careerSeasons = pickCareerSeasons(ps);
      p.pitching.careerTotals = careerSeasons.length ? computePitchingTotals(careerSeasons) : null;
      if (p.pitching.careerTotals) p.pitching.careerTotals.team = normalizeTeam(careerSeasons[0]?.team) || "";
    }
  }

  const outJson = JSON.stringify(existing, null, 2) + "\n";
  writeText(statsPath, outJson);

  console.log(`Imported year ${year} from CSV: ${csvPath}`);
  console.log(`Updated players: ${updatedPlayers}`);
}

main();


