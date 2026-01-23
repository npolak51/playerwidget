import { useMemo, useState } from "react";
import { HonorsShell, useEmbedAutoHeight } from "./HonorsWidgetBase";
import { mvps, allLeagueSelections } from "./honorsData";
import { LeagueMvpsBody } from "./LeagueMvpsWidget";
import { AllLeagueMultiBody, buildAllLeagueMulti } from "./AllLeagueMultiWidget";
import { AllLeagueAllBody } from "./AllLeagueAllWidget";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 min-h-[44px] rounded-full text-base sm:text-sm font-semibold whitespace-nowrap transition-colors ${
        active ? "bg-blue-900 text-white" : "bg-white/80 text-blue-900 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function HonorsHubWidget() {
  const params = new URLSearchParams(window.location.search);
  const defaultTab = params.get("tab") || "mvps"; // mvps | multi | all
  const heightParam = params.get("height"); // used for the All‑League tab's internal scroll region
  const fixedHeight =
    heightParam && !Number.isNaN(Number(heightParam)) ? Number(heightParam) : 720;

  const [activeTab, setActiveTab] = useState(
    defaultTab === "multi" || defaultTab === "all" ? defaultTab : "mvps"
  );

  const mvpRows = useMemo(() => mvps || [], []);
  const multi = useMemo(() => buildAllLeagueMulti(allLeagueSelections), []);

  // One auto-height controller for the whole hub (tab switches + content changes).
  useEmbedAutoHeight([activeTab, mvpRows.length, multi.length]);

  const body =
    activeTab === "mvps" ? (
      <LeagueMvpsBody rows={mvpRows} />
    ) : activeTab === "multi" ? (
      <AllLeagueMultiBody multi={multi} />
    ) : (
      <AllLeagueAllBody fixedHeight={fixedHeight} />
    );

  return (
    <HonorsShell title="League Honors" subtitle="Tahoma Bears Baseball">
      <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-700 border-b border-blue-950/40">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <TabButton active={activeTab === "mvps"} onClick={() => setActiveTab("mvps")}>
            MVPs
          </TabButton>
          <TabButton active={activeTab === "multi"} onClick={() => setActiveTab("multi")}>
            3× / 4×
          </TabButton>
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            All‑League
          </TabButton>
        </div>
      </div>

      {body}
    </HonorsShell>
  );
}

