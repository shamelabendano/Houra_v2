import { registry } from "../widgets/registry";
import type { DashboardWidget } from "../types";

/** Renders the layout in order. It knows nothing about individual widget types. */
export default function DashboardGrid({ widgets }: { widgets: DashboardWidget[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {widgets.map((widget) => {
        const def = registry[widget.type]; // unknown types (stale saved layouts) are skipped
        if (!def) return null;
        const Widget = def.component;
        return (
          <div key={widget.id} className="dash-cell" style={{ "--cols": def.defaultSize.cols } as React.CSSProperties}>
            <Widget widget={widget} />
          </div>
        );
      })}
    </div>
  );
}
