import AddWidgetMenu from "../components/AddWidgetMenu";
import DashboardGrid from "../components/DashboardGrid";
import { useSettingsStore } from "../store/useSettingsStore";

export default function Home() {
  const dashboard = useSettingsStore((s) => s.dashboard);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-4xl font-normal text-ink">Home</h1>
        <AddWidgetMenu />
      </div>
      <DashboardGrid widgets={dashboard} />
    </div>
  );
}
