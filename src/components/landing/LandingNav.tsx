import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SUPPORT_URL } from "./support";

const links = [
  { id: "home", label: "Home", icon: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { id: "features", label: "Services", icon: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.2-2.2z" },
  { id: "about", label: "About us", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z" },
];

const buttonClass =
  "rounded-xl bg-primary px-5 py-2 text-[15px] font-medium text-white shadow-[0_4px_0_#2563eb] transition active:translate-y-0.5 active:shadow-[0_2px_0_#2563eb]";

/** Sticky nav. The right-hand button is the tagline at the top and "Buy me a Choco-kape" once scrolled. */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center gap-4 bg-accent px-5 text-white">
      <span className="text-[28px] font-bold leading-none">Houra</span>
      <nav className="ml-auto hidden items-center gap-10 md:flex">
        {links.map((l) => (
          <a key={l.id} href={`#${l.id}`} className="flex items-center gap-2 text-[17px] hover:opacity-80">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={l.icon} />
            </svg>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="ml-auto md:ml-10">
        {scrolled && SUPPORT_URL ? (
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className={buttonClass}>
            ☕ Buy me a Choco-kape
          </a>
        ) : (
          <Link to="/home" className={buttonClass}>
            Your time, your terms
          </Link>
        )}
      </div>
    </header>
  );
}
