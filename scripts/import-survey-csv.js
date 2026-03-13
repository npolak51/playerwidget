/**
 * Import 2026 Tahoma Player Survey CSV into players.json.
 * Updates existing players and adds new ones.
 *
 * Usage: node scripts/import-survey-csv.js "/path/to/survey.csv"
 */

import fs from "node:fs";
import path from "node:path";

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

function trim(s) {
  return String(s ?? "").trim();
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
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeBatThrow(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "";
  const left = /l|left/.test(s);
  const right = /r|right/.test(s);
  if (left && right) return "L/R";
  if (left) return "L/L";
  if (right) return "R/R";
  return s;
}

function normalizeHeightWeight(heightStr, weightStr) {
  let h = String(heightStr ?? "").trim();
  let w = String(weightStr ?? "").trim();
  // Fix typos: "5,8" -> "5'8", "5,11" -> "5'11", "6'q" -> "6'0"
  h = h.replace(/,/g, "'").replace(/['"]/g, "'").replace(/q/g, "0");
  w = w.replace(/\s*(lbs?|ib?s?)\s*$/i, "").trim();
  if (!h && !w) return "";
  if (h && w) return `${h}/${w} lbs`;
  if (h) return `${h}`;
  return w ? `${w} lbs` : "";
}

function normalizeClass(v) {
  const s = String(v ?? "").trim();
  const m = s.match(/\b(20\d{2})\b/);
  if (m) return m[1];
  if (/^\d{2}$/.test(s)) return "20" + s;
  return s || "";
}

const COMMITTED_MAP = {
  "university of washington": { name: "University of Washington", logo: "/logos/Washington.png", div: "D-I" },
  "northwest nazarene university": { name: "Northwest Nazarene", logo: "/logos/Northwest Nazarene.png", div: "D-II" },
  "northwest nazarene": { name: "Northwest Nazarene", logo: "/logos/Northwest Nazarene.png", div: "D-II" },
  "new mexico state": { name: "New Mexico State", logo: "/logos/New Mexico State.png", div: "D-I" },
  "eastern oregon university": { name: "Eastern Oregon", logo: "/logos/Eastern Oregon.png", div: "NAIA" },
  "eastern oregon": { name: "Eastern Oregon", logo: "/logos/Eastern Oregon.png", div: "NAIA" },
  "montana state university - billings": { name: "Montana State Billings", logo: "/logos/Montana State Billings.png", div: "D-II" },
  "montana state billings": { name: "Montana State Billings", logo: "/logos/Montana State Billings.png", div: "D-II" },
  "wenatchee valley college": { name: "Wenatchee Valley", logo: "/logos/Wenatchee Valley.png", div: "NWAC" },
  "wenatchee valley": { name: "Wenatchee Valley", logo: "/logos/Wenatchee Valley.png", div: "NWAC" },
  "clark college": { name: "Clark", logo: "/logos/Clark.png", div: "NWAC" },
  "clark": { name: "Clark", logo: "/logos/Clark.png", div: "NWAC" },
  "oregon state university": { name: "Oregon State", logo: "/logos/Oregon State.png", div: "D-I" },
  "oregon state": { name: "Oregon State", logo: "/logos/Oregon State.png", div: "D-I" },
};

function resolveCommitted(committedYes, school) {
  const yes = String(committedYes ?? "").trim().toLowerCase();
  if (yes !== "yes") return null;
  const s = String(school ?? "").trim().toLowerCase();
  if (!s || s === "no" || s === "n/a" || s === ".") return null;
  const key = Object.keys(COMMITTED_MAP).find((k) => s.includes(k) || k.includes(s));
  return key ? COMMITTED_MAP[key] : { name: school.trim(), logo: "", div: "" };
}

function titleCase(s) {
  return String(s ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatPositions(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s*,\s*/g, "/")
    .replace(/\s+/g, " ") || "";
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((h, j) => {
      row[h] = cols[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function main() {
  const csvPath = process.argv[2] || "/Users/NPolak/Desktop/2026 Tahoma Player Survey (Responses) - Form Responses 1.csv";
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const playersPath = path.join(process.cwd(), "src", "data", "players.json");
  const playersData = JSON.parse(fs.readFileSync(playersPath, "utf8"));
  const players = playersData.players || {};

  const rows = parseCsv(csvPath);
  const nameKey = "First and last name (with caps, like this: Nick Polak)";
  const posKey = "Positions";
  const batKey = "Bat/Throw";
  const bdayKey = "Birthday (with year)";
  const hometownKey = "Hometown";
  const classKey = "Graduating Class";
  const heightKey = "Height (Ft'In)";
  const weightKey = "Weight (XXX lbs)";
  const teamKey = "Favorite Sports Team";
  const mealKey = "Favorite pregame meal/snack";
  const committedKey = "Are you currently committed to play in college?";
  const schoolKey = "If yes, where are you committed?";
  const twitterKey = "Twitter handle (if you have one and want to share it on our website)";
  const instaKey = "Instagram handle (if you have one and want to share it on our website)";
  const tiktokKey = "TikTok handle (if you have one and want to share it on our website)";

  let updated = 0;
  const addedIds = [];

  for (const row of rows) {
    const rawName = row[nameKey];
    if (!trim(rawName)) continue;

    const playerId = slugify(rawName);
    const name = titleCase(rawName);

    const positions = formatPositions(row[posKey]) || "";
    const batThrow = normalizeBatThrow(row[batKey]);
    const hometown = trim(row[hometownKey]) || "";
    const gradClass = normalizeClass(row[classKey]);
    const heightWeight = normalizeHeightWeight(row[heightKey], row[weightKey]);
    const favoriteTeam = trim(row[teamKey]) ? titleCase(trim(row[teamKey])) : "";
    const postGameMeal = trim(row[mealKey]) || "";

    const committedInfo = resolveCommitted(row[committedKey], row[schoolKey]);

    let twitter = trim(row[twitterKey]) || "";
    if (twitter.startsWith("@")) twitter = twitter.slice(1);
    let instagram = trim(row[instaKey]) || "";
    if (instagram.startsWith("@")) instagram = instagram.slice(1);
    if (instagram.startsWith("https://")) instagram = instagram.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    let tiktok = trim(row[tiktokKey]) || "";
    if (tiktok.toLowerCase() === "n/a" || tiktok.toLowerCase() === "none") tiktok = "";
    if (tiktok.startsWith("@")) tiktok = tiktok.slice(1);

    const surveyData = {
      name,
      positions: positions || undefined,
      batThrow: batThrow || undefined,
      class: gradClass || undefined,
      heightWeight: heightWeight || undefined,
      favoriteTeam: favoriteTeam || undefined,
      postGameMeal: postGameMeal || undefined,
      twitter: twitter || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
    };

    if (committedInfo) {
      surveyData.committed = committedInfo.name;
      surveyData.committedDivision = committedInfo.div || undefined;
      if (committedInfo.logo) surveyData.committedLogo = committedInfo.logo;
    }

    if (players[playerId]) {
      const existing = players[playerId];
      for (const [k, v] of Object.entries(surveyData)) {
        if (v !== undefined && v !== "") {
          existing[k] = v;
        }
      }
      updated++;
    } else {
      players[playerId] = {
        name,
        number: "",
        positions: positions || "",
        playerImg: `/players/${playerId}.jpg`,
        headerImg: `/headers/${playerId}-header.jpg`,
        logoImg: "",
        school: "",
        class: gradClass || "",
        heightWeight: heightWeight || "",
        batThrow: batThrow || "",
        favoriteTeam: favoriteTeam || "",
        postGameMeal: postGameMeal || "",
        twitter: twitter || "",
        instagram: instagram || "",
        tiktok: tiktok || "",
        scoutPages: {
          perfectGame: "",
          pbr: "",
          baseballNorthwest: "",
        },
      };
      if (committedInfo) {
        players[playerId].committed = committedInfo.name;
        players[playerId].committedDivision = committedInfo.div || "";
        if (committedInfo.logo) players[playerId].committedLogo = committedInfo.logo;
      }
      addedIds.push(playerId);
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(players).sort((a, b) => {
      const nameA = (a[1].name || "").toLowerCase();
      const nameB = (b[1].name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    })
  );

  playersData.players = sorted;
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2) + "\n", "utf8");

  console.log(`Updated ${updated} existing players, added ${addedIds.length} new players.`);
  if (addedIds.length > 0) {
    console.log(`New players: ${addedIds.join(", ")}`);
  }
}

main();
