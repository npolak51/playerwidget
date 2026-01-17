import { useMemo } from "react";
import { Award } from "lucide-react";
import { HonorsShell, useEmbedAutoHeight } from "./HonorsWidgetBase";
import { mvps } from "./honorsData";

function MvpIconTile() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-sm flex items-center justify-center flex-shrink-0">
      <Award className="w-7 h-7 text-white" />
    </div>
  );
}

export default function LeagueMvpsWidget() {
  const rows = useMemo(() => mvps || [], []);

  useEmbedAutoHeight([rows.length]);

  return (
    <HonorsShell title="League MVPs" subtitle="Tahoma Bears Baseball">
      <div className="p-4 sm:p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((mvp) => {
            const inner = (
              <div className="p-4 flex items-center gap-4">
                <MvpIconTile />
                <div className="min-w-0">
                  <div className="text-blue-900 font-semibold truncate">{mvp.name}</div>
                  <div className="text-gray-600 text-sm mt-1">{mvp.year}</div>
                </div>
              </div>
            );

            const cardClass =
              "bg-yellow-50/40 border border-yellow-300/70 rounded-xl shadow-sm hover:shadow-md transition-shadow";

            return mvp.url ? (
              <a
                key={`${mvp.year}-${mvp.name}`}
                href={mvp.url}
                target="_top"
                rel="noreferrer"
                className={cardClass}
              >
                {inner}
              </a>
            ) : (
              <div key={`${mvp.year}-${mvp.name}`} className={cardClass}>
                {inner}
              </div>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No MVPs recorded yet.</div>
        ) : null}
      </div>
    </HonorsShell>
  );
}

