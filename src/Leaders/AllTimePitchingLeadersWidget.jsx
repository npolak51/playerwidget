import AllTimeLeadersWidgetBase from "./AllTimeLeadersWidgetBase";
import { pitchingStatCategories } from "./leadersData";

export default function AllTimePitchingLeadersWidget() {
  return (
    <AllTimeLeadersWidgetBase
      title="All-Time Pitching Leaders"
      categories={pitchingStatCategories}
    />
  );
}

