import { Activity, Flame, Snowflake } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import CollapsibleSection from "../components/CollapsibleSection";

function StatusIcon({ status }) {
  if (status === "hot") return <Flame className="w-5 h-5 text-orange-500 mx-auto" />;
  if (status === "cold") return <Snowflake className="w-5 h-5 text-blue-400 mx-auto" />;
  return <div className="w-2 h-2 bg-slate-400 rounded-full mx-auto" />;
}

export default function RecentPerformanceSection({
  expanded,
  onToggle,
  recentGames,
  performanceTrend,
}) {
  const games = Array.isArray(recentGames) ? recentGames : [];
  const trend = Array.isArray(performanceTrend) ? performanceTrend : [];

  const anyBatting = games.some((g) => g?.hasBatting === true);
  const anyPitching = games.some((g) => g?.hasPitching === true);
  const mode = anyBatting && anyPitching ? "both" : anyBatting ? "batting" : "pitching";

  return (
    <CollapsibleSection
      id="recentGames"
      title="Recent Varsity Performance (Last 5 Games)"
      icon={Activity}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#1d4281]">
              <th className="text-left py-3 px-2">Date</th>
              <th className="text-left py-3 px-2">Opponent</th>
              <th className="text-left py-3 px-2">Result</th>
              {mode === "batting" ? (
                <>
                  <th className="text-center py-3 px-2">Hits</th>
                  <th className="text-center py-3 px-2">RBI</th>
                  <th className="text-center py-3 px-2">R</th>
                  <th className="text-center py-3 px-2">BA</th>
                  <th className="text-center py-3 px-2">OBP</th>
                  <th className="text-center py-3 px-2">SLG</th>
                </>
              ) : mode === "pitching" ? (
                <>
                  <th className="text-center py-3 px-2">IP</th>
                  <th className="text-center py-3 px-2">ER</th>
                  <th className="text-center py-3 px-2">SO</th>
                  <th className="text-center py-3 px-2">BB</th>
                  <th className="text-center py-3 px-2">ERA</th>
                  <th className="text-center py-3 px-2">WHIP</th>
                </>
              ) : (
                <>
                  <th className="text-center py-3 px-2">BA</th>
                  <th className="text-center py-3 px-2">Hits</th>
                  <th className="text-center py-3 px-2">RBI</th>
                  <th className="text-center py-3 px-2">ERA</th>
                  <th className="text-center py-3 px-2">IP</th>
                  <th className="text-center py-3 px-2">SO</th>
                </>
              )}
              <th className="text-center py-3 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, index) => (
              <tr
                key={`${g.date}-${g.opponent}-${index}`}
                className={`border-b hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
              >
                <td className="py-3 px-2">{g.date}</td>
                <td className="py-3 px-2 font-semibold">{g.opponent}</td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      String(g.result || "").startsWith("W")
                        ? "bg-green-100 text-green-700"
                        : String(g.result || "").startsWith("T")
                          ? "bg-slate-200 text-slate-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {g.result}
                  </span>
                </td>
                {mode === "batting" ? (
                  <>
                    <td className="text-center py-3 px-2 font-semibold">{g.hits}</td>
                    <td className="text-center py-3 px-2 font-semibold">{g.rbi}</td>
                    <td className="text-center py-3 px-2">{g.runs}</td>
                    <td className="text-center py-3 px-2 font-semibold">{g.ba}</td>
                    <td className="text-center py-3 px-2">{g.obp}</td>
                    <td className="text-center py-3 px-2">{g.slg}</td>
                  </>
                ) : mode === "pitching" ? (
                  <>
                    <td className="text-center py-3 px-2">{g.ip}</td>
                    <td className="text-center py-3 px-2 font-semibold">{g.er}</td>
                    <td className="text-center py-3 px-2 font-semibold">{g.so}</td>
                    <td className="text-center py-3 px-2">{g.bbPit}</td>
                    <td className="text-center py-3 px-2">{g.era}</td>
                    <td className="text-center py-3 px-2">{g.whip}</td>
                  </>
                ) : (
                  <>
                    <td className="text-center py-3 px-2 font-semibold">{g.ba}</td>
                    <td className="text-center py-3 px-2">{g.hits}</td>
                    <td className="text-center py-3 px-2 font-semibold">{g.rbi}</td>
                    <td className="text-center py-3 px-2">{g.era}</td>
                    <td className="text-center py-3 px-2">{g.ip}</td>
                    <td className="text-center py-3 px-2 font-semibold">{g.so}</td>
                  </>
                )}
                <td className="text-center py-3 px-2">
                  <StatusIcon status={g.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trend.length ? (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="font-bold text-[#1d4281] mb-3">Performance Trends</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  domain={[0.2, 0.8]}
                />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#1d4281"
                  strokeWidth={2}
                  name="Batting Avg"
                />
                <Line
                  type="monotone"
                  dataKey="obp"
                  stroke="#ffc525"
                  strokeWidth={2}
                  name="On-Base %"
                />
                <Line
                  type="monotone"
                  dataKey="slg"
                  stroke="#64748b"
                  strokeWidth={2}
                  name="Slugging %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </CollapsibleSection>
  );
}

