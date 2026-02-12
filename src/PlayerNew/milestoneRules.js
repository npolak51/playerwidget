// Define your stat milestone thresholds here.
// These are evaluated separately for Varsity and JV (no combining).
//
// Shape:
// {
//   id: "batting-hits-100",
//   sport: "batting" | "pitching",
//   stat: "H" | "HR" | "RBI" | "SB" | "K" | "IP" | ...,
//   threshold: number,              // for IP, use innings as a number (e.g., 50)
//   title: "100 Career Hits",
//   icon: "Star" | "Trophy" | "Target" | "Flame"
// }
//
// Example (commented):
// export const MILESTONE_RULES = [
//   { id: "batting-hits-100", sport: "batting", stat: "H", threshold: 100, title: "100 Career Hits", icon: "Star" },
//   { id: "pitching-k-100", sport: "pitching", stat: "K", threshold: 100, title: "100 Career Strikeouts", icon: "Flame" },
// ];

export const MILESTONE_RULES = [
  // Batting — Hits
  { id: "batting-hits-20", sport: "batting", stat: "H", threshold: 20, title: "20 Career Hits", icon: "Star" },
  { id: "batting-hits-30", sport: "batting", stat: "H", threshold: 30, title: "30 Career Hits", icon: "Star" },
  { id: "batting-hits-40", sport: "batting", stat: "H", threshold: 40, title: "40 Career Hits", icon: "Star" },
  { id: "batting-hits-50", sport: "batting", stat: "H", threshold: 50, title: "50 Career Hits", icon: "Star", showInAchievements: true },

  // Batting — Stolen Bases
  { id: "batting-sb-10", sport: "batting", stat: "SB", threshold: 10, title: "10 Career Stolen Bases", icon: "Target" },
  { id: "batting-sb-20", sport: "batting", stat: "SB", threshold: 20, title: "20 Career Stolen Bases", icon: "Target" },
  { id: "batting-sb-30", sport: "batting", stat: "SB", threshold: 30, title: "30 Career Stolen Bases", icon: "Target", showInAchievements: true },
  { id: "batting-sb-40", sport: "batting", stat: "SB", threshold: 40, title: "40 Career Stolen Bases", icon: "Target" },
  { id: "batting-sb-50", sport: "batting", stat: "SB", threshold: 50, title: "50 Career Stolen Bases", icon: "Target", showInAchievements: true },

  // Batting — RBI
  { id: "batting-rbi-10", sport: "batting", stat: "RBI", threshold: 10, title: "10 Career RBI", icon: "Star" },
  { id: "batting-rbi-20", sport: "batting", stat: "RBI", threshold: 20, title: "20 Career RBI", icon: "Star" },
  { id: "batting-rbi-30", sport: "batting", stat: "RBI", threshold: 30, title: "30 Career RBI", icon: "Star", showInAchievements: true },
  { id: "batting-rbi-40", sport: "batting", stat: "RBI", threshold: 40, title: "40 Career RBI", icon: "Star" },
  { id: "batting-rbi-50", sport: "batting", stat: "RBI", threshold: 50, title: "50 Career RBI", icon: "Star", showInAchievements: true },

  // Batting — Runs
  { id: "batting-r-10", sport: "batting", stat: "R", threshold: 10, title: "10 Career Runs", icon: "Star" },
  { id: "batting-r-20", sport: "batting", stat: "R", threshold: 20, title: "20 Career Runs", icon: "Star" },
  { id: "batting-r-30", sport: "batting", stat: "R", threshold: 30, title: "30 Career Runs", icon: "Star", showInAchievements: true },
  { id: "batting-r-40", sport: "batting", stat: "R", threshold: 40, title: "40 Career Runs", icon: "Star" },
  { id: "batting-r-50", sport: "batting", stat: "R", threshold: 50, title: "50 Career Runs", icon: "Star", showInAchievements: true },

  // Batting — Home Runs
  { id: "batting-hr-1", sport: "batting", stat: "HR", threshold: 1, title: "1 Career Home Run", icon: "Trophy" },
  { id: "batting-hr-5", sport: "batting", stat: "HR", threshold: 5, title: "5 Career Home Runs", icon: "Trophy", showInAchievements: true },
  { id: "batting-hr-10", sport: "batting", stat: "HR", threshold: 10, title: "10 Career Home Runs", icon: "Trophy", showInAchievements: true },

  // Batting — Extra Base Hits
  { id: "batting-xbh-10", sport: "batting", stat: "XBH", threshold: 10, title: "10 Career Extra-Base Hits", icon: "Star" },
  { id: "batting-xbh-20", sport: "batting", stat: "XBH", threshold: 20, title: "20 Career Extra-Base Hits", icon: "Star", showInAchievements: true },
  { id: "batting-xbh-30", sport: "batting", stat: "XBH", threshold: 30, title: "30 Career Extra-Base Hits", icon: "Star" },
  { id: "batting-xbh-40", sport: "batting", stat: "XBH", threshold: 40, title: "40 Career Extra-Base Hits", icon: "Star", showInAchievements: true },
  { id: "batting-xbh-50", sport: "batting", stat: "XBH", threshold: 50, title: "50 Career Extra-Base Hits", icon: "Star", showInAchievements: true },

  // Pitching — Strikeouts
  { id: "pitching-k-50", sport: "pitching", stat: "K", threshold: 50, title: "50 Career Strikeouts", icon: "Flame", showInAchievements: true },
  { id: "pitching-k-75", sport: "pitching", stat: "K", threshold: 75, title: "75 Career Strikeouts", icon: "Flame" },
  { id: "pitching-k-100", sport: "pitching", stat: "K", threshold: 100, title: "100 Career Strikeouts", icon: "Flame", showInAchievements: true },
  { id: "pitching-k-125", sport: "pitching", stat: "K", threshold: 125, title: "125 Career Strikeouts", icon: "Flame" },
  { id: "pitching-k-150", sport: "pitching", stat: "K", threshold: 150, title: "150 Career Strikeouts", icon: "Flame", showInAchievements: true },
  { id: "pitching-k-175", sport: "pitching", stat: "K", threshold: 175, title: "175 Career Strikeouts", icon: "Flame" },
  { id: "pitching-k-200", sport: "pitching", stat: "K", threshold: 200, title: "200 Career Strikeouts", icon: "Flame", showInAchievements: true },
  { id: "pitching-k-225", sport: "pitching", stat: "K", threshold: 225, title: "225 Career Strikeouts", icon: "Flame" },
  { id: "pitching-k-250", sport: "pitching", stat: "K", threshold: 250, title: "250 Career Strikeouts", icon: "Flame", showInAchievements: true },
];

