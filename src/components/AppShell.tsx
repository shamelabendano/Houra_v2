import { useState } from "react";
import { Outlet } from "react-router-dom";
import { usePomodoroTicker } from "../lib/usePomodoroTicker";
import Sidebar from "./Sidebar";

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  usePomodoroTicker();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-[52px] shrink-0 items-center gap-3 bg-header px-4">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
          className="text-white"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M10 4v16" />
          </svg>
        </button>
        <span className="text-[28px] font-bold leading-none text-white">Houra</span>
      </header>
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-y-auto px-10 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
