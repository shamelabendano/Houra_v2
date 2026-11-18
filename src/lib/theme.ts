import { useSettingsStore } from "../store/useSettingsStore";
import type { Settings } from "../types";

function applyTheme(theme: Settings["theme"]) {
  document.documentElement.dataset.theme = theme;
}

/** Applies the saved theme before first paint and keeps <html> in sync with the setting. */
export function initTheme() {
  applyTheme(useSettingsStore.getState().settings.theme);
  useSettingsStore.subscribe((state, prev) => {
    if (state.settings.theme !== prev.settings.theme) applyTheme(state.settings.theme);
  });
}
