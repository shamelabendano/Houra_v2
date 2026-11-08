import type { Session as AuthSession, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { clearLocal } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { startSync, stopSync } from "../lib/sync";

type Status = "loading" | "signedOut" | "ready";

interface AuthState {
  status: Status;
  user: User | null;
  /** Subscribes to Supabase auth changes; call once at startup. */
  init: () => void;
  /** Returns an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Returns an error message, or null on success. `needsConfirmation` means a confirm email was sent. */
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  async function handleSession(session: AuthSession | null) {
    if (!session) {
      await stopSync();
      set({ user: null, status: "signedOut" });
      return;
    }
    const current = get();
    if (current.status === "ready" && current.user?.id === session.user.id) {
      set({ user: session.user }); // token refresh; nothing to re-sync
      return;
    }
    set({ user: session.user, status: "loading" });
    await startSync(session.user.id);
    set({ status: "ready" });
  }

  return {
    status: "loading",
    user: null,

    init: () => {
      if (!supabase) {
        set({ status: "ready" }); // no backend configured: local-only mode
        return;
      }
      // Deferred: calling Supabase inside this callback can deadlock its auth lock.
      supabase.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => void handleSession(session), 0);
      });
    },

    signIn: async (email, password) => {
      if (!supabase) return "Sign-in is not configured.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },

    signUp: async (email, password) => {
      if (!supabase) return { error: "Sign-in is not configured.", needsConfirmation: false };
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { error: error ? error.message : null, needsConfirmation: !error && !data.session };
    },

    signOut: async () => {
      await stopSync(); // flush unsaved changes first
      await supabase?.auth.signOut();
      clearLocal(); // don't leave this account's data on the device
      window.location.assign("/");
    },
  };
});
