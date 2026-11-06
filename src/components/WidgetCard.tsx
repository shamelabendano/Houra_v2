import type { ReactNode } from "react";
import { useSettingsStore } from "../store/useSettingsStore";

interface Props {
  widgetId: string;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Shared card chrome for dashboard widgets: pale panel, title, hover-to-remove. */
export default function WidgetCard({ widgetId, title, children, className = "" }: Props) {
  const removeWidget = useSettingsStore((s) => s.removeWidget);
  return (
    <section className={`group relative h-full rounded-card border border-panel bg-sidebar p-4 ${className}`}>
      <button
        onClick={() => removeWidget(widgetId)}
        aria-label={`Remove ${title ?? "widget"}`}
        className="absolute right-3 top-2 z-[1] text-lg leading-none text-accent opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
      {title && <h2 className="mb-3 text-lg font-semibold text-accent">{title}</h2>}
      {children}
    </section>
  );
}
