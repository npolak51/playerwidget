import { Trophy } from "lucide-react";
import CollapsibleSection from "../components/CollapsibleSection";

function CareerBattingStatsJsonTable({ rows }) {
  const data = Array.isArray(rows) ? rows : [];
  const cols = [
    { key: "season", label: "Season" },
    { key: "class", label: "Class" },
    { key: "team", label: "Team" },
    { key: "PA", label: "PA" },
    { key: "AB", label: "AB" },
    { key: "R", label: "R" },
    { key: "H", label: "H" },
    { key: "RBI", label: "RBI" },
    { key: "XBH", label: "XBH" },
    { key: "SB", label: "SB" },
    { key: "AVG", label: "AVG" },
    { key: "OBP", label: "OBP" },
    { key: "SLG", label: "SLG" },
    { key: "OPS", label: "OPS" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1d4281] text-white">
            {cols.map((c) => (
              <th key={c.key} className="text-center py-3 px-2 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`${row.season}-${index}`}
              className={`border-b ${
                row.__totals ? "bg-[#ffc525]/20 font-bold" : index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`text-center py-3 px-2 ${c.key === "season" ? "text-left px-3" : ""}`}
                >
                  {row?.[c.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CareerPitchingStatsJsonTable({ rows }) {
  const data = Array.isArray(rows) ? rows : [];
  const cols = [
    { key: "season", label: "Season" },
    { key: "class", label: "Class" },
    { key: "team", label: "Team" },
    { key: "IP", label: "IP" },
    { key: "H", label: "H" },
    { key: "R", label: "R" },
    { key: "ER", label: "ER" },
    { key: "BB", label: "BB" },
    { key: "K", label: "K" },
    { key: "HBP", label: "HBP" },
    { key: "WP", label: "WP" },
    { key: "ERA", label: "ERA" },
    { key: "WHIP", label: "WHIP" },
    { key: "BAA", label: "BAA" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1d4281] text-white">
            {cols.map((c) => (
              <th key={c.key} className="text-center py-3 px-2 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`${row.season}-${index}`}
              className={`border-b ${
                row.__totals ? "bg-[#ffc525]/20 font-bold" : index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`text-center py-3 px-2 ${c.key === "season" ? "text-left px-3" : ""}`}
                >
                  {row?.[c.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CareerHittingTable({ rows }) {
  const data = Array.isArray(rows) ? rows : [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1d4281] text-white">
            <th className="text-left py-3 px-3">Season</th>
            <th className="text-center py-3 px-2">G</th>
            <th className="text-center py-3 px-2">AB</th>
            <th className="text-center py-3 px-2">R</th>
            <th className="text-center py-3 px-2">H</th>
            <th className="text-center py-3 px-2">2B</th>
            <th className="text-center py-3 px-2">3B</th>
            <th className="text-center py-3 px-2">HR</th>
            <th className="text-center py-3 px-2">RBI</th>
            <th className="text-center py-3 px-2">SB</th>
            <th className="text-center py-3 px-2">AVG</th>
            <th className="text-center py-3 px-2">OBP</th>
            <th className="text-center py-3 px-2">SLG</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`${row.season}-${index}`}
              className={`border-b ${
                row.season === "Career"
                  ? "bg-[#ffc525]/20 font-bold"
                  : index % 2 === 0
                    ? "bg-slate-50"
                    : "bg-white"
              }`}
            >
              <td className="py-3 px-3">{row.season}</td>
              <td className="text-center py-3 px-2">{row.games}</td>
              <td className="text-center py-3 px-2">{row.ab}</td>
              <td className="text-center py-3 px-2">{row.r}</td>
              <td className="text-center py-3 px-2">{row.h}</td>
              <td className="text-center py-3 px-2">{row.doubles}</td>
              <td className="text-center py-3 px-2">{row.triples}</td>
              <td className="text-center py-3 px-2">{row.hr}</td>
              <td className="text-center py-3 px-2">{row.rbi}</td>
              <td className="text-center py-3 px-2">{row.sb}</td>
              <td className="text-center py-3 px-2 font-semibold">{row.avg}</td>
              <td className="text-center py-3 px-2">{row.obp}</td>
              <td className="text-center py-3 px-2">{row.slg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CareerPitchingTable({ rows }) {
  const data = Array.isArray(rows) ? rows : [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1d4281] text-white">
            <th className="text-left py-3 px-3">Season</th>
            <th className="text-center py-3 px-2">G</th>
            <th className="text-center py-3 px-2">GS</th>
            <th className="text-center py-3 px-2">IP</th>
            <th className="text-center py-3 px-2">W</th>
            <th className="text-center py-3 px-2">L</th>
            <th className="text-center py-3 px-2">ERA</th>
            <th className="text-center py-3 px-2">SO</th>
            <th className="text-center py-3 px-2">BB</th>
            <th className="text-center py-3 px-2">H</th>
            <th className="text-center py-3 px-2">WHIP</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`${row.season}-${index}`}
              className={`border-b ${
                row.season === "Career"
                  ? "bg-[#ffc525]/20 font-bold"
                  : index % 2 === 0
                    ? "bg-slate-50"
                    : "bg-white"
              }`}
            >
              <td className="py-3 px-3">{row.season}</td>
              <td className="text-center py-3 px-2">{row.games}</td>
              <td className="text-center py-3 px-2">{row.gs}</td>
              <td className="text-center py-3 px-2">{row.ip}</td>
              <td className="text-center py-3 px-2">{row.w}</td>
              <td className="text-center py-3 px-2">{row.l}</td>
              <td className="text-center py-3 px-2 font-semibold">{row.era}</td>
              <td className="text-center py-3 px-2">{row.so}</td>
              <td className="text-center py-3 px-2">{row.bb}</td>
              <td className="text-center py-3 px-2">{row.h}</td>
              <td className="text-center py-3 px-2">{row.whip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CareerStatsSection({ expanded, onToggle, careerStats }) {
  const battingRows = careerStats?.battingRows || null;
  const pitchingRows = careerStats?.pitchingRows || null;
  const legacy = careerStats?.legacy || careerStats;
  const hitting = legacy?.hitting || [];
  const pitching = legacy?.pitching || [];

  return (
    <CollapsibleSection
      id="careerStats"
      title="Career Statistics"
      icon={Trophy}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="mb-6">
        <h3 className="font-bold text-lg text-[#1d4281] mb-3 pb-2 border-b-2 border-[#ffc525]">
          Career Hitting
        </h3>
        {battingRows ? <CareerBattingStatsJsonTable rows={battingRows} /> : <CareerHittingTable rows={hitting} />}
      </div>

      <div>
        <h3 className="font-bold text-lg text-[#1d4281] mb-3 pb-2 border-b-2 border-[#ffc525]">
          Career Pitching
        </h3>
        {pitchingRows ? <CareerPitchingStatsJsonTable rows={pitchingRows} /> : <CareerPitchingTable rows={pitching} />}
      </div>
    </CollapsibleSection>
  );
}

