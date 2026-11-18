import { useMemo, useState } from "react";
import SessionEditor from "../components/SessionEditor";
import SessionRow from "../components/SessionRow";
import TagPicker from "../components/TagPicker";
import { durationSec, totalByDay } from "../lib/aggregate";
import { formatClock, formatDayLabel, formatDuration } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import type { Session } from "../types";

export default function TimeTracker() {
  const { sessions, startSession, stopSession, updateSession, addSession, deleteSession } = useSessionStore();
  const running = sessions.find((s) => s.endedAt === null) ?? null;
  const now = useNow(running !== null);
  const days = useMemo(() => totalByDay(sessions, now), [sessions, now]);

  // Entry-row draft, used only while nothing is running.
  const [title, setTitle] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState(false);

  const patch = (s: Session, change: Partial<Pick<Session, "title" | "tagId">>) =>
    updateSession(s.id, { title: s.title, tagId: s.tagId, startedAt: s.startedAt, endedAt: s.endedAt, ...change });

  const toggleEntry = () => {
    if (running) return stopSession();
    startSession(title, tagId);
    setTitle("");
    setTagId(null);
  };

  const remove = (s: Session) => {
    if (window.confirm(`Delete "${s.title || "Untitled session"}"?`)) deleteSession(s.id);
  };

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Time Tracker</h1>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
        <TagPicker
          tagId={running ? running.tagId : tagId}
          onChange={(id) => (running ? patch(running, { tagId: id }) : setTagId(id))}
          emptyColor="#8f94fb"
          emptyIcon="tag"
        />
        <input
          value={running ? running.title : title}
          onChange={(e) => (running ? patch(running, { title: e.target.value }) : setTitle(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && !running && toggleEntry()}
          placeholder="Enter your session's title here"
          aria-label="Session title"
          className="min-w-[10rem] flex-1 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <span className="whitespace-nowrap text-sm tabular-nums text-ink/80">
          {running ? `${formatClock(running.startedAt)} - now` : "00:00:00 am - 00:00:00 pm"}
        </span>
        <span data-testid="elapsed" className="w-20 border-l border-ink/60 pl-4 text-right text-base tabular-nums">
          {formatDuration(running ? durationSec(running, now) : 0)}
        </span>
        <button
          onClick={toggleEntry}
          aria-label={running ? "Stop timer" : "Start timer"}
          className="flex h-8 w-24 items-center justify-center rounded-xl bg-primary text-white shadow-[0_3px_0_#2563eb]"
        >
          {running ? "■" : "▶"}
        </button>
        <div>
          <button aria-label="Entry options" onClick={() => setMenu((m) => !m)} className="px-1 text-xl leading-none">
            ⋮
          </button>
          {menu && (
            <div className="absolute right-3 top-12 z-10 w-40 overflow-hidden rounded-xl border bg-surface text-sm shadow-lg">
              <button
                className="block w-full px-3 py-2 text-left hover:bg-sidebar"
                onClick={() => { setMenu(false); setAdding(true); }}
              >
                Add manual entry
              </button>
            </div>
          )}
        </div>
      </div>

      {days.length === 0 && <p className="mt-10 text-sm text-accent">No sessions yet. Start the timer above.</p>}

      {days.map((d) => (
        <section key={d.day} className="mt-8">
          <div className="flex justify-between rounded-sm bg-panel px-3 py-1 text-xs">
            <span>{formatDayLabel(d.day)}</span>
            <span>
              Total: <span className="ml-2 tabular-nums">{formatDuration(d.totalSec)}</span>
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {d.sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                now={now}
                onTitle={(t) => patch(s, { title: t })}
                onTag={(id) => patch(s, { tagId: id })}
                onToggle={() => (s.endedAt === null ? stopSession() : startSession(s.title, s.tagId))}
                onEdit={() => setEditing(s)}
                onDelete={() => remove(s)}
              />
            ))}
          </div>
        </section>
      ))}

      {editing && (
        <SessionEditor session={editing} onSave={(i) => updateSession(editing.id, i)} onClose={() => setEditing(null)} />
      )}
      {adding && <SessionEditor session={null} onSave={addSession} onClose={() => setAdding(false)} />}
    </div>
  );
}
