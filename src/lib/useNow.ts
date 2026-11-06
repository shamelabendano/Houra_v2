import { useEffect, useState } from "react";

/**
 * Re-renders every second while `active` and returns the current time.
 * Ticks only trigger renders; elapsed time is always derived from `startedAt`.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
