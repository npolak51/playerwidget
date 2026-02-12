function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function seedFromString(s) {
  const str = String(s ?? "");
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function frac01(seed, salt) {
  const x = (seed ^ seedFromString(salt)) >>> 0;
  // Deterministic pseudo-random in [0,1)
  return ((x * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function pick(seed, salt, items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const f = frac01(seed, salt);
  return items[Math.floor(f * items.length)];
}

function makeAvg(seed, salt, min = 0.22, max = 0.42) {
  const v = min + (max - min) * frac01(seed, salt);
  return `.${String(Math.round(v * 1000)).padStart(3, "0")}`;
}

function makeEra(seed, salt, min = 0.9, max = 4.9) {
  const v = min + (max - min) * frac01(seed, salt);
  return Number(v).toFixed(2);
}

function normalizeUrl(url) {
  const v = String(url ?? "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

function buildScoutingProfiles(player) {
  const raw = player?.scoutPages || {};
  const legacy = player || {};
  const profiles = [];

  const pg = normalizeUrl(raw.perfectGame || legacy.perfectGame);
  const pbr = normalizeUrl(raw.pbr || legacy.pbr);
  const bbnw = normalizeUrl(raw.baseballNorthwest || legacy.baseballNorthwest);

  if (pg) profiles.push({ name: "Perfect Game", url: pg });
  if (pbr) profiles.push({ name: "Prep Baseball Report", url: pbr });
  if (bbnw) profiles.push({ name: "Baseball Northwest", url: bbnw });

  // Optional extra placeholder to match the Figma feel.
  if (profiles.length < 2) profiles.push({ name: "NCSA", url: "#" });

  return profiles;
}

export function getPlayerNewMockData(playerId, player) {
  const seed = seedFromString(playerId || player?.name || "player");
  const first = String(player?.name || "Player").split(" ")[0] || "Player";
  const last = String(player?.name || "Profile").split(" ").slice(1).join(" ") || "Profile";

  const hometowns = ["San Diego, CA", "Seattle, WA", "Tacoma, WA", "Bellevue, WA", "Portland, OR", "Boise, ID"];
  const schools = ["Tahoma High School", "Lincoln High School", "Roosevelt High School", "Central High School"];
  const meals = ["Chicken Parmesan", "Chipotle Bowl", "Teriyaki", "Pasta", "Tacos"];

  const position = player?.positions || "Utility";
  const batsThrows = player?.batThrow ? player.batThrow.replace(/\s+/g, " ") : "R/R";

  const avg = makeAvg(seed, "avg", 0.24, 0.44);
  const obp = makeAvg(seed, "obp", 0.30, 0.50);
  const slg = makeAvg(seed, "slg", 0.32, 0.68);

  const quickStats = [
    { label: "Batting Avg", value: avg, trend: "up" },
    { label: "ERA", value: makeEra(seed, "era", 1.1, 4.2), trend: "down" },
    { label: "Home Runs", value: String(2 + Math.floor(frac01(seed, "hr") * 9)), trend: "up" },
    { label: "Wins", value: String(2 + Math.floor(frac01(seed, "w") * 9)), trend: "up" },
  ];

  const skillsData = [
    { skill: "Hitting", value: Math.round(70 + frac01(seed, "skill-hitting") * 25) },
    { skill: "Power", value: Math.round(65 + frac01(seed, "skill-power") * 30) },
    { skill: "Speed", value: Math.round(65 + frac01(seed, "skill-speed") * 30) },
    { skill: "Fielding", value: Math.round(70 + frac01(seed, "skill-fielding") * 25) },
    { skill: "Arm", value: Math.round(70 + frac01(seed, "skill-arm") * 25) },
    { skill: "Baseball IQ", value: Math.round(75 + frac01(seed, "skill-iq") * 20) },
  ];

  const achievements = [
    { year: 2025, title: "All-League First Team", type: "award", description: pick(seed, "pos", ["Shortstop", "Pitcher", "Utility", "Outfield"]) },
    { year: 2025, title: "Team MVP", type: "mvp", description: "Offensive & Defensive Excellence" },
    { year: 2025, title: "Player of the Week", type: "weekly", description: "Week 7 – 3 HR, 10 RBI" },
    { year: 2024, title: "100 Career Hits", type: "milestone", description: "Reached milestone in April" },
    { year: 2024, title: "All-League Second Team", type: "award", description: pick(seed, "pos2", ["Infield", "Outfield", "Catcher"]) },
    { year: 2024, title: "Showcase Invite", type: "recognition", description: "Regional Top Prospect list" },
  ];

  const recentGames = [
    { date: "Jan 20", opponent: "vs Central", result: "W 8-5", ba: makeAvg(seed, "g1-ba", 0.25, 0.75), hits: "2-4", rbi: 3, era: "1.50", ip: "6.0", so: 8, status: "hot" },
    { date: "Jan 17", opponent: "@ East Valley", result: "W 6-3", ba: makeAvg(seed, "g2-ba", 0.25, 0.75), hits: "2-3", rbi: 2, era: "-", ip: "-", so: "-", status: "hot" },
    { date: "Jan 15", opponent: "vs Westwood", result: "L 4-5", ba: makeAvg(seed, "g3-ba", 0.15, 0.55), hits: "1-4", rbi: 1, era: "-", ip: "-", so: "-", status: "neutral" },
    { date: "Jan 12", opponent: "@ Lincoln", result: "W 10-2", ba: makeAvg(seed, "g4-ba", 0.25, 0.75), hits: "3-5", rbi: 4, era: "0.00", ip: "4.0", so: 6, status: "hot" },
    { date: "Jan 10", opponent: "vs Roosevelt", result: "W 7-4", ba: makeAvg(seed, "g5-ba", 0.15, 0.55), hits: "1-3", rbi: 1, era: "-", ip: "-", so: "-", status: "neutral" },
  ];

  const performanceTrend = [
    { month: "Sept", avg: clamp(Number(`0${makeAvg(seed, "t1-avg")}`), 0.2, 0.7), obp: clamp(Number(`0${makeAvg(seed, "t1-obp")}`), 0.25, 0.75), slg: clamp(Number(`0${makeAvg(seed, "t1-slg")}`), 0.25, 0.85) },
    { month: "Oct", avg: clamp(Number(`0${makeAvg(seed, "t2-avg")}`), 0.2, 0.7), obp: clamp(Number(`0${makeAvg(seed, "t2-obp")}`), 0.25, 0.75), slg: clamp(Number(`0${makeAvg(seed, "t2-slg")}`), 0.25, 0.85) },
    { month: "Nov", avg: clamp(Number(`0${makeAvg(seed, "t3-avg")}`), 0.2, 0.7), obp: clamp(Number(`0${makeAvg(seed, "t3-obp")}`), 0.25, 0.75), slg: clamp(Number(`0${makeAvg(seed, "t3-slg")}`), 0.25, 0.85) },
    { month: "Dec", avg: clamp(Number(`0${makeAvg(seed, "t4-avg")}`), 0.2, 0.7), obp: clamp(Number(`0${makeAvg(seed, "t4-obp")}`), 0.25, 0.75), slg: clamp(Number(`0${makeAvg(seed, "t4-slg")}`), 0.25, 0.85) },
    { month: "Jan", avg: clamp(Number(`0${makeAvg(seed, "t5-avg")}`), 0.2, 0.7), obp: clamp(Number(`0${makeAvg(seed, "t5-obp")}`), 0.25, 0.75), slg: clamp(Number(`0${makeAvg(seed, "t5-slg")}`), 0.25, 0.85) },
  ];

  const milestones = [
    { date: "May 15, 2025", description: "100th Career Hit", icon: "Star" },
    { date: "Apr 22, 2025", description: "Complete game shutout – 11 K", icon: "Trophy" },
    { date: "Mar 8, 2025", description: "Career-high 5 RBI game", icon: "Target" },
    { date: "Oct 15, 2024", description: "25th Career Extra-Base Hit", icon: "Flame" },
  ];

  const seasonStats = [
    { category: "Games Played", value: String(18 + Math.floor(frac01(seed, "gp") * 12)) },
    { category: "At Bats", value: String(60 + Math.floor(frac01(seed, "ab") * 70)) },
    { category: "Runs", value: String(12 + Math.floor(frac01(seed, "r") * 30)) },
    { category: "Hits", value: String(18 + Math.floor(frac01(seed, "h") * 35)) },
    { category: "Home Runs", value: String(1 + Math.floor(frac01(seed, "shr") * 10)) },
    { category: "RBI", value: String(10 + Math.floor(frac01(seed, "srbi") * 35)) },
    { category: "Stolen Bases", value: String(Math.floor(frac01(seed, "sb") * 18)) },
    { category: "Batting Average", value: avg },
    { category: "On-Base %", value: obp },
    { category: "Slugging %", value: slg },
    { category: "OPS", value: (Number(`0${obp}`) + Number(`0${slg}`)).toFixed(3).replace(/^0/, "") },
  ];

  const pitchingStats = [
    { category: "Appearances", value: String(5 + Math.floor(frac01(seed, "app") * 10)) },
    { category: "Starts", value: String(3 + Math.floor(frac01(seed, "gs") * 10)) },
    { category: "Innings Pitched", value: (18 + frac01(seed, "ip") * 55).toFixed(1) },
    { category: "Wins", value: String(2 + Math.floor(frac01(seed, "pw") * 9)) },
    { category: "ERA", value: makeEra(seed, "sera", 1.2, 4.4) },
    { category: "Strikeouts", value: String(20 + Math.floor(frac01(seed, "k") * 75)) },
    { category: "Walks", value: String(5 + Math.floor(frac01(seed, "bb") * 30)) },
    { category: "Wild Pitches", value: String(Math.floor(frac01(seed, "wpitch") * 10)) },
    { category: "WHIP", value: (0.85 + frac01(seed, "whip") * 0.75).toFixed(2) },
    { category: "Opponent BA", value: makeAvg(seed, "baa", 0.15, 0.33) },
    { category: "Strikeouts/9", value: (7.5 + frac01(seed, "k9") * 7.0).toFixed(1) },
  ];

  const careerStats = {
    hitting: [
      { season: "2025", games: 24, ab: 92, r: 28, h: 33, doubles: 8, triples: 1, hr: 6, rbi: 29, sb: 11, avg, obp, slg },
      { season: "2024", games: 26, ab: 98, r: 31, h: 35, doubles: 9, triples: 2, hr: 5, rbi: 27, sb: 14, avg: makeAvg(seed, "c24-avg", 0.26, 0.44), obp: makeAvg(seed, "c24-obp", 0.30, 0.52), slg: makeAvg(seed, "c24-slg", 0.32, 0.66) },
      { season: "2023", games: 24, ab: 86, r: 21, h: 28, doubles: 6, triples: 1, hr: 3, rbi: 20, sb: 9, avg: makeAvg(seed, "c23-avg", 0.24, 0.42), obp: makeAvg(seed, "c23-obp", 0.28, 0.50), slg: makeAvg(seed, "c23-slg", 0.30, 0.62) },
      { season: "Career", games: 74, ab: 276, r: 80, h: 96, doubles: 23, triples: 4, hr: 14, rbi: 76, sb: 34, avg: makeAvg(seed, "cc-avg", 0.26, 0.40), obp: makeAvg(seed, "cc-obp", 0.30, 0.48), slg: makeAvg(seed, "cc-slg", 0.36, 0.62) },
    ],
    pitching: [
      { season: "2025", games: 10, gs: 8, ip: "48.2", w: 6, l: 2, era: makeEra(seed, "p25-era", 1.1, 4.3), so: 63, bb: 17, h: 39, whip: (0.90 + frac01(seed, "p25-whip") * 0.7).toFixed(2) },
      { season: "2024", games: 8, gs: 7, ip: "41.1", w: 5, l: 2, era: makeEra(seed, "p24-era", 1.1, 4.6), so: 52, bb: 16, h: 38, whip: (0.95 + frac01(seed, "p24-whip") * 0.8).toFixed(2) },
      { season: "2023", games: 6, gs: 5, ip: "29.0", w: 3, l: 2, era: makeEra(seed, "p23-era", 1.3, 5.2), so: 34, bb: 12, h: 28, whip: (1.00 + frac01(seed, "p23-whip") * 0.9).toFixed(2) },
      { season: "Career", games: 24, gs: 20, ip: "119.0", w: 14, l: 6, era: makeEra(seed, "pc-era", 1.4, 4.2), so: 149, bb: 45, h: 105, whip: (1.00 + frac01(seed, "pc-whip") * 0.6).toFixed(2) },
    ],
  };

  return {
    player: {
      name: player?.name || `${first} ${last}`,
      number: player?.number || String(1 + Math.floor(frac01(seed, "num") * 35)),
      position,
      batsThrows,
      heightWeight: player?.heightWeight || "6'0/180 lbs",
      classYear: player?.class || "2026",
      birthdate: pick(seed, "dob", ["March 15, 2007", "April 8, 2008", "June 2, 2007", "Sept 21, 2006"]),
      age: 16 + Math.floor(frac01(seed, "age") * 3),
      hometown: pick(seed, "home", hometowns),
      highSchool: pick(seed, "school", schools),
      gpa: (3.2 + frac01(seed, "gpa") * 0.7).toFixed(2),
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, "")}@email.com`,
      phone: "(555) 555-0123",
      favoriteTeam: player?.favoriteTeam || pick(seed, "fav", ["Mariners", "Cubs", "Padres", "Dodgers", "Yankees"]),
      favoriteMeal: player?.postGameMeal || pick(seed, "meal", meals),
      bio:
        "Dynamic two-way player known for steady leadership and a strong work ethic. Competitive presence with a team-first mindset and a love for the game.",
      scoutingProfiles: buildScoutingProfiles(player),
    },
    quickStats,
    skillsData,
    achievements,
    recentGames,
    performanceTrend,
    milestones,
    seasonStats,
    pitchingStats,
    careerStats,
  };
}

