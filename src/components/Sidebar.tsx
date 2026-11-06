import { NavLink } from "react-router-dom";
import { navItems } from "./navItems";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block whitespace-nowrap rounded-full py-2.5 pl-12 pr-3 text-[17px] transition-colors ${
    isActive ? "bg-panel text-ink" : "text-ink hover:bg-panel/60"
  }`;

export default function Sidebar() {
  const main = navItems.filter((i) => i.group === "main");
  const secondary = navItems.filter((i) => i.group === "secondary");

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar">
      <nav className="flex flex-1 flex-col gap-1 p-2.5">
        {main.map((i) => (
          <NavLink key={i.path} to={i.path} end={i.path === "/"} className={linkClass}>
            {i.label}
          </NavLink>
        ))}
        <hr className="mx-8 my-4 border-accent/40" />
        {secondary.map((i) => (
          <NavLink key={i.path} to={i.path} className={linkClass}>
            {i.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-3 bg-header px-3.5 py-2 text-sm text-white/90">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          G
        </span>
        <span className="flex-1 truncate">Guest</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Sign out">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      </div>
    </aside>
  );
}
