# Houra — Project Spec

A time tracker for people who want to see where their hours actually go: start a timer, tag it, and view time (and optional earnings) by tag.

This file is the always-loaded spec. The phased roadmap is in BUILD_PLAN.md.
The visual reference is the prototype screenshots in /prototype (match the look: soft blue/periwinkle, rounded cards, Poppins font, 3D-ish colored tag icons).

## Core principle: data-driven, single source of truth

1. **Tags are data** — stored in the tag store (with optional parent for sub-tags). Every screen that shows a tag (colors, icon, name, totals) reads from the store.
2. **Session is the single source of truth** — one record type: a block of time with a start, an end, and a tag. Every number in the app (daily totals, weekly goals, per-tag time, earnings) is an aggregation over the sessions array.
3. **Widgets come from a registry** — Home dashboard cards (tag stats, earnings, pomodoro, clock, calendar, time tracker) are registered by type. The dashboard grid never changes when a widget is added.

Two rules that keep it scalable:
- No tag name ("Work", "Gym", "Code", "School") appears anywhere except the seed data.
- Every computed number (totals, durations, earnings, goal progress) comes from a helper in `src/lib/aggregate.ts`, never inline in a component.

## Stack
- React 18 + Vite + TypeScript (UI and tooling)
- React Router (one route per sidebar item)
- Zustand (global state: tags, sessions, settings)
- Tailwind CSS (styling)
- Recharts (charts, from Phase 3)
- Persistence: localStorage, accessed ONLY through `src/lib/storage.ts` (swappable for a backend later)
- Dates: date-fns

## Data model (src/types/index.ts)
```ts
export interface Tag {
  id: string;
  name: string;
  color: string;            // hex, drives card + icon color
  icon: string;             // icon key, e.g. "code", "dumbbell"
  parentId: string | null;  // null = top-level tag, otherwise a sub-tag
  hourlyRate?: number;      // optional, in settings.currency; sub-tags inherit parent's
  weeklyGoalSec?: number;   // optional, powers the "12:21 | 40:00" cards
  createdAt: string;        // ISO
}

export interface Session {
  id: string;
  title: string;
  tagId: string | null;     // null = untagged (grey icon, e.g. "Dinner Time")
  startedAt: string;        // ISO
  endedAt: string | null;   // null = currently running
  source: "timer" | "pomodoro" | "manual";
}

export interface Settings {
  currency: string;         // "PHP"
  theme: "light" | "dark";
}

export interface DashboardWidget {
  id: string;
  type: string;             // key into the widget registry
  config?: Record<string, unknown>; // e.g. { tagId } for a tag-stat widget
}
```
Duration is NEVER stored. It is `endedAt - startedAt`, computed by `aggregate.ts`.
At most one session may have `endedAt === null` at a time.

## File structure
```
src/
  types/index.ts          # the data model above, verbatim
  lib/
    storage.ts            # load/save adapter (localStorage now, backend later)
    aggregate.ts          # durationSec, totalByTag, totalByDay, rangeForPreset, inRange, earnings, goalProgress
    format.ts             # formatDuration(sec) -> "00:39:38", formatTime, formatCurrency
    seed.ts               # default tags + demo sessions (the ONLY place tag names appear)
  store/
    useTagStore.ts       # tags CRUD
    useSessionStore.ts   # sessions CRUD, start/stop
    useSettingsStore.ts
  widgets/
    registry.ts          # { [type]: { title, component, defaultSize } }
    TagStatWidget.tsx, EarningsWidget.tsx, PomodoroWidget.tsx, ClockWidget.tsx, CalendarWidget.tsx, TimeTrackerWidget.tsx
  components/            # dumb UI pieces: SessionRow, TagBadge, Sidebar, AppShell
  pages/                 # Home, TimeTracker, ProgressHistory, ManageTags, Pomodoro, Calendar, Earnings, Landing
  App.tsx                # router
```

## Branding
Calm, friendly, productive. Periwinkle/sky-blue header (#9EC1FF-ish), white content area, pale blue panels, blue primary buttons with a slight 3D bottom edge, rounded 12–16px corners, Poppins. Tag colors come from tag data (pink gym, orange work, green code, yellow school are seed examples only). Tagline: "Your time, your terms."


## Git workflow (every session follows this)
- `main` is always the last known-good version. Never commit to it directly.
- One ticket (GitHub issue, from `.github/ISSUE_TEMPLATE/phase-ticket.md`) = one branch = one PR.
- Branch names: `phase-<n>-<short-name>`, `fix-<short-name>`, `chore-<short-name>`, `docs-<short-name>`. Branch from an up-to-date `main`.
- Never mix work from two phases on one branch. If you notice out-of-scope work, make a new ticket instead.
- Commits: imperative subject, e.g. `Phase 6: Earnings page`. Commit only files belonging to the ticket.
- Open the PR with `.github/pull_request_template.md` filled in, including "Closes #N" and what you actually verified. Merge only after the phase's Verify step (and any Scalability Gate) passes.
- Never commit secrets (`.env*` except `.env.example`) or build artifacts (`dist`, `*.tsbuildinfo`).
- Run `npm run build` and `npm test` before opening a PR.
