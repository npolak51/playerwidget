/**
 * Update gameLogs.json from stats diff + pending games.
 *
 * Workflow:
 * 1. Add game info (date, opponent, result) to src/data/pending-games.csv
 * 2. Export latest stats from GameChanger, run: npm run import-stats
 * 3. Run: npm run update-game-logs
 *
 * This script diffs stats.json vs stats_previous.json to infer per-player
 * stats for the most recent pending game, then appends it to gameLogs.json.
 *
 * One game at a time: add one game, run import-stats, run update-game-logs.
 */

import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "src", "data");
const pendingPath = path.join(dataDir, "pending-games.csv");
const statsPath = path.join(dataDir, "stats.json");
const statsPrevPath = path.join(dataDir, "stats_previous.json");
const gameLogsPath = path.join(dataDir, "gameLogs.json");

function slugify(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTeam(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "Var.";
  if (s === "varsity" || s.startsWith("var")) return "Var.";
  if (s === "jv" || s.includes("junior")) return "JV";
  return "Var.";
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function toNum(v) {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseIPToOuts(ipStr) {
  const v = String(ipStr ?? "").trim();
  if (!v) return 0;
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

function findSeason(seasons, year, team) {
  const y = String(year ?? "").trim();
  const t = normalizeTeam(team);
  return (seasons || []).find(
    (s) => String(s?.year ?? "") === y && normalizeTeam(s?.team) === t
  ) || null;
}

function main() {
  if (!fs.existsSync(pendingPath)) {
    console.error(`No pending games file at ${pendingPath}`);
    console.error("Create it with header: date,opponent,ourScore,oppScore,location,team");
    console.error("Example: 2026-03-15,Lakes,8,3,Home,Varsity");
    process.exit(1);
  }

  if (!fs.existsSync(statsPrevPath)) {
    console.error(`No stats_previous.json found. Run 'npm run import-stats' first (it saves previous stats before overwriting).`);
    process.exit(1);
  }

  const pendingCsv = fs.readFileSync(pendingPath, "utf8");
  const lines = pendingCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    console.error("pending-games.csv must have a header row and at least one game.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const dateIdx = idx.date ?? 0;
  const opponentIdx = idx.opponent ?? 1;
  const ourScoreIdx = idx.ourScore ?? 2;
  const oppScoreIdx = idx.oppScore ?? 3;
  const locationIdx = idx.location ?? 4;
  const teamIdx = idx.team ?? 5;

  const firstRow = parseCsvLine(lines[1]);
  const date = String(firstRow[dateIdx] ?? "").trim();
  const opponent = String(firstRow[opponentIdx] ?? "").trim();
  const ourScore = toNum(firstRow[ourScoreIdx]);
  const oppScore = toNum(firstRow[oppScoreIdx]);
  const location = String(firstRow[locationIdx] ?? "").trim();
  const team = normalizeTeam(firstRow[teamIdx] ?? "Varsity");

  if (!date || !opponent) {
    console.error("First pending game must have date and opponent.");
    process.exit(1);
  }

  const season = Number(date.slice(0, 4)) || new Date().getFullYear();

  const statsPrev = JSON.parse(fs.readFileSync(statsPrevPath, "utf8"));
  const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));

  const gameId = slugify(
    [date, season, team, opponent, location, ourScore, oppScore].join(" ")
  );

  const players = {};
  const allPlayerIds = new Set([
    ...Object.keys(stats?.players || {}),
    ...Object.keys(statsPrev?.players || {}),
  ]);

  for (const playerId of allPlayerIds) {
    const currBat = findSeason(
      stats?.players?.[playerId]?.batting?.seasons,
      season,
      team
    );
    const prevBat = findSeason(
      statsPrev?.players?.[playerId]?.batting?.seasons,
      season,
      team
    );

    const currPit = findSeason(
      stats?.players?.[playerId]?.pitching?.seasons,
      season,
      team
    );
    const prevPit = findSeason(
      statsPrev?.players?.[playerId]?.pitching?.seasons,
      season,
      team
    );

    const batDelta = {
      AB: Math.max(0, toNum(currBat?.AB) - toNum(prevBat?.AB)),
      H: Math.max(0, toNum(currBat?.H) - toNum(prevBat?.H)),
      R: Math.max(0, toNum(currBat?.R) - toNum(prevBat?.R)),
      RBI: Math.max(0, toNum(currBat?.RBI) - toNum(prevBat?.RBI)),
      BB: Math.max(0, toNum(currBat?.BB) - toNum(prevBat?.BB)),
      SO: Math.max(0, toNum(currBat?.SO) - toNum(prevBat?.SO)),
      "2B": Math.max(0, toNum(currBat?.["2B"]) - toNum(prevBat?.["2B"])),
      "3B": Math.max(0, toNum(currBat?.["3B"]) - toNum(prevBat?.["3B"])),
      HR: Math.max(0, toNum(currBat?.HR) - toNum(prevBat?.HR)),
      SF: Math.max(0, toNum(currBat?.SF) - toNum(prevBat?.SF)),
      HBP: Math.max(0, toNum(currBat?.HBP) - toNum(prevBat?.HBP)),
      SB: Math.max(0, toNum(currBat?.SB) - toNum(prevBat?.SB)),
      CS: 0,
    };

    const currOuts = parseIPToOuts(currPit?.IP);
    const prevOuts = parseIPToOuts(prevPit?.IP);
    const pitOuts = Math.max(0, currOuts - prevOuts);

    const pitDelta = {
      IP: pitOuts > 0 ? formatOutsToIP(pitOuts) : null,
      H: Math.max(0, toNum(currPit?.H) - toNum(prevPit?.H)),
      R: Math.max(0, toNum(currPit?.R) - toNum(prevPit?.R)),
      ER: Math.max(0, toNum(currPit?.ER) - toNum(prevPit?.ER)),
      BB: Math.max(0, toNum(currPit?.BB) - toNum(prevPit?.BB)),
      K: Math.max(0, toNum(currPit?.K) - toNum(prevPit?.K)),
      HBP: Math.max(0, toNum(currPit?.HBP) - toNum(prevPit?.HBP)),
      WP: Math.max(0, toNum(currPit?.WP) - toNum(prevPit?.WP)),
    };

    const hasBat = Object.values(batDelta).some((v) => v > 0);
    const hasPit =
      pitOuts > 0 ||
      (pitDelta.H > 0 || pitDelta.R > 0 || pitDelta.ER > 0 || pitDelta.BB > 0 || pitDelta.K > 0 || pitDelta.HBP > 0 || pitDelta.WP > 0);

    if (hasBat || hasPit) {
      players[playerId] = {};
      if (hasBat) {
        players[playerId].batting = {};
        for (const [k, v] of Object.entries(batDelta)) {
          players[playerId].batting[k] = v > 0 ? v : null;
        }
      }
      if (hasPit) {
        players[playerId].pitching = {
          IP: pitOuts > 0 ? formatOutsToIP(pitOuts) : null,
          H: pitDelta.H > 0 ? pitDelta.H : null,
          R: pitDelta.R > 0 ? pitDelta.R : null,
          ER: pitDelta.ER > 0 ? pitDelta.ER : null,
          BB: pitDelta.BB > 0 ? pitDelta.BB : null,
          K: pitDelta.K > 0 ? pitDelta.K : null,
          HBP: pitDelta.HBP > 0 ? pitDelta.HBP : null,
          WP: pitDelta.WP > 0 ? pitDelta.WP : null,
        };
      }
    }
  }

  const newGame = {
    gameId,
    date,
    season,
    team,
    opponent,
    location: location || "",
    ourScore: ourScore || null,
    oppScore: oppScore || null,
    isOfficial: true,
    players,
  };

  if (Object.keys(players).length === 0) {
    console.error("No player stats inferred from diff. Game will be added with empty players.");
    console.error("");
    console.error("Workflow: 1) Add game to pending-games.csv");
    console.error("         2) Export FRESH stats from GameChanger (including this game)");
    console.error("         3) Run: npm run import-stats");
    console.error("         4) Run: npm run update-game-logs");
    console.error("");
    console.error("stats.json and stats_previous.json appear identical - no delta to attribute to this game.");
    process.exit(1);
  }

  const gameLogs = JSON.parse(fs.readFileSync(gameLogsPath, "utf8"));
  gameLogs.games = gameLogs.games || [];
  gameLogs.games.push(newGame);
  gameLogs.games.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  fs.writeFileSync(
    gameLogsPath,
    JSON.stringify(gameLogs, null, 2) + "\n",
    "utf8"
  );

  const remaining = lines.slice(2);
  const newCsv =
    lines[0] + "\n" + (remaining.length ? remaining.join("\n") + "\n" : "");
  fs.writeFileSync(pendingPath, newCsv, "utf8");

  console.log(`Added game: ${date} vs ${opponent} (${ourScore}-${oppScore})`);
  console.log(`  Players with stats: ${Object.keys(players).length}`);
  console.log(`  Remaining pending games: ${remaining.length}`);
}

main();
