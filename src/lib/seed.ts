import type { DashboardWidget, Session, Tag } from "../types";

const now = new Date().toISOString();

// The ONLY place tag names appear in the codebase.
export const seedTags: Tag[] = [
  { id: "tag-gym", name: "Gym", color: "#ff5fb0", icon: "dumbbell", parentId: null, weeklyGoalSec: 5 * 3600, createdAt: now },
  { id: "tag-work", name: "Work", color: "#ffa530", icon: "laptop", parentId: null, weeklyGoalSec: 40 * 3600, createdAt: now },
  { id: "tag-code", name: "Code", color: "#10d97c", icon: "code", parentId: null, weeklyGoalSec: 6 * 3600, createdAt: now },
  { id: "tag-school", name: "School", color: "#f0d52a", icon: "school", parentId: null, createdAt: now },
  { id: "tag-school-1", name: "Subject #1", color: "#f0d52a", icon: "book", parentId: "tag-school", createdAt: now },
  { id: "tag-school-2", name: "Subject #2", color: "#f0d52a", icon: "book", parentId: "tag-school", createdAt: now },
  { id: "tag-school-3", name: "Subject #3", color: "#f0d52a", icon: "book", parentId: "tag-school", createdAt: now },
  { id: "tag-school-4", name: "Subject #4", color: "#f0d52a", icon: "book", parentId: "tag-school", createdAt: now },
];

export const TAG_COLORS = [
  "#ff5fb0", "#ffa530", "#10d97c", "#f0d52a", "#3b82f6", "#8f94fb",
  "#ef4444", "#14b8a6", "#a855f7", "#78716c",
];

/** Demo sessions, placed relative to now so every history range has data on first run. */
export function seedSessions(now: Date = new Date()): Session[] {
  // [days ago, start hour, minutes, tag id, title]
  const demo: [number, number, number, string | null, string][] = [
    [0, 8, 50, "tag-code", "Morning coding"],
    [1, 9, 120, "tag-work", "Project work"],
    [2, 18, 45, "tag-gym", "Workout"],
    [3, 10, 90, "tag-school-1", "Study session"],
    [8, 14, 60, "tag-school-2", "Reading notes"],
    [9, 19, 30, null, "Dinner Time"],
    [10, 9, 150, "tag-work", "Client calls"],
  ];
  return demo.map(([daysAgo, hour, mins, tagId, title], i) => {
    const start = new Date(now);
    start.setDate(start.getDate() - daysAgo);
    start.setHours(hour, 0, 0, 0);
    return {
      id: `seed-session-${i + 1}`,
      title,
      tagId,
      startedAt: start.toISOString(),
      endedAt: new Date(start.getTime() + mins * 60000).toISOString(),
      source: "manual",
    };
  });
}

/** Default Home layout, in display order. Tag stat cards point at seed tags by id. */
export const seedDashboard: DashboardWidget[] = [
  { id: "w-greeting", type: "greeting" },
  { id: "w-stat-work", type: "tagStat", config: { tagId: "tag-work" } },
  { id: "w-stat-gym", type: "tagStat", config: { tagId: "tag-gym" } },
  { id: "w-stat-code", type: "tagStat", config: { tagId: "tag-code" } },
  { id: "w-add-tag", type: "addTag" },
  { id: "w-time-tracker", type: "timeTracker" },
  { id: "w-clock", type: "clock" },
  { id: "w-calendar", type: "calendar" },
];
