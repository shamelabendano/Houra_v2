import type { ComponentType } from "react";
import Home from "../pages/Home";
import TimeTracker from "../pages/TimeTracker";
import Pomodoro from "../pages/Pomodoro";
import Calendar from "../pages/Calendar";
import ProgressHistory from "../pages/ProgressHistory";
import ManageTags from "../pages/ManageTags";
import Earnings from "../pages/Earnings";

export interface NavItem {
  path: string;
  label: string;
  component: ComponentType;
  group: "main" | "secondary"; // secondary items sit below the divider
}

// Single source for both the sidebar links and the router.
export const navItems: NavItem[] = [
  { path: "/", label: "Home", component: Home, group: "main" },
  { path: "/time-tracker", label: "Time Tracker", component: TimeTracker, group: "main" },
  { path: "/pomodoro", label: "Pomodoro", component: Pomodoro, group: "main" },
  { path: "/calendar", label: "Calendar", component: Calendar, group: "main" },
  { path: "/progress-history", label: "Progress History", component: ProgressHistory, group: "main" },
  { path: "/manage-tags", label: "Manage Tags", component: ManageTags, group: "main" },
  { path: "/earnings", label: "Earnings", component: Earnings, group: "secondary" },
];
