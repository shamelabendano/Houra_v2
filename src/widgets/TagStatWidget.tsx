import TagBadge from "../components/TagBadge";
import WidgetCard from "../components/WidgetCard";
import { goalProgress } from "../lib/aggregate";
import { formatHoursMinutes } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTagStore } from "../store/useTagStore";
import type { WidgetProps } from "./types";

/** This week's time on one tag against its weekly goal. config: { tagId }. */
export default function TagStatWidget({ widget }: WidgetProps) {
  const tagId = widget.config?.tagId as string | undefined;
  const tags = useTagStore((s) => s.tags);
  const sessions = useSessionStore((s) => s.sessions);
  const removeWidget = useSettingsStore((s) => s.removeWidget);
  const now = useNow(sessions.some((s) => s.endedAt === null));
  const tag = tags.find((t) => t.id === tagId);

  if (!tag) {
    return (
      <WidgetCard widgetId={widget.id}>
        <p className="text-sm text-accent">This tag was deleted.</p>
        <p className="mt-1 text-xs text-ink/60">Remove the card with ×.</p>
      </WidgetCard>
    );
  }

  const { trackedSec, goalSec, fraction } = goalProgress(tag.id, sessions, tags, now);

  return (
    <section
      className="group relative h-full overflow-hidden rounded-card border"
      style={{
        borderColor: `color-mix(in srgb, ${tag.color} 35%, white)`,
        background: `color-mix(in srgb, ${tag.color} 10%, white)`,
        color: tag.color,
      }}
    >
      <button
        onClick={() => removeWidget(widget.id)}
        aria-label={`Remove ${tag.name} card`}
        className="absolute right-2 top-1 z-[1] text-lg leading-none opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
      <div className="flex items-center gap-2 px-2 py-1.5" style={{ background: `color-mix(in srgb, ${tag.color} 25%, white)` }}>
        <TagBadge color={tag.color} icon={tag.icon} size={30} />
        <span className="truncate text-lg font-semibold">{tag.name}</span>
      </div>
      <div className="px-3 pb-2 pt-2 text-center text-2xl font-bold tabular-nums">
        {formatHoursMinutes(trackedSec)}
        {goalSec !== null && (
          <>
            <span className="mx-1 font-light opacity-60">|</span>
            {formatHoursMinutes(goalSec)}
          </>
        )}
        {goalSec === null && <p className="text-xs font-normal opacity-70">No weekly goal</p>}
      </div>
      {fraction !== null && (
        <div className="mx-3 mb-3 h-1.5 overflow-hidden rounded-full bg-white/70" aria-label="Goal progress">
          <div className="h-full rounded-full" style={{ width: `${fraction * 100}%`, background: tag.color }} />
        </div>
      )}
    </section>
  );
}
