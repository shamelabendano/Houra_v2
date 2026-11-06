import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek, subWeeks } from "date-fns";
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

export type RangePreset = "today" | "thisWeek" | "lastWeek" | "thisMonth";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Inclusive local-time range for a preset. Weeks start on Monday. */
export function rangeForPreset(preset: RangePreset, now: Date = new Date()): DateRange {
  const opts = { weekStartsOn: 1 } as const;
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "thisWeek":
      return { start: startOfWeek(now, opts), end: endOfWeek(now, opts) };
    case "lastWeek": {
      const ref = subWeeks(now, 1);
      return { start: startOfWeek(ref, opts), end: endOfWeek(ref, opts) };
    }
    case "thisMonth":
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

/** A session belongs to the range its start time falls in (same rule as totalByDay). */
export function inRange(session: Session, range: DateRange): boolean {
  const t = new Date(session.startedAt).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export interface TagChartDatum {
  key: string; // tag id, or "untagged"
  name: string;
  color: string;
  seconds: number;
}

const UNTAGGED_CHART_COLOR = "#a8a3b0";

/** Per-tag totals for charting, largest first. Sums to the total of `sessions`. */
export function tagChartData(
  sessions: Session[],
  tags: Tag[],
  now: number = Date.now(),
): TagChartDatum[] {
  return Object.entries(totalByTag(sessions, now))
    .filter(([, seconds]) => seconds > 0)
    .map(([key, seconds]) => {
      const tag = tags.find((t) => t.id === key);
      return {
        key,
        name: tag?.name ?? "Untagged",
        color: tag?.color ?? UNTAGGED_CHART_COLOR,
        seconds,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);
}

/** Sum of all session durations. */
export function totalSec(sessions: Session[], now: number = Date.now()): number {
  return sessions.reduce((sum, s) => sum + durationSec(s, now), 0);
}

export interface GoalProgress {
  trackedSec: number;       // this week's time on the tag, including its sub-tags
  goalSec: number | null;   // null when the tag has no weekly goal
  fraction: number | null;  // trackedSec / goalSec clamped to 0..1, null without a goal
}

/** Progress of a tag (and its sub-tags) toward its weekly goal, for the current week. */
export function goalProgress(
  tagId: string,
  sessions: Session[],
  tags: Tag[],
  now: number = Date.now(),
): GoalProgress {
  const range = rangeForPreset("thisWeek", new Date(now));
  const totals = totalByTag(sessions.filter((s) => inRange(s, range)), now);
  const trackedSec = tagTreeTotalSec(tagId, tags, totals);
  const goalSec = tags.find((t) => t.id === tagId)?.weeklyGoalSec ?? null;
  const fraction = goalSec && goalSec > 0 ? Math.min(1, trackedSec / goalSec) : null;
  return { trackedSec, goalSec: goalSec && goalSec > 0 ? goalSec : null, fraction };
}
