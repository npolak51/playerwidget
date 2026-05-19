import fs from "node:fs";

const PATH =
  "/Users/NPolak/BaseballApps/playerwidget/src/data/gameLogs.json";

const PITCH_KEYS = ["IP", "H", "R", "ER", "BB", "K", "HBP", "WP"];

/** @returns {number} */
function normalizePitchingObject(pitching) {
  let replaced = 0;
  for (const key of PITCH_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(pitching, key)) continue;
    if (pitching[key] !== null) continue;
    pitching[key] = key === "IP" ? "0.0" : 0;
    replaced++;
  }
  return replaced;
}

/** @returns {number} */
function walkPlayersSubtree(node) {
  let total = 0;
  if (node === null || node === undefined) return total;

  if (Array.isArray(node)) {
    for (const item of node) total += walkPlayersSubtree(item);
    return total;
  }

  if (typeof node !== "object") return total;

  if (
    node.pitching !== null &&
    typeof node.pitching === "object" &&
    !Array.isArray(node.pitching)
  ) {
    total += normalizePitchingObject(node.pitching);
  }

  for (const k of Object.keys(node)) {
    total += walkPlayersSubtree(node[k]);
  }
  return total;
}

/** @returns number of offending keys left */
function countRemainingNullPitchStats(data) {
  let badCount = 0;

  function walk(node) {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;

    if (
      node.pitching !== null &&
      typeof node.pitching === "object" &&
      !Array.isArray(node.pitching)
    ) {
      for (const key of PITCH_KEYS) {
        if (
          Object.prototype.hasOwnProperty.call(node.pitching, key) &&
          node.pitching[key] === null
        ) {
          badCount++;
        }
      }
    }

    for (const k of Object.keys(node)) walk(node[k]);
  }

  for (const game of data.games ?? []) {
    if (game.players) walk(game.players);
  }

  return badCount;
}

const raw = fs.readFileSync(PATH, "utf8");
const data = JSON.parse(raw);

let replaced = 0;
for (const game of data.games ?? []) {
  if (game.players) replaced += walkPlayersSubtree(game.players);
}

fs.writeFileSync(PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Replaced ${replaced} null pitching statistic value(s).`);

const remainingNulls = countRemainingNullPitchStats(data);
if (remainingNulls > 0) {
  console.error(
    `Verification failed: ${remainingNulls} pitching key(s) still null.`,
  );
  process.exit(1);
}

console.log(
  "Verification OK: no null for IP,H,R,ER,BB,K,HBP,WP where present.",
);
