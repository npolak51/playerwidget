import PlayerPage from "./PlayerPage";
import ScoutPages from "./ScoutPages";
import StatWidget from "./StatWidget";

export default function PlayerProfileBundleWidget() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        <PlayerPage />
        <ScoutPages />
        <StatWidget />
      </div>
    </div>
  );
}

