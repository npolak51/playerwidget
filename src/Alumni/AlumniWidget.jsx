import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Filter, GraduationCap, MapPin, Search, Trophy } from "lucide-react";
import { alumniPlayers } from "./alumniData";

function useEmbedAutoHeight(deps = []) {
  useEffect(() => {
    // When embedded, make the page background transparent (so the parent page shows through).
    if (window.parent && window.parent !== window) {
      document.documentElement.classList.add("embed");
    }

    const postHeight = () => {
      const body = document.body;
      const html = document.documentElement;
      const height = Math.max(
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
        html?.clientHeight ?? 0,
        html?.scrollHeight ?? 0,
        html?.offsetHeight ?? 0
      );

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "playerwidget:height", height }, "*");
      }
    };

    postHeight();
    const raf = window.requestAnimationFrame(postHeight);
    const t = window.setTimeout(postHeight, 250);

    window.addEventListener("resize", postHeight);
    window.addEventListener("load", postHeight);

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => postHeight());
      if (document.body) ro.observe(document.body);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", postHeight);
      window.removeEventListener("load", postHeight);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function getDivisionGradient(division) {
  switch (division) {
    case "D-I":
      return "from-purple-500 to-purple-600";
    case "D-II":
      return "from-blue-500 to-blue-600";
    case "D-III":
      return "from-green-500 to-green-600";
    case "NAIA":
      return "from-orange-500 to-orange-600";
    case "NWAC":
      return "from-gray-500 to-gray-600";
    case "CCCAA":
      return "from-gray-500 to-gray-600";
    case "JUCO":
      return "from-gray-500 to-gray-600";
    default:
      return "from-gray-400 to-gray-500";
  }
}

function CollegePath({ colleges }) {
  const list = Array.isArray(colleges) ? colleges.filter(Boolean) : [];
  if (list.length === 0) return <span className="text-gray-500">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {list.map((c, idx) => (
        <span key={`${c}-${idx}`} className="flex items-center gap-2">
          <span className="text-gray-700">{c}</span>
          {idx < list.length - 1 ? <ArrowRight className="w-4 h-4 text-gray-400" /> : null}
        </span>
      ))}
    </div>
  );
}

function DraftNote({ player }) {
  if (!player?.drafted) return null;
  const team = String(player.draftTeam || "").trim();
  const year = player.draftYear ? String(player.draftYear) : "";
  const round = player.draftRound ? `Rd ${player.draftRound}` : "";
  const pick = player.draftPick ? `Pick ${player.draftPick}` : "";
  const extras = [round, pick].filter(Boolean).join(", ");
  const main = [team, year ? `(${year})` : ""].filter(Boolean).join(" ");
  return (
    <div className="mt-1 text-sm text-gray-600">
      Drafted{main ? `: ${main}` : ""}{extras ? ` — ${extras}` : ""}
    </div>
  );
}

