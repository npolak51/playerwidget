import { useMemo, useState } from "react";
import { Search } from "lucide-react";

const POSITION_ABBREVIATIONS = {
  Pitcher: "P",
  Catcher: "C",
  "First Base": "1B",
  "First Baseman": "1B",
  "Second Base": "2B",
  "Second Baseman": "2B",
  "Third Base": "3B",
  "Third Baseman": "3B",
  Shortstop: "SS",
  Infield: "INF",
  Outfield: "OF",
  Utility: "UTL",
  "Designated Hitter": "DH",
  DH: "DH",
};

const POSITION_PILL_CLASSES = {
  P: "bg-blue-600 text-white border-blue-700",
  C: "bg-purple-600 text-white border-purple-700",
  "1B": "bg-yellow-400 text-blue-900 border-yellow-500",
  "2B": "bg-amber-500 text-white border-amber-600",
  "3B": "bg-orange-500 text-white border-orange-600",
  SS: "bg-red-500 text-white border-red-600",
  INF: "bg-green-600 text-white border-green-700",
  OF: "bg-emerald-500 text-white border-emerald-600",
  UTL: "bg-gray-600 text-white border-gray-700",
  DH: "bg-pink-500 text-white border-pink-600",
};

function abbreviatePosition(pos) {
  const raw = String(pos ?? "").trim();
  if (!raw) return "";
  if (/^[0-9]B$/.test(raw)) return raw.toUpperCase();
  if (/^[A-Za-z]{1,3}$/.test(raw)) return raw.toUpperCase();
  if (POSITION_ABBREVIATIONS[raw]) return POSITION_ABBREVIATIONS[raw];

  const normalized = raw
    .replace(/\s+Baseman$/i, " Base")
    .replace(/\s+/g, " ")
    .trim();

  return POSITION_ABBREVIATIONS[normalized] || raw;
}

function splitAndAbbreviatePositions(positionsStr) {
  const parts = String(positionsStr ?? "")
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);

  const out = [];
  const seen = new Set();
  for (const p of parts) {
    const abbr = abbreviatePosition(p);
    if (!abbr) continue;
    if (seen.has(abbr)) continue;
    seen.add(abbr);
    out.push(abbr);
  }
  return out;
}

function pillClassFor(abbr) {
  return POSITION_PILL_CLASSES[abbr] || "bg-gray-200 text-gray-800 border-gray-300";
}

function normalizeNumber(n) {
  const s = String(n ?? "").trim();
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function normalizeSiteBase(siteBase) {
  if (!siteBase) return "";
  return siteBase.startsWith("http") ? siteBase : `https://${siteBase}`;
}

export function buildPlayerPageUrl(siteBase, playerId) {
  const base = normalizeSiteBase(siteBase);
  if (!base) return "";
  const url = new URL(base);
  url.pathname = `/${playerId}`;
  return url.toString();
}

export default function PlayerSelectSection({ roster, selectedId, onSelect, siteBase }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return (roster || []).filter((p) => {
      const name = String(p?.name || "").toLowerCase();
      const num = String(p?.number || "");
      return name.includes(q) || num.includes(q);
    });
  }, [query, roster]);

  const useNavigation = Boolean(siteBase);

  const handlePlayerClick = (playerId) => {
    if (useNavigation) {
      const target = buildPlayerPageUrl(siteBase, playerId);
      if (target) {
        if (window.top) window.top.location.href = target;
        else window.location.href = target;
      }
    } else {
      onSelect?.(playerId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-7 flex flex-col">
      <h2 className="text-2xl font-bold text-[#1d4281] mb-4">Select Player</h2>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or number..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4281] focus:border-transparent transition-all"
        />
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Showing {filtered.length} of {roster.length} players
      </div>

      <div className="space-y-2 pr-1">
        {filtered.map((p) => {
          const active = p.id === selectedId;
          const pills = splitAndAbbreviatePositions(p?.positions || "");
          const number = normalizeNumber(p?.number);
          const playerUrl = useNavigation ? buildPlayerPageUrl(siteBase, p.id) : null;
          const rowClass = `w-full text-left px-4 py-3 rounded-lg border transition ${
                active
                  ? "bg-[#1d4281] text-white border-[#1d4281]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`;

          const content = (
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${active ? "text-white/90" : "text-slate-500"}`}>
                {number !== null ? `#${number}` : "#--"}
              </span>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className={`font-semibold truncate ${active ? "text-white" : "text-slate-900"}`}>
                  {p.name}
                </span>

                {pills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {pills.map((abbr) => (
                      <span
                        key={abbr}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          active ? "bg-white/15 text-white border-white/25" : pillClassFor(abbr)
                        }`}
                      >
                        {abbr}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );

          if (useNavigation && playerUrl) {
            return (
              <a
                key={p.id}
                href={playerUrl}
                className={`block ${rowClass} no-underline`}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePlayerClick(p.id)}
              className={rowClass}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function buildRosterFromPlayersJson(playersMap) {
  const entries = Object.entries(playersMap || {});
  return entries
    .map(([id, p]) => ({
      id,
      name: p?.name || id,
      number: String(p?.number || "").trim(),
      positions: String(p?.positions || ""),
    }))
    .sort((a, b) => {
      const na = normalizeNumber(a.number);
      const nb = normalizeNumber(b.number);
      if (na !== null && nb !== null && na !== nb) return na - nb;
      if (na !== null && nb === null) return -1;
      if (na === null && nb !== null) return 1;
      return a.name.localeCompare(b.name);
    });
}

