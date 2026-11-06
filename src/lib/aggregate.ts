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
