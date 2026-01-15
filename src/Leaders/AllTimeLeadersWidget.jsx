import AllTimeOffensiveLeadersWidget from "./AllTimeOffensiveLeadersWidget";

// Backwards-compatible alias: `?widget=leaders` renders the offensive widget.
export default function AllTimeLeadersWidget() {
  return <AllTimeOffensiveLeadersWidget />;
}

