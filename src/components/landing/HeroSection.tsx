import HourglassLogo from "../HourglassLogo";

// Presentational stand-in for the app UI; the numbers are decoration, not tracked data.
const rows = [
  { title: "Planning the week", time: "00:39:38" },
  { title: "Deep work block", time: "00:55:46" },
  { title: "Invoice follow-ups", time: "02:50:31" },
  { title: "Lunch", time: "00:16:10" },
  { title: "Client call", time: "00:29:01" },
];

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-[calc(100vh-60px)] overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none opacity-30">
        <div className="absolute inset-y-0 left-0 hidden w-56 bg-sidebar md:block" />
        <div className="absolute inset-0 px-6 pt-8 md:pl-72 md:pr-10">
          <p className="mb-4 text-[44px] font-light">Time Tracker</p>
          <div className="mb-8 h-12 rounded-full border border-line/40" />
          {rows.map((r) => (
            <div key={r.title} className="mb-3 flex h-12 items-center gap-4 rounded-full border border-line/40 px-4">
              <span className="h-7 w-7 rounded-lg bg-panel" />
              <span className="flex-1 truncate text-[15px]">{r.title}</span>
              <span className="text-[15px]">{r.time}</span>
              <span className="h-7 w-16 rounded-lg bg-panel" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/60 to-white" />
      </div>
      <div className="relative flex min-h-[calc(100vh-60px)] flex-col items-center justify-center gap-4 px-6 sm:flex-row sm:gap-3">
        <HourglassLogo size={64} />
        <h1 className="text-[64px] font-bold leading-none text-accent sm:text-[120px]">Houra</h1>
      </div>
    </section>
  );
}
