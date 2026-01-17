import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { HonorsShell, useEmbedAutoHeight } from "./HonorsWidgetBase";
import { allLeagueSelections } from "./honorsData";

function TeamBadge({ team }) {
  const t = String(team ?? "").trim();
  if (!t) return <span className="text-gray-500">—</span>;

  const norm = t.toLowerCase();
  const cls =
    norm === "1st team"
      ? "bg-gradient-to-r from-yellow-300 to-yellow-500 text-blue-900"
      : norm === "2nd team"
        ? "bg-gradient-to-r from-blue-700 to-blue-900 text-white"
        : norm === "honorable mention"
          ? "bg-gradient-to-r from-gray-200 to-gray-400 text-gray-700"
          : "bg-gray-200 text-gray-800";

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {t}
    </span>
  );
}

function splitPositions(position) {
  const raw = String(position ?? "").trim();
  if (!raw) return [];
  // Stored as "P, 1B" (or "P, OF"), keep commas and slashes as delimiters.
  return raw
    .split(/[,/]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeTeam(team) {
  const t = String(team ?? "").trim();
  if (!t) return "";
  if (t.toLowerCase() === "hm") return "Honorable Mention";
  return t;
}

export default function AllLeagueAllWidget() {
  const rows = useMemo(() => (allLeagueSelections || []).map((r) => ({ ...r, team: normalizeTeam(r.team) })), []);

  const years = useMemo(() => {
    const set = new Set(rows.map((r) => r.year).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a);
  }, [rows]);

  const teams = useMemo(() => {
    const set = new Set(rows.map((r) => r.team).filter(Boolean));
    const ordered = ["1st Team", "2nd Team", "Honorable Mention"];
    const rest = Array.from(set).filter((t) => !ordered.includes(t)).sort();
    return ordered.filter((t) => set.has(t)).concat(rest);
  }, [rows]);

  const positions = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      const tokens = splitPositions(r.position);
      if (tokens.length === 0) set.add("__unknown__");
      else tokens.forEach((p) => set.add(p));
    }
    const ordered = ["P", "C", "1B", "2B", "3B", "SS", "INF", "OF", "UTL", "DH"];
    const rest = Array.from(set)
      .filter((p) => p !== "__unknown__" && !ordered.includes(p))
      .sort();
    const out = ordered.filter((p) => set.has(p)).concat(rest);
    if (set.has("__unknown__")) out.push("__unknown__");
    return out;
  }, [rows]);

  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (yearFilter !== "all" && String(r.year) !== yearFilter) return false;
      if (teamFilter !== "all" && r.team !== teamFilter) return false;

      if (positionFilter !== "all") {
        const tokens = splitPositions(r.position);
        if (positionFilter === "__unknown__") {
          if (tokens.length !== 0) return false;
        } else {
          if (!tokens.includes(positionFilter)) return false;
        }
      }

      if (q) {
        const name = String(r.name ?? "").toLowerCase();
        if (!name.includes(q)) return false;
      }

      return true;
    });
  }, [rows, searchQuery, yearFilter, teamFilter, positionFilter]);

  useEmbedAutoHeight([filtered.length]);

  return (
    <HonorsShell title="All‑League Teams" subtitle="Search, filter, and browse all selections">
      {/* Search + filters */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Year */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white cursor-pointer transition-all min-w-[140px]"
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Team */}
            <div className="relative">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white cursor-pointer transition-all min-w-[170px]"
              >
                <option value="all">All Teams</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Position */}
            <div className="relative">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white cursor-pointer transition-all min-w-[160px]"
              >
                <option value="all">All Positions</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p === "__unknown__" ? "Unknown" : p}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing <span className="font-semibold">{filtered.length}</span> of{" "}
          <span className="font-semibold">{rows.length}</span> selections
        </div>
      </div>

      {/* Table header (desktop) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-white border-b border-gray-200 text-sm">
        <div className="col-span-2 text-gray-600 font-semibold">Year</div>
        <div className="col-span-4 text-gray-600 font-semibold">Player</div>
        <div className="col-span-3 text-gray-600 font-semibold">Team</div>
        <div className="col-span-2 text-gray-600 font-semibold">Position</div>
        <div className="col-span-1 text-gray-600 font-semibold">Class</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {filtered.map((r) => {
          const cls =
            "px-4 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all duration-200";

          const content = (
            <>
              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <span className="inline-block px-3 py-1 bg-blue-900/10 text-blue-900 rounded-full text-sm">
                    {r.year}
                  </span>
                </div>
                <div className="col-span-4 text-blue-900 font-semibold">{r.name}</div>
                <div className="col-span-3">
                  <TeamBadge team={r.team} />
                </div>
                <div className="col-span-2 text-gray-800">{r.position || "—"}</div>
                <div className="col-span-1 text-gray-600">{r.class || "—"}</div>
              </div>

              {/* Mobile */}
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-blue-900 font-semibold">{r.name}</div>
                  <span className="inline-block px-3 py-1 bg-blue-900/10 text-blue-900 rounded-full text-sm">
                    {r.year}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
                  <TeamBadge team={r.team} />
                  {r.position ? (
                    <span className="inline-block px-2.5 py-0.5 bg-blue-900/10 text-blue-900 rounded-full">
                      {r.position}
                    </span>
                  ) : null}
                  {r.class ? <span className="text-gray-600">{r.class}</span> : null}
                </div>
              </div>
            </>
          );

          return r.url ? (
            <a key={`${r.year}-${r.team}-${r.name}-${r.position}`} className={cls} href={r.url} target="_top" rel="noreferrer">
              {content}
            </a>
          ) : (
            <div key={`${r.year}-${r.team}-${r.name}-${r.position}`} className={cls}>
              {content}
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <div className="px-4 sm:px-6 py-10 text-center text-gray-500">No selections match your filters.</div>
        ) : null}
      </div>
    </HonorsShell>
  );
}

