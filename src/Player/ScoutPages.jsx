import { useEffect, useMemo } from "react";
import playersData from "../data/players.json";

import PGLogo from "../assets/Icons/PG_Logo.svg";
import PBRLogo from "../assets/Icons/PBR_Logo.svg";
import BBNWLogo from "../assets/Icons/BBNW_Logo.svg";

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

function normalizeUrl(url) {
  const v = String(url ?? "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

export default function ScoutPages() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("player");
  const player = playerId ? playersData.players?.[playerId] : null;

  useEmbedAutoHeight([playerId]);

  const links = useMemo(() => {
    const raw = player?.scoutPages || {};
    const legacy = player || {};

    const perfectGame = normalizeUrl(raw.perfectGame || legacy.perfectGame);
    const pbr = normalizeUrl(raw.pbr || legacy.pbr);
    const baseballNorthwest = normalizeUrl(raw.baseballNorthwest || legacy.baseballNorthwest);

    const out = [];
    if (perfectGame) out.push({ key: "perfectGame", name: "Perfect Game", url: perfectGame, icon: PGLogo });
    if (pbr) out.push({ key: "pbr", name: "PBR", url: pbr, icon: PBRLogo });
    if (baseballNorthwest) out.push({ key: "baseballNorthwest", name: "Baseball Northwest", url: baseballNorthwest, icon: BBNWLogo });
    return out;
  }, [player]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-0 w-full max-w-6xl mx-auto border border-gray-200">
      <div className="bg-gradient-to-r from-[#1d4281] to-[#2554a8] px-4 py-3">
        <h4 className="text-white text-center text-lg">Player Profiles</h4>
      </div>

      <div className="p-4">
        {!playerId ? (
          <div className="text-gray-700">
            Add a player id to the URL, e.g. <code>?widget=scoutpages&amp;player=adam-jay</code>
          </div>
        ) : !player ? (
          <div className="text-gray-700">
            Unknown player id: <code>{playerId}</code>
          </div>
        ) : links.length === 0 ? (
          <div className="border border-gray-200 rounded-xl p-6 bg-white text-center">
            <div className="text-xl font-bold text-gray-900 mb-2">No scouting profiles yet</div>
            <div className="text-gray-700">Check back soon for external scouting links.</div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5 justify-center">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-1 min-w-[170px] max-w-[260px] flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 border-gray-200 hover:border-[#ffc525] hover:bg-[#ffc525]/5 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#1d4281] to-[#2554a8] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                  <img src={link.icon} alt={`${link.name} logo`} className="w-11 h-11 object-contain" />
                </div>
                <span className="text-[#1d4281] text-center text-sm group-hover:text-[#2554a8] transition-colors">
                  {link.name}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


