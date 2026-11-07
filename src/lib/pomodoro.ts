/** One running pomodoro phase. Remaining time is derived from `startedAt`, never stored. */
export interface PomodoroRun {
  phase: "focus" | "break";
  startedAt: string; // ISO
  durationSec: number;
  tagId: string | null;
}

export const phaseEndsAt = (run: PomodoroRun): number => new Date(run.startedAt).getTime() + run.durationSec * 1000;

export const phaseRemainingSec = (run: PomodoroRun, now: number): number =>
  Math.max(0, Math.ceil((phaseEndsAt(run) - now) / 1000));

export const isPhaseDue = (run: PomodoroRun, now: number): boolean => now >= phaseEndsAt(run);
