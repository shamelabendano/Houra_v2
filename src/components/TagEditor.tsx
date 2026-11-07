import { useState } from "react";
import TagBadge from "./TagBadge";
import { ICON_KEYS, TAG_ICONS } from "./tagIcons";
import { effectiveRate } from "../lib/aggregate";
import { TAG_COLORS } from "../lib/seed";
import { useSettingsStore } from "../store/useSettingsStore";
import type { TagInput } from "../store/useTagStore";
import type { Tag } from "../types";

interface Props {
  /** Existing tag being edited, or null when adding. */
  tag: Tag | null;
  tags: Tag[];
  initial?: Partial<TagInput>;
  onSave: (input: TagInput) => boolean;
  onClose: () => void;
}

export default function TagEditor({ tag, tags, initial, onSave, onClose }: Props) {
  const [name, setName] = useState(tag?.name ?? initial?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? initial?.color ?? TAG_COLORS[0]);
  const [icon, setIcon] = useState(tag?.icon ?? initial?.icon ?? "tag");
  const [parentId, setParentId] = useState<string | null>(tag?.parentId ?? initial?.parentId ?? null);
  const [goalHours, setGoalHours] = useState(tag?.weeklyGoalSec ? String(tag.weeklyGoalSec / 3600) : "");
  const [rate, setRate] = useState(tag?.hourlyRate ? String(tag.hourlyRate) : "");
  const currency = useSettingsStore((s) => s.settings.currency);
  const [error, setError] = useState("");

  // Only top-level tags can be parents, and a tag that has children can't become a sub-tag.
  const hasChildren = tag ? tags.some((t) => t.parentId === tag.id) : false;
  const parents = tags.filter((t) => t.parentId === null && t.id !== tag?.id);

  // What this tag would earn if its own rate were blank (the chosen parent's rate).
  const inheritedRate = effectiveRate(tags.find((t) => t.id === parentId), tags);

  const submit =(e: React.FormEvent) => {
    e.preventDefault();
    if (onSave({
      name, color, icon, parentId,
      weeklyGoalSec: Number(goalHours) > 0 ? Math.round(Number(goalHours) * 3600) : undefined,
      hourlyRate: Number(rate) > 0 ? Number(rate) : undefined,
    })) onClose();
    else setError("Name is required and the parent must be a top-level tag.");
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-card bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-medium">{tag ? "Edit tag" : "New tag"}</h2>

        <div className="flex items-center gap-3">
          <TagBadge color={color} icon={icon} />
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-ink" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {ICON_KEYS.map((k) => (
            <button
              type="button"
              key={k}
              aria-label={`Icon ${k}`}
              onClick={() => setIcon(k)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg bg-panel text-ink ${
                icon === k ? "ring-2 ring-accent" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" width={20} height={20}>{TAG_ICONS[k]}</svg>
            </button>
          ))}
        </div>

        <label className="block text-sm">
          Parent tag
          <select
            value={parentId ?? ""}
            disabled={hasChildren}
            onChange={(e) => setParentId(e.target.value || null)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">None (top-level)</option>
            {parents.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          Weekly goal (hours, optional)
          <input
            type="number"
            min="0"
            step="0.5"
            value={goalHours}
            onChange={(e) => setGoalHours(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          Hourly rate ({currency}/hr, optional)
          <input
            type="number"
            min="0"
            step="any"
            value={rate}
            placeholder={inheritedRate > 0 ? `Inherits ${inheritedRate}` : ""}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white shadow-[0_3px_0_#2563eb]"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
