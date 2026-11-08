import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { navItems } from "./components/navItems";
import RequireAuth from "./components/RequireAuth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      {/* Public: no sidebar */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      {/* App: signed-in only; sidebar shell, routes come from navItems */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          {navItems.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Suspense fallback={null}><Page /></Suspense>} />
          ))}
        </Route>
      </Route>
    </Routes>
  );
}
