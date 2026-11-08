import { createClient } from "@supabase/supabase-js";

const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** null when the env vars are missing: the app then runs local-only, with no sign-in. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const isBackendConfigured = supabase !== null;