export default function AlumniWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showDraftedOnly, setShowDraftedOnly] = useState(false);

  const years = useMemo(() => {
    const set = new Set((alumniPlayers || []).map((p) => p.gradYear).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => b - a)];
  }, []);

  const divisions = useMemo(() => {
    const set = new Set((alumniPlayers || []).map((p) => p.division).filter(Boolean));
    const preferred = ["D-I", "D-II", "D-III", "NAIA", "NWAC", "CCCAA", "JUCO", "Other"];
    const rest = Array.from(set).filter((d) => !preferred.includes(d)).sort();
    return ["all", ...preferred.filter((d) => set.has(d)), ...rest];
  }, []);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (alumniPlayers || []).filter((player) => {
      const matchesSearch =
        !q ||
        String(player.playerName ?? "").toLowerCase().includes(q) ||
        (Array.isArray(player.colleges) ? player.colleges.join(" ") : "").toLowerCase().includes(q);

      const matchesDivision = selectedDivision === "all" || player.division === selectedDivision;
      const matchesYear = selectedYear === "all" || player.gradYear === Number(selectedYear);
      const matchesActive = !showActiveOnly || player.isActive;
      const matchesDrafted = !showDraftedOnly || !!player.drafted;

      return matchesSearch && matchesDivision && matchesYear && matchesActive && matchesDrafted;
    });
  }, [searchQuery, selectedDivision, selectedYear, showActiveOnly, showDraftedOnly]);

  const stats = useMemo(() => {
    const baseball = (alumniPlayers || []).filter((p) => p.sport === "Baseball");
    const totalPlayers = baseball.length;
    const activePlayers = baseball.filter((p) => p.isActive).length;
    const d1Players = baseball.filter((p) => p.division === "D-I").length;
    const draftedPlayers = baseball.filter((p) => !!p.drafted).length;
    return { totalPlayers, activePlayers, d1Players, draftedPlayers };
  }, []);

  useEmbedAutoHeight([filteredPlayers.length, searchQuery, selectedDivision, selectedYear, showActiveOnly]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-6 py-5 border-b border-yellow-500">
          <div className="flex items-center justify-center gap-3">
            <GraduationCap className="w-7 h-7 text-blue-900" />
            <h1 className="text-blue-900 text-center text-2xl font-bold">College Baseball Alumni (2003-Present)</h1>
            <GraduationCap className="w-7 h-7 text-blue-900" />
          </div>
          <p className="text-blue-900/70 text-center mt-2">Tahoma Bears Playing at the Next Level</p>
        </div>

        {/* Stats Summary (Baseball only, per design) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <StatBlock label="Total Alumni" value={stats.totalPlayers} />
          <StatBlock label="Active Players" value={stats.activePlayers} />
          <StatBlock label="D-I Players" value={stats.d1Players} />
          <StatBlock label="Drafted" value={stats.draftedPlayers} />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by player name or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Division Filter */}
              <div className="flex-1 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white cursor-pointer transition-all"
                >
                  {divisions.map((div) => (
                    <option key={div} value={div}>
                      {div === "all" ? "All Divisions" : div}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white cursor-pointer transition-all min-w-[160px]"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year === "all" ? "All Years" : `Class of ${year}`}
                  </option>
                ))}
              </select>

              {/* Active Only Toggle */}
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-900 transition-all min-w-fit">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                />
                <span className="text-sm text-gray-700 whitespace-nowrap">Active Only</span>
              </label>

              {/* Drafted Only Toggle */}
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-900 transition-all min-w-fit">
                <input
                  type="checkbox"
                  checked={showDraftedOnly}
                  onChange={(e) => setShowDraftedOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                />
                <span className="text-sm text-gray-700 whitespace-nowrap">Drafted Only</span>
              </label>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Showing {filteredPlayers.length} of {alumniPlayers.length} players
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-900 to-blue-700">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Grad Year</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Player Name</th>
                <th className="px-6 py-4 text-left text-white font-semibold">College / University</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Division</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlayers.map((player) => (
                <tr
                  key={`${player.gradYear}-${player.playerName}-${(player.colleges || []).join("→")}-${player.sport}`}
                  className={`hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all ${
                    player.division === "D-I" ? "bg-purple-50/30" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-blue-900/10 text-blue-900 rounded-full text-sm">
                      {player.gradYear}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-blue-900 font-semibold">{player.playerName}</span>
                      {player.drafted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-900 rounded text-xs border border-yellow-200">
                          <Trophy className="w-3.5 h-3.5 text-yellow-600" />
                          Drafted
                        </span>
                      ) : null}
                      {player.sport === "Football" ? (
                        <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          Football
                        </span>
                      ) : null}
                    </div>
                    <DraftNote player={player} />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <CollegePath colleges={player.colleges} />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-white text-sm bg-gradient-to-r ${getDivisionGradient(player.division)}`}>
                      {player.division}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${
                        player.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {player.isActive ? "Active" : "Alumni"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredPlayers.map((player) => (
            <div
              key={`${player.gradYear}-${player.playerName}-${(player.colleges || []).join("→")}-${player.sport}`}
              className={`p-5 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all ${
                player.division === "D-I" ? "bg-purple-50/30" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-blue-900 font-semibold truncate">{player.playerName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {player.drafted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-900 rounded text-xs border border-yellow-200">
                        <Trophy className="w-3.5 h-3.5 text-yellow-600" />
                        Drafted
                      </span>
                    ) : null}
                    {player.sport === "Football" ? (
                      <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        Football
                      </span>
                    ) : null}
                    <span className="inline-block px-3 py-1 bg-blue-900/10 text-blue-900 rounded-full text-sm">
                      Class of {player.gradYear}
                    </span>
                  </div>
                  <DraftNote player={player} />
                </div>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm flex-shrink-0 ${
                    player.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {player.isActive ? "Active" : "Alumni"}
                </span>
              </div>

              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <CollegePath colleges={player.colleges} />
                </div>
              </div>

              <div>
                <span className={`inline-block px-3 py-1 rounded-lg text-white text-sm bg-gradient-to-r ${getDivisionGradient(player.division)}`}>
                  {player.division}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No players found matching your criteria.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-semibold text-blue-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

