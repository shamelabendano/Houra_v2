import type { ComponentType } from "react";
import type { DashboardWidget } from "../types";

/** Every widget component receives its own dashboard entry (id + config). */
export interface WidgetProps {
  widget: DashboardWidget;
}

export interface WidgetDef {
  title: string;
  component: ComponentType<WidgetProps>;
  /** Width in grid columns (the grid has 6). */
  defaultSize: { cols: number };
  /** Listed in the "Add widget" menu. Omit for widgets that need config or are pinned by the layout. */
  addable?: boolean;
}
