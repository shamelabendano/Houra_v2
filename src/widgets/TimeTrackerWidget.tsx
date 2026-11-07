import { useState } from "react";
import { Link } from "react-router-dom";
import SessionEditor from "../components/SessionEditor";
import SessionRow from "../components/SessionRow";
import TagPicker from "../components/TagPicker";
import WidgetCard from "../components/WidgetCard";
import { durationSec } from "../lib/aggregate";
import { formatDuration } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import type { Session } from "../types";
import type { WidgetProps } from "./types";

const RECENT = 3;

/** Compact timer: entry row plus the latest few sessions. */
export default function TimeTrackerWidget({ widget }: WidgetProps) {
  const { sessions, startSession, stopSession, updateSession, deleteSession } = useSessionStore();
  const running = sessions.find((s) => s.endedAt === null) ?? null;
  const now = useNow(running !== null);
  const [title, setTitle] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);

  const recent = [...sessions]
    .filter((s) => s.id !== running?.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, RECENT);

  const patch = (s: Session, change: Partial<Pick<Session, "title" | "tagId">>) =>
    updateSession(s.id, { title: s.title, tagId: s.tagId, startedAt: s.startedAt, endedAt: s.endedAt, ...change });

  const toggle = () => {
    if (running) return stopSession();
    startSession(title, tagId);
    setTitle("");
    setTagId(null);
  };

  const remove = (s: Session) => {
    if (window.confirm(`Delete "${s.title || "Untitled session"}"?`)) deleteSession(s.id);
  };

  return (
    <WidgetCard widgetId={widget.id} title="Time Tracker">
      <Link to="/time-tracker" className="absolute right-8 top-4 text-xs text-accent hover:underline">View all</Link>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-3 py-2">
        <TagPicker
          tagId={running ? running.tagId : tagId}
          onChange={(id) => (running ? patch(running, { tagId: id }) : setTagId(id))}
          emptyColor="#8f94fb"
          emptyIcon="tag"
        />
        <input
          value={running ? running.title : title}
          onChange={(e) => (running ? patch(running, { title: e.target.value }) : setTitle(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && !running && toggle()}
          placeholder="Enter your session's title here"
          aria-label="Session title"
          className="min-w-[8rem] flex-1 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <span className="w-20 border-l border-ink/60 pl-3 text-right tabular-nums">
          {formatDuration(running ? durationSec(running, now) : 0)}
        </span>
        <button
          onClick={toggle}
          aria-label={running ? "Stop timer" : "Start timer"}
          className="flex h-8 w-16 items-center justify-center rounded-xl bg-primary text-white shadow-[0_3px_0_#2563eb]"
        >
          {running ? "■" : "▶"}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {recent.length === 0 && <p className="text-sm text-accent">No sessions yet.</p>}
        {recent.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            now={now}
            onTitle={(t) => patch(s, { title: t })}
            onTag={(id) => patch(s, { tagId: id })}
            onToggle={() => startSession(s.title, s.tagId)}
            onEdit={() => setEditing(s)}
            onDelete={() => remove(s)}
          />
        ))}
      </div>
      {editing && (
        <SessionEditor session={editing} onSave={(i) => updateSession(editing.id, i)} onClose={() => setEditing(null)} />
      )}
    </WidgetCard>
  );
}
