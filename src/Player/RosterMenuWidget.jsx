import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import playersData from "../data/players.json";

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
        position: p?.positions || "",
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
            {p.position ? (
              <div className="text-sm text-gray-600">{p.position}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}


