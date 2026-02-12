/**
 * Import per-game stats CSV into src/data/gameLogs.json
 *
 * Expected format: ONE ROW PER PLAYER PER GAME.
 *
 * Required columns:
 * - date (YYYY-MM-DD)
 * - season (number, e.g. 2025)
 * - team ("Varsity" / "Var." / "JV")
 * - opponent (string)
 * - playerID (or playerId) (matches keys in src/data/players.json)
 *
 * Batting columns (optional per row):
 * - AB, R, H, RBI, BB, SO, 2B, 3B, HR, SF, HBP, SB, CS
 *
 * Pitching columns (optional per row):
 * - IP (baseball innings string e.g. 7.0, 6.2, 5.1)
 * - H_pit, R_pit, ER, BB_pit, SO_pit, HBP_pit, WP
 *
 * Notes:
 * - Use H_pit and R_pit to avoid collisions with batting H/R.
 * - Values may be blank; blanks are treated as missing.
 *
 * Usage:
 *   node scripts/import-game-logs-csv.js "/absolute/path/to/game_logs.csv"
 */

import fs from "node:fs";
import path from "node:path";

function slugify(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTeam(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s === "varsity" || s.startsWith("var")) return "Var.";
  if (s === "jv" || s.includes("junior")) return "JV";
  return String(v ?? "").trim();
}

function parseCsvLine(line) {
  // Minimal CSV parser: supports quoted fields and commas.
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
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStr(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

function pickIdx(idx, ...names) {
  for (const n of names) {
    if (idx[n] !== undefined) return idx[n];
  }
  return undefined;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Missing CSV path. Example: node scripts/import-game-logs-csv.js \"/path/to/game_logs.csv\"");
    process.exit(1);
  }

  const csv = fs.readFileSync(inputPath, "utf8");
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    console.error("CSV must have a header row and at least one data row.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = ["date", "season", "team", "opponent"];
  const missing = required.filter((c) => idx[c] === undefined);
  if (missing.length) {
    console.error(`Missing required columns: ${missing.join(", ")}`);
    console.error(`Header columns seen: ${header.join(", ")}`);
    process.exit(1);
  }

  const playerIdIdx = pickIdx(idx, "playerID", "playerId", "player_id");
  if (playerIdIdx === undefined) {
    console.error(`Missing required column: playerID (or playerId)`);
    console.error(`Header columns seen: ${header.join(", ")}`);
    process.exit(1);
  }

  const gamesById = new Map();

  for (let r = 1; r < lines.length; r += 1) {
    const row = parseCsvLine(lines[r]);
    const date = toStr(row[idx.date]);
    const season = toNum(row[idx.season]);
    const team = normalizeTeam(toStr(row[idx.team]));
    const opponent = toStr(row[idx.opponent]);
    const location = idx.location !== undefined ? toStr(row[idx.location]) : "";
    const ourScore = idx.ourScore !== undefined ? toNum(row[idx.ourScore]) : null;
    const oppScore = idx.oppScore !== undefined ? toNum(row[idx.oppScore]) : null;
    const playerId = toStr(row[playerIdIdx]);

    const derivedGameId = slugify(
      [
        date,
        season,
        team,
        opponent,
        location,
        ourScore === null ? "" : String(ourScore),
        oppScore === null ? "" : String(oppScore),
      ].join(" ")
    );
    const gameId = derivedGameId;

    if (!gameId || !date || !season || !team || !opponent || !playerId) continue;

    const game =
      gamesById.get(gameId) ||
      {
        gameId,
        date,
        season,
        team,
        opponent,
        location,
        ourScore,
        oppScore,
        isOfficial: true,
        players: {},
      };

    const batting = {
      AB: toNum(idx.AB !== undefined ? row[idx.AB] : null),
      H: toNum(idx.H !== undefined ? row[idx.H] : null),
      R: toNum(idx.R !== undefined ? row[idx.R] : null),
      RBI: toNum(idx.RBI !== undefined ? row[idx.RBI] : null),
      BB: toNum(idx.BB !== undefined ? row[idx.BB] : null),
      SO: toNum(idx.SO !== undefined ? row[idx.SO] : null),
      "2B": toNum(idx["2B"] !== undefined ? row[idx["2B"]] : null),
      "3B": toNum(idx["3B"] !== undefined ? row[idx["3B"]] : null),
      HR: toNum(idx.HR !== undefined ? row[idx.HR] : null),
      SF: toNum(idx.SF !== undefined ? row[idx.SF] : null),
      HBP: toNum(idx.HBP !== undefined ? row[idx.HBP] : null),
      SB: toNum(idx.SB !== undefined ? row[idx.SB] : null),
      CS: toNum(idx.CS !== undefined ? row[idx.CS] : null),
    };

    const pitching = {
      IP: toStr(idx.IP !== undefined ? row[idx.IP] : null),
      H: toNum(idx.H_pit !== undefined ? row[idx.H_pit] : null),
      R: toNum(idx.R_pit !== undefined ? row[idx.R_pit] : null),
      ER: toNum(idx.ER !== undefined ? row[idx.ER] : null),
      BB: toNum(idx.BB_pit !== undefined ? row[idx.BB_pit] : null),
      K: toNum(idx.SO_pit !== undefined ? row[idx.SO_pit] : null),
      HBP: toNum(idx.HBP_pit !== undefined ? row[idx.HBP_pit] : null),
      WP: toNum(idx.WP !== undefined ? row[idx.WP] : null),
    };

    // Keep only sections that have at least one value.
    const hasBat = Object.values(batting).some((v) => v !== null);
    const hasPit = Object.values(pitching).some((v) => v !== null && v !== "");

    game.players[playerId] = {
      ...(hasBat ? { batting } : {}),
      ...(hasPit ? { pitching } : {}),
    };

    gamesById.set(gameId, game);
  }

  const games = Array.from(gamesById.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const outPath = path.join(process.cwd(), "src", "data", "gameLogs.json");
  fs.writeFileSync(outPath, JSON.stringify({ games }, null, 2) + "\n", "utf8");
  console.log(`Wrote ${games.length} games to ${outPath}`);
}

main();

