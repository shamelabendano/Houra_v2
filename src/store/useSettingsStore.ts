import { create } from "zustand";
import { seedDashboard } from "../lib/seed";
import { load, save } from "../lib/storage";
import type { DashboardWidget, Settings } from "../types";

interface SettingsState {
  settings: Settings;
  dashboard: DashboardWidget[];
  updateSettings: (patch: Partial<Settings>) => void;
  /** Appends the widget, or inserts it before `beforeId` when that widget exists. */
  addWidget: (widget: Omit<DashboardWidget, "id">, beforeId?: string) => void;
  removeWidget: (id: string) => void;
}

const defaultSettings: Settings = { currency: "PHP", theme: "light" };

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings, ...load<Partial<Settings>>("settings", {}) },
  dashboard: load<DashboardWidget[]>("dashboard", seedDashboard),

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    save("settings", settings);
    set({ settings });
  },

  addWidget: (widget, beforeId) => {
    const next = { ...widget, id: crypto.randomUUID() };
    const dashboard = [...get().dashboard];
    const at = beforeId ? dashboard.findIndex((w) => w.id === beforeId) : -1;
    dashboard.splice(at === -1 ? dashboard.length : at, 0, next);
    save("dashboard", dashboard);
    set({ dashboard });
  },

  removeWidget: (id) => {
    const dashboard = get().dashboard.filter((w) => w.id !== id);
    save("dashboard", dashboard);
    set({ dashboard });
  },
}));
