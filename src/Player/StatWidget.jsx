import { useEffect, useMemo, useState } from "react";
import playersData from "../data/players.json";
import statsData from "../data/stats.json";

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

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-blue-700 text-white"
          : "bg-white/70 text-gray-800 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold text-gray-900">{children}</h3>
    </div>
  );
}

function StatCard({ title, items, accent = "blue" }) {
  const accentClasses =
    accent === "yellow"
      ? "border-yellow-200 bg-yellow-50"
      : "border-blue-200 bg-blue-50";

  return (
    <div className={`border rounded-xl p-4 ${accentClasses}`}>
      <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-sm text-gray-600">{it.label}</div>
            <div className="text-lg font-semibold text-gray-900">{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BattingTable({ rows, totalsOnly = false }) {
  const cols = [
    { key: "class", label: "Class" },
    { key: "team", label: "Team" },
    { key: "year", label: "Year" },
    { key: "PA", label: "PA" },
    { key: "H", label: "H" },
    { key: "RBI", label: "RBI" },
    { key: "R", label: "R" },
    { key: "XBH", label: "XBH" },
    { key: "KBB", label: "K/BB" },
    { key: "SB", label: "SB" },
    { key: "AVG", label: "AVG" },
    { key: "OBP", label: "OBP" },
    { key: "SLG", label: "SLG" }
  ];

  const dataRows = totalsOnly ? rows.slice(0, 1) : rows;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl">
      <table className="min-w-full text-left">
        <thead className="bg-yellow-400 border-b border-yellow-500">
          <tr>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-sm font-semibold text-blue-900">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {dataRows.map((row, idx) => {
            const isTotals = row.__totals === true;
            return (
              <tr
                key={`${row.year || "career"}-${idx}`}
                className={isTotals ? "bg-blue-600 text-white" : "bg-white"}
              >
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-3 text-sm ${isTotals ? "font-semibold" : "text-gray-900"}`}
                  >
                    {row[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PitchingTable({ rows, totalsOnly = false }) {
  const cols = [
    { key: "class", label: "Class" },
    { key: "team", label: "Team" },
    { key: "year", label: "Year" },
    { key: "IP", label: "IP" },
    { key: "H", label: "H" },
    { key: "R", label: "R" },
    { key: "ER", label: "ER" },
    { key: "BB", label: "BB" },
    { key: "K", label: "K" },
    { key: "ERA", label: "ERA" },
    { key: "WHIP", label: "WHIP" },
    { key: "BAA", label: "BAA" }
  ];

  const dataRows = totalsOnly ? rows.slice(0, 1) : rows;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl">
      <table className="min-w-full text-left">
        <thead className="bg-yellow-400 border-b border-yellow-500">
          <tr>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-sm font-semibold text-blue-900">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {dataRows.map((row, idx) => {
            const isTotals = row.__totals === true;
            return (
              <tr
                key={`${row.year || "career"}-${idx}`}
                className={isTotals ? "bg-blue-600 text-white" : "bg-white"}
              >
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-3 text-sm ${isTotals ? "font-semibold" : "text-gray-900"}`}
                  >
                    {row[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StatWidget() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("player");
  const playerName = playerId ? playersData.players?.[playerId]?.name : null;
  const playerStats = playerId ? statsData.players?.[playerId] : null;

  const seasonTabs = useMemo(() => {
    const years = (playerStats?.batting?.seasons || []).map((s) => s.year).filter(Boolean);
    const unique = Array.from(new Set(years));
    unique.sort((a, b) => {
      const ay = Number(a);
      const by = Number(b);
      if (Number.isNaN(ay) || Number.isNaN(by)) return String(b).localeCompare(String(a));
      return by - ay;
    });
    return unique;
  }, [playerStats]);

  const [activeTab, setActiveTab] = useState(seasonTabs[0] || "Career");
  useEffect(() => {
    // Keep active tab valid when player changes
    if (seasonTabs.length > 0) setActiveTab(seasonTabs[0]);
    else setActiveTab("Career");
  }, [playerId, seasonTabs]);

  useEmbedAutoHeight([playerId, activeTab]);

  const battingSeason =
    activeTab !== "Career"
      ? playerStats?.batting?.seasons?.find((s) => s.year === activeTab) || null
      : null;
  const pitchingSeason =
    activeTab !== "Career"
      ? playerStats?.pitching?.seasons?.find((s) => s.year === activeTab) || null
      : null;

  const battingTotals = playerStats?.batting?.careerTotals || null;
  const pitchingTotals = playerStats?.pitching?.careerTotals || null;

  const battingDesktopRows =
    activeTab === "Career"
      ? battingTotals
        ? [{ class: "", team: battingTotals.team || "", year: "", ...battingTotals, __totals: true }]
        : []
      : battingSeason
        ? [battingSeason]
        : [];

  const pitchingDesktopRows =
    activeTab === "Career"
      ? pitchingTotals
        ? [{ class: "", team: pitchingTotals.team || "", year: "", ...pitchingTotals, __totals: true }]
        : []
      : pitchingSeason
        ? [pitchingSeason]
        : [];

  const battingMobileItems = (row) => [
    { label: "Year", value: row?.year || (activeTab === "Career" ? "Career" : "") },
    { label: "PA", value: row?.PA ?? "" },
    { label: "H", value: row?.H ?? "" },
    { label: "RBI", value: row?.RBI ?? "" },
    { label: "R", value: row?.R ?? "" },
    { label: "SB", value: row?.SB ?? "" },
    { label: "AVG", value: row?.AVG ?? "" },
    { label: "OBP", value: row?.OBP ?? "" },
    { label: "SLG", value: row?.SLG ?? "" },
    { label: "K/BB", value: row?.KBB ?? "" }
  ];

  const pitchingMobileItems = (row) => [
    { label: "Year", value: row?.year || (activeTab === "Career" ? "Career" : "") },
    { label: "IP", value: row?.IP ?? "" },
    { label: "H", value: row?.H ?? "" },
    { label: "R", value: row?.R ?? "" },
    { label: "ER", value: row?.ER ?? "" },
    { label: "BB", value: row?.BB ?? "" },
    { label: "K", value: row?.K ?? "" },
    { label: "ERA", value: row?.ERA ?? "" },
    { label: "WHIP", value: row?.WHIP ?? "" },
    { label: "BAA", value: row?.BAA ?? "" }
  ];

  const mobileBattingRow = activeTab === "Career" ? battingTotals : battingSeason;
  const mobilePitchingRow = activeTab === "Career" ? pitchingTotals : pitchingSeason;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-0 w-full max-w-6xl mx-auto">
      <div className="p-4 bg-yellow-400 border-b border-yellow-500">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-blue-900">Stats</div>
            <div className="text-sm text-blue-900/80">
              {playerName ? playerName : playerId ? playerId : "Select a player"}
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {seasonTabs.map((y) => (
            <TabButton key={y} active={activeTab === y} onClick={() => setActiveTab(y)}>
              {y}
            </TabButton>
          ))}
          <TabButton active={activeTab === "Career"} onClick={() => setActiveTab("Career")}>
            Career
          </TabButton>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-8">
        {!playerId ? (
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <div className="text-xl font-bold text-gray-900 mb-2">Select a player</div>
            <div className="text-gray-700">
              Add a player id to the URL, e.g.{" "}
              <code>?widget=stats&amp;player=adam-jay</code>
            </div>
          </div>
        ) : !playerStats ? (
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <div className="text-xl font-bold text-gray-900 mb-2">No stats yet</div>
            <div className="text-gray-700">
              Stats for <code>{playerId}</code> haven’t been added to <code>src/data/stats.json</code> yet.
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <SectionTitle>Batting</SectionTitle>

              {/* Mobile: stacked cards */}
              <div className="md:hidden">
                {mobileBattingRow ? (
                  <StatCard
                    title={activeTab === "Career" ? "Career Totals" : `${mobileBattingRow.year} Season`}
                    items={battingMobileItems(mobileBattingRow)}
                    accent="yellow"
                  />
                ) : (
                  <div className="text-gray-600">No batting stats for this tab.</div>
                )}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <BattingTable rows={battingDesktopRows} totalsOnly={activeTab === "Career"} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Pitching</SectionTitle>

              {/* Mobile: stacked cards */}
              <div className="md:hidden">
                {mobilePitchingRow ? (
                  <StatCard
                    title={activeTab === "Career" ? "Career Totals" : `${mobilePitchingRow.year} Season`}
                    items={pitchingMobileItems(mobilePitchingRow)}
                    accent="blue"
                  />
                ) : (
                  <div className="text-gray-600">No pitching stats for this tab.</div>
                )}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <PitchingTable rows={pitchingDesktopRows} totalsOnly={activeTab === "Career"} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


