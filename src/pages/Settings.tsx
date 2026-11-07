import { useSettingsStore } from "../store/useSettingsStore";
import type { Settings as SettingsType } from "../types";

const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "INR"];

const THEMES: { value: SettingsType["theme"]; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Settings</h1>

      <section className="mt-6 max-w-md rounded-xl bg-panel p-4">
        <h2 className="mb-3 text-lg">Appearance</h2>
        <div className="flex gap-2" role="group" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => updateSettings({ theme: t.value })}
              aria-pressed={settings.theme === t.value}
              className={`rounded-xl px-4 py-1.5 text-sm ${
                settings.theme === t.value ? "bg-primary text-white shadow-[0_3px_0_#2563eb]" : "bg-surface text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 max-w-md rounded-xl bg-panel p-4">
        <h2 className="mb-3 text-lg">Currency</h2>
        <select
          value={settings.currency}
          onChange={(e) => updateSettings({ currency: e.target.value })}
          aria-label="Currency"
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
        >
          {[...new Set([settings.currency, ...CURRENCIES])].map((c) => <option key={c}>{c}</option>)}
        </select>
      </section>
    </div>
  );
}
