/**
 * Build player profile from real data (players.json). No mock/fake data.
 */

function normalizeUrl(url) {
  const v = String(url ?? "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

export function buildScoutingProfiles(player) {
  const raw = player?.scoutPages || {};
  const legacy = player || {};
  const profiles = [];

  const pg = normalizeUrl(raw.perfectGame || legacy.perfectGame);
  const pbr = normalizeUrl(raw.pbr || legacy.pbr);
  const bbnw = normalizeUrl(raw.baseballNorthwest || legacy.baseballNorthwest);

  if (pg) profiles.push({ name: "Perfect Game", url: pg });
  if (pbr) profiles.push({ name: "Prep Baseball Report", url: pbr });
  if (bbnw) profiles.push({ name: "Baseball Northwest", url: bbnw });

  return profiles;
}

/**
 * Build player profile object from players.json data. Uses only real data; empty strings for missing fields.
 */
export function buildPlayerProfile(player) {
  const p = player || {};
  const batsThrows = p.batThrow ? String(p.batThrow).replace(/\s+/g, " ") : "";

  return {
    name: p.name || "",
    number: p.number || "",
    position: p.positions || "",
    batsThrows: batsThrows || "",
    heightWeight: p.heightWeight || "",
    classYear: p.class || "",
    birthdate: "",
    age: "",
    hometown: p.hometown || "",
    highSchool: p.school || "",
    gpa: "",
    email: "",
    phone: "",
    favoriteTeam: p.favoriteTeam || "",
    preGameMeal: p.preGameMeal || "",
    bio: "",
    scoutingProfiles: buildScoutingProfiles(player),
  };
}
