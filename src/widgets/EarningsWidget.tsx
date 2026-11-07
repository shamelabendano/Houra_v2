import CurrentSessionCard from "../components/CurrentSessionCard";
import WidgetCard from "../components/WidgetCard";
import { earnings, inRange, rangeForPreset } from "../lib/aggregate";
import { formatCurrency } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTagStore } from "../store/useTagStore";
import type { WidgetProps } from "./types";

/** This week's earnings plus the live current-session card. */
export default function EarningsWidget({ widget }: WidgetProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const currency = useSettingsStore((s) => s.settings.currency);
  const now = useNow(sessions.some((s) => s.endedAt === null));
  const week = sessions.filter((s) => inRange(s, rangeForPreset("thisWeek", new Date(now))));

  return (
    <WidgetCard widgetId={widget.id} title="Earnings">
      <p className="text-xs text-ink/60">This week</p>
      <p data-testid="widget-earnings-total" className="mb-3 text-3xl font-bold tabular-nums text-accent">
        {formatCurrency(earnings(week, tags, now).total, currency)}
      </p>
      <CurrentSessionCard />
    </WidgetCard>
  );
}
