import { Award, Flame, Medal, Star, Target, Trophy } from "lucide-react";
import CollapsibleSection from "../components/CollapsibleSection";

function TypeIcon({ type }) {
  if (type === "mvp") return <Trophy className="w-5 h-5 text-[#ffc525]" />;
  if (type === "award") return <Award className="w-5 h-5 text-[#1d4281]" />;
  if (type === "milestone") return <Star className="w-5 h-5 text-[#ffc525]" />;
  if (type === "record") return <Medal className="w-5 h-5 text-[#ffc525]" />;
  if (type === "weekly") return <Flame className="w-5 h-5 text-orange-500" />;
  if (type === "recognition") return <Target className="w-5 h-5 text-[#1d4281]" />;
  return <Award className="w-5 h-5 text-[#1d4281]" />;
}

export default function AchievementsSection({ expanded, onToggle, achievements }) {
  const rows = Array.isArray(achievements) ? achievements : [];

  return (
    <CollapsibleSection
      id="achievements"
      title="Achievements & Honors"
      icon={Award}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((a, idx) => (
          <div
            key={`${a.title}-${idx}`}
            className="border-l-4 border-[#ffc525] bg-slate-50 p-4 rounded-r-lg hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-2 gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {a?.year ? <span className="text-[#1d4281] font-bold">{a.year}</span> : null}
                {a?.active ? (
                  <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                ) : null}
              </div>
              <TypeIcon type={a.type} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{a.title}</h3>
            <p className="text-sm text-slate-600">{a.description}</p>
          </div>
        ))}
        {!rows.length ? (
          <div className="text-slate-600">No achievements yet.</div>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}

