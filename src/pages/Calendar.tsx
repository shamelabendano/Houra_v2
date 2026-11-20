import { addDays, addMinutes, addWeeks, eachDayOfInterval, endOfWeek, format, isToday, startOfDay, startOfWeek } from "date-fns";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { daySegments, durationSec } from "../lib/aggregate";
import { formatClock, formatDuration } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useTagStore } from "../store/useTagStore";
import type { Session } from "../types";

const WEEK = { weekStartsOn: 1 } as const; // same week start as aggregate.rangeForPreset
const BASE_HOUR_PX = 48;
/** Blocks shorter than this (~1h at the base zoom) don't render a separate end-time line. */
const END_TIME_MIN_HEIGHT_PX = 56;
const UNTAGGED_COLOR = "#a8a3b0";
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const SNAP_MIN = 15;
const DRAG_THRESHOLD_PX = 8; // small hand wobbles don't count as a drag
const UNDO_MS = 6000;
const UNDO_LIMIT = 20;

/** One undoable calendar edit: the session as it was before. */
interface UndoEntry {
  label: string;
  prev: Session;
}

type View = "day" | "week";

/** Live drag state: the whole session moves by shiftMin minutes (can cross midnight into other days). */
interface Drag {
  id: string;
  shiftMin: number;
}

/** Fixed facts captured at pointer-down (bounds keep the block inside the visible grid). */
interface DragStart {
  x0: number;
  y0: number;
  scroll0: number; // grid scrollTop at pointer-down
  colW: number;
  hourPx: number;
  minShift: number; // keeps the session inside the visible days
  maxShift: number;
  moved: boolean;
  shiftMin: number;
}

/** Live resize state: one edge of a session moves by dMin minutes. */
interface Resize {
  id: string;
  edge: "start" | "end";
  dMin: number;
}

interface ResizeStart {
  y0: number;
  hourPx: number;
  minMin: number;
  maxMin: number;
  dMin: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** A new time block being filled in after clicking an empty spot on the grid. */
interface Draft {
  day: Date;
  title: string;
  tagId: string;
  start: string; // "HH:mm"
  end: string;
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Google-Calendar-style time grid: a 24h vertical axis with one column per day. */
export default function Calendar() {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const running = sessions.some((s) => s.endedAt === null);
  const now = useNow(running);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const scroller = useRef<HTMLDivElement>(null);
  const updateSession = useSessionStore((s) => s.updateSession);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragStart = useRef<DragStart | null>(null);
  const lastPtr = useRef({ x: 0, y: 0 });
  const autoScroll = useRef(0);
  const [resize, setResize] = useState<Resize | null>(null);
  const resizeStart = useRef<ResizeStart | null>(null);
  const addSession = useSessionStore((s) => s.addSession);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraftRaw] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState("");
  const setDraft = (d: Draft | null) => { setDraftRaw(d); setDraftError(""); };
  const [rename, setRename] = useState<{ id: string; title: string } | null>(null);
  const hadSelection = useRef(false);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const restoreSession = useSessionStore((s) => s.restoreSession);

  // Undo: a stack of previous session versions; the toast shows the latest for a few seconds.
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [toastOn, setToastOn] = useState(false);
  const pushUndo = (label: string, prev: Session) => {
    setUndoStack((st) => [...st.slice(-(UNDO_LIMIT - 1)), { label, prev }]);
    setToastOn(true);
  };
  const undo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    restoreSession(last.prev);
    setUndoStack((st) => st.slice(0, -1));
    setSelectedId(null);
    setToastOn(true);
  };
  useEffect(() => {
    if (!toastOn) return;
    const t = setTimeout(() => setToastOn(false), UNDO_MS);
    return () => clearTimeout(t);
  }, [toastOn, undoStack]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== "z") return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return; // keep text undo
      e.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const lastUndo = undoStack[undoStack.length - 1];

