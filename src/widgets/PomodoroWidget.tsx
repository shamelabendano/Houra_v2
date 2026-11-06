import PomodoroPanel from "../components/PomodoroPanel";
import WidgetCard from "../components/WidgetCard";
import type { WidgetProps } from "./types";

/** Dashboard card wrapping the shared Pomodoro panel. */
export default function PomodoroWidget({ widget }: WidgetProps) {
  return (
    <WidgetCard widgetId={widget.id} title="Pomodoro">
      <PomodoroPanel />
    </WidgetCard>
  );
}
