import { useEffect, useMemo, useState } from "react";
import { Calendar, Filter, Medal, Search, Trophy } from "lucide-react";
import { seasons } from "./seasonsData";

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

function FinishPill({ finish }) {
  const v = String(finish ?? "").trim();
  const cls = v.includes("1st")
    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
    : v.includes("2nd")
      ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700"
      : v.includes("3rd")
        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
        : "bg-gray-200 text-gray-700";

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {v || "—"}
    </span>
  );
}

export default function SeasonHistoryWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredSeasons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return (seasons || []).filter((season) => {
      const matchesSearch =
        !q ||
        String(season.year).includes(q) ||
        String(season.leagueFinish ?? "").toLowerCase().includes(q) ||
        String(season.playoffResults ?? "").toLowerCase().includes(q);

      let matchesFilter = true;
      if (filterType === "league-champs") matchesFilter = !!season.isLeagueChampion;
      else if (filterType === "state-appearances") matchesFilter = !!season.isStateAppearance;
      else if (filterType === "final-four") matchesFilter = !!season.isFinalFour;
      else if (filterType === "district-champs") matchesFilter = !!season.isDistrictChamp;
      else if (filterType === "top-3-league") {
        const f = String(season.leagueFinish ?? "");
        matchesFilter = f.includes("1st") || f.includes("2nd") || f.includes("3rd");
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterType]);

  const totals = useMemo(() => {
    const s = seasons || [];
    const nonCovid = s.filter((x) => x.year !== 2020);
    return {
      totalSeasons: nonCovid.length,
      leagueChampionships: nonCovid.filter((x) => x.isLeagueChampion).length,
      stateAppearances: nonCovid.filter((x) => x.isStateAppearance).length,
      finalFourAppearances: nonCovid.filter((x) => x.isFinalFour).length,
    };
  }, []);

  useEmbedAutoHeight([filteredSeasons.length, searchQuery, filterType]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-6 py-5 border-b border-yellow-500">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="w-7 h-7 text-blue-900" />
            <h1 className="text-blue-900 text-center text-2xl font-bold">Season-by-Season History</h1>
            <Calendar className="w-7 h-7 text-blue-900" />
          </div>
          <p className="text-blue-900/70 text-center mt-2">Tahoma Bears Baseball Program</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <StatBlock label="Seasons" value={totals.totalSeasons} />
          <StatBlock label="League Titles" value={totals.leagueChampionships} />
          <StatBlock label="State Appearances" value={totals.stateAppearances} />
          <StatBlock label="Final Fours" value={totals.finalFourAppearances} />
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by year, finish, or playoff result..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white cursor-pointer transition-all min-w-[220px]"
              >
                <option value="all">All Seasons</option>
                <option value="league-champs">League Championships</option>
                <option value="state-appearances">State Appearances</option>
                <option value="final-four">Final Four</option>
                <option value="district-champs">District Champions</option>
                <option value="top-3-league">Top 3 League Finish</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Showing {filteredSeasons.length} of {seasons.length} seasons
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-900 to-blue-700">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Year</th>
                <th className="px-6 py-4 text-left text-white font-semibold">League Record</th>
                <th className="px-6 py-4 text-left text-white font-semibold">League Finish</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Overall Record</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Playoff Results</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSeasons.map((season) => (
                <tr
                  key={season.year}
                  className={`hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all ${
                    season.isLeagueChampion ? "bg-yellow-400/10" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-blue-900 text-white rounded-lg">
                        {season.year}
                      </span>
                      {season.isLeagueChampion ? <Trophy className="w-5 h-5 text-yellow-400" /> : null}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700">{season.leagueRecord}</td>

                  <td className="px-6 py-4">
                    <FinishPill finish={season.leagueFinish} />
                  </td>

                  <td className="px-6 py-4 text-gray-700">{season.overallRecord}</td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {season.isFinalFour ? <Medal className="w-5 h-5 text-amber-600 flex-shrink-0" /> : null}
                      <span className="text-gray-700">{season.playoffResults}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredSeasons.map((season) => (
            <div
              key={season.year}
              className={`p-5 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all ${
                season.isLeagueChampion ? "bg-yellow-400/10" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-4 py-2 bg-blue-900 text-white rounded-lg">{season.year}</span>
                  {season.isLeagueChampion ? <Trophy className="w-6 h-6 text-yellow-400" /> : null}
                  {season.isFinalFour ? <Medal className="w-6 h-6 text-amber-600" /> : null}
                </div>

                <FinishPill finish={season.leagueFinish} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">League Record</div>
                  <div className="text-blue-900">{season.leagueRecord}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Overall Record</div>
                  <div className="text-blue-900">{season.overallRecord}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Playoff Results</div>
                <div className="text-gray-700 text-sm">{season.playoffResults}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredSeasons.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No seasons found matching your criteria.</p>
          </div>
        ) : null}
      </div>

      {/* Legend (optional, but matches the Figma intent) */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <h3 className="text-blue-900 font-bold mb-3">Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-700">League Champion</span>
          </div>
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-600" />
            <span className="text-gray-700">Final Four</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded" />
            <span className="text-gray-700">1st Place</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-gray-300 to-gray-400 rounded" />
            <span className="text-gray-700">2nd Place</span>
          </div>
        </div>
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

