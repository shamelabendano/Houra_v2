export interface Tag {
  id: string;
  name: string;
  color: string;            // hex, drives card + icon color
  icon: string;             // icon key, e.g. "code", "dumbbell"
  parentId: string | null;  // null = top-level tag, otherwise a sub-tag
  hourlyRate?: number;      // optional, in settings.currency; sub-tags inherit parent's
  weeklyGoalSec?: number;   // optional, powers the "12:21 | 40:00" cards
  createdAt: string;        // ISO
}

export interface Session {
  id: string;
  title: string;
  tagId: string | null;     // null = untagged (grey icon, e.g. "Dinner Time")
  startedAt: string;        // ISO
  endedAt: string | null;   // null = currently running
  source: "timer" | "pomodoro" | "manual";
}

export interface Settings {
  currency: string;         // "PHP"
  theme: "light" | "dark";
}

export interface DashboardWidget {
  id: string;
  type: string;             // key into the widget registry
  config?: Record<string, unknown>; // e.g. { tagId } for a tag-stat widget
}
