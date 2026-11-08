import type { ReactNode } from "react";

interface Feature {
  title: string;
  body: string;
  icon?: ReactNode;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const features: Feature[] = [
  {
    title: "Time Tracker",
    body: "Track work sessions and log every minute with accuracy.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: "Pomodoro Mode",
    body: "Focus with built-in timers and custom break lengths.",
    icon: <span className="text-[44px] font-light">25</span>,
  },
  {
    title: "Freelancing",
    body: "Convert time tracked into real-world earnings.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2.2 0 3 6 1.6 6 4.3 0 1.4-1.3 2.2-3 2.2-1.4 0-2.6-.6-3-1.700M12 5.5v13" />
      </svg>
    ),
  },
  {
    title: "Charts & graphs",
    body: "See where your hours go with time-by-tag charts.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="14" width="4" height="7" />
        <rect x="10" y="9" width="4" height="12" />
        <rect x="17" y="4" width="4" height="17" />
      </svg>
    ),
  },
  { title: "Coming soon", body: "Calendar feature" },
  { title: "Coming soon", body: "" },
];

// A few dandelion seeds in the corners, as in the prototype.
const seeds = [
  "top-6 right-8 rotate-12",
  "top-24 right-24 -rotate-12",
  "bottom-10 left-8 rotate-45",
  "bottom-24 left-28 -rotate-12",
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-white px-6 py-20">
      {seeds.map((pos) => (
        <svg key={pos} aria-hidden="true" width="56" height="56" viewBox="0 0 24 24" className={`absolute ${pos} text-accent/70`} {...stroke} strokeWidth={1}>
          <path d="M12 22V10M12 10l-6-5M12 10l6-5M12 10V2M12 10l-9-1M12 10l9-1" />
        </svg>
      ))}
      <h2 className="mb-14 flex items-center justify-center gap-4 text-center text-[44px] font-bold text-accent">
        <svg width="44" height="44" viewBox="0 0 24 24" {...stroke}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.2-2.2z" />
        </svg>
        Features
      </h2>
      <div className="mx-auto grid max-w-[940px] gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <article key={i} className="relative mt-12 flex min-h-[190px] flex-col items-center rounded-card bg-[#f1f7ff] px-6 pb-6 pt-14 text-center text-primary">
            <div className="absolute -top-12 flex h-[106px] w-[106px] items-center justify-center rounded-[22px] bg-[#ddebff] text-accent">
              {f.icon}
            </div>
            <h3 className="text-2xl font-bold">{f.title}</h3>
            <p className="mt-1 text-[15px]">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
