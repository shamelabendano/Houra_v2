import { create } from "zustand";
import type { Session } from "../types";

interface SessionState {
  sessions: Session[];
}

export const useSessionStore = create<SessionState>(() => ({
  sessions: [],
}));
