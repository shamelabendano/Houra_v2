import { load, save } from "./storage";
import type { DashboardWidget, Session, Settings, Tag } from "../types";

export const BACKUP_VERSION = 1;

/** Everything the app persists, in one portable file. */
export interface Backup {
  app: "houra";
  version: number;
  exportedAt: string;
  tags: Tag[];
  sessions: Session[];
  settings: Partial<Settings>;
  dashboard: DashboardWidget[] | null; // null = leave the dashboard layout alone
}

export type ImportMode = "merge" | "replace";

export interface ImportSummary {
  tagsAdded: number;
  sessionsAdded: number;
  skipped: number; // invalid or duplicate records that were not imported
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isIso = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(new Date(v).getTime());

function isTag(v: unknown): v is Tag {
  return (
    isObj(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.color === "string" &&
    typeof v.icon === "string" &&
    (v.parentId === null || typeof v.parentId === "string")
  );
}

function isSession(v: unknown): v is Session {
  return (
    isObj(v) &&
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    (v.tagId === null || typeof v.tagId === "string") &&
    isIso(v.startedAt) &&
    (v.endedAt === null || isIso(v.endedAt)) &&
    (v.source === "timer" || v.source === "pomodoro" || v.source === "manual")
  );
}

/** Reads the current data from storage (the only path to localStorage is lib/storage). */
export function buildBackup(): Backup {
  return {
    app: "houra",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tags: load<Tag[]>("tags", []),
    sessions: load<Session[]>("sessions", []),
    settings: load<Partial<Settings>>("settings", {}),
    dashboard: load<DashboardWidget[] | null>("dashboard", null),
  };
}

export function backupFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `houra-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

export type ParseResult = { ok: true; backup: Backup; skipped: number } | { ok: false; error: string };

/** Validates file text. Invalid records are dropped and counted instead of failing the whole import. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  if (!isObj(raw) || raw.app !== "houra") return { ok: false, error: "That file is not a Houra backup." };
  if (typeof raw.version !== "number" || raw.version > BACKUP_VERSION) {
    return { ok: false, error: "This backup was made by a newer version of Houra." };
  }
  if (!Array.isArray(raw.tags) || !Array.isArray(raw.sessions)) {
    return { ok: false, error: "The backup is missing its tags or sessions." };
  }
  const tags = raw.tags.filter(isTag);
  const sessions = raw.sessions.filter(isSession);
  const skipped = raw.tags.length - tags.length + (raw.sessions.length - sessions.length);
  return {
    ok: true,
    skipped,
    backup: {
      app: "houra",
      version: raw.version,
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : "",
      tags,
      sessions,
      settings: isObj(raw.settings) ? (raw.settings as Partial<Settings>) : {},
      dashboard: Array.isArray(raw.dashboard) ? (raw.dashboard as DashboardWidget[]) : null,
    },
  };
}

/**
 * Writes the backup into storage. "merge" keeps everything already here and adds records whose id is new;
 * "replace" overwrites it all. Callers reload afterwards so every store re-reads storage.
 */
export function applyBackup(backup: Backup, mode: ImportMode, skippedInvalid = 0): ImportSummary {
  const tags = load<Tag[]>("tags", []);
  const sessions = load<Session[]>("sessions", []);

  if (mode === "replace") {
    save("tags", backup.tags);
    save("sessions", backup.sessions);
    save("settings", backup.settings);
    if (backup.dashboard) save("dashboard", backup.dashboard);
    return { tagsAdded: backup.tags.length, sessionsAdded: backup.sessions.length, skipped: skippedInvalid };
  }

  const tagIds = new Set(tags.map((t) => t.id));
  const sessionIds = new Set(sessions.map((s) => s.id));
  const newTags = backup.tags.filter((t) => !tagIds.has(t.id));
  const newSessions = backup.sessions.filter((s) => !sessionIds.has(s.id));
  save("tags", [...tags, ...newTags]);
  save("sessions", [...sessions, ...newSessions]);
  const duplicates = backup.tags.length - newTags.length + (backup.sessions.length - newSessions.length);
  return { tagsAdded: newTags.length, sessionsAdded: newSessions.length, skipped: skippedInvalid + duplicates };
}
