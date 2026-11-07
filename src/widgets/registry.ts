import AddTagWidget from "./AddTagWidget";
import CalendarWidget from "./CalendarWidget";
import ClockWidget from "./ClockWidget";
import GreetingWidget from "./GreetingWidget";
import PomodoroWidget from "./PomodoroWidget";
import TagStatWidget from "./TagStatWidget";
import TimeTrackerWidget from "./TimeTrackerWidget";
import TodayTotalWidget from "./TodayTotalWidget";
import type { WidgetDef } from "./types";

/** Adding a widget = one component + one line here. The dashboard grid never changes. */
export const registry: Record<string, WidgetDef> = {
  greeting: { title: "Greeting", component: GreetingWidget, defaultSize: { cols: 2 } },
  tagStat: { title: "Tag stats", component: TagStatWidget, defaultSize: { cols: 1 } },
  addTag: { title: "Add a tag", component: AddTagWidget, defaultSize: { cols: 1 } },
  timeTracker: { title: "Time Tracker", component: TimeTrackerWidget, defaultSize: { cols: 4 }, addable: true },
  clock: { title: "Analog Clock", component: ClockWidget, defaultSize: { cols: 2 }, addable: true },
  calendar: { title: "Calendar", component: CalendarWidget, defaultSize: { cols: 2 }, addable: true },
  pomodoro: { title: "Pomodoro", component: PomodoroWidget, defaultSize: { cols: 2 }, addable: true },
  todayTotal: { title: "Today total", component: TodayTotalWidget, defaultSize: { cols: 2 }, addable: true },
};
