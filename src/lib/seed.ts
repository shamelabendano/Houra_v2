import type { Tag } from "../types";

const now = new Date().toISOString();

// The ONLY place tag names appear in the codebase.
export const seedTags: Tag[] = [
  { id: "tag-gym", name: "Gym", color: "#ff5fb0", icon: "dumbbell", parentId: null, createdAt: now },
  { id: "tag-work", name: "Work", color: "#ffa530", icon: "laptop", parentId: null, createdAt: now },
  { id: "tag-code", name: "Code", color: "#10d97c", icon: "code", parentId: null, createdAt: now },
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
