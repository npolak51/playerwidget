import { BarChart3 } from "lucide-react";
import CollapsibleSection from "../components/CollapsibleSection";

function StatRow({ stat, index }) {
  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded ${
        index % 2 === 0 ? "bg-slate-50" : "bg-white"
      }`}
    >
      <span className="text-slate-700">{stat.category}</span>
      <span className="font-bold text-[#1d4281]">{stat.value}</span>
    </div>
  );
}

export default function SeasonStatsSection({
  expanded,
  onToggle,
  seasonStats,
  pitchingStats,
  seasonLabel = "Season Statistics",
}) {
  const hitting = Array.isArray(seasonStats) ? seasonStats : [];
  const pitching = Array.isArray(pitchingStats) ? pitchingStats : [];

  return (
    <CollapsibleSection
      id="seasonStats"
      title={seasonLabel}
      icon={BarChart3}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-lg text-[#1d4281] mb-3 pb-2 border-b-2 border-[#ffc525]">
            Hitting
          </h3>
          <div className="space-y-2">
            {hitting.map((stat, idx) => (
              <StatRow key={`${stat.category}-${idx}`} stat={stat} index={idx} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg text-[#1d4281] mb-3 pb-2 border-b-2 border-[#ffc525]">
            Pitching
          </h3>
          <div className="space-y-2">
            {pitching.map((stat, idx) => (
              <StatRow key={`${stat.category}-${idx}`} stat={stat} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

