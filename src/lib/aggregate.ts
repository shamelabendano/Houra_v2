import { format } from "date-fns";
import type { Session, Tag } from "../types";

/** Duration is never stored; a running session counts up to `now`. */
export function durationSec(session: Session, now: number = Date.now()): number {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : now;
  return Math.max(0, Math.round((end - start) / 1000));
}

/** Seconds per tag id (direct sessions only; untagged sessions are keyed "untagged"). */
export function totalByTag(sessions: Session[], now: number = Date.now()): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const s of sessions) {
    const key = s.tagId ?? "untagged";
    totals[key] = (totals[key] ?? 0) + durationSec(s, now);
  }
  return totals;
}

/** A tag's own time plus all of its sub-tags' time. */
export function tagTreeTotalSec(
  tagId: string,
  tags: Tag[],
  totals: Record<string, number>,
): number {
  const childIds = tags.filter((t) => t.parentId === tagId).map((t) => t.id);
  return [tagId, ...childIds].reduce((sum, id) => sum + (totals[id] ?? 0), 0);
}

export interface DayGroup {
  day: string; // local "yyyy-MM-dd" of the day the sessions started
  totalSec: number;
  sessions: Session[]; // newest first
}

/** Groups sessions by local start day (newest day first) with each day's total. */
export function totalByDay(sessions: Session[], now: number = Date.now()): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const s of sessions) {
    const day = format(new Date(s.startedAt), "yyyy-MM-dd");
    const group = groups.get(day) ?? { day, totalSec: 0, sessions: [] };
    group.totalSec += durationSec(s, now);
    group.sessions.push(s);
    groups.set(day, group);
  }
  const byStartDesc = (a: Session, b: Session) => b.startedAt.localeCompare(a.startedAt);
  return [...groups.values()]
    .map((g) => ({ ...g, sessions: g.sessions.sort(byStartDesc) }))
    .sort((a, b) => b.day.localeCompare(a.day));
}
