import { useMemo } from "react";
import { Users } from "lucide-react";
import { HonorsShell, useEmbedAutoHeight } from "./HonorsWidgetBase";
import { allLeagueSelections } from "./honorsData";

function normalizeName(name) {
  return String(name ?? "").trim();
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

      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-white border-b border-gray-200 text-sm">
        <div className="col-span-5 text-gray-600 font-semibold">Player</div>
        <div className="col-span-2 text-gray-600 font-semibold">Selections</div>
        <div className="col-span-5 text-gray-600 font-semibold">Years</div>
      </div>

      <div className="divide-y divide-gray-200">
        {multi.map((p) => (
          <div
            key={p.name}
            className="px-4 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all duration-200"
          >
            {/* Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
              <div className="col-span-5 text-blue-900 font-semibold">{p.name}</div>
              <div className="col-span-2">
                <span className="inline-block px-3 py-1 bg-yellow-400/25 text-blue-900 rounded-full font-semibold text-sm border border-yellow-400/40">
                  {p.count}×
                </span>
              </div>
              <div className="col-span-5 text-gray-800">{p.years.join(", ")}</div>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="text-blue-900 font-semibold">{p.name}</div>
                <span className="inline-block px-3 py-1 bg-yellow-400/25 text-blue-900 rounded-full font-semibold text-sm border border-yellow-400/40">
                  {p.count}×
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-700">{p.years.join(", ")}</div>
            </div>
          </div>
        ))}

        {multi.length === 0 ? (
          <div className="px-4 sm:px-6 py-10 text-center text-gray-500">
            No players have 3+ All‑League selections yet.
          </div>
        ) : null}
      </div>
    </HonorsShell>
  );
}

