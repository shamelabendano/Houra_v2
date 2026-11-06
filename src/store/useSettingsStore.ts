import { create } from "zustand";
import type { DashboardWidget, Settings } from "../types";

interface SettingsState {
  settings: Settings;
  dashboard: DashboardWidget[];
}

export const useSettingsStore = create<SettingsState>(() => ({
  settings: { currency: "PHP", theme: "light" },
  dashboard: [],
}));
