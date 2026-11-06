import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "../lib/useClickOutside";
import { useSettingsStore } from "../store/useSettingsStore";
import { registry } from "../widgets/registry";

/** Lists every registry entry marked `addable`, so new widget types show up with no UI changes. */
export default function AddWidgetMenu() {
  const addWidget = useSettingsStore((s) => s.addWidget);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-xl bg-primary px-4 py-1.5 text-sm text-white shadow-[0_3px_0_#2563eb]"
      >
        + Add widget
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 top-11 z-10 w-48 overflow-hidden rounded-xl border bg-white py-1 text-sm shadow-lg">
          {Object.entries(registry)
            .filter(([, def]) => def.addable)
            .map(([type, def]) => (
              <li key={type}>
                <button
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left hover:bg-sidebar"
                  onClick={() => {
                    addWidget({ type });
                    setOpen(false);
                  }}
                >
                  {def.title}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
