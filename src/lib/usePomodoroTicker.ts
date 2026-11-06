import { useEffect } from "react";
import { usePomodoroStore } from "../store/usePomodoroStore";
import { useNow } from "./useNow";

/** Mount once (in AppShell) so finished phases are settled on every route and after a refresh. */
export function usePomodoroTicker(): void {
  const active = usePomodoroStore((s) => s.run !== null);
  const tick = usePomodoroStore((s) => s.tick);
  const now = useNow(active);
  useEffect(() => {
    tick(now);
  }, [now, active, tick]);
}
