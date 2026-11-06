import TagPicker from "../components/TagPicker";
import { useSettingsStore } from "../store/useSettingsStore";
import type { WidgetProps } from "./types";

/** "Add a tag" card: picking a tag inserts a tag stat card before this one. */
export default function AddTagWidget({ widget }: WidgetProps) {
  const dashboard = useSettingsStore((s) => s.dashboard);
  const addWidget = useSettingsStore((s) => s.addWidget);

  const onPick = (tagId: string | null) => {
    if (!tagId) return;
    const shown = dashboard.some((w) => w.type === "tagStat" && w.config?.tagId === tagId);
    if (!shown) addWidget({ type: "tagStat", config: { tagId } }, widget.id);
  };

  return (
    <section className="flex h-full min-h-28 flex-col justify-center gap-2 rounded-card border border-panel bg-sidebar px-3 py-2">
      <div className="flex items-center gap-2">
        <TagPicker tagId={null} onChange={onPick} emptyColor="#b9c6f5" emptyIcon="tag" />
        <span className="text-lg font-semibold text-accent/70">Add a tag</span>
      </div>
      <p className="text-center text-2xl font-bold tabular-nums text-accent/40">0:00 | 0:00</p>
    </section>
  );
}
