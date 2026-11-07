import { durationSec, earnings } from "../lib/aggregate";
import { formatCurrency, formatElapsedHms } from "../lib/format";
import { useNow } from "../lib/useNow";
import { useSessionStore } from "../store/useSessionStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTagStore } from "../store/useTagStore";

/** Live earnings of the running session (₱0.00 when nothing is running). */
export default function CurrentSessionCard() {
  const sessions = useSessionStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const currency = useSettingsStore((s) => s.settings.currency);
  const running = sessions.find((s) => s.endedAt === null);
  const now = useNow(!!running);

  const amount = running ? earnings([running], tags, now).total : 0;
  const elapsed = running ? durationSec(running, now) : 0;

  return (
    <div className="w-fit min-w-48 rounded-xl border border-[#9b9aa3] bg-white px-6 py-4 text-center">
      <span className="rounded-sm bg-panel px-2 py-0.5 text-sm">Current Session</span>
      <p data-testid="current-session-earnings" className="mt-1 text-3xl font-bold tabular-nums text-[#10b981]">
        {formatCurrency(amount, currency)}
      </p>
      <p data-testid="current-session-elapsed" className="text-sm tabular-nums text-ink/50">{formatElapsedHms(elapsed)}</p>
    </div>
  );
}
