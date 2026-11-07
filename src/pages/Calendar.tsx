import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import TagBadge from "../components/TagBadge";
import { durationSec, totalByDay } from "../lib/aggregate";
import { formatClock, formatDayLabel, formatDuration, formatHoursMinutes } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useTagStore } from "../store/useTagStore";

const WEEK = { weekStartsOn: 1 } as const; // same week start as aggregate.rangeForPreset

export default function Calendar() {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const now = useNow(sessions.some((s) => s.endedAt === null));
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const byDay = useMemo(() => new Map(totalByDay(sessions, now).map((g) => [g.day, g])), [sessions, now]);
  const days = eachDayOfInterval({ start: startOfWeek(month, WEEK), end: endOfWeek(endOfMonth(month), WEEK) });
  const group = byDay.get(selected);
  const nav = "rounded-xl bg-panel px-3 py-1 text-accent hover:opacity-80";

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Calendar</h1>

      <div className="mt-4 flex items-center gap-2">
        <button className={nav} aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>‹</button>
        <span className="min-w-36 text-center text-lg font-medium">{format(month, "MMMM yyyy")}</span>
        <button className={nav} aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>›</button>
        <button
          className="ml-2 rounded-xl bg-panel px-4 py-1 text-sm"
          onClick={() => { setMonth(startOfMonth(new Date())); setSelected(format(new Date(), "yyyy-MM-dd")); }}
        >
          Today
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-ink/60">
        {days.slice(0, 7).map((d) => <span key={d.toISOString()}>{format(d, "EEE")}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const g = byDay.get(key);
          const colors = g ? [...new Set(g.sessions.map((s) => tags.find((t) => t.id === s.tagId)?.color ?? "#a8a3b0"))] : [];
          return (
            <button
              key={key}
              data-day={key}
              data-tracked={g ? true : undefined}
              aria-pressed={selected === key}
              aria-label={`${format(d, "MMMM d")}${g ? `, ${formatHoursMinutes(g.totalSec)} tracked` : ""}`}
              onClick={() => setSelected(key)}
              className={`flex min-h-14 flex-col items-center rounded-xl border p-1 text-sm sm:min-h-20 ${
                selected === key ? "border-primary bg-panel" : "border-line/40 bg-surface"
              } ${isSameMonth(d, month) ? "" : "opacity-40"}`}
            >
              <span className={isToday(d) ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white" : ""}>
                {format(d, "d")}
              </span>
              {g && (
                <>
                  <span className="mt-1 hidden text-[11px] tabular-nums sm:block">{formatHoursMinutes(g.totalSec)}</span>
                  <span className="mt-auto flex flex-wrap justify-center gap-0.5">
                    {colors.slice(0, 4).map((c) => <i key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />)}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <section className="mt-6">
        <div className="flex justify-between rounded-sm bg-panel px-3 py-1 text-xs">
          <span data-testid="selected-day">{formatDayLabel(selected)}</span>
          <span>
            Total: <span className="ml-2 tabular-nums">{formatDuration(group?.totalSec ?? 0)}</span>
          </span>
        </div>
        {!group && <p className="mt-3 text-sm text-accent">No sessions on this day.</p>}
        <ul className="mt-3 space-y-2">
          {group?.sessions.map((s) => {
            const tag = tags.find((t) => t.id === s.tagId);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-surface px-4 py-2">
                <TagBadge color={tag?.color} icon={tag?.icon} size={30} />
                <span className="min-w-[8rem] flex-1 truncate text-sm">{s.title || "Untitled session"}</span>
                <span className="whitespace-nowrap text-sm tabular-nums">
                  {formatClock(s.startedAt)} - {s.endedAt ? formatClock(s.endedAt) : "now"}
                </span>
                <span className="w-20 text-right tabular-nums">{formatDuration(durationSec(s, now))}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
