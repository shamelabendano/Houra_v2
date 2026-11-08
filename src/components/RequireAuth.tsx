import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isBackendConfigured } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

/** Route guard for the AppShell routes: waits for sign-in + first sync, else sends you to /login.
 *  With no backend configured there is nothing to protect, so the app runs local-only. */
export default function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (!isBackendConfigured) return <Outlet />;
  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center text-ink/60">Loading your hours…</div>;
  }
  if (status === "signedOut") return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
