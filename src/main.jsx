import React from "react";
import ReactDOM from "react-dom/client";
import PlayerPage from "./Player/PlayerPage";
import RosterMenuWidget from "./Player/RosterMenuWidget";
import StatWidget from "./Player/StatWidget";
import ScoutPages from "./Player/ScoutPages";
import AllTimeLeadersWidget from "./Leaders/AllTimeLeadersWidget";
import AllTimeOffensiveLeadersWidget from "./Leaders/AllTimeOffensiveLeadersWidget";
import AllTimePitchingLeadersWidget from "./Leaders/AllTimePitchingLeadersWidget";
import LeagueMvpsWidget from "./Honors/LeagueMvpsWidget";
import AllLeagueMultiWidget from "./Honors/AllLeagueMultiWidget";
import AllLeagueAllWidget from "./Honors/AllLeagueAllWidget";
import "./index.css";

function WidgetRoot() {
  const params = new URLSearchParams(window.location.search);
  const widget = params.get("widget");

  if (widget === "menu") return <RosterMenuWidget />;
  if (widget === "stats") return <StatWidget />;
  if (widget === "scoutpages") return <ScoutPages />;
  if (widget === "leaders") return <AllTimeLeadersWidget />; // alias → offense
  if (widget === "leaders-offense") return <AllTimeOffensiveLeadersWidget />;
  if (widget === "leaders-pitching") return <AllTimePitchingLeadersWidget />;
  if (widget === "league-mvps") return <LeagueMvpsWidget />;
  if (widget === "all-league-multi") return <AllLeagueMultiWidget />;
  if (widget === "all-league-all") return <AllLeagueAllWidget />;
  return <PlayerPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WidgetRoot />
  </React.StrictMode>
);
