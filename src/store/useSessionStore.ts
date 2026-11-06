import { create } from "zustand";
import { load, save } from "../lib/storage";
import type { Session } from "../types";

interface SessionState {
  sessions: Session[];
  /** Detach sessions from deleted tags so no time is lost. */
  untagSessions: (tagIds: string[]) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: load<Session[]>("sessions", []),
  untagSessions: (tagIds) => {
    const sessions = get().sessions.map((s) =>
      s.tagId && tagIds.includes(s.tagId) ? { ...s, tagId: null } : s,
    );
    save("sessions", sessions);
    set({ sessions });
  },
}));
