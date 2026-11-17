import { addDays, addWeeks, eachDayOfInterval, endOfWeek, format, isToday, startOfDay, startOfWeek } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { daySegments, durationSec } from "../lib/aggregate";
import { formatClock, formatDuration } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useTagStore } from "../store/useTagStore";

const WEEK = { weekStartsOn: 1 } as const; // same week start as aggregate.rangeForPreset
const HOUR_PX = 48;
const UNTAGGED_COLOR = "#a8a3b0";
const HOURS = Array.from({ length: 24 }, (_, h) => h);

type View = "day" | "week";

/** Google-Calendar-style time grid: a 24h vertical axis with one column per day. */
export default function Calendar() {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const running = sessions.some((s) => s.endedAt === null);
  const now = useNow(running);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const scroller = useRef<HTMLDivElement>(null);

  const days = useMemo(
    () =>
      view === "day"
        ? [anchor]
        : eachDayOfInterval({ start: startOfWeek(anchor, WEEK), end: endOfWeek(anchor, WEEK) }),
    [view, anchor],
  );
  const step = (dir: 1 | -1) => setAnchor(view === "day" ? addDays(anchor, dir) : addWeeks(anchor, dir));
  const title =
    view === "day"
      ? format(anchor, "EEEE, MMMM d, yyyy")
      : `${format(days[0], "MMM d")} – ${format(days[6], "MMM d, yyyy")}`;

  // Open near the current time (so recent sessions are in view), else the working day.
  useEffect(() => {
    const showsToday = days.some((d) => isToday(d));
    const hour = showsToday ? Math.max(0, new Date().getHours() - 3) : 7;
    scroller.current?.scrollTo({ top: hour * HOUR_PX });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchor]);

  const btn = "rounded-xl bg-panel px-3 py-1 text-accent hover:opacity-80";
  const cols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };
  const nowMin = (now - startOfDay(now).getTime()) / 60_000;
  const line = "rgb(75 69 83 / 0.1)";

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Calendar</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className={btn} aria-label="Previous" onClick={() => step(-1)}>‹</button>
        <button className={btn} aria-label="Next" onClick={() => step(1)}>›</button>
        <button className="rounded-xl bg-panel px-4 py-1 text-sm" onClick={() => setAnchor(startOfDay(new Date()))}>
          Today
        </button>
        <span className="ml-2 text-lg font-medium" data-testid="calendar-title">{title}</span>
        <span className="ml-auto flex overflow-hidden rounded-xl bg-panel text-sm">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`px-4 py-1 capitalize ${view === v ? "bg-primary text-white" : "text-ink"}`}
            >
              {v}
            </button>
          ))}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-white">
        {/* Day headers */}
        <div className="grid border-b border-ink/10 bg-sidebar" style={cols}>
          <span />
          {days.map((d) => (
            <button
              key={d.toISOString()}
              onClick={() => { setAnchor(startOfDay(d)); setView("day"); }}
              className="py-2 text-center text-xs text-ink/70 hover:bg-panel"
            >
              <span className="block uppercase">{format(d, "EEE")}</span>
              <span
                className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-base ${
                  isToday(d) ? "bg-primary font-semibold text-white" : "text-ink"
                }`}
              >
                {format(d, "d")}
              </span>
            </button>
          ))}
        </div>

        {/* Scrollable 24h grid */}
        <div ref={scroller} className="max-h-[calc(100vh-16rem)] min-h-[20rem] overflow-y-auto">
          <div className="relative grid" style={{ ...cols, height: 24 * HOUR_PX }}>
            <div className="relative">
              {HOURS.slice(1).map((h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-ink/50"
                  style={{ top: h * HOUR_PX }}
                >
                  {format(new Date(2000, 0, 1, h), "h a")}
                </span>
              ))}
            </div>

            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const segs = daySegments(sessions, d, now);
              return (
                <div
                  key={key}
                  data-day={key}
                  className="relative border-l border-ink/10"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, ${line} ${HOUR_PX - 1}px, ${line} ${HOUR_PX}px)`,
                  }}
                >
                  {segs.map((seg) => {
                    const s = seg.session;
                    const tag = tags.find((t) => t.id === s.tagId);
                    const color = tag?.color ?? UNTAGGED_COLOR;
                    const height = Math.max(((seg.endMin - seg.startMin) / 60) * HOUR_PX, 14);
                    const range = `${formatClock(s.startedAt)} - ${s.endedAt ? formatClock(s.endedAt) : "now"}`;
                    return (
                      <div
                        key={s.id}
                        data-session={s.id}
                        title={`${s.title || "Untitled session"}${tag ? ` · ${tag.name}` : ""}\n${range} (${formatDuration(durationSec(s, now))})`}
                        className="absolute overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-sm"
                        style={{
                          top: (seg.startMin / 60) * HOUR_PX,
                          height,
                          left: `calc(${(seg.lane / seg.lanes) * 100}% + 1px)`,
                          width: `calc(${100 / seg.lanes}% - 3px)`,
                          background: color,
                          borderLeft: `3px solid color-mix(in srgb, ${color} 70%, black)`,
                        }}
                      >
                        <span className="block truncate font-medium">{s.title || tag?.name || "Untitled session"}</span>
                        {height >= 32 && (
                          <span className="block truncate opacity-90">
                            {formatClock(s.startedAt)}{tag ? ` · ${tag.name}` : ""}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {isToday(d) && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500"
                      style={{ top: (nowMin / 60) * HOUR_PX }}
                    >
                      <i className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
