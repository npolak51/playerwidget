import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Target } from "lucide-react";

export default function SkillsRadarSection({ skills }) {
  const data = Array.isArray(skills) ? skills : [];
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#1d4281] mb-4 flex items-center gap-2">
        <Target className="w-6 h-6" />
        Skills Snapshot
      </h2>

      <div className="grid lg:grid-cols-2 gap-6 items-center">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "#475569", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Skills"
                dataKey="value"
                stroke="#1d4281"
                fill="#1d4281"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {data.map((s) => (
            <div key={s.skill} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm text-slate-600">{s.skill}</div>
              <div className="text-lg font-bold text-[#1d4281]">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

