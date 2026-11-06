import { create } from "zustand";
import { isPhaseDue, phaseEndsAt, type PomodoroRun } from "../lib/pomodoro";
import { load, save } from "../lib/storage";
import { useSessionStore } from "./useSessionStore";
import { useTagStore } from "./useTagStore";

export interface PomodoroConfig {
  focusMin: number;
  breakMin: number;
  skipBreaks: boolean;
  tagId: string | null;
}

interface PomodoroState {
  config: PomodoroConfig;
  run: PomodoroRun | null;
  setConfig: (patch: Partial<PomodoroConfig>) => void;
  /** Starts a focus block (stopping any running timer so time is not counted twice). */
  start: () => void;
  /** Abandons the current phase; an unfinished focus block is not saved. */
  cancel: () => void;
  /** Finishes every phase whose end time has passed. Safe to call repeatedly or from several places. */
  tick: (now: number) => void;
}

const defaults: { config: PomodoroConfig; run: PomodoroRun | null } = {
  config: { focusMin: 25, breakMin: 5, skipBreaks: false, tagId: null },
  run: null,
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n) || min));

const stored = load<Partial<typeof defaults>>("pomodoro", {});

export const usePomodoroStore = create<PomodoroState>((set, get) => {
  const commit = (config: PomodoroConfig, run: PomodoroRun | null) => {
    save("pomodoro", { config, run });
    set({ config, run });
  };

  return {
    config: { ...defaults.config, ...stored.config },
    run: stored.run ?? null,

    setConfig: (patch) => {
      const next = { ...get().config, ...patch };
      next.focusMin = clamp(next.focusMin, 1, 180);
      next.breakMin = clamp(next.breakMin, 1, 60);
      commit(next, get().run);
    },

    start: () => {
      const { config } = get();
      useSessionStore.getState().stopSession();
      commit(config, {
        phase: "focus",
        startedAt: new Date().toISOString(),
        durationSec: config.focusMin * 60,
        tagId: config.tagId,
      });
    },

    cancel: () => commit(get().config, null),

    tick: (now) => {
      let { run } = get();
      const { config } = get();
      if (!run || !isPhaseDue(run, now)) return;

      // Loop so a refresh long after the deadline settles focus and break in one go.
      let finished: PomodoroRun | null = null;
      while (run && isPhaseDue(run, now)) {
        const endedAt = new Date(phaseEndsAt(run)).toISOString();
        if (run.phase === "focus") {
          finished = run;
          run = config.skipBreaks
            ? null
            : { phase: "break", startedAt: endedAt, durationSec: config.breakMin * 60, tagId: run.tagId };
        } else {
          run = null;
        }
      }

      // Clear the run before saving so a second tick can never save the block twice.
      commit(config, run);
      if (finished) {
        const tagExists = finished.tagId !== null && useTagStore.getState().tags.some((t) => t.id === finished!.tagId);
        useSessionStore.getState().addSession(
          {
            title: "Focus session",
            tagId: tagExists ? finished.tagId : null,
            startedAt: finished.startedAt,
            endedAt: new Date(phaseEndsAt(finished)).toISOString(),
          },
          "pomodoro",
        );
      }
    },
  };
});
