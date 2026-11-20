import { useRef, useState } from "react";
import { addDays, format } from "date-fns";
import TagPicker from "./TagPicker";
import { fromInputValue, toInputValue } from "../lib/format";
import type { SessionInput } from "../store/useSessionStore";
import type { Session } from "../types";

/** Last date picked for a manual entry; kept so several same-day backfills in a row don't reset to today. */
let lastPickedDay: string | null = null;
const DAY_FMT = "yyyy-MM-dd";

interface Props {
  /** Session being edited, or null to add a manual entry. */
  session: Session | null;
  onSave: (input: SessionInput) => boolean;
  onClose: () => void;
  /** Prefill for a new manual entry (e.g. the entry bar's draft). */
  initialTitle?: string;
  initialTagId?: string | null;
  /** Manual entry from the entry bar: only start/end times (today); title and tag come from the bar. */
  timeOnly?: boolean;
}

export default function SessionEditor({ session, onSave, onClose, initialTitle = "", initialTagId = null, timeOnly = false }: Props) {
  const running = session !== null && session.endedAt === null;
  const [title, setTitle] = useState(session?.title ?? initialTitle);
  const [tagId, setTagId] = useState<string | null>(session ? session.tagId : initialTagId);
  const [start, setStart] = useState(
    toInputValue(session?.startedAt ?? new Date(Date.now() - 3600_000).toISOString()),
  );
  const [end, setEnd] = useState(running ? "" : toInputValue(session?.endedAt ?? new Date().toISOString()));
  const [error, setError] = useState("");

  const [startT, setStartT] = useState(start.slice(11, 16));
  const [endT, setEndT] = useState(end.slice(11, 16));
  const today = format(new Date(), DAY_FMT);
  const yesterday = format(addDays(new Date(), -1), DAY_FMT);
  const [day, setDay] = useState(lastPickedDay && lastPickedDay <= today ? lastPickedDay : today);
  const dateRef = useRef<HTMLInputElement>(null);
  const rollover = timeOnly && !!startT && !!endT && endT < startT;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeOnly) {
      if (!startT || !endT) return setError("Start and end are required.");
      const ok = onSave({
        title,
        tagId,
        startedAt: fromInputValue(`${day}T${startT}`),
        endedAt: fromInputValue(`${rollover ? format(addDays(new Date(`${day}T00:00`), 1), DAY_FMT) : day}T${endT}`),
      });
      if (ok) {
        lastPickedDay = day;
        onClose();
      } else setError("End must be after start.");
      return;
    }
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
        {!timeOnly && <div className="flex items-center gap-3">
          <TagPicker tagId={tagId} onChange={setTagId} emptyColor="#8f94fb" emptyIcon="tag" />
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>}
        {timeOnly ? (
          <>
            <div className="text-sm">
              Date
              <div className="mt-1 flex gap-2">
                {([["Today", today], ["Yesterday", yesterday]] as const).map(([label, d]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDay(d)}
                    className={`rounded-xl border px-4 py-2 text-sm ${
                      day === d ? "border-primary/50 bg-primary/10 font-medium text-primary" : "border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => (dateRef.current?.showPicker ? dateRef.current.showPicker() : dateRef.current?.focus())}
                  className={`relative rounded-xl border px-4 py-2 text-sm ${
                    day !== today && day !== yesterday ? "border-primary/50 bg-primary/10 font-medium text-primary" : "border-gray-300"
                  }`}
                >
                  📅 Pick date
                  <input
                    ref={dateRef}
                    type="date"
                    max={today}
                    value={day}
                    onChange={(e) => e.target.value && setDay(e.target.value > today ? today : e.target.value)}
                    tabIndex={-1}
                    aria-label="Pick date"
                    className="pointer-events-none absolute inset-0 opacity-0"
                  />
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-gray-100 px-4 py-3">{format(new Date(`${day}T00:00`), "EEE, MMM d, yyyy")}</div>
            </div>
            <label className="block text-sm">
              Start
              <input autoFocus type="time" value={startT} onChange={(e) => setStartT(e.target.value)} className={field} />
            </label>
            <label className="block text-sm">
              <span className="flex items-center gap-2">
                End
                {rollover && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">+1 day</span>}
              </span>
              <input type="time" value={endT} onChange={(e) => setEndT(e.target.value)} className={field} />
              <span className="mt-1 block text-xs text-gray-500">End time before start time rolls over to the next day</span>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm">
              Start
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
            </label>
            <label className="block text-sm">
              End
              <input type="datetime-local" value={end} disabled={running} onChange={(e) => setEnd(e.target.value)} className={field} />
              {running && <span className="text-xs text-accent">Still running</span>}
            </label>
          </>
        )}
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
