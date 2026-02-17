import { useEffect, useMemo, useRef, useState } from "react";
import playersData from "../data/players.json";
import statsData from "../data/stats.json";
import gameLogsData from "../data/gameLogs.json";
import { allLeagueSelections } from "../Honors/honorsData";
import { offensiveStatCategories, pitchingStatCategories } from "../Leaders/leadersData";
import { useEmbedAutoHeight } from "./useEmbedAutoHeight";
import { getPlayerNewMockData } from "./playerNewMockData";
import { MILESTONE_RULES } from "./milestoneRules";

import ProfileHeaderSection from "./sections/ProfileHeaderSection";
import PlayerSelectSection, { buildRosterFromPlayersJson } from "./sections/PlayerSelectSection";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import AchievementsSection from "./sections/AchievementsSection";
import RecentPerformanceSection from "./sections/RecentPerformanceSection";
import CareerMilestonesSection from "./sections/CareerMilestonesSection";
import SeasonStatsSection from "./sections/SeasonStatsSection";
import CareerStatsSection from "./sections/CareerStatsSection";
import ContactSection from "./sections/ContactSection";

function normalizeTeam(t) {
  const v = String(t ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v.includes("junior") || v === "jv") return "JV";
  if (v.startsWith("var")) return "Var.";
  return v.toUpperCase();
}

function varsityFirstCareerSeasons(seasons) {
  const normalized = (seasons || []).map((s) => ({ ...s, team: normalizeTeam(s.team) }));
  const varSeasons = normalized.filter((s) => s.team === "Var.");
  const jvSeasons = normalized.filter((s) => s.team === "JV");
  const picked = varSeasons.length ? varSeasons : jvSeasons;
  picked.sort((a, b) => (Number(b?.year) || 0) - (Number(a?.year) || 0));
  return picked;
}

function formatBattingRate3(v) {
  const raw = String(v ?? "").trim();
  if (!raw) return "";
  const num = Number(raw.startsWith(".") ? `0${raw}` : raw);
  if (!Number.isFinite(num)) return raw;
  let out = num.toFixed(3);
  if (out.startsWith("0")) out = out.slice(1);
  return out;
}

function formatPitchingRate2(v) {
  const raw = String(v ?? "").trim();
  if (!raw) return "";
  const num = Number(raw);
  if (!Number.isFinite(num)) return raw;
  return num.toFixed(2);
}

function formatRate3FromNumber(num) {
  if (!Number.isFinite(num)) return "—";
  let out = Number(num).toFixed(3);
  if (out.startsWith("0")) out = out.slice(1);
  return out;
}

function formatRate2FromNumber(num) {
  if (!Number.isFinite(num)) return "—";
  return Number(num).toFixed(2);
}

function parseRateToNumber(v) {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const num = Number(raw.startsWith(".") ? `0${raw}` : raw);
  return Number.isFinite(num) ? num : null;
}

function formatNumber1(num) {
  if (!Number.isFinite(num)) return "—";
  return Number(num).toFixed(1);
}

