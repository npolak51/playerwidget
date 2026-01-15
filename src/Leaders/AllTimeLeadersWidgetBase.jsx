import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";

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

function RankBadge({ rank }) {
  const cls =
    rank === 1
      ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
      : rank === 2
        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
        : rank === 3
          ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
          : "bg-gradient-to-br from-blue-900 to-blue-700 text-white";

  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${cls}`}>
      <span className="font-semibold">{rank}</span>
    </div>
  );
}

function safeCategoryId(v, categories) {
  const id = String(v ?? "").trim();
  if (!id) return "";
  return categories.some((c) => c.id === id) ? id : "";
}

export default function AllTimeLeadersWidgetBase({ title, categories }) {
  const params = new URLSearchParams(window.location.search);
  const initial = safeCategoryId(params.get("category"), categories) || categories[0]?.id || "";
  const [activeTab, setActiveTab] = useState(initial);

  useEmbedAutoHeight([activeTab]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeTab) || categories[0];
  }, [activeTab, categories]);

  if (!activeCategory) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-6xl mx-auto border border-gray-200 p-4">
        <div className="text-gray-700">No leader categories configured yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-6xl mx-auto border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-4 sm:px-6 py-4 border-b border-yellow-500">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="w-6 h-6 text-blue-900" />
          <h2 className="text-blue-900 text-center text-xl sm:text-2xl font-bold">{title}</h2>
          <Trophy className="w-6 h-6 text-blue-900" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 overflow-x-auto">
        <div className="flex min-w-max">
          {categories.map((category) => {
            const isActive = activeTab === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveTab(category.id)}
                className={`px-5 py-3 text-center transition-all duration-200 border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-yellow-400 bg-white text-blue-900"
                    : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-blue-900"
                }`}
              >
                <span className="block font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">{activeCategory.name} Leaders</h3>
        </div>
        {activeCategory.valueLabel ? (
          <div className="text-white/80 text-sm mt-1">{activeCategory.valueLabel}</div>
        ) : null}
      </div>

      {/* Table Header (desktop) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm">
        <div className="col-span-1 text-gray-600 font-semibold">Rank</div>
        <div className="col-span-6 text-gray-600 font-semibold">Name</div>
        <div className="col-span-2 text-gray-600 font-semibold">Year</div>
        <div className="col-span-3 text-gray-600 font-semibold">Value</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {(activeCategory.leaders || []).map((leader) => (
          <div
            key={`${leader.rank}-${leader.name}-${leader.year}`}
            className={`px-4 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all duration-200 ${
              leader.rank <= 3 ? "bg-yellow-400/5" : ""
            }`}
          >
            {/* Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <RankBadge rank={leader.rank} />
              </div>
              <div className="col-span-6">
                <span className="text-blue-900 font-semibold">{leader.name}</span>
              </div>
              <div className="col-span-2">
                <span className="inline-block px-3 py-1 bg-blue-900/10 text-blue-900 rounded-full text-sm">
                  {leader.year}
                </span>
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-900 font-semibold">{leader.value}</span>
                  {leader.games ? <span className="text-gray-500 text-sm">{leader.games}</span> : null}
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-start gap-4">
              <div className="flex-shrink-0">
                <RankBadge rank={leader.rank} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-blue-900 font-semibold truncate">{leader.name}</div>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className="inline-block px-2.5 py-0.5 bg-blue-900/10 text-blue-900 text-sm rounded-full">
                    {leader.year}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-900 font-semibold">{leader.value}</span>
                    {leader.games ? <span className="text-gray-500 text-sm">{leader.games}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-4 sm:px-6 py-4 bg-white">
        <div className="text-center text-gray-500 text-sm">* Denotes pre-BBCOR bat era</div>
      </div>
    </div>
  );
}

