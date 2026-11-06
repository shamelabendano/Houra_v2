import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import WidgetCard from "../components/WidgetCard";
import { totalByDay } from "../lib/aggregate";
import { useSessionStore } from "../store/useSessionStore";
import type { WidgetProps } from "./types";

const WEEK = { weekStartsOn: 1 } as const; // same week start as aggregate.rangeForPreset

/** Month grid; days that have tracked sessions get a dot. */
export default function CalendarWidget({ widget }: WidgetProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const trackedDays = useMemo(() => new Set(totalByDay(sessions).map((g) => g.day)), [sessions]);
  const days = eachDayOfInterval({ start: startOfWeek(month, WEEK), end: endOfWeek(endOfMonth(month), WEEK) });
  const nav = "rounded px-2 text-accent hover:bg-panel";

  return (
    <WidgetCard widgetId={widget.id} title="Calendar">
      <div className="mx-auto max-w-[17rem]">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{format(month, "MMMM yyyy")}</span>
          <span>
            <button className={nav} aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>‹</button>
            <button className={nav} aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>›</button>
          </span>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-ink/60">
          {days.slice(0, 7).map((d) => <span key={d.toISOString()} className="py-1">{format(d, "EEEEEE")}</span>)}
        </div>
        <div className="grid grid-cols-7 text-center text-xs">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const tracked = trackedDays.has(key);
            return (
              <span
                key={key}
                data-day={key}
                data-tracked={tracked || undefined}
                className={`relative m-0.5 flex h-7 items-center justify-center rounded-full ${
                  isToday(d) ? "bg-primary font-semibold text-white" : isSameMonth(d, month) ? "" : "text-ink/30"
                }`}
              >
                {format(d, "d")}
                {tracked && <i className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isToday(d) ? "bg-white" : "bg-accent"}`} />}
              </span>
            );
          })}
        </div>
      </div>
    </WidgetCard>
  );
}
