import WidgetCard from "../components/WidgetCard";
import { inRange, rangeForPreset, totalSec } from "../lib/aggregate";
import { formatDuration } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import type { WidgetProps } from "./types";

/** Everything tracked today, running session included. */
export default function TodayTotalWidget({ widget }: WidgetProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const now = useNow(sessions.some((s) => s.endedAt === null));
  const today = sessions.filter((s) => inRange(s, rangeForPreset("today", new Date(now))));

  return (
    <WidgetCard widgetId={widget.id} title="Today">
      <p data-testid="today-total" className="text-center text-3xl font-bold tabular-nums text-accent">
        {formatDuration(totalSec(today, now))}
      </p>
    </WidgetCard>
  );
}