function numOrNull(v) {
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

function computeObp({ H, AB, BB, HBP, SF }) {
  const h = numOrNull(H);
  const ab = numOrNull(AB);
  const bb = numOrNull(BB);
  const hbp = numOrNull(HBP);
  const sf = numOrNull(SF);
  const num = (h ?? 0) + (bb ?? 0) + (hbp ?? 0);
  const den = (ab ?? 0) + (bb ?? 0) + (hbp ?? 0) + (sf ?? 0);
  if (!den) return null;
  return num / den;
}

function computeSlg({ H, AB, "2B": doubles, "3B": triples, HR }) {
  const h = numOrNull(H);
  const ab = numOrNull(AB);
  const d = numOrNull(doubles);
  const t = numOrNull(triples);
  const hr = numOrNull(HR);
  if (!ab) return null;
  const singles = (h ?? 0) - (d ?? 0) - (t ?? 0) - (hr ?? 0);
  const tb = (singles ?? 0) + 2 * (d ?? 0) + 3 * (t ?? 0) + 4 * (hr ?? 0);
  return tb / ab;
}

function formatOpsFrom(obp, slg) {
  const obpRaw = String(obp ?? "").trim();
  const slgRaw = String(slg ?? "").trim();
  const obpNum = Number(obpRaw.startsWith(".") ? `0${obpRaw}` : obpRaw);
  const slgNum = Number(slgRaw.startsWith(".") ? `0${slgRaw}` : slgRaw);
  if (!Number.isFinite(obpNum) || !Number.isFinite(slgNum)) return "";
  let out = (obpNum + slgNum).toFixed(3);
  if (out.startsWith("0")) out = out.slice(1);
  return out;
}

function normalizeNameForMatch(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function allLeagueTeamRank(team) {
  const t = String(team ?? "").toLowerCase();
  if (t.includes("1st") || t.includes("first")) return 1;
  if (t.includes("2nd") || t.includes("second")) return 2;
  if (t.includes("honorable") || t === "hm") return 3;
  return 9;
}

function parseInningsToOuts(ip) {
  const raw = String(ip ?? "").trim();
  if (!raw) return 0;
  const m = raw.match(/^(\d+)(?:\.(\d))?$/);
  if (!m) return 0;
  const inn = Number(m[1] || 0);
  const frac = Number(m[2] || 0);
  const outs = frac === 1 ? 1 : frac === 2 ? 2 : 0;
  return inn * 3 + outs;
}

function outsToIpString(outs) {
  const o = Number(outs) || 0;
  const inn = Math.floor(o / 3);
  const rem = o % 3;
  return `${inn}.${rem}`;
}

function sumNumeric(a, b) {
  const na = Number(a);
  const nb = Number(b);
  return (Number.isFinite(na) ? na : 0) + (Number.isFinite(nb) ? nb : 0);
}

function categoryKeyForRule(rule) {
  const sport = String(rule?.sport || "");
  const stat = String(rule?.stat || "");
  if (sport === "batting") {
    if (stat === "H") return "Hits";
    if (stat === "SB") return "Stolen Bases";
    if (stat === "RBI") return "RBI";
    if (stat === "R") return "Runs";
    if (stat === "HR") return "Home Runs";
    if (stat === "XBH") return "Extra-Base Hits";
    return stat || "Batting";
  }
  if (sport === "pitching") {
    if (stat === "K") return "Strikeouts";
    if (stat === "IP") return "Innings Pitched";
    return stat || "Pitching";
  }
  return stat || "Milestone";
}

function seasonsForTeamSortedAsc(seasons, teamWanted) {
  const out = (seasons || [])
    .filter((s) => normalizeTeam(s?.team) === teamWanted)
    .map((s) => ({ ...s, yearNum: Number(s?.year) || 0 }));
  out.sort((a, b) => a.yearNum - b.yearNum);
  return out;
}

function firstYearThresholdReachedBatting(seasonsAsc, stat, threshold) {
  let total = 0;
  for (const s of seasonsAsc) {
    total += sumNumeric(s?.[stat], 0);
    if (total >= threshold) return s.yearNum || null;
  }
  return null;
}

function firstYearThresholdReachedPitching(seasonsAsc, stat, threshold) {
  if (stat === "IP") {
    let outs = 0;
    for (const s of seasonsAsc) {
      outs += parseInningsToOuts(s?.IP);
      if (outs >= threshold * 3) return s.yearNum || null;
    }
    return null;
  }

  let total = 0;
  for (const s of seasonsAsc) {
    total += sumNumeric(s?.[stat], 0);
    if (total >= threshold) return s.yearNum || null;
  }
  return null;
}

function firstVarsityDateThresholdReachedFromGameLogs(playerId, sport, stat, threshold) {
  const games = Array.isArray(gameLogsData?.games) ? gameLogsData.games : [];
  if (!playerId || !games.length) return null;
  if (!sport || !stat || !Number.isFinite(Number(threshold))) return null;

  const relevant = games
    .filter((g) => normalizeTeam(g?.team) === "Var." && g?.players?.[playerId])
    .map((g) => ({
      date: String(g?.date || ""),
      batting: g.players[playerId]?.batting || null,
      pitching: g.players[playerId]?.pitching || null,
    }))
    .filter((g) => g.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (!relevant.length) return null;

  if (sport === "pitching" && stat === "IP") {
    let outs = 0;
    for (const g of relevant) {
      outs += g.pitching?.IP ? parseInningsToOuts(g.pitching.IP) : 0;
      if (outs >= Number(threshold) * 3) return g.date;
    }
    return null;
  }

  let total = 0;
  for (const g of relevant) {
    if (sport === "batting") {
      const b = g.batting || {};
      let add = 0;
      if (stat === "XBH") {
        add = (Number(b["2B"]) || 0) + (Number(b["3B"]) || 0) + (Number(b.HR) || 0);
      } else {
        add = Number(b?.[stat]) || 0;
      }
      total += add;
    } else if (sport === "pitching") {
      const p = g.pitching || {};
      total += Number(p?.[stat]) || 0;
    }

    if (total >= Number(threshold)) return g.date;
  }

  return null;
}

function buildMilestonesFromStats(selectedStats, playerId) {
  if (!selectedStats) return [];
  if (!Array.isArray(MILESTONE_RULES) || MILESTONE_RULES.length === 0) return [];

  const battingSeasons = selectedStats?.batting?.seasons || [];
  const pitchingSeasons = selectedStats?.pitching?.seasons || [];

  const all = [];
  for (const team of ["Var.", "JV"]) {
    const batAsc = seasonsForTeamSortedAsc(battingSeasons, team);
    const pitAsc = seasonsForTeamSortedAsc(pitchingSeasons, team);

    for (const rule of MILESTONE_RULES) {
      const sport = rule?.sport;
      const stat = rule?.stat;
      const threshold = Number(rule?.threshold);
      if (!sport || !stat || !Number.isFinite(threshold)) continue;

      const achievedYear =
        sport === "batting"
          ? firstYearThresholdReachedBatting(batAsc, stat, threshold)
          : sport === "pitching"
            ? firstYearThresholdReachedPitching(pitAsc, stat, threshold)
            : null;

      if (!achievedYear) continue;

      const achievedAt =
        team === "Var." ? firstVarsityDateThresholdReachedFromGameLogs(playerId, sport, stat, threshold) : null;
      const sortKey = achievedAt
        ? Date.parse(achievedAt)
        : Number.isFinite(Number(achievedYear))
          ? Date.parse(`${achievedYear}-12-31`)
          : 0;

      all.push({
        // Keep existing section API (date + description + icon), but also attach metadata
        // so the section can select the "default 4" intelligently.
        date: achievedAt ? `${achievedAt} • ${team}` : `${achievedYear} • ${team}`,
        description: String(rule.title || `${threshold} ${stat}`),
        icon: rule.icon || "Star",
        team,
        achievedYear,
        achievedAt,
        sortKey,
        categoryKey: categoryKeyForRule(rule),
        threshold,
        sport,
        stat,
        showInAchievements: rule?.showInAchievements === true,
      });
    }
  }

  // Remove older thresholds within the same category.
  // - If ANY Varsity milestone exists for a category, hide all JV milestones in that category.
  // - Within the chosen team, keep only the highest threshold reached.
  const byCategory = new Map(); // categoryKey -> { varBest, jvBest }
  for (const m of all) {
    const cat = String(m?.categoryKey || "");
    if (!cat) continue;
    const bucket = byCategory.get(cat) || { varBest: null, jvBest: null };
    const slot = m.team === "Var." ? "varBest" : m.team === "JV" ? "jvBest" : null;
    if (!slot) continue;

    const prev = bucket[slot];
    if (!prev) {
      bucket[slot] = m;
    } else {
      const prevThr = Number(prev?.threshold) || 0;
      const thr = Number(m?.threshold) || 0;
      const prevKey = Number(prev?.sortKey) || 0;
      const key = Number(m?.sortKey) || 0;
      if (thr > prevThr || (thr === prevThr && key > prevKey)) {
        bucket[slot] = m;
      }
    }
    byCategory.set(cat, bucket);
  }

  const out = [];
  for (const bucket of byCategory.values()) {
    if (bucket.varBest) out.push(bucket.varBest);
    else if (bucket.jvBest) out.push(bucket.jvBest);
  }

  // Most recent first; tie-break by bigger milestone.
  out.sort((a, b) => {
    const ka = Number(a?.sortKey) || 0;
    const kb = Number(b?.sortKey) || 0;
    if (kb !== ka) return kb - ka;
    const ta = Number(a.threshold) || 0;
    const tb = Number(b.threshold) || 0;
    if (tb !== ta) return tb - ta;
    const ra = a.team === "Var." ? 0 : 1;
    const rb = b.team === "Var." ? 0 : 1;
    return ra - rb;
  });

  return out;
}

function buildGameMilestonesForPlayer(playerId) {
  const games = Array.isArray(gameLogsData?.games) ? gameLogsData.games : [];
  if (!playerId || games.length === 0) return [];

  const relevant = games
    .filter((g) => g?.players && g.players[playerId])
    .map((g) => ({
      gameId: g.gameId,
      date: String(g.date || ""),
      year: Number(String(g.date || "").slice(0, 4)) || Number(g.season) || 0,
      team: String(g.team || ""),
      opponent: String(g.opponent || ""),
      batting: g.players[playerId]?.batting || null,
      pitching: g.players[playerId]?.pitching || null,
    }))
    .filter((g) => g.year > 0 && g.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (!relevant.length) return [];

  const out = [];

  for (const team of ["Var.", "JV"]) {
    const teamGames = relevant.filter((g) => normalizeTeam(g.team) === team);
    if (!teamGames.length) continue;

    // Option 2: emit a milestone each time a new best is set.
    const best = { hits: 0, sb: 0, rbi: 0, runs: 0, k: 0, scorelessOuts: 0 };
    let firstPerfectGame = false;
    let firstNoHitter = false;
    let firstShutout = false;

    for (const g of teamGames) {
      const b = g.batting || {};
      const p = g.pitching || {};

      const H = Number(b.H) || 0;
      const SB = Number(b.SB) || 0;
      const RBI = Number(b.RBI) || 0;
      const R = Number(b.R) || 0;

      if (H > best.hits) {
        best.hits = H;
        out.push({
          date: `${g.date} • ${team}`,
          description: `Career-high ${H} hit game vs ${g.opponent || "opponent"}`,
          icon: "Star",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "Career-high Hits Game",
          threshold: H,
        });
      }
      if (SB > best.sb) {
        best.sb = SB;
        out.push({
          date: `${g.date} • ${team}`,
          description: `Career-high ${SB} stolen base game vs ${g.opponent || "opponent"}`,
          icon: "Target",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "Career-high SB Game",
          threshold: SB,
        });
      }
      if (RBI > best.rbi) {
        best.rbi = RBI;
        out.push({
          date: `${g.date} • ${team}`,
          description: `Career-high ${RBI} RBI game vs ${g.opponent || "opponent"}`,
          icon: "Star",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "Career-high RBI Game",
          threshold: RBI,
        });
      }
      if (R > best.runs) {
        best.runs = R;
        out.push({
          date: `${g.date} • ${team}`,
          description: `Career-high ${R} run game vs ${g.opponent || "opponent"}`,
          icon: "Star",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "Career-high Runs Game",
          threshold: R,
        });
      }

      const outs = parseInningsToOuts(p.IP);
      const K = Number(p.K) || 0;

      if (K > best.k) {
        best.k = K;
        out.push({
          date: `${g.date} • ${team}`,
          description: `Career-high ${K} strikeout game (${outsToIpString(outs)} IP) vs ${g.opponent || "opponent"}`,
          icon: "Flame",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "Career-high K Game",
          threshold: K,
        });
      }

      const pitR = p.R === null || p.R === undefined ? null : Number(p.R);
      const pitER = p.ER === null || p.ER === undefined ? null : Number(p.ER);
      const scoreless = outs > 0 && pitR === 0 && pitER === 0;

      if (scoreless && outs > best.scorelessOuts) {
        best.scorelessOuts = outs;
        out.push({
          date: `${g.date} • ${team}`,
          description: `Career-high ${outsToIpString(outs)} scoreless innings (${K} K) vs ${g.opponent || "opponent"}`,
          icon: "Trophy",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "Career-high Scoreless IP",
          threshold: outs,
        });
      }

      // First Perfect Game / No-Hitter / Shutout (7+ IP)
      const minOuts = 21;
      const ipOk = outs >= minOuts;
      const pitH = p.H === null || p.H === undefined ? null : Number(p.H);
      const pitBB = p.BB === null || p.BB === undefined ? null : Number(p.BB);
      const pitHBP = p.HBP === null || p.HBP === undefined ? null : Number(p.HBP);

      const isShutout = ipOk && pitR === 0 && pitER === 0;
      const isNoHitter = isShutout && pitH === 0;
      const isPerfect = isNoHitter && pitBB === 0 && pitHBP === 0;

      if (!firstPerfectGame && isPerfect) {
        firstPerfectGame = true;
        out.push({
          date: `${g.date} • ${team}`,
          description: `First Perfect Game — ${outsToIpString(outs)} IP, ${K} K vs ${g.opponent || "opponent"}`,
          icon: "Trophy",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "First Perfect Game",
          threshold: outs,
        });
      }
      if (!firstNoHitter && isNoHitter) {
        firstNoHitter = true;
        out.push({
          date: `${g.date} • ${team}`,
          description: `First No-Hitter — ${outsToIpString(outs)} IP, ${K} K vs ${g.opponent || "opponent"}`,
          icon: "Trophy",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "First No-Hitter",
          threshold: outs,
        });
      }
      if (!firstShutout && isShutout) {
        firstShutout = true;
        out.push({
          date: `${g.date} • ${team}`,
          description: `First Shutout — ${outsToIpString(outs)} IP, ${K} K vs ${g.opponent || "opponent"}`,
          icon: "Trophy",
          team,
          achievedYear: g.year,
          achievedAt: g.date,
          sortKey: Date.parse(g.date),
          categoryKey: "First Shutout",
          threshold: outs,
        });
      }
    }
  }

  // Collapse "career-high" milestones to only the CURRENT best per category+team.
  // (So earlier game-high milestones disappear once surpassed.)
  const bestByKey = new Map();
  const keep = [];
  for (const m of out) {
    const key = `${m.team}::${m.categoryKey}`;
    const isCareerHigh = String(m.categoryKey || "").startsWith("Career-high");
    if (!isCareerHigh) {
      keep.push(m);
      continue;
    }

    const prev = bestByKey.get(key);
    if (!prev) {
      bestByKey.set(key, m);
      continue;
    }

    const tPrev = Number(prev.threshold) || 0;
    const tNow = Number(m.threshold) || 0;
    if (tNow > tPrev) {
      bestByKey.set(key, m);
      continue;
    }
    if (tNow === tPrev) {
      // Tie-breaker: keep the most recent.
      if (String(m.date || "") > String(prev.date || "")) bestByKey.set(key, m);
    }
  }

  const collapsed = [...keep, ...Array.from(bestByKey.values())];
  collapsed.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return collapsed;
}

function readPlayerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "";
}

function setPlayerIdInUrl(playerId) {
  const url = new URL(window.location.href);
  url.searchParams.set("player", playerId);
  window.history.pushState({}, "", url.toString());
}

export default function PlayerNewProfileWidget() {
  const roster = useMemo(() => {
    return buildRosterFromPlayersJson(playersData.players || {});
  }, []);

  const siteBase = useMemo(() => {
    return new URLSearchParams(window.location.search).get("siteBase") || "www.tahomabearsbaseball.com";
  }, []);

  const [playerId, setPlayerId] = useState(() => readPlayerIdFromUrl());
  const [playerSelectMatchHeight, setPlayerSelectMatchHeight] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    achievements: true,
    recentGames: true,
    seasonStats: true,
    careerStats: true,
  });
  const personalInfoRef = useRef(null);

  // Keep state synced with browser navigation (back/forward).
  useEffect(() => {
    const onPop = () => setPlayerId(readPlayerIdFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // If player isn't specified, pick the first roster entry.
  useEffect(() => {
    if (playerId) return;
    if (!roster.length) return;
    const first = roster[0].id;
    setPlayerId(first);
    setPlayerIdInUrl(first);
  }, [playerId, roster]);

  const selectedPlayer = playerId ? playersData.players?.[playerId] : null;
  const selectedStats = playerId ? statsData.players?.[playerId] : null;

  const mock = useMemo(() => {
    return getPlayerNewMockData(playerId, selectedPlayer);
  }, [playerId, selectedPlayer]);

  const achievements = useMemo(() => {
    const playerName = selectedPlayer?.name || mock?.player?.name || "";
    const key = normalizeNameForMatch(playerName);
    if (!key) return [];

    const matches = (allLeagueSelections || []).filter((row) => {
      return normalizeNameForMatch(row?.name) === key;
    });

    const mapped = matches.map((row) => ({
      year: row.year,
      type: "award",
      title: `All‑League ${row.team}`,
      description: `${row.position || ""}${row.class ? ` • ${row.class}` : ""}`.trim() || "All‑League selection",
    }));

    mapped.sort((a, b) => {
      const ya = Number(a.year) || 0;
      const yb = Number(b.year) || 0;
      if (yb !== ya) return yb - ya;
      return allLeagueTeamRank(a.title) - allLeagueTeamRank(b.title);
    });

    return mapped;
  }, [selectedPlayer?.name, mock?.player?.name]);

  const milestoneAchievements = useMemo(() => {
    const computed = buildMilestonesFromStats(selectedStats, playerId);
    return computed
      .filter((m) => m?.showInAchievements === true)
      .map((m) => ({
        year: m?.team === "JV" ? "" : m.achievedYear,
        type: "milestone",
        title: m.description,
        description: m.team ? `${m.team} milestone` : "Milestone",
      }));
  }, [selectedStats, playerId]);

  const recordAchievements = useMemo(() => {
    const playerName = selectedPlayer?.name || mock?.player?.name || "";
    const key = normalizeNameForMatch(playerName);
    if (!key) return [];

    const allCategories = [...(offensiveStatCategories || []), ...(pitchingStatCategories || [])];
    const records = [];

    for (const cat of allCategories) {
      const leaders = cat?.leaders || [];
      for (const leader of leaders) {
        if (normalizeNameForMatch(leader?.name) !== key) continue;
        const rank = leader?.rank;
        const statName = cat?.name || "";
        const year = leader?.year;
        const value = leader?.value || "";
        const games = leader?.games || "";
        const descParts = [value, games].filter(Boolean).join(" ");
        const description = descParts ? `${descParts} • ${year}` : String(year || "");
        const c = String(leader?.class ?? "").trim().toLowerCase();
        const active = c && c !== "sr" && c !== "senior";
        records.push({
          year: year || "",
          type: "record",
          title: `#${rank} All-Time Single-Season ${statName}`,
          description,
          active,
          __sortKey: Number(year) || 0,
        });
      }
    }

    records.sort((a, b) => b.__sortKey - a.__sortKey);
    return records.map(({ __sortKey, ...r }) => r);
  }, [selectedPlayer?.name, mock?.player?.name]);

  const combinedAchievements = useMemo(() => {
    const combined = [...(achievements || []), ...(milestoneAchievements || []), ...(recordAchievements || [])];
    combined.sort((a, b) => (Number(b?.year) || 0) - (Number(a?.year) || 0));
    return combined;
  }, [achievements, milestoneAchievements, recordAchievements]);

  const milestones = useMemo(() => {
    const computed = buildMilestonesFromStats(selectedStats, playerId);
    const gameMilestones = buildGameMilestonesForPlayer(playerId);
    const merged = [...(computed || []), ...(gameMilestones || [])];
    merged.sort((a, b) => {
      const ka = Number(a?.sortKey) || 0;
      const kb = Number(b?.sortKey) || 0;
      if (kb !== ka) return kb - ka;
      const ta = Number(a?.threshold) || 0;
      const tb = Number(b?.threshold) || 0;
      return tb - ta;
    });
    return merged.length ? merged : mock.milestones;
  }, [selectedStats, playerId, mock.milestones]);

  const activeSeasonYear = useMemo(() => {
    const games = Array.isArray(gameLogsData?.games) ? gameLogsData.games : [];
    let maxSeason = 0;
    for (const g of games) {
      const s = Number(g?.season) || 0;
      if (s > maxSeason) maxSeason = s;
    }
    // Default to 2025 until any 2026 games exist in gameLogs.
    return maxSeason || 2025;
  }, []);

  const headerQuickStats = useMemo(() => {
    const year = Number(activeSeasonYear) || 0;
    const batSeasons = selectedStats?.batting?.seasons || [];
    const pitSeasons = selectedStats?.pitching?.seasons || [];

    function pickSeasonRow(seasons, y) {
      const wanted = String(y || "");
      if (!wanted) return null;
      const inYear = (seasons || []).filter((s) => String(s?.year || "") === wanted);
      const varRow = inYear.find((s) => normalizeTeam(s?.team) === "Var.");
      if (varRow) return varRow;
      return inYear[0] || null;
    }

    function pickPrevRow(seasons, currentRow) {
      const curYear = Number(currentRow?.year) || 0;
      const curTeam = normalizeTeam(currentRow?.team);
      const prev = (seasons || [])
        .filter((s) => normalizeTeam(s?.team) === curTeam)
        .map((s) => ({ ...s, __y: Number(s?.year) || 0 }))
        .filter((s) => s.__y > 0 && s.__y < curYear)
        .sort((a, b) => b.__y - a.__y)[0];
      return prev || null;
    }

    const batRow = pickSeasonRow(batSeasons, year);
    const pitRow = pickSeasonRow(pitSeasons, year);

    const hasBat = !!batRow && Object.values(batRow).some((v) => v !== null && v !== "" && v !== undefined);
    const hasPit = !!pitRow && Object.values(pitRow).some((v) => v !== null && v !== "" && v !== undefined);
    const mode = hasBat && hasPit ? "both" : hasBat ? "batting" : "pitching";

    const prevBat = batRow ? pickPrevRow(batSeasons, batRow) : null;
    const prevPit = pitRow ? pickPrevRow(pitSeasons, pitRow) : null;

    function trendFor({ current, prev, higherIsGood }) {
      const c = parseRateToNumber(current);
      const p = parseRateToNumber(prev);
      if (c === null || p === null || c === p) return null;
      const dir = c > p ? "up" : "down";
      const good = higherIsGood ? dir === "up" : dir === "down";
      return { dir, tone: good ? "good" : "bad" };
    }

    // Batting rates
    const avg = batRow ? formatBattingRate3(batRow.AVG) || "—" : "—";
    const obp = batRow ? formatBattingRate3(batRow.OBP) || "—" : "—";
    const slg = batRow ? formatBattingRate3(batRow.SLG) || "—" : "—";
    const ops = batRow ? formatOpsFrom(batRow.OBP, batRow.SLG) || "—" : "—";

    // Pitching rates
    const era = pitRow ? formatPitchingRate2(pitRow.ERA) || "—" : "—";
    const whip = pitRow ? formatPitchingRate2(pitRow.WHIP) || "—" : "—";
    const baa = pitRow ? formatBattingRate3(pitRow.BAA) || "—" : "—";

    // K/9 (strikeouts per 9 innings).
    let kPer9 = "—";
    let kPer9Num = null;
    if (pitRow?.IP && Number.isFinite(Number(pitRow?.K))) {
      const outs = parseInningsToOuts(pitRow.IP);
      const innings = outs > 0 ? outs / 3 : 0;
      const k = Number(pitRow.K) || 0;
      if (innings > 0) {
        kPer9Num = (k * 9) / innings;
        kPer9 = formatNumber1(kPer9Num);
      }
    }

    const prevAvg = prevBat ? prevBat.AVG : null;
    const prevObp = prevBat ? prevBat.OBP : null;
    const prevSlg = prevBat ? prevBat.SLG : null;
    const prevOps = prevBat ? formatOpsFrom(prevBat.OBP, prevBat.SLG) : null;

    const prevEra = prevPit ? prevPit.ERA : null;
    const prevWhip = prevPit ? prevPit.WHIP : null;
    const prevBaa = prevPit ? prevPit.BAA : null;

    let prevKPer9 = null;
    if (prevPit?.IP && Number.isFinite(Number(prevPit?.K))) {
      const outs = parseInningsToOuts(prevPit.IP);
      const innings = outs > 0 ? outs / 3 : 0;
      const k = Number(prevPit.K) || 0;
      if (innings > 0) prevKPer9 = String((k * 9) / innings);
    }

    if (mode === "both") {
      return [
        { label: "AVG", value: avg, trend: trendFor({ current: batRow?.AVG, prev: prevAvg, higherIsGood: true }) },
        { label: "OBP", value: obp, trend: trendFor({ current: batRow?.OBP, prev: prevObp, higherIsGood: true }) },
        { label: "ERA", value: era, trend: trendFor({ current: pitRow?.ERA, prev: prevEra, higherIsGood: false }) },
        { label: "WHIP", value: whip, trend: trendFor({ current: pitRow?.WHIP, prev: prevWhip, higherIsGood: false }) },
      ];
    }

    if (mode === "batting") {
      return [
        { label: "AVG", value: avg, trend: trendFor({ current: batRow?.AVG, prev: prevAvg, higherIsGood: true }) },
        { label: "OBP", value: obp, trend: trendFor({ current: batRow?.OBP, prev: prevObp, higherIsGood: true }) },
        { label: "SLG", value: slg, trend: trendFor({ current: batRow?.SLG, prev: prevSlg, higherIsGood: true }) },
        { label: "OPS", value: ops, trend: trendFor({ current: ops, prev: prevOps, higherIsGood: true }) },
      ];
    }

    // pitching only
    return [
      { label: "ERA", value: era, trend: trendFor({ current: pitRow?.ERA, prev: prevEra, higherIsGood: false }) },
      { label: "WHIP", value: whip, trend: trendFor({ current: pitRow?.WHIP, prev: prevWhip, higherIsGood: false }) },
      { label: "K/9", value: kPer9, trend: trendFor({ current: kPer9Num === null ? null : String(kPer9Num), prev: prevKPer9, higherIsGood: true }) },
      { label: "BAA", value: baa, trend: trendFor({ current: pitRow?.BAA, prev: prevBaa, higherIsGood: false }) },
    ];
  }, [activeSeasonYear, selectedStats]);

  const recentVarsityGames = useMemo(() => {
    const games = Array.isArray(gameLogsData?.games) ? gameLogsData.games : [];
    if (!playerId || !games.length) return [];

    const rawRows = [];
    for (const g of games) {
      if (normalizeTeam(g?.team) !== "Var.") continue;
      const entry = g?.players?.[playerId];
      if (!entry) continue;

      const batting = entry?.batting || null;
      const pitching = entry?.pitching || null;

      const ourScore = g?.ourScore;
      const oppScore = g?.oppScore;

      let result = "—";
      if (Number.isFinite(Number(ourScore)) && Number.isFinite(Number(oppScore))) {
        const os = Number(ourScore);
        const ps = Number(oppScore);
        const wl = os > ps ? "W" : os < ps ? "L" : "T";
        result = `${wl} ${os}-${ps}`;
      }

      const ab = batting && Number.isFinite(Number(batting.AB)) ? Number(batting.AB) : null;
      const h = batting && Number.isFinite(Number(batting.H)) ? Number(batting.H) : null;
      const rbi = batting && Number.isFinite(Number(batting.RBI)) ? Number(batting.RBI) : null;
      const runs = batting && Number.isFinite(Number(batting.R)) ? Number(batting.R) : null;

      const bbBat = batting && Number.isFinite(Number(batting.BB)) ? Number(batting.BB) : null;
      const hbpBat = batting && Number.isFinite(Number(batting.HBP)) ? Number(batting.HBP) : null;
      const sfBat = batting && Number.isFinite(Number(batting.SF)) ? Number(batting.SF) : null;
      const doublesBat = batting && Number.isFinite(Number(batting["2B"])) ? Number(batting["2B"]) : null;
      const triplesBat = batting && Number.isFinite(Number(batting["3B"])) ? Number(batting["3B"]) : null;
      const hrBat = batting && Number.isFinite(Number(batting.HR)) ? Number(batting.HR) : null;

      const baNum = ab && ab > 0 && h !== null ? h / ab : null;
      const ba = baNum !== null ? formatRate3FromNumber(baNum) : "—";

      const obpNum = batting ? computeObp(batting) : null;
      const slgNum = batting ? computeSlg(batting) : null;
      const obp = obpNum !== null ? formatRate3FromNumber(obpNum) : "—";
      const slg = slgNum !== null ? formatRate3FromNumber(slgNum) : "—";

      const outs = pitching?.IP ? parseInningsToOuts(pitching.IP) : 0;
      const innings = outs > 0 ? outs / 3 : 0;
      const er = pitching && Number.isFinite(Number(pitching.ER)) ? Number(pitching.ER) : null;
      const so = pitching && Number.isFinite(Number(pitching.K)) ? Number(pitching.K) : null;
      const bbPit = pitching && Number.isFinite(Number(pitching.BB)) ? Number(pitching.BB) : null;
      const hPit = pitching && Number.isFinite(Number(pitching.H)) ? Number(pitching.H) : null;

      const eraNum = innings > 0 && er !== null ? (er * 7) / innings : null;
      const era = eraNum !== null ? formatRate2FromNumber(eraNum) : "—";

      const whipNum = innings > 0 ? ((bbPit ?? 0) + (hPit ?? 0)) / innings : null;
      const whip = whipNum !== null ? formatRate2FromNumber(whipNum) : "—";

      const ip = pitching?.IP ? String(pitching.IP) : "—";

      const hasBatting =
        !!batting &&
        Object.values({
          AB: ab,
          H: h,
          R: runs,
          RBI: rbi,
          BB: bbBat,
          HBP: hbpBat,
          SF: sfBat,
          "2B": doublesBat,
          "3B": triplesBat,
          HR: hrBat,
        }).some((v) => v !== null);

      const hasPitching =
        !!pitching &&
        (String(pitching?.IP || "").trim() !== "" ||
          Object.values({
            H: hPit,
            ER: er,
            BB: bbPit,
            K: so,
          }).some((v) => v !== null));

      rawRows.push({
        date: String(g?.date || ""),
        opponent: String(g?.opponent || ""),
        result,
        ba,
        hits: h === null ? "—" : String(h),
        rbi: rbi === null ? "—" : String(rbi),
        runs: runs === null ? "—" : String(runs),
        obp,
        slg,
        era,
        ip,
        so: so === null ? "—" : String(so),
        er: er === null ? "—" : String(er),
        bbPit: bbPit === null ? "—" : String(bbPit),
        whip,
        hasBatting,
        hasPitching,
        __nums: {
          ab,
          h,
          rbi,
          runs,
          ba: baNum,
          obp: obpNum,
          slg: slgNum,
          outs,
          innings,
          er,
          so,
          bbPit,
          era: eraNum,
          whip: whipNum,
        },
      });
    }

    rawRows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const last5 = rawRows.slice(0, 5);

    const anyBatting = last5.some((g) => g?.hasBatting === true);
    const anyPitching = last5.some((g) => g?.hasPitching === true);
    const mode = anyBatting && anyPitching ? "both" : anyBatting ? "batting" : "pitching";

    function battingStatus(g) {
      const ab = g?.__nums?.ab;
      const h = g?.__nums?.h ?? 0;
      const rbi = g?.__nums?.rbi ?? 0;
      const runs = g?.__nums?.runs ?? 0;
      const ba = g?.__nums?.ba;
      const obp = g?.__nums?.obp;
      if (ab && ab >= 3) {
        if (h === 0) return "cold";
        if (h >= 2) return "hot";
        if (ba !== null && ba >= 0.4) return "hot";
        if (obp !== null && obp >= 0.5) return "hot";
        if (rbi >= 2 || runs >= 2) return "hot";
      }
      return "neutral";
    }

    function pitchingStatus(g) {
      const innings = g?.__nums?.innings ?? 0;
      const er = g?.__nums?.er;
      const so = g?.__nums?.so ?? 0;
      const era = g?.__nums?.era;
      const whip = g?.__nums?.whip;
      if (innings >= 1) {
        if (er === 0 && (so >= 4 || (whip !== null && whip <= 1.0))) return "hot";
        if (er !== null && er >= 3) return "cold";
        if (era !== null && era >= 6) return "cold";
        if (whip !== null && whip >= 2.0) return "cold";
      }
      return "neutral";
    }

    return last5.map((g) => {
      const hit = battingStatus(g);
      const pit = pitchingStatus(g);
      const status = mode === "batting" ? hit : mode === "pitching" ? pit : hit === "hot" || pit === "hot" ? "hot" : hit === "cold" || pit === "cold" ? "cold" : "neutral";
      // Keep only what the table needs.
      const { __nums, ...rest } = g;
      return { ...rest, status };
    });
  }, [playerId]);

  const derivedStats = useMemo(() => {
    if (!selectedStats) return null;

    const battingSeasonsPicked = varsityFirstCareerSeasons(selectedStats?.batting?.seasons || []);
    const pitchingSeasonsPicked = varsityFirstCareerSeasons(selectedStats?.pitching?.seasons || []);

    const sortAllSeasonsForCareerTable = (seasons) => {
      const normalized = (seasons || []).map((s) => ({ ...s, team: normalizeTeam(s.team) }));
      normalized.sort((a, b) => {
        const ya = Number(a?.year) || 0;
        const yb = Number(b?.year) || 0;
        // Oldest -> newest, so the newest season sits directly above "Career".
        if (ya !== yb) return ya - yb;
        // Within the same year, show JV first then Varsity (so Varsity is closest to the Career row).
        const ta = a.team === "JV" ? 0 : a.team === "Var." ? 1 : 9;
        const tb = b.team === "JV" ? 0 : b.team === "Var." ? 1 : 9;
        return ta - tb;
      });
      return normalized;
    };

    const battingSeasonsAll = sortAllSeasonsForCareerTable(selectedStats?.batting?.seasons || []);
    const pitchingSeasonsAll = sortAllSeasonsForCareerTable(selectedStats?.pitching?.seasons || []);

    const seasonBat = battingSeasonsPicked[0] || null;
    const seasonPit = pitchingSeasonsPicked[0] || null;

    const seasonHitting = seasonBat
      ? [
          { category: "Plate Appearances", value: String(seasonBat.PA ?? "—") },
          { category: "At Bats", value: String(seasonBat.AB ?? "—") },
          { category: "Runs", value: String(seasonBat.R ?? "—") },
          { category: "Hits", value: String(seasonBat.H ?? "—") },
          { category: "RBI", value: String(seasonBat.RBI ?? "—") },
          { category: "Extra-Base Hits", value: String(seasonBat.XBH ?? "—") },
          { category: "Stolen Bases", value: String(seasonBat.SB ?? "—") },
          { category: "Batting Average", value: formatBattingRate3(seasonBat.AVG) || "—" },
          { category: "On-Base %", value: formatBattingRate3(seasonBat.OBP) || "—" },
          { category: "Slugging %", value: formatBattingRate3(seasonBat.SLG) || "—" },
          { category: "OPS", value: formatOpsFrom(seasonBat.OBP, seasonBat.SLG) || "—" },
        ]
      : null;

    const seasonPitching = seasonPit
      ? [
          { category: "Innings Pitched", value: String(seasonPit.IP ?? "—") },
          { category: "Hits Allowed", value: String(seasonPit.H ?? "—") },
          { category: "Runs", value: String(seasonPit.R ?? "—") },
          { category: "Earned Runs", value: String(seasonPit.ER ?? "—") },
          { category: "Walks", value: String(seasonPit.BB ?? "—") },
          { category: "Strikeouts", value: String(seasonPit.K ?? "—") },
          { category: "Wild Pitches", value: String(seasonPit.WP ?? "—") },
          { category: "ERA", value: formatPitchingRate2(seasonPit.ERA) || "—" },
          { category: "WHIP", value: formatPitchingRate2(seasonPit.WHIP) || "—" },
          { category: "Opponent BA", value: formatBattingRate3(seasonPit.BAA) || "—" },
          { category: "Hit By Pitch", value: String(seasonPit.HBP ?? "—") },
        ]
      : null;

    const battingTotals = selectedStats?.batting?.careerTotals || null;
    const pitchingTotals = selectedStats?.pitching?.careerTotals || null;

    const careerBattingRows = [
      ...battingSeasonsAll.map((s) => ({
        season: s.year,
        class: s.class,
        team: s.team,
        PA: s.PA,
        AB: s.AB,
        R: s.R,
        H: s.H,
        RBI: s.RBI,
        XBH: s.XBH,
        SB: s.SB,
        AVG: formatBattingRate3(s.AVG),
        OBP: formatBattingRate3(s.OBP),
        SLG: formatBattingRate3(s.SLG),
        OPS: formatOpsFrom(s.OBP, s.SLG),
        __totals: false,
      })),
      ...(battingTotals
        ? [
            {
              season: "Career",
              class: "",
              team: battingTotals.team,
              PA: battingTotals.PA,
              AB: battingTotals.AB,
              R: battingTotals.R,
              H: battingTotals.H,
              RBI: battingTotals.RBI,
              XBH: battingTotals.XBH,
              SB: battingTotals.SB,
              AVG: formatBattingRate3(battingTotals.AVG),
              OBP: formatBattingRate3(battingTotals.OBP),
              SLG: formatBattingRate3(battingTotals.SLG),
              OPS: formatOpsFrom(battingTotals.OBP, battingTotals.SLG),
              __totals: true,
            },
          ]
        : []),
    ];

    const careerPitchingRows = [
      ...pitchingSeasonsAll.map((s) => ({
        season: s.year,
        class: s.class,
        team: s.team,
        IP: s.IP,
        H: s.H,
        R: s.R,
        ER: s.ER,
        BB: s.BB,
        K: s.K,
        HBP: s.HBP,
        WP: s.WP,
        ERA: formatPitchingRate2(s.ERA),
        WHIP: formatPitchingRate2(s.WHIP),
        BAA: formatBattingRate3(s.BAA),
        __totals: false,
      })),
      ...(pitchingTotals
        ? [
            {
              season: "Career",
              class: "",
              team: pitchingTotals.team,
              IP: pitchingTotals.IP,
              H: pitchingTotals.H,
              R: pitchingTotals.R,
              ER: pitchingTotals.ER,
              BB: pitchingTotals.BB,
              K: pitchingTotals.K,
              HBP: pitchingTotals.HBP,
              WP: pitchingTotals.WP,
              ERA: formatPitchingRate2(pitchingTotals.ERA),
              WHIP: formatPitchingRate2(pitchingTotals.WHIP),
              BAA: formatBattingRate3(pitchingTotals.BAA),
              __totals: true,
            },
          ]
        : []),
    ];

    return { seasonHitting, seasonPitching, careerBattingRows, careerPitchingRows };
  }, [selectedStats]);

  // Keep the left "Select Player" card the same height as Personal Info (desktop only).
  useEffect(() => {
    const refEl = personalInfoRef.current;
    if (!refEl) return undefined;

    const mql = window.matchMedia("(min-width: 1024px)");
    let raf = 0;
    let ro;

    const update = () => {
      if (!mql.matches) {
        setPlayerSelectMatchHeight(null);
        return;
      }
      const h = refEl.offsetHeight || 0;
      setPlayerSelectMatchHeight(h > 0 ? h : null);
    };

    const schedule = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(update);
    };

    schedule();

    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => schedule());
      ro.observe(refEl);
    }

    const onChange = () => schedule();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [playerId]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const selectPlayer = (id) => {
    if (!id || id === playerId) return;
    setPlayerId(id);
    setPlayerIdInUrl(id);
  };

  // Auto-height: rerun whenever the main toggles change.
  useEmbedAutoHeight([
    playerId,
    expandedSections.achievements,
    expandedSections.recentGames,
    expandedSections.seasonStats,
    expandedSections.careerStats,
  ]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <ProfileHeaderSection
          player={mock.player}
          images={{ playerImg: selectedPlayer?.playerImg, headerImg: selectedPlayer?.headerImg }}
          committed={selectedPlayer?.committed}
          committedDivision={selectedPlayer?.committedDivision}
          quickStats={headerQuickStats}
        />

        {/* Player selection & personal info */}
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          <PlayerSelectSection
            roster={roster}
            selectedId={playerId}
            onSelect={selectPlayer}
            matchHeight={playerSelectMatchHeight}
            siteBase={siteBase}
          />
          <div className="lg:col-span-2 space-y-6">
            <div ref={personalInfoRef}>
              <PersonalInfoSection
                player={mock.player}
                social={{
                  twitter: selectedPlayer?.twitter,
                  instagram: selectedPlayer?.instagram,
                  tiktok: selectedPlayer?.tiktok,
                }}
              />
            </div>
          </div>
        </div>

        <AchievementsSection
          expanded={expandedSections.achievements}
          onToggle={toggleSection}
          achievements={combinedAchievements}
        />

        {recentVarsityGames.length ? (
          <RecentPerformanceSection
            expanded={expandedSections.recentGames}
            onToggle={toggleSection}
            recentGames={recentVarsityGames}
            performanceTrend={[]}
          />
        ) : null}

        <CareerMilestonesSection milestones={milestones} />

        <SeasonStatsSection
          expanded={expandedSections.seasonStats}
          onToggle={toggleSection}
          seasonStats={derivedStats?.seasonHitting || mock.seasonStats}
          pitchingStats={derivedStats?.seasonPitching || mock.pitchingStats}
          seasonLabel={`Season Statistics (${activeSeasonYear})`}
        />

        <CareerStatsSection
          expanded={expandedSections.careerStats}
          onToggle={toggleSection}
          careerStats={{
            battingRows: derivedStats?.careerBattingRows || null,
            pitchingRows: derivedStats?.careerPitchingRows || null,
            legacy: mock.careerStats,
          }}
        />

        <ContactSection player={mock.player} />
      </div>
    </div>
  );
}

