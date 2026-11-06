import type { WidgetProps } from "./types";

export default function GreetingWidget(_: WidgetProps) {
  return (
    <section className="flex h-full min-h-28 flex-col justify-center rounded-card border border-panel bg-sidebar px-6 py-4">
      <h1 className="text-3xl font-semibold text-accent">Hello there</h1>
      <p className="text-lg text-accent/80">It's good to see you again</p>
    </section>
  );
}
