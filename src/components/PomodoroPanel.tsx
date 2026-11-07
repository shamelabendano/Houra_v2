import { formatDuration } from "../lib/format";
import { phaseRemainingSec } from "../lib/pomodoro";
import { useNow } from "../lib/useNow";
import { usePomodoroStore } from "../store/usePomodoroStore";
import TagPicker from "./TagPicker";

interface StepperProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
}

function Stepper({ label, value, onChange }: StepperProps) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="px-4 py-2 text-center">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="w-16 bg-transparent text-center text-3xl tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="text-xs text-ink/60">mins</div>
      </div>
      <div className="flex flex-col border-l border-gray-200 text-xs">
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} className="flex-1 px-2 hover:bg-sidebar">
          ▲
        </button>
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(value - 1)} className="flex-1 border-t border-gray-200 px-2 hover:bg-sidebar">
          ▼
        </button>
      </div>
    </div>
  );
}

/** The Pomodoro card from the prototype: setup while idle, countdown while a phase runs. */
export default function PomodoroPanel() {
  const { config, run, setConfig, start, cancel } = usePomodoroStore();
  const now = useNow(run !== null);

  if (run) {
    const isFocus = run.phase === "focus";
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-semibold">{isFocus ? "Stay focused" : "Take a break"}</h3>
        <p data-testid="pomodoro-remaining" className="text-5xl tabular-nums">
          {formatDuration(phaseRemainingSec(run, now))}
        </p>
        <p className="text-xs text-ink/60">
          {isFocus ? "Stopping early won't save this block." : "Breaks are not tracked."}
        </p>
        <button
          onClick={cancel}
          className="rounded-xl bg-primary px-6 py-2 text-sm text-white shadow-[0_3px_0_#2563eb]"
        >
          {isFocus ? "Stop" : "Skip break"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h3 className="text-xl font-semibold">Get ready to focus</h3>
      <p className="max-w-sm text-xs text-ink/70">
        Pick a length and a tag. Finished focus blocks are saved to your time tracker automatically.
      </p>
      <div className="flex flex-wrap items-end justify-center gap-4">
        <div>
          <div className="mb-1 text-xs text-ink/60">Focus</div>
          <Stepper label="Focus length" value={config.focusMin} onChange={(n) => setConfig({ focusMin: n })} />
        </div>
        {!config.skipBreaks && (
          <div>
            <div className="mb-1 text-xs text-ink/60">Break</div>
            <Stepper label="Break length" value={config.breakMin} onChange={(n) => setConfig({ breakMin: n })} />
          </div>
        )}
      </div>
      <p className="text-xs">{config.skipBreaks ? "Breaks are off." : "You'll have 1 break."}</p>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={config.skipBreaks}
          onChange={(e) => setConfig({ skipBreaks: e.target.checked })}
        />
        Skip breaks
      </label>
      <TagPicker tagId={config.tagId} onChange={(id) => setConfig({ tagId: id })} emptyColor="#8f94fb" emptyIcon="tag" />
      <button
        onClick={start}
        className="rounded-xl bg-primary px-6 py-2 text-sm text-white shadow-[0_3px_0_#2563eb]"
      >
        ▶ Start focus session
      </button>
    </div>
  );
}
