/**
 * Replace blank entries in stats JSON with defaults:
 * - AVG, OBP, SLG, OPS, BAA → .000
 * - ERA, WHIP → 0.00
 * - All other numeric stats → 0
 * - IP (string) → 0.0
 *
 * Usage: node scripts/normalize-stats-blanks.js
 * Modifies src/data/stats.json and src/data/stats_previous.json in place.
 */

import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "src", "data");
const statsPath = path.join(dataDir, "stats.json");
const statsPrevPath = path.join(dataDir, "stats_previous.json");

const RATE_STATS = ["AVG", "OBP", "SLG", "OPS", "BAA"];
const ERA_WHIP_STATS = ["ERA", "WHIP"];
const NUMERIC_STATS = [
  "PA", "H", "AB", "R", "RBI", "BB", "SO", "2B", "3B", "HR", "SF", "HBP", "SB", "TB", "XBH",
  "K", "ER", "WP", "__estAB",
];

function isBlank(v) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

function normalizeValue(key, value) {
  if (!isBlank(value)) return value;
  if (RATE_STATS.includes(key)) return ".000";
  if (ERA_WHIP_STATS.includes(key)) return "0.00";
  if (key === "IP") return "0.0";
  if (NUMERIC_STATS.includes(key)) return 0;
  return value;
}

function walkAndNormalize(obj) {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) walkAndNormalize(item);
    return;
  }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) walkAndNormalize(item);
    } else if (val !== null && typeof val === "object") {
      walkAndNormalize(val);
    } else if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const normalized = normalizeValue(key, val);
      if (normalized !== val) obj[key] = normalized;
    }
  }
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  walkAndNormalize(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Normalized: ${path.basename(filePath)}`);
}

function main() {
  processFile(statsPath);
  processFile(statsPrevPath);
  console.log("Done.");
}

main();
