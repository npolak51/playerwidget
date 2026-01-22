import { useEffect, useMemo, useState } from "react";
import { Award, Shield, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import { teamRecords } from "./teamRecordsData";

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

function getCategoryColor(category) {
  switch (category) {
    case "team":
      return "from-yellow-400 to-yellow-300";
    case "offense":
      return "from-red-500 to-red-600";
    case "pitching":
      return "from-blue-500 to-blue-600";
    case "defense":
      return "from-green-500 to-green-600";
    default:
      return "from-gray-500 to-gray-600";
  }
}

function getCategoryIcon(category) {
  switch (category) {
    case "team":
      return Award;
    case "offense":
      return Target;
    case "pitching":
      return Zap;
    case "defense":
      return Shield;
    default:
      return Trophy;
  }
}

const categories = [
  { value: "all", label: "All Records", icon: Trophy },
  { value: "team", label: "Team", icon: Award },
  { value: "offense", label: "Offense", icon: Target },
  { value: "pitching", label: "Pitching", icon: Zap },
  { value: "defense", label: "Defense", icon: Shield },
];

export default function TeamRecordsWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showRecentOnly, setShowRecentOnly] = useState(false);

  const nowYear = new Date().getFullYear();
  const recentThreshold = nowYear - 5;

  const normalizedRecords = useMemo(() => {
    return (teamRecords || []).map((r) => ({
      ...r,
      isRecentRecord:
        typeof r.isRecentRecord === "boolean"
          ? r.isRecentRecord
          : Math.max(r.year || 0, r.year2 || 0) >= recentThreshold,
    }));
  }, [recentThreshold]);

  const formatYears = (record) => {
    const y1 = record.year ? String(record.year) : "";
    const y2 = record.year2 ? String(record.year2) : "";
    if (y1 && y2) return `${y1} / ${y2}`;
    return y1 || y2 || "";
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedRecords.filter((record) => {
      const matchesSearch =
        !q ||
        String(record.statName ?? "").toLowerCase().includes(q) ||
        String(record.year ?? "").includes(q) ||
        String(record.year2 ?? "").includes(q);
      const matchesCategory = selectedCategory === "all" || record.category === selectedCategory;
      const matchesRecent = !showRecentOnly || record.isRecentRecord;
      return matchesSearch && matchesCategory && matchesRecent;
    });
  }, [normalizedRecords, searchQuery, selectedCategory, showRecentOnly]);

  const stats = useMemo(() => {
    const totalRecords = normalizedRecords.length;
    const recentRecords = normalizedRecords.filter((r) => r.isRecentRecord).length;
    const years = Array.from(
      new Set(
        normalizedRecords
          .flatMap((r) => [r.year, r.year2])
          .filter(Boolean)
      )
    );
    const mostRecentYear = years.length ? Math.max(...years) : 0;
    return {
      totalRecords,
      recentRecords,
      mostRecentYear,
      recordYearsCount: years.length,
    };
  }, [normalizedRecords]);

  useEmbedAutoHeight([filteredRecords.length, searchQuery, selectedCategory, showRecentOnly]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-6 py-5 border-b border-yellow-500">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-7 h-7 text-blue-900" />
            <h1 className="text-blue-900 text-center text-2xl font-bold">Team Record Book</h1>
            <Trophy className="w-7 h-7 text-blue-900" />
          </div>
          <p className="text-blue-900/70 text-center mt-2">All-Time Program Records</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <StatBlock label="Total Records" value={stats.totalRecords} />
          <StatBlock label="Recent Records" value={stats.recentRecords} />
          <StatBlock label="Latest Record Year" value={stats.mostRecentYear} />
          <StatBlock label="Record-Setting Seasons" value={stats.recordYearsCount} />
        </div>
      </div>

      {/* Category Tabs + Search */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-5 border-b border-gray-200">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center justify-center gap-2 px-4 py-4 border-b-2 transition-all ${
                  isActive ? "border-blue-900 bg-blue-900/5" : "border-transparent hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-900" : "text-gray-400"}`} />
                <span className={`text-sm font-medium ${isActive ? "text-blue-900" : "text-gray-600"}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search records by name or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
              />
            </div>

            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-900 transition-all min-w-fit">
              <input
                type="checkbox"
                checked={showRecentOnly}
                onChange={(e) => setShowRecentOnly(e.target.checked)}
                className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
              />
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 whitespace-nowrap">Recent Only</span>
            </label>
          </div>

          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Showing {filteredRecords.length} of {normalizedRecords.length} records
            </p>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.map((record, idx) => {
          const CategoryIcon = getCategoryIcon(record.category);
          return (
            <div
              key={`${record.category}-${record.statName}-${record.year}-${idx}`}
              className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-gray-200"
            >
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${getCategoryColor(record.category)} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5 text-white" />
                  <span className="text-white text-sm uppercase tracking-wide">{record.category}</span>
                </div>
                {record.isRecentRecord ? (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 text-white" />
                    <span className="text-white text-xs">Recent</span>
                  </div>
                ) : null}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-blue-900 text-lg font-semibold mb-3">{record.statName}</h3>

                <div className="flex items-baseline gap-2 mb-4 flex-wrap">
                  <div className="text-4xl font-semibold text-blue-900">{record.recordValue}</div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-400/20 rounded-full">
                    <Trophy className="w-4 h-4 text-blue-900" />
                    <span className="text-blue-900 font-semibold">{formatYears(record)}</span>
                  </div>
                </div>

                {record.previousRecord ? (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Previous Record</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-700 font-semibold">{record.previousRecord.value}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">{record.previousRecord.year}</span>
                    </div>
                  </div>
                ) : null}

                {record.additionalInfo ? (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Award className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">{record.additionalInfo}</p>
                  </div>
                ) : null}
              </div>

              <div className={`h-1 bg-gradient-to-r ${getCategoryColor(record.category)}`} />
            </div>
          );
        })}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No records found matching your criteria.</p>
        </div>
      ) : null}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <h3 className="text-blue-900 font-bold mb-4">Record Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <LegendItem label="Team Records" gradient="from-yellow-400 to-yellow-300" Icon={Award} />
          <LegendItem label="Offense" gradient="from-red-500 to-red-600" Icon={Target} />
          <LegendItem label="Pitching" gradient="from-blue-500 to-blue-600" Icon={Zap} />
          <LegendItem label="Defense" gradient="from-green-500 to-green-600" Icon={Shield} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-700">Recent records set within the last 5 years</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
    </svg>
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

function LegendItem({ label, gradient, Icon }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-gray-700">{label}</span>
    </div>
  );
}

