import React from "react";
import ReactDOM from "react-dom/client";
import PlayerPage from "./Player/PlayerPage";
import RosterMenuWidget from "./Player/RosterMenuWidget";
import StatWidget from "./Player/StatWidget";
import "./index.css";

function WidgetRoot() {
  const params = new URLSearchParams(window.location.search);
  const widget = params.get("widget");

  if (widget === "menu") return <RosterMenuWidget />;
  if (widget === "stats") return <StatWidget />;
  return <PlayerPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WidgetRoot />
  </React.StrictMode>
);
