import { useEffect, useRef, useState } from "react";
import TagBadge from "./TagBadge";
import { formatDuration } from "../lib/format";
import type { Tag } from "../types";

interface Props {
  tag: Tag;
  totalSec: number;
  selected?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TagRow({ tag, totalSec, selected, onSelect, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div
      onClick={onSelect}
      className={`relative flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 ${
        onSelect ? "cursor-pointer" : ""
      } ${selected ? "ring-2 ring-accent" : ""}`}
      style={{ borderColor: tag.parentId ? tag.color : "var(--color-line)" }}
    >
      <TagBadge color={tag.color} icon={tag.icon} />
      <span
        className="min-w-0 flex-1 truncate rounded-lg border border-line px-3 py-1 text-sm font-bold"
        style={{ color: tag.color }}
      >
        {tag.name}
      </span>
      <span className="text-sm tabular-nums">{formatDuration(totalSec)}</span>
      <div ref={ref} onClick={(e) => e.stopPropagation()}>
        <button
          aria-label={`Menu for ${tag.name}`}
          onClick={() => setOpen((o) => !o)}
          className="px-1 text-xl leading-none text-ink"
        >
          ⋮
        </button>
        {open && (
          <div className="absolute right-3 top-12 z-10 w-28 overflow-hidden rounded-xl border bg-surface text-sm shadow-lg">
            <button
              className="block w-full px-3 py-2 text-left hover:bg-sidebar"
              onClick={() => { setOpen(false); onEdit(); }}
            >
              Edit
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-red-500 hover:bg-sidebar"
              onClick={() => { setOpen(false); onDelete(); }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
