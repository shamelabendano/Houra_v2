// Connects the backend to the zustand stores without touching them: remote data goes in through
// setState (which does not call save, so nothing echoes back) and local edits go out through
// storage.ts's normal save() path.
import { useSessionStore } from "../store/useSessionStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTagStore } from "../store/useTagStore";
import type { DashboardWidget, Session, Settings, Tag } from "../types";
import {
  bindUser,
  cacheRemote,
  clearLocal,
  flushPending,
  getCacheOwner,
  hasPending,
  pullRemote,
  save,
  setCacheOwner,
  subscribeRemote,
  SYNCED_KEYS,
  type SyncedKey,
} from "./storage";

const isObject = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v);

/** Per key: how to read the store's current value, and how to replace it (false = bad shape, ignored). */
const bindings: Record<SyncedKey, { read: () => unknown; write: (v: unknown) => boolean }> = {
  tags: {
    read: () => useTagStore.getState().tags,
    write: (v) => Array.isArray(v) && (useTagStore.setState({ tags: v as Tag[] }), true),
  },
  sessions: {
    read: () => useSessionStore.getState().sessions,
    write: (v) => Array.isArray(v) && (useSessionStore.setState({ sessions: v as Session[] }), true),
  },
  settings: {
    read: () => useSettingsStore.getState().settings,
    write: (v) =>
      isObject(v) &&
      (useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, ...(v as Partial<Settings>) } }), true),
  },
  dashboard: {
    read: () => useSettingsStore.getState().dashboard,
    write: (v) => Array.isArray(v) && (useSettingsStore.setState({ dashboard: v as DashboardWidget[] }), true),
  },
};

function applyRemote(key: SyncedKey, value: unknown): void {
  const { read, write } = bindings[key];
  if (hasPending(key)) return; // our own newer edit is on its way out; it wins
  if (JSON.stringify(read()) === JSON.stringify(value)) return;
  if (write(value)) cacheRemote(key, value);
}

async function refresh(): Promise<void> {
  try {
    const remote = await pullRemote();
    for (const key of SYNCED_KEYS) if (key in remote) applyRemote(key, remote[key]);
  } catch {
    // offline; the next refresh or realtime event catches up
  }
}

let stop: (() => void) | null = null;

/** Pulls the user's data into the stores, uploads anything the server lacks, then keeps both sides in step. */
export async function startSync(userId: string): Promise<void> {
  const owner = getCacheOwner();
  if (owner && owner !== userId) {
    // The cached data belongs to someone else: drop it and reload so the stores start clean.
    clearLocal();
    setCacheOwner(userId);
    window.location.reload();
    return new Promise<void>(() => {});
  }
  setCacheOwner(userId);
  bindUser(userId);

  try {
    const remote = await pullRemote();
    for (const key of SYNCED_KEYS) {
      if (key in remote) applyRemote(key, remote[key]);
      else save(key, bindings[key].read()); // first sign-in: the server is empty, so upload what's here
    }
  } catch (e) {
    // Offline or backend down: keep working from the local cache, and don't upload over unseen data.
    console.warn("Houra sync: could not reach the backend", e);
  }

  const unsubscribe = subscribeRemote(applyRemote);
  const onVisible = () => document.visibilityState === "visible" && void refresh();
  document.addEventListener("visibilitychange", onVisible);
  stop = () => {
    unsubscribe();
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export async function stopSync(): Promise<void> {
  stop?.();
  stop = null;
  await flushPending();
  bindUser(null);
}
