import { useMemo, useState } from "react";
import TagBadge from "../components/TagBadge";
import TimeByTagChart from "../components/TimeByTagChart";
import {
  durationSec, inRange, rangeForPreset, tagChartData, totalByDay, totalSec,
  type RangePreset,
} from "../lib/aggregate";
import { formatClock, formatDayLabel, formatDuration } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useTagStore } from "../store/useTagStore";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
];

export default function ProgressHistory() {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const [preset, setPreset] = useState<RangePreset>("thisWeek");
  const running = sessions.some((s) => s.endedAt === null);
  const now = useNow(running);

  const { days, chart, total } = useMemo(() => {
    const range = rangeForPreset(preset, new Date(now));
    const scoped = sessions.filter((s) => inRange(s, range));
    return {
      days: totalByDay(scoped, now),
      chart: tagChartData(scoped, tags, now),
      total: totalSec(scoped, now),
    };
  }, [sessions, tags, preset, now]);

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Progress History</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            aria-pressed={preset === p.value}
            className={`rounded-xl px-4 py-1.5 text-sm ${
              preset === p.value ? "bg-primary text-white shadow-[0_3px_0_#2563eb]" : "bg-panel text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-sm">
          Total: <span data-testid="range-total" className="ml-2 tabular-nums">{formatDuration(total)}</span>
        </span>
      </div>

      <section className="mt-6 rounded-xl bg-panel p-4">
        <h2 className="mb-2 text-lg">Time by tag</h2>
        <TimeByTagChart data={chart} />
      </section>

      {days.length === 0 && <p className="mt-8 text-sm text-accent">No sessions in this range.</p>}

      {days.map((d) => (
        <section key={d.day} className="mt-8">
          <div className="flex justify-between rounded-sm bg-panel px-3 py-1 text-xs">
            <span>{formatDayLabel(d.day)}</span>
            <span>
              Total: <span className="ml-2 tabular-nums">{formatDuration(d.totalSec)}</span>
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {d.sessions.map((s) => {
              const tag = tags.find((t) => t.id === s.tagId);
              return (
                <li key={s.id} className="flex items-center gap-4 rounded-xl border border-[#9b9aa3] bg-white px-4 py-2">
                  <TagBadge color={tag?.color} icon={tag?.icon} size={30} />
                  <span className="flex-1 truncate text-sm">{s.title || "Untitled session"}</span>
                  <span className="whitespace-nowrap text-sm tabular-nums">
                    {formatClock(s.startedAt)} - {s.endedAt ? formatClock(s.endedAt) : "now"}
                  </span>
                  <span className="w-20 text-right tabular-nums">{formatDuration(durationSec(s, now))}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