  const duplicate = (id: string) => {
    const src = sessions.find((x) => x.id === id);
    if (!src?.endedAt) return;
    const ok = addSession({ title: src.title, tagId: src.tagId, startedAt: src.startedAt, endedAt: src.endedAt }, src.source);
    if (!ok) return;
    const all = useSessionStore.getState().sessions;
    setSelectedId(all[all.length - 1].id); // the copy is now the selected block, ready to drag
  };
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);
  const [night, setNight] = useState(false);
  const [full, setFull] = useState(false);
  const [fitPx, setFitPx] = useState(0);
  // Full screen: shrink the hour height so all 24h fit in view with no scrolling.
  const HOUR_PX = full && fitPx > 0 ? fitPx / 24 : BASE_HOUR_PX;

  useEffect(() => {
    if (!full) return;
    const el = scroller.current;
    if (!el) return;
    const measure = () => setFitPx(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => {
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  const days = useMemo(
    () =>
      view === "day"
        ? [anchor]
        : eachDayOfInterval({ start: startOfWeek(anchor, WEEK), end: endOfWeek(anchor, WEEK) }),
    [view, anchor],
  );
  const step = (dir: 1 | -1) => setAnchor(view === "day" ? addDays(anchor, dir) : addWeeks(anchor, dir));
  const title =
    view === "day"
      ? format(anchor, "EEEE, MMMM d, yyyy")
      : `${format(days[0], "MMM d")} – ${format(days[6], "MMM d, yyyy")}`;

  // Open near the current time (so recent sessions are in view), else the working day.
  useEffect(() => {
    const showsToday = days.some((d) => isToday(d));
    const hour = showsToday ? Math.max(0, new Date().getHours() - 3) : 7;
    scroller.current?.scrollTo({ top: full ? 0 : hour * HOUR_PX });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchor, full]);

  const btn = "rounded-xl bg-panel px-3 py-1 text-accent hover:opacity-80";
  const cols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };
  const nowMin = (now - startOfDay(now).getTime()) / 60_000;
  const line = "rgb(75 69 83 / 0.1)";

  return (
    <div className={full ? "fixed inset-0 z-50 flex flex-col bg-white p-3" : ""}>
      {!full && <h1 className="text-4xl font-normal text-ink">Calendar</h1>}

      <div className={`flex flex-wrap items-center gap-2 ${full ? "" : "mt-4"}`}>
        <button className={btn} aria-label="Previous" onClick={() => step(-1)}>‹</button>
        <button className={btn} aria-label="Next" onClick={() => step(1)}>›</button>
        <button className="rounded-xl bg-panel px-4 py-1 text-sm" onClick={() => setAnchor(startOfDay(new Date()))}>
          Today
        </button>
        <span className="ml-2 text-lg font-medium" data-testid="calendar-title">{title}</span>
        <button
          role="switch"
          aria-checked={night}
          title="Shade 6 PM – 6 AM"
          onClick={() => setNight((n) => !n)}
          className={`ml-auto flex items-center gap-2 rounded-xl px-3 py-1 text-sm ${
            night ? "bg-[#1e1b4b] text-white" : "bg-panel text-ink"
          }`}
        >
          <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          Night View
          <span className={`relative h-4 w-7 rounded-full ${night ? "bg-indigo-400" : "bg-ink/20"}`}>
            <i className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${night ? "left-3.5" : "left-0.5"}`} />
          </span>
        </button>
        <span className="flex overflow-hidden rounded-xl bg-panel text-sm">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`px-4 py-1 capitalize ${view === v ? "bg-primary text-white" : "text-ink"}`}
            >
              {v}
            </button>
          ))}
        </span>
        <button
          className="rounded-xl bg-panel px-3 py-1 text-sm text-ink hover:opacity-80"
          aria-pressed={full}
          title={full ? "Exit full screen (Esc)" : "Full screen: see all 24 hours at once"}
          onClick={() => setFull((f) => !f)}
        >
          {full ? "⤡ Exit full screen" : "⤢ Full screen"}
        </button>
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-white ${
          full ? "flex min-h-0 flex-1 flex-col" : ""
        }`}
      >
        {/* Day headers */}
        <div className="grid border-b border-ink/10 bg-sidebar" style={cols}>
          <span />
          {days.map((d) => (
            <button
              key={d.toISOString()}
              onClick={() => { setAnchor(startOfDay(d)); setView("day"); }}
              className="py-2 text-center text-xs text-ink/70 hover:bg-panel"
            >
              <span className="block uppercase">{format(d, "EEE")}</span>
              <span
                className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-base ${
                  isToday(d) ? "bg-primary font-semibold text-white" : "text-ink"
                }`}
              >
                {format(d, "d")}
              </span>
            </button>
          ))}
        </div>

        {/* Scrollable 24h grid */}
        <div ref={scroller} className={
            full ? "min-h-0 flex-1 overflow-hidden" : "max-h-[calc(100vh-16rem)] min-h-[20rem] overflow-y-auto"
          }>
          <div className="relative grid" style={{ ...cols, height: 24 * HOUR_PX }}>
            <div className="relative">
              {night &&
                [[0, 6], [18, 24]].map(([a, b]) => (
                  <div
                    key={a}
                    data-testid="night-gutter"
                    className="absolute inset-x-0 bg-slate-500/15"
                    style={{ top: a * HOUR_PX, height: (b - a) * HOUR_PX }}
                  />
                ))}
              {HOURS.slice(1).map((h) => (
                <span
                  key={h}
                  className={`absolute right-2 -translate-y-1/2 text-[11px] ${
                    night && (h < 6 || h >= 18) ? "text-ink/70" : "text-ink/50"
                  }`}
                  style={{ top: h * HOUR_PX }}
                >
                  {format(new Date(2000, 0, 1, h), "h a")}
                </span>
              ))}
            </div>

            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const dragged = drag ? sessions.find((x) => x.id === drag.id) : undefined;
              const ghost =
                drag && dragged?.endedAt
                  ? {
                      session: {
                        ...dragged,
                        startedAt: addMinutes(new Date(dragged.startedAt), drag.shiftMin).toISOString(),
                        endedAt: addMinutes(new Date(dragged.endedAt), drag.shiftMin).toISOString(),
                      },
                    }
                  : null;
              const segs = daySegments(sessions, d, now);
              return (
                <div
                  key={key}
                  data-day={key}
                  className="relative border-l border-ink/10"
                  onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    hadSelection.current = selectedId !== null;
                    setSelectedId(null);
                  }}
                  onClick={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (hadSelection.current) { hadSelection.current = false; return; } // this click only deselected
                    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                    const start = clamp(Math.floor(((y / HOUR_PX) * 60) / SNAP_MIN) * SNAP_MIN, 0, 1440 - SNAP_MIN);
                    const end = Math.min(start + 60, 1439);
                    setDraft({ day: d, title: "", tagId: "", start: hhmm(start), end: hhmm(end) });
                  }}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, ${line} ${HOUR_PX - 1}px, ${line} ${HOUR_PX}px)`,
                  }}
                >
                  {night &&
                    [[0, 6], [18, 24]].map(([a, b]) => (
                      <div
                        key={a}
                        data-testid="night-overlay"
                        className="pointer-events-none absolute inset-x-0 bg-slate-500/15"
                        style={{ top: a * HOUR_PX, height: (b - a) * HOUR_PX }}
                      />
                    ))}
                  {segs.map((seg) => {
                    const s = seg.session;
                    const dayIdx = days.indexOf(d);
                    const movable = s.endedAt !== null; // a running session can't be moved
                    const dragging = drag?.id === s.id ? drag : null;
                    const endDrag = () => {
                      if (autoScroll.current) window.clearInterval(autoScroll.current);
                      autoScroll.current = 0;
                      dragStart.current = null;
                      setDrag(null);
                    };
                    // Recompute the move from the pointer plus how far the grid has scrolled since the press.
                    const applyDrag = () => {
                      const st = dragStart.current;
                      if (!st) return;
                      const dx = lastPtr.current.x - st.x0;
                      const dy = lastPtr.current.y - st.y0 + ((scroller.current?.scrollTop ?? 0) - st.scroll0);
                      if (!st.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
                      st.moved = true;
                      const dMin = Math.round(((dy / st.hourPx) * 60) / SNAP_MIN) * SNAP_MIN;
                      const dDays = Math.round(dx / st.colW);
                      st.shiftMin = clamp(dDays * 1440 + dMin, st.minShift, st.maxShift);
                      setDrag({ id: s.id, shiftMin: st.shiftMin });
                    };
                    const tag = tags.find((t) => t.id === s.tagId);
                    const color = tag?.color ?? UNTAGGED_COLOR;
                    const resizing = resize?.id === s.id ? resize : null;
                    const topMin = seg.startMin + (resizing?.edge === "start" ? resizing.dMin : 0);
                    const botMin = seg.endMin + (resizing?.edge === "end" ? resizing.dMin : 0);
                    const height = Math.max(((botMin - topMin) / 60) * HOUR_PX, 14);
                    const dayStartMs = startOfDay(d).getTime();
                    // Only the real start/end of a session can be resized (not a midnight clip).
                    const startsHere = new Date(s.startedAt).getTime() >= dayStartMs;
                    const endsHere = !!s.endedAt && new Date(s.endedAt).getTime() <= dayStartMs + 86_400_000;
                    const edgeBar = `color-mix(in srgb, ${color} 55%, black)`;
                    const handle = (edge: "start" | "end") => (
                      <div
                        data-testid={`resize-${edge}`}
                        className={`absolute left-0 right-0 flex h-2 cursor-ns-resize items-center justify-center ${edge === "start" ? "top-0" : "bottom-0"}`}
                        style={{ touchAction: "none", background: `color-mix(in srgb, ${edgeBar} 45%, transparent)` }}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          e.stopPropagation();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          resizeStart.current = {
                            y0: e.clientY,
                            hourPx: HOUR_PX,
                            minMin: edge === "start" ? Math.ceil(-seg.startMin / SNAP_MIN) * SNAP_MIN : -(Math.floor((seg.endMin - seg.startMin - SNAP_MIN) / SNAP_MIN) * SNAP_MIN),
                            maxMin: edge === "start" ? Math.floor((seg.endMin - seg.startMin - SNAP_MIN) / SNAP_MIN) * SNAP_MIN : Math.floor((1440 - seg.endMin) / SNAP_MIN) * SNAP_MIN,
                            dMin: 0,
                          };
                          setResize({ id: s.id, edge, dMin: 0 });
                        }}
                        onPointerMove={(e) => {
                          const st = resizeStart.current;
                          if (!st) return;
                          e.stopPropagation();
                          const dMin = clamp(Math.round((((e.clientY - st.y0) / st.hourPx) * 60) / SNAP_MIN) * SNAP_MIN, st.minMin, st.maxMin);
                          st.dMin = dMin;
                          setResize({ id: s.id, edge, dMin });
                        }}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          const st = resizeStart.current;
                          resizeStart.current = null;
                          setResize(null);
                          if (!st || !st.dMin || !s.endedAt) return;
                          pushUndo("Resized", s);
                          updateSession(s.id, {
                            title: s.title,
                            tagId: s.tagId,
                            startedAt: edge === "start" ? addMinutes(new Date(s.startedAt), st.dMin).toISOString() : s.startedAt,
                            endedAt: edge === "end" ? addMinutes(new Date(s.endedAt), st.dMin).toISOString() : s.endedAt,
                          });
                        }}
                        onPointerCancel={(e) => {
                          e.stopPropagation();
                          resizeStart.current = null;
                          setResize(null);
                        }}
                      >
                        <span className="pointer-events-none h-[3px] w-8 rounded-full" style={{ background: edgeBar, opacity: 0.9 }} />
                      </div>
                    );
                    const range = `${formatClock(s.startedAt)} - ${s.endedAt ? formatClock(s.endedAt) : "now"}`;
                    const selected = selectedId === s.id && movable;
                    // End time: pinned to the bottom of tall, full-width blocks only. Short blocks show their end by
                    // their bottom edge; overlapping lanes are too narrow for the extra line.
                    const endIso = s.endedAt && resizing?.edge === "end" ? addMinutes(new Date(s.endedAt), resizing.dMin).toISOString() : s.endedAt;
                    const showEnd = !!endIso && endsHere && seg.lanes === 1 && height >= END_TIME_MIN_HEIGHT_PX;
                    return (
                      <Fragment key={s.id}>
                      {selected && !dragging && (
                        <div
                          role="toolbar"
                          data-testid="block-actions"
                          className="absolute z-30 flex gap-1 rounded-xl border border-ink/10 bg-white p-1 shadow-lg"
                          style={{
                            // above the block; if it's too close to the top of the day, below it (never on top of the block)
                            top: (seg.startMin / 60) * HOUR_PX >= 40 ? (seg.startMin / 60) * HOUR_PX - 36 : (seg.startMin / 60) * HOUR_PX + height + 4,
                            left: `calc(${(seg.lane / seg.lanes) * 100}% + 1px)`,
                          }}
                        >
                          <button
                            aria-label="Duplicate"
                            title="Duplicate"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink hover:bg-panel"
                            onClick={() => duplicate(s.id)}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="11" height="11" rx="2" />
                              <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                            </svg>
                          </button>
                          <button
                            aria-label="Edit title"
                            title="Edit title"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink hover:bg-panel"
                            onClick={() => setRename({ id: s.id, title: s.title })}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button
                            aria-label="Delete"
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                            onClick={() => {
                              pushUndo("Deleted", s);
                              deleteSession(s.id);
                              setSelectedId(null);
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div
                        data-session={s.id}
                        title={`${s.title || "Untitled session"}${tag ? ` · ${tag.name}` : ""}\n${range} (${formatDuration(durationSec(s, now))})`}
                        className={`absolute overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-sm ${
                          movable ? (dragging ? "cursor-grabbing" : selected ? "cursor-grab" : "cursor-pointer") : ""
                        } ${selected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                        onPointerDown={(e) => {
                          if (!movable || e.button !== 0) return;
                          // Select first: the first press only selects; a selected block can then be dragged.
                          if (!selected) {
                            setSelectedId(s.id);
                            return;
                          }
                          const col = e.currentTarget.parentElement as HTMLElement;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          dragStart.current = {
                            x0: e.clientX,
                            y0: e.clientY,
                            scroll0: scroller.current?.scrollTop ?? 0,
                            colW: col.offsetWidth,
                            hourPx: HOUR_PX,
                            minShift: Math.ceil((startOfDay(days[0]).getTime() - new Date(s.startedAt).getTime()) / 60_000 / SNAP_MIN) * SNAP_MIN,
                            maxShift: Math.floor((startOfDay(days[days.length - 1]).getTime() + 86_400_000 - new Date(s.endedAt ?? s.startedAt).getTime()) / 60_000 / SNAP_MIN) * SNAP_MIN,
                            moved: false,
                            shiftMin: 0,
                          };
                        }}
                        onPointerMove={(e) => {
                          if (!dragStart.current) return;
                          lastPtr.current = { x: e.clientX, y: e.clientY };
                          applyDrag();
                          // Near the top/bottom edge of the grid: keep scrolling so far-away times are reachable.
                          const box = scroller.current?.getBoundingClientRect();
                          if (box && dragStart.current.moved && !autoScroll.current) {
                            autoScroll.current = window.setInterval(() => {
                              const el = scroller.current;
                              if (!el || !dragStart.current) return;
                              const y = lastPtr.current.y;
                              const edge = 40;
                              if (y < box.top + edge) el.scrollTop -= 12;
                              else if (y > box.bottom - edge) el.scrollTop += 12;
                              else return;
                              applyDrag();
                            }, 16);
                          }
                        }}
                        onPointerUp={() => {
                          const st = dragStart.current;
                          if (st && !st.moved && movable) setSelectedId(s.id); // a tap selects the block
                          if (st?.moved && st.shiftMin && s.endedAt) {
                            pushUndo("Moved", s);
                            const shift = (iso: string) => addMinutes(new Date(iso), st.shiftMin).toISOString();
                            updateSession(s.id, {
                              title: s.title,
                              tagId: s.tagId,
                              startedAt: shift(s.startedAt),
                              endedAt: shift(s.endedAt),
                            });
                          }
                          endDrag();
                        }}
                        onPointerCancel={endDrag}
                        style={{
                          touchAction: movable ? "none" : undefined,
                          zIndex: dragging ? 20 : undefined,
                          opacity: dragging ? 0.3 : undefined, // the live preview is drawn as a ghost in each day it covers
                          top: (topMin / 60) * HOUR_PX,
                          height,
                          left: `calc(${(seg.lane / seg.lanes) * 100}% + 1px)`,
                          width: `calc(${100 / seg.lanes}% - 3px)`,
                          background: color,
                          borderLeft: `3px solid color-mix(in srgb, ${color} 70%, black)`,
                        }}
                      >
                        {selected && startsHere && handle("start")}
                        {selected && endsHere && handle("end")}
                        <span className="block truncate font-medium">{s.title || tag?.name || "Untitled session"}</span>
                        {height >= 32 && (
                          <span className="block truncate opacity-90">
                            {formatClock(s.startedAt)}{tag ? ` · ${tag.name}` : ""}
                          </span>
                        )}
                        {showEnd && (
                          <span
                            data-testid="block-end-time"
                            className={`pointer-events-none absolute right-1.5 truncate text-[11px] leading-none opacity-60 ${selected && endsHere ? "bottom-3.5" : "bottom-1.5"}`}
                            style={{ left: 6 }}
                          >
                            {formatClock(endIso)}
                          </span>
                        )}
                      </div>
                      </Fragment>
                    );
                  })}
                  {ghost &&
                    daySegments([ghost.session], d, now).map((g) => {
                      const gt = tags.find((t) => t.id === ghost.session.tagId);
                      const gc = gt?.color ?? UNTAGGED_COLOR;
                      return (
                        <div
                          key={`ghost-${g.startMin}`}
                          data-testid="drag-ghost"
                          className="pointer-events-none absolute z-20 overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-lg"
                          style={{
                            top: (g.startMin / 60) * HOUR_PX,
                            height: Math.max(((g.endMin - g.startMin) / 60) * HOUR_PX, 14),
                            left: 1,
                            right: 2,
                            opacity: 0.85,
                            background: gc,
                            borderLeft: `3px solid color-mix(in srgb, ${gc} 70%, black)`,
                          }}
                        >
                          <span className="block truncate font-medium">{ghost.session.title || gt?.name || "Untitled session"}</span>
                          <span className="block truncate opacity-90">{formatClock(ghost.session.startedAt)} - {formatClock(ghost.session.endedAt!)}</span>
                        </div>
                      );
                    })}
                  {isToday(d) && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500"
                      style={{ top: (nowMin / 60) * HOUR_PX }}
                    >
                      <i className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {draft && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 p-4"
          onPointerDown={(e) => e.target === e.currentTarget && setDraft(null)}
        >
          <form
            role="dialog"
            aria-label="Add time block"
            data-testid="add-block"
            className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-5 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              const at = (t: string) => {
                const [h, m] = t.split(":").map(Number);
                return addMinutes(startOfDay(draft.day), h * 60 + m).toISOString();
              };
              const ok = addSession({ title: draft.title, tagId: draft.tagId || null, startedAt: at(draft.start), endedAt: at(draft.end) });
              if (!ok) { setDraftError("End time must be after start time."); return; }
              setDraft(null);
            }}
            onKeyDown={(e) => e.key === "Escape" && setDraft(null)}
          >
            <h2 className="text-lg font-medium text-ink">Add time block</h2>
            <p className="text-sm text-ink/60">{format(draft.day, "EEEE, MMM d")}</p>
            <input
              autoFocus
              aria-label="Title"
              placeholder="What did you work on?"
              className="mt-3 w-full rounded-xl border border-ink/15 px-3 py-2"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <select
              aria-label="Tag"
              className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2"
              value={draft.tagId}
              onChange={(e) => setDraft({ ...draft, tagId: e.target.value })}
            >
              <option value="">No tag</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.parentId ? "– " : ""}{t.name}</option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-2">
              <input type="time" aria-label="Start time" className="flex-1 rounded-xl border border-ink/15 px-3 py-2" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
              <span>–</span>
              <input type="time" aria-label="End time" className="flex-1 rounded-xl border border-ink/15 px-3 py-2" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
            </div>
            {draftError && <p role="alert" className="mt-2 text-sm text-red-500">{draftError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl bg-panel px-4 py-2 text-sm" onClick={() => setDraft(null)}>Cancel</button>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm text-white">Add</button>
            </div>
          </form>
        </div>
      )}

      {rename && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 p-4"
          onPointerDown={(e) => e.target === e.currentTarget && setRename(null)}
        >
          <form
            role="dialog"
            aria-label="Edit title"
            data-testid="edit-title"
            className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-5 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              const s = sessions.find((x) => x.id === rename.id);
              if (s) {
                pushUndo("Renamed", s);
                updateSession(s.id, { title: rename.title.trim(), tagId: s.tagId, startedAt: s.startedAt, endedAt: s.endedAt });
              }
              setRename(null);
            }}
            onKeyDown={(e) => e.key === "Escape" && setRename(null)}
          >
            <h2 className="text-lg font-medium text-ink">Edit title</h2>
            <input
              autoFocus
              aria-label="Title"
              placeholder="What did you work on?"
              className="mt-3 w-full rounded-xl border border-ink/15 px-3 py-2"
              value={rename.title}
              onChange={(e) => setRename({ ...rename, title: e.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl bg-panel px-4 py-2 text-sm" onClick={() => setRename(null)}>Cancel</button>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      {toastOn && lastUndo && (
        <div
          role="status"
          data-testid="undo-toast"
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg"
        >
          <span>
            {lastUndo.label} “{lastUndo.prev.title || "Untitled session"}”
          </span>
          <button className="font-semibold text-sky-300 hover:underline" onClick={undo}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
