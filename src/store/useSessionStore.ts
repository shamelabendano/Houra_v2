import { create } from "zustand";
import { load, save } from "../lib/storage";
import type { Session } from "../types";

export type SessionInput = Pick<Session, "title" | "tagId" | "startedAt" | "endedAt">;

interface SessionState {
  sessions: Session[];
  /** Starts a timer, stopping any running session first (only one may run). */
  startSession: (title: string, tagId: string | null, source?: Session["source"]) => Session;
  stopSession: () => void;
  /** Manual entry; returns false if the times are invalid. */
  addSession: (input: SessionInput) => boolean;
  /** Returns false if the times are invalid or it would create a second running session. */
  updateSession: (id: string, input: SessionInput) => boolean;
  deleteSession: (id: string) => void;
  /** Detach sessions from deleted tags so no time is lost. */
  untagSessions: (tagIds: string[]) => void;
}

function persist(sessions: Session[]) {
  save("sessions", sessions);
  return sessions;
}

/** Keeps the newest running session; any older "running" leftovers are closed at the next start. */
function normalize(sessions: Session[]): Session[] {
  const running = sessions.filter((s) => s.endedAt === null).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (running.length <= 1) return sessions;
  const keep = running[0].id;
  return sessions.map((s) => (s.endedAt === null && s.id !== keep ? { ...s, endedAt: s.startedAt } : s));
}

const validRange = (startedAt: string, endedAt: string | null) => {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return false;
  if (endedAt === null) return start <= Date.now();
  const end = new Date(endedAt).getTime();
  return !Number.isNaN(end) && end > start;
};

const stopAll = (sessions: Session[], at: string): Session[] =>
  sessions.map((s) => (s.endedAt === null ? { ...s, endedAt: at } : s));

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: normalize(load<Session[]>("sessions", [])),

  startSession: (title, tagId, source = "timer") => {
    const startedAt = new Date().toISOString();
    const session: Session = {
      id: crypto.randomUUID(),
      title: title.trim(),
      tagId,
      startedAt,
      endedAt: null,
      source,
    };
    set({ sessions: persist([...stopAll(get().sessions, startedAt), session]) });
    return session;
  },

  stopSession: () => {
    if (!get().sessions.some((s) => s.endedAt === null)) return;
    set({ sessions: persist(stopAll(get().sessions, new Date().toISOString())) });
  },

  addSession: (input) => {
    if (input.endedAt === null || !validRange(input.startedAt, input.endedAt)) return false;
    const session: Session = { ...input, title: input.title.trim(), id: crypto.randomUUID(), source: "manual" };
    set({ sessions: persist([...get().sessions, session]) });
    return true;
  },

  updateSession: (id, input) => {
    const existing = get().sessions.find((s) => s.id === id);
    if (!existing || !validRange(input.startedAt, input.endedAt)) return false;
    if (input.endedAt === null && existing.endedAt !== null) return false; // can't re-open a finished session
    set({
      sessions: persist(
        get().sessions.map((s) => (s.id === id ? { ...s, ...input, title: input.title.trim() } : s)),
      ),
    });
    return true;
  },

  deleteSession: (id) => set({ sessions: persist(get().sessions.filter((s) => s.id !== id)) }),

  untagSessions: (tagIds) => {
    const sessions = get().sessions.map((s) =>
      s.tagId && tagIds.includes(s.tagId) ? { ...s, tagId: null } : s,
    );
    set({ sessions: persist(sessions) });
  },
}));
