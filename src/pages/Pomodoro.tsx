import PomodoroPanel from "../components/PomodoroPanel";

export default function Pomodoro() {
  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Pomodoro</h1>
      <div className="mx-auto mt-8 max-w-lg rounded-card border border-panel bg-sidebar p-8">
        <PomodoroPanel />
      </div>
    </div>
  );
}
