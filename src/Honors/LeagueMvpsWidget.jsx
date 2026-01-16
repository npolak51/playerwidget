import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { HonorsShell, useEmbedAutoHeight } from "./HonorsWidgetBase";
import { mvps } from "./honorsData";

export default function LeagueMvpsWidget() {
  const rows = useMemo(() => mvps || [], []);

  useEmbedAutoHeight([rows.length]);

  return (
    <HonorsShell title="League MVPs" subtitle="Tahoma Bears Baseball">
      <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div className="text-white font-semibold">Most Valuable Player</div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {rows.map((mvp) => {
          const content = (
            <div className="flex items-center justify-between gap-4">
              <div className="text-blue-900 font-semibold">{mvp.name}</div>
              <div className="inline-block px-3 py-1 bg-blue-900/10 text-blue-900 rounded-full text-sm">
                {mvp.year}
              </div>
            </div>
          );

          const cls =
            "px-4 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-transparent transition-all duration-200";

          return mvp.url ? (
            <a key={`${mvp.year}-${mvp.name}`} href={mvp.url} className={cls} target="_top" rel="noreferrer">
              {content}
            </a>
          ) : (
            <div key={`${mvp.year}-${mvp.name}`} className={cls}>
              {content}
            </div>
          );
        })}
      </div>
    </HonorsShell>
  );
}

