import fs from "node:fs";
import path from "node:path";

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeText(p, s) {
  fs.writeFileSync(p, s);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let cur = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        values.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    values.push(cur.trim());
    const row = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function emptyPlayer(name) {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return {
    name,
    number: "",
    positions: "",
    playerImg: `/players/${slug}.jpg`,
    headerImg: `/headers/${slug}-header.jpg`,
    logoImg: "",
    school: "",
    class: "",
    heightWeight: "",
    batThrow: "",
    favoriteTeam: "",
    postGameMeal: "",
    twitter: "",
    instagram: "",
    scoutPages: {
      perfectGame: "",
      pbr: "",
      baseballNorthwest: "",
    },
  };
}

function main() {
  const csvPathArg = process.argv.find((a) => a.startsWith("--csv="));
  const csvPath = csvPathArg ? csvPathArg.slice("--csv=".length) : "/Users/NPolak/Desktop/tahoma scouting links.csv";
  const playersPath = path.join(process.cwd(), "src/data/players.json");

  const csvText = readText(csvPath);
  const rows = parseCsv(csvText);

  const players = JSON.parse(readText(playersPath));
  if (!players.players) players.players = {};

  const newPlayerIds = ["evan-kim", "anthony-wagner"];
  let updated = 0;
  let added = 0;

  for (const row of rows) {
    const playerId = String(row.player ?? "").trim().toLowerCase();
    if (!playerId) continue;

    const perfectGame = String(row.perfectgame ?? "").trim();
    const pbr = String(row.prb ?? "").trim();
    const baseballNorthwest = String(row.baseballnorthwest ?? "").trim();

    if (players.players[playerId]) {
      const p = players.players[playerId];
      p.scoutPages = p.scoutPages || {};
      if (p.scountPages) delete p.scountPages;
      if (perfectGame) p.scoutPages.perfectGame = perfectGame;
      if (pbr) p.scoutPages.pbr = pbr;
      if (baseballNorthwest) p.scoutPages.baseballNorthwest = baseballNorthwest;
      updated++;
    } else if (newPlayerIds.includes(playerId)) {
      const name = playerId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      players.players[playerId] = emptyPlayer(name);
      players.players[playerId].scoutPages = {
        perfectGame: perfectGame || "",
        pbr: pbr || "",
        baseballNorthwest: baseballNorthwest || "",
      };
      added++;
    }
  }

  writeText(playersPath, JSON.stringify(players, null, 2) + "\n");
  console.log(`Updated ${updated} players, added ${added} new players.`);
}

main();
