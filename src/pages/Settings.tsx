import { useRef, useState } from "react";
import { applyBackup, backupFileName, buildBackup, parseBackup, type ImportMode } from "../lib/backup";
import { useSettingsStore } from "../store/useSettingsStore";
import { useSessionStore } from "../store/useSessionStore";
import { useTagStore } from "../store/useTagStore";
import type { Settings as SettingsType } from "../types";

const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "INR"];

const THEMES: { value: SettingsType["theme"]; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const sessionCount = useSessionStore((s) => s.sessions.length);
  const tagCount = useTagStore((s) => s.tags.length);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: "ok", text: `Exported ${sessionCount} sessions and ${tagCount} tags.` });
  };

  const importFile = async (file: File) => {
    const result = parseBackup(await file.text());
    if (!result.ok) return setMessage({ kind: "error", text: result.error });
    const { backup, skipped } = result;
    if (
      mode === "replace" &&
      !window.confirm(
        `Replace everything here with the backup (${backup.sessions.length} sessions, ${backup.tags.length} tags)? This cannot be undone.`,
      )
    ) {
      return;
    }
    const summary = applyBackup(backup, mode, skipped);
    setMessage({
      kind: "ok",
      text: `Imported ${summary.sessionsAdded} sessions and ${summary.tagsAdded} tags (${summary.skipped} skipped). Reloading…`,
    });
    setTimeout(() => window.location.reload(), 900); // stores re-read storage on load
  };

  const card = "rounded-[var(--radius-card)] bg-sidebar p-5";
  const button = "rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white shadow-[0_3px_0_rgb(37_99_235)] hover:opacity-90";

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

      <section className={`mt-4 max-w-2xl ${card}`}>
        <h2 className="text-lg font-medium">Backup</h2>
        <p className="mt-1 text-sm text-ink/70">
          Houra keeps your data in this browser only. Export it to a file to back it up or move it to another browser,
          then import it there.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className={button} onClick={exportData}>Export data</button>
          <span className="text-sm text-ink/60">{sessionCount} sessions · {tagCount} tags</span>
        </div>

        <hr className="my-5 border-accent/30" />

        <fieldset>
          <legend className="text-sm font-medium">Import</legend>
          {(
            [
              ["merge", "Merge", "Keep what's here and add anything new from the file."],
              ["replace", "Replace", "Overwrite everything here with the file."],
            ] as const
          ).map(([value, label, hint]) => (
            <label key={value} className="mt-2 flex cursor-pointer items-start gap-2 text-sm">
              <input type="radio" name="import-mode" className="mt-1" checked={mode === value} onChange={() => setMode(value)} />
              <span>
                <span className="font-medium">{label}</span> <span className="text-ink/70">{hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          data-testid="import-file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow re-importing the same file
            if (file) void importFile(file);
          }}
        />
        <button className={`mt-4 ${button}`} onClick={() => fileInput.current?.click()}>Import data…</button>

        {message && (
          <p role="status" className={`mt-4 text-sm ${message.kind === "error" ? "text-red-600" : "text-ink"}`}>
            {message.text}
          </p>
        )}
      </section>
    </div>
  );
}
