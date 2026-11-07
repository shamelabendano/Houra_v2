import { useCallback, useRef, useState } from "react";
import TagBadge from "./TagBadge";
import { useClickOutside } from "../lib/useClickOutside";
import { useTagStore } from "../store/useTagStore";

interface Props {
  tagId: string | null;
  onChange: (tagId: string | null) => void;
  /** Badge shown when no tag is chosen. */
  emptyColor?: string;
  emptyIcon?: string;
}

/** Dropdown of every tag in the store (sub-tags nested under their parent). */
export default function TagPicker({ tagId, onChange, emptyColor, emptyIcon }: Props) {
  const tags = useTagStore((s) => s.tags);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);

  const current = tags.find((t) => t.id === tagId);
  const ordered = tags
    .filter((t) => t.parentId === null)
    .flatMap((p) => [p, ...tags.filter((t) => t.parentId === p.id)]);

  const pick = (id: string | null) => {
    setOpen(false);
    onChange(id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Choose tag"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <TagBadge color={current?.color ?? emptyColor} icon={current?.icon ?? emptyIcon} />
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 top-11 z-10 max-h-64 w-52 overflow-auto rounded-xl border bg-surface py-1 text-sm shadow-lg">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!current}
              onClick={() => pick(null)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-sidebar"
            >
              <TagBadge size={22} />
              No tag
            </button>
          </li>
          {ordered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={t.id === current?.id}
                onClick={() => pick(t.id)}
                className={`flex w-full items-center gap-2 py-1.5 pr-3 text-left hover:bg-sidebar ${t.parentId ? "pl-7" : "pl-3"}`}
              >
                <TagBadge color={t.color} icon={t.icon} size={22} />
                <span className="truncate">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
