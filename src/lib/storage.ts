// The only place the app touches localStorage or the backend. The API stays synchronous
// (load/save) so stores don't change: localStorage is a device cache, and when a user is
// bound, every save to a synced key is also pushed to Supabase in the background.
import { supabase } from "./supabase";

const PREFIX = "houra:";
const OWNER_KEY = "owner";
const TABLE = "user_data";
const PUSH_DELAY_MS = 400;

/** Keys shared across devices. Anything else (e.g. the pomodoro run) stays on this device,
 *  so two devices can't both finish the same focus block and save it twice. */
export const SYNCED_KEYS = ["tags", "sessions", "settings", "dashboard"] as const;
export type SyncedKey = (typeof SYNCED_KEYS)[number];
const isSynced = (key: string): key is SyncedKey => (SYNCED_KEYS as readonly string[]).includes(key);

/** Identifies this tab, so it can skip the realtime echo of its own writes. */
const DEVICE_ID = crypto.randomUUID();

let userId: string | null = null;
const timers = new Map<SyncedKey, ReturnType<typeof setTimeout>>();
const inflight = new Set<SyncedKey>();
const failed = new Set<SyncedKey>();

// ---- local cache --------------------------------------------------------------------------

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable; ignore
  }
}

export function save<T>(key: string, value: T): void {
  writeLocal(key, value);
  if (userId && isSynced(key)) schedulePush(key);
}

/** Wipes this device's copy of the data (used on sign-out and when a different user signs in). */
export function clearLocal(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** Who the cached data belongs to, if anyone. */
export const getCacheOwner = () => load<string | null>(OWNER_KEY, null);
export const setCacheOwner = (id: string) => writeLocal(OWNER_KEY, id);

// ---- backend ------------------------------------------------------------------------------

/** Start (or stop, with null) pushing saves to the backend for this user. */
export function bindUser(id: string | null): void {
  userId = id;
  if (!id) {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
  }
}

function schedulePush(key: SyncedKey): void {
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(() => void push(key), PUSH_DELAY_MS));
}

async function push(key: SyncedKey): Promise<void> {
  timers.delete(key);
  const value = load<unknown>(key, undefined);
  if (!supabase || !userId || value === undefined) return;
  inflight.add(key);
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, key, value, device_id: DEVICE_ID, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" },
    );
  inflight.delete(key);
  if (error) {
    console.warn(`Houra sync: could not save "${key}"`, error.message);
    failed.add(key);
  } else {
    failed.delete(key);
  }
}

/** True while this device has a change for `key` that the backend may not have yet. */
export const hasPending = (key: SyncedKey) => timers.has(key) || inflight.has(key) || failed.has(key);

/** Pushes everything waiting (called when the tab hides, on sign-out, and when back online). */
export async function flushPending(): Promise<void> {
  const keys = new Set<SyncedKey>([...timers.keys(), ...failed]);
  keys.forEach((k) => clearTimeout(timers.get(k)));
  await Promise.all([...keys].map(push));
}

/** All of the signed-in user's rows. Throws if the backend can't be reached. */
export async function pullRemote(): Promise<Partial<Record<SyncedKey, unknown>>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from(TABLE).select("key, value");
  if (error) throw error;
  const out: Partial<Record<SyncedKey, unknown>> = {};
  for (const row of data ?? []) if (isSynced(row.key)) out[row.key] = row.value;
  return out;
}

/** Stores a value that came from the backend in the local cache, without pushing it back. */
export const cacheRemote = (key: SyncedKey, value: unknown) => writeLocal(key, value);

/** Calls `onChange` when another tab or device writes one of this user's rows. Returns an unsubscribe. */
export function subscribeRemote(onChange: (key: SyncedKey, value: unknown) => void): () => void {
  const client = supabase;
  if (!client || !userId) return () => {};
  const channel = client
    .channel(`user_data:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as { key?: string; value?: unknown; device_id?: string };
        if (!row.key || !isSynced(row.key) || row.device_id === DEVICE_ID) return;
        onChange(row.key, row.value);
      },
    )
    .subscribe();
  return () => void client.removeChannel(channel);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushPending());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushPending();
  });
}
