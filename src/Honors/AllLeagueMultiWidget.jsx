import { useMemo } from "react";
import { Users } from "lucide-react";
import { HonorsShell, useEmbedAutoHeight } from "./HonorsWidgetBase";
import { allLeagueSelections } from "./honorsData";

function normalizeName(name) {
  return String(name ?? "").trim();
}

function formatYearRanges(yearsDesc) {
  // Input is currently sorted DESC; convert to unique ASC for range building.
  const uniqAsc = Array.from(new Set((yearsDesc || []).map((y) => Number(y)).filter(Boolean))).sort((a, b) => a - b);
  if (uniqAsc.length === 0) return "";

  const ranges = [];
  let start = uniqAsc[0];
  let prev = uniqAsc[0];

  for (let i = 1; i < uniqAsc.length; i++) {
    const y = uniqAsc[i];
    if (y === prev + 1) {
      prev = y;
      continue;
    }
    ranges.push([start, prev]);
    start = y;
    prev = y;
  }
  ranges.push([start, prev]);

  // Use en dash for ranges to match the screenshot.
  return ranges
    .map(([a, b]) => (a === b ? String(a) : `${a}\u2013${b}`))
    .join(", ");
}

export default function AllLeagueMultiWidget() {
  const multi = useMemo(() => {
    const counts = new Map();

    for (const r of allLeagueSelections || []) {
      const name = normalizeName(r.name);
      if (!name) continue;
      const cur = counts.get(name) || { name, count: 0, years: new Set(), teams: new Set() };
      cur.count += 1;
      if (r.year) cur.years.add(r.year);
      if (r.team) cur.teams.add(r.team);
      counts.set(name, cur);
    }

    const out = [];
    for (const v of counts.values()) {
      if (v.count >= 3) {
        out.push({
          name: v.name,
          count: v.count,
          years: Array.from(v.years).sort((a, b) => b - a),
          teams: Array.from(v.teams),
        });
      }
    }

    out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return out;
  }, []);

  useEmbedAutoHeight([multi.length]);

  return (
    <HonorsShell title="3× / 4× All‑League" subtitle="Players selected to 3+ All‑League teams">
      <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-yellow-400" />
          <div className="text-white font-semibold">Multi‑time Honorees</div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {multi.map((p) => (
            <div
              key={p.name}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 flex items-center gap-4">
                {/* 3x / 4x badge */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.count >= 4
                      ? "bg-gradient-to-r from-yellow-300 to-yellow-500 text-blue-900"
                      : "bg-gradient-to-r from-blue-700 to-blue-900 text-white"
                  }`}
                >
                  <span className="font-semibold">{p.count}×</span>
                </div>

                {/* name + years */}
                <div className="min-w-0">
                  <div className="text-blue-900 font-semibold truncate">{p.name}</div>
                  <div className="text-gray-600 text-sm mt-1 truncate">
                    {formatYearRanges(p.years)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {multi.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No players have 3+ All‑League selections yet.</div>
        ) : null}
      </div>
    </HonorsShell>
  );
}

