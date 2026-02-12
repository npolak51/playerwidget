import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Flame, Star, Target, Trophy } from "lucide-react";

function iconFor(key) {
  if (key === "Star") return Star;
  if (key === "Trophy") return Trophy;
  if (key === "Target") return Target;
  if (key === "Flame") return Flame;
  return Star;
}

export default function CareerMilestonesSection({ milestones }) {
  const rows = Array.isArray(milestones) ? milestones : [];
  if (!rows.length) return null;

  const [expanded, setExpanded] = useState(false);
  const maxVisible = 4;
  const visible = useMemo(() => {
    const hasSortKey = rows.some((r) => Number.isFinite(Number(r?.sortKey)));
    const hasMeta = rows.some((r) => Number.isFinite(Number(r?.achievedYear)) && r?.categoryKey && r?.team);

    const sorted = hasSortKey
      ? [...rows].sort((a, b) => {
          const ka = Number(a?.sortKey) || 0;
          const kb = Number(b?.sortKey) || 0;
          if (kb !== ka) return kb - ka;
          const ta = Number(a?.threshold) || 0;
          const tb = Number(b?.threshold) || 0;
          return tb - ta;
        })
      : hasMeta
        ? [...rows].sort((a, b) => {
            const ya = Number(a?.achievedYear) || 0;
            const yb = Number(b?.achievedYear) || 0;
            if (yb !== ya) return yb - ya;
            const ta = Number(a?.threshold) || 0;
            const tb = Number(b?.threshold) || 0;
            return tb - ta;
          })
        : rows;

    return expanded ? sorted : sorted.slice(0, maxVisible);
  }, [expanded, rows]);

  return (
    <div className="bg-gradient-to-r from-[#1d4281] to-[#2a5ba8] rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-[#ffc525]" />
          Career Milestones
        </h2>

        {rows.length > maxVisible ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
          >
            {expanded ? "Show less" : `Show all (${rows.length})`}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        ) : null}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {visible.map((m, idx) => {
          const Icon = iconFor(m.icon);
          return (
            <div
              key={`${m.date}-${idx}`}
              className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4"
            >
              <Icon className="w-6 h-6 text-[#ffc525] flex-shrink-0 mt-1" />
              <div>
                {m?.team !== "JV" && m?.date ? (
                  <div className="text-sm text-white/80 mb-1">{m.date}</div>
                ) : null}
                <div className="font-semibold">{m.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {!expanded && rows.length > maxVisible ? (
        <div className="mt-4 text-white/80 text-sm">
          Showing {maxVisible} of {rows.length}.
        </div>
      ) : null}
    </div>
  );
}

