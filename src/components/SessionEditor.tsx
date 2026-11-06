import { useState } from "react";
import TagPicker from "./TagPicker";
import { fromInputValue, toInputValue } from "../lib/format";
import type { SessionInput } from "../store/useSessionStore";
import type { Session } from "../types";

interface Props {
  /** Session being edited, or null to add a manual entry. */
  session: Session | null;
  onSave: (input: SessionInput) => boolean;
  onClose: () => void;
}

export default function SessionEditor({ session, onSave, onClose }: Props) {
  const running = session !== null && session.endedAt === null;
  const [title, setTitle] = useState(session?.title ?? "");
  const [tagId, setTagId] = useState<string | null>(session?.tagId ?? null);
  const [start, setStart] = useState(
    toInputValue(session?.startedAt ?? new Date(Date.now() - 3600_000).toISOString()),
  );
  const [end, setEnd] = useState(running ? "" : toInputValue(session?.endedAt ?? new Date().toISOString()));
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || (!running && !end)) return setError("Start and end are required.");
    const ok = onSave({
      title,
      tagId,
      startedAt: fromInputValue(start),
      endedAt: running ? null : fromInputValue(end),
    });
    if (ok) onClose();
    else setError(running ? "Start must be in the past." : "End must be after start.");
  };

  const field = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-card bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-medium">{session ? "Edit session" : "Add session"}</h2>
        <div className="flex items-center gap-3">
          <TagPicker tagId={tagId} onChange={setTagId} emptyColor="#8f94fb" emptyIcon="tag" />
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <label className="block text-sm">
          Start
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
        </label>
        <label className="block text-sm">
          End
          <input type="datetime-local" value={end} disabled={running} onChange={(e) => setEnd(e.target.value)} className={field} />
          {running && <span className="text-xs text-accent">Still running</span>}
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
