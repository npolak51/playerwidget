import AllTimeLeadersWidgetBase from "./AllTimeLeadersWidgetBase";
import { offensiveStatCategories } from "./leadersData";

export default function AllTimeOffensiveLeadersWidget() {
  return (
    <AllTimeLeadersWidgetBase
      title="All-Time Offensive Leaders"
      categories={offensiveStatCategories}
    />
  );
}

