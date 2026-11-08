import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import HourglassLogo from "../components/HourglassLogo";
import { isBackendConfigured } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

const inputClass = "w-full rounded-xl border border-line/40 bg-surface px-4 py-2.5 text-ink outline-none focus:border-primary";

// Public page rendered outside AppShell: sign in or create an account.
export default function Login() {
  const { status, user, signIn, signUp } = useAuthStore();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/home";
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && status === "ready") return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    if (mode === "signIn") {
      const error = await signIn(email.trim(), password);
      if (error) setMessage({ text: error, error: true });
    } else {
      const { error, needsConfirmation } = await signUp(email.trim(), password);
      if (error) setMessage({ text: error, error: true });
      else if (needsConfirmation) setMessage({ text: "Check your email to confirm your account, then sign in.", error: false });
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-r from-[#4f52c9] to-accent">
      <header className="flex h-[60px] items-center px-5">
        <Link to="/" className="text-[28px] font-bold leading-none text-white">Houra</Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm rounded-card bg-panel p-8 text-ink shadow-lg">
          <div className="mb-6 flex items-center justify-center gap-3">
            <HourglassLogo size={26} />
            <span className="text-3xl font-bold text-accent">Houra</span>
          </div>
          {!isBackendConfigured ? (
            <div className="text-center text-sm">
              <p>Sync isn't set up on this copy of Houra yet, so there's nothing to sign in to.</p>
              <Link to="/home" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2 text-white shadow-[0_4px_0_#2563eb]">
                Continue on this device
              </Link>
            </div>
          ) : user ? (
            <p className="text-center text-sm">Syncing your hours…</p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <h1 className="text-center text-xl">{mode === "signIn" ? "Welcome back" : "Create your account"}</h1>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                required
                minLength={mode === "signUp" ? 8 : undefined}
                autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {message && (
                <p role={message.error ? "alert" : "status"} className={`text-sm ${message.error ? "text-red-500" : "text-ink"}`}>
                  {message.text}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-primary py-2.5 text-white shadow-[0_4px_0_#2563eb] disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setMessage(null);
                }}
                className="text-sm text-primary underline"
              >
                {mode === "signIn" ? "New here? Create an account" : "Have an account? Sign in"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
