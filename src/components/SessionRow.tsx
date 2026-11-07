import { useCallback, useRef, useState } from "react";
import TagPicker from "./TagPicker";
import { durationSec } from "../lib/aggregate";
import { formatClock, formatDuration } from "../lib/format";
import { useClickOutside } from "../lib/useClickOutside";
import type { Session } from "../types";

interface Props {
  session: Session;
  now: number;
  onTitle: (title: string) => void;
  onTag: (tagId: string | null) => void;
  /** Start the timer again (or, when this session is running, stop it). */
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SessionRow({ session, now, onTitle, onTag, onToggle, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);
  const running = session.endedAt === null;

  return (
    <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
      <TagPicker tagId={session.tagId} onChange={onTag} />
      <input
        value={session.title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Untitled session"
        aria-label="Session title"
        className="min-w-[10rem] flex-1 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <span className="whitespace-nowrap text-sm tabular-nums">
        {formatClock(session.startedAt)} - {session.endedAt ? formatClock(session.endedAt) : "now"}
      </span>
      <span className="w-20 border-l border-ink/60 pl-4 text-right text-base tabular-nums">
        {formatDuration(durationSec(session, now))}
      </span>
      <button
        onClick={onToggle}
        aria-label={running ? "Stop timer" : "Start timer again"}
        className="flex h-8 w-24 items-center justify-center rounded-xl bg-primary text-white shadow-[0_3px_0_#2563eb]"
      >
        {running ? "■" : "▶"}
      </button>
      <div ref={ref}>
        <button aria-label="Session menu" onClick={() => setOpen((o) => !o)} className="px-1 text-xl leading-none">
          ⋮
        </button>
        {open && (
          <div className="absolute right-3 top-12 z-10 w-28 overflow-hidden rounded-xl border bg-surface text-sm shadow-lg">
            <button className="block w-full px-3 py-2 text-left hover:bg-sidebar" onClick={() => { setOpen(false); onEdit(); }}>
              Edit
            </button>
            <button className="block w-full px-3 py-2 text-left text-red-500 hover:bg-sidebar" onClick={() => { setOpen(false); onDelete(); }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
