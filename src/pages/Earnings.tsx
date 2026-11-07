import { useMemo, useState } from "react";
import CurrentSessionCard from "../components/CurrentSessionCard";
import TagBadge from "../components/TagBadge";
import {
  earnings, effectiveRate, inRange, rangeForPreset, tagChartData,
  type RangePreset,
} from "../lib/aggregate";
import { formatCurrency, formatHoursMinutes } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTagStore } from "../store/useTagStore";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
];

export default function Earnings() {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const currency = useSettingsStore((s) => s.settings.currency);
  const [preset, setPreset] = useState<RangePreset>("thisWeek");
  const now = useNow(sessions.some((s) => s.endedAt === null));

  const { rows, total } = useMemo(() => {
    const scoped = sessions.filter((s) => inRange(s, rangeForPreset(preset, new Date(now))));
    const result = earnings(scoped, tags, now);
    return {
      total: result.total,
      rows: tagChartData(scoped, tags, now).map((d) => ({
        ...d,
        rate: effectiveRate(tags.find((t) => t.id === d.key), tags),
        amount: result.byTag[d.key] ?? 0,
      })),
    };
  }, [sessions, tags, preset, now]);

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Earnings</h1>

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
          Total: <span data-testid="range-earnings" className="ml-2 tabular-nums">{formatCurrency(total, currency)}</span>
        </span>
      </div>

      <div className="mt-6">
        <CurrentSessionCard />
      </div>

      <section className="mt-6 rounded-xl bg-panel p-4">
        <h2 className="mb-3 text-lg">Earnings by tag</h2>
        {rows.length === 0 && <p className="text-sm text-accent">No time tracked in this range.</p>}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key} data-testid="earnings-row" className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-2">
              <TagBadge color={tags.find((t) => t.id === r.key)?.color} icon={tags.find((t) => t.id === r.key)?.icon} size={30} />
              <span className="flex-1 truncate text-sm">{r.name}</span>
              <span className="text-sm tabular-nums text-ink/60">{formatHoursMinutes(r.seconds)}</span>
              <span className="w-28 text-right text-xs text-ink/60">
                {r.rate > 0 ? `${formatCurrency(r.rate, currency)}/hr` : "No rate"}
              </span>
              <span className="w-28 text-right tabular-nums">{formatCurrency(r.amount, currency)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
