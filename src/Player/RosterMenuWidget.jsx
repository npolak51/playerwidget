import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import playersData from "../data/players.json";

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

  // Already abbreviated (e.g. "P", "SS", "1B")
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

function normalizeSiteBase(siteBase) {
  if (!siteBase) return "";
  return siteBase.startsWith("http") ? siteBase : `https://${siteBase}`;
}

function buildPlayerPageUrl(siteBase, playerId) {
  const base = normalizeSiteBase(siteBase);
  if (!base) return "";
  const url = new URL(base);
  url.pathname = `/${playerId}`;
  return url.toString();
}

export default function RosterMenuWidget() {
  const params = new URLSearchParams(window.location.search);
  const siteBase = params.get("siteBase") || "www.tahomabearsbaseball.com";
  const heightParam = params.get("height"); // e.g. "600"
  const fixedHeight = heightParam && !Number.isNaN(Number(heightParam)) ? Number(heightParam) : 600;

  const [isOpen, setIsOpen] = useState(true);

  const roster = useMemo(() => {
    const entries = Object.entries(playersData.players || {});
    return entries
      .map(([id, p]) => ({
        id,
        name: p?.name || id,
        number: p?.number || "",
        positionPills: splitAndAbbreviatePositions(p?.positions || ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // When embedded, make the page background transparent (so the parent page shows through).
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      document.documentElement.classList.add("embed");
    }
  }, []);

  // Note: this widget is intended to be fixed-height + internally scrollable,
  // so we do NOT auto-resize the parent iframe here.

  const goToPlayer = (playerId) => {
    const target = buildPlayerPageUrl(siteBase, playerId);
    if (!target) return;

    // Navigate the Squarespace page (top window), not the iframe.
    if (window.top) window.top.location.href = target;
    else window.location.href = target;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-0 top-8 bg-yellow-400 p-3 rounded-r-lg shadow-lg hover:bg-yellow-500 transition-colors z-50"
        aria-label="Open roster menu"
      >
        <ChevronDown className="rotate-90" size={20} />
      </button>
    );
  }

  return (
    <div
      className="w-72 max-w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
      style={{ height: `${fixedHeight}px` }}
    >
      <div className="p-4 bg-yellow-400 border-b border-yellow-500">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">Roster</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-yellow-500 rounded transition-colors"
            aria-label="Close roster menu"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="relative">
          <select
            className="w-full p-2 pr-8 border border-gray-300 rounded bg-white appearance-none cursor-pointer"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) goToPlayer(e.target.value);
            }}
          >
            <option value="" disabled>
              Select a Player
            </option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            size={16}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {roster.map((p) => (
          <button
            key={p.id}
            onClick={() => goToPlayer(p.id)}
            className="w-full p-4 text-left hover:bg-blue-50 transition-colors"
          >
            {p.number ? (
              <div className="text-sm text-gray-600 mb-1">#{p.number}</div>
            ) : null}
            <div className="mb-1">{p.name}</div>
            {p.positionPills?.length ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {p.positionPills.map((abbr) => (
                  <span
                    key={abbr}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${pillClassFor(abbr)}`}
                  >
                    {abbr}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}


