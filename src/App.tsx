import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { navItems } from "./components/navItems";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {navItems.map(({ path, component: Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
      </Route>
    </Routes>
  );
}
