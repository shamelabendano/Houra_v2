# Houra — Opening Prompts

Paste one per session. Always start a fresh session per phase.
Put the prototype screenshots in `/prototype` before Phase 0.

## Phase 0 — Foundation
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 0 only. Plan it before writing code.

Deliverables: Vite + React + TypeScript scaffold, Tailwind, Zustand, React Router, date-fns; `src/types/index.ts` copied exactly from AGENTS.md; `src/lib/storage.ts` (typed load/save JSON helpers); three empty Zustand stores; the AppShell (top bar + sidebar) matching /prototype/Time Tracker Tab.png; placeholder pages for every sidebar item. No features.

Also explain each file you create in one sentence so I can follow along. Verify the sidebar routing in the browser before finishing.

## Phase 1 — Tags
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 1 only. Plan it before writing code.

Deliverables: `useTagStore` persisted through `lib/storage.ts`; `lib/seed.ts` with starter tags Work, Gym, Code, School; the Manage Tags page matching /prototype/Manage Tags Tab.png, including sub-tags and a three-dot menu for edit/delete. No tag name may appear outside seed.ts. Verify add, edit, delete and refresh persistence before finishing.

## Phase 2 — Time Tracker
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 2 only. Plan it before writing code.

Deliverables: `useSessionStore` (start/stop, only one running session); `lib/aggregate.ts` with `durationSec` and `totalByDay`; `lib/format.ts`; the Time Tracker page matching /prototype/Time Tracker Tab.png, grouped by day with day totals. Timer must survive a page refresh (compute from `startedAt`, don't count ticks). Then run Scalability Gate 1. Verify before finishing.

## Phase 3 and onward
Same pattern: "Read AGENTS.md and BUILD_PLAN.md. We're doing Phase N only. Plan it before writing code." then the deliverables from that phase in BUILD_PLAN.md, then "verify [that phase's verify step] before finishing."

## Phase 4 — Home dashboard + widget registry
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 4 only. Plan it before writing code.

Deliverables: `src/widgets/registry.ts` (`{ [type]: { title, component, defaultSize } }`); a DashboardGrid that only does `registry[widget.type].component` and never names a widget type; widgets `TagStatWidget.tsx` (tracked vs weekly goal, using a new `goalProgress` helper added to the existing `src/lib/aggregate.ts`), `TimeTrackerWidget.tsx` (compact, reuse `SessionRow` and `TagPicker`), `ClockWidget.tsx` (reuse `src/lib/useNow.ts`) and `CalendarWidget.tsx`. Replace the placeholder in `src/pages/Home.tsx` with the grid. Make `src/store/useSettingsStore.ts` persist `settings` and `dashboard` (`DashboardWidget[]`) through `src/lib/storage.ts`, like `useTagStore` does. The "Add a tag" card creates a TagStat widget with `config: { tagId }`. Match /prototype/Home Tab (2).png (greeting card, tag stat cards, Time Tracker, Clock, Calendar); /prototype/Home Tab.png is the earlier wireframe of the same layout. Skip the Earnings and Pomodoro cards for now; they come in Phases 5 and 6. Verify that all widgets render with real data from Phases 1 to 3 before finishing.

Then run **Scalability Gate 2**: register one extra widget (e.g. a "Today total" card) by adding one component and one registry line. It must appear on the Home dashboard with no edits to the grid component. If it needs more than that, fix the leak first.

Also explain each file you create in one sentence.

## Phase 5 — Pomodoro
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 5 only. Plan it before writing code.

Deliverables: replace the placeholder in `src/pages/Pomodoro.tsx` with the Pomodoro page (focus length, break length, skip breaks, tag picker via `TagPicker`); create `src/widgets/PomodoroWidget.tsx` and register it in `src/widgets/registry.ts` with one line. Timer state must survive a refresh by storing the phase start time and computing remaining time from it (same principle as the Time Tracker, via `useNow`). A completed focus block is saved through `useSessionStore` as a `Session` with `source: "pomodoro"`; breaks are never saved. Do not touch the aggregation helpers: pomodoro sessions must flow into totals, history and charts as they are. There is no dedicated Pomodoro screenshot, so match the Pomodoro card in /prototype/Home Tab (2).png (focus length stepper, "Skip breaks" checkbox, "Start focus session" button). Verify that a 1-minute focus block appears in Today's list on the Time Tracker and in the tag totals on Progress History before finishing.

Also explain each file you create in one sentence.

## Phase 6 — Earnings
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 6 only. Plan it before writing code.

Deliverables: add an hourly rate field to `src/components/TagEditor.tsx` (the `hourlyRate` field already exists on `Tag` in `src/types/index.ts`; sub-tags inherit the parent's); add `earnings(sessions, tags)` to `src/lib/aggregate.ts` and `formatCurrency` to `src/lib/format.ts`, with currency read from `useSettingsStore`; replace the placeholder in `src/pages/Earnings.tsx` with the Earnings page (totals by tag and by range, reusing `rangeForPreset`, `inRange` and `tagChartData`) plus a live "Current Session ₱0000.00" card that ticks via `useNow`; create `src/widgets/EarningsWidget.tsx` and register it with one line. Earnings math lives only in `aggregate.ts`, never in a component. Match the Earnings card in /prototype/Home Tab (2).png; there is no dedicated Earnings page screenshot, so reuse the card and panel style of /prototype/Progress History Tab.png. Verify that a tag at 200/hr with a 30-minute session shows 100.00 everywhere it appears (Earnings page, widget, current-session card) before finishing.

Also explain each file you create in one sentence.

## Phase 7 — Calendar, Dark mode, polish
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 7 only. Plan it before writing code.

Deliverables: replace the placeholder in `src/pages/Calendar.tsx` with a month calendar showing sessions by day (group with `totalByDay` in `src/lib/aggregate.ts`; reuse `SessionRow` for the day detail, and share a month-grid component with `src/widgets/CalendarWidget.tsx`); a dark mode toggle that writes `settings.theme` in `src/store/useSettingsStore.ts` and applies it in `src/components/AppShell.tsx` and `src/index.css` (the sidebar in /prototype/Home Tab (2).png shows "Dark mode", "Preferences" and "Themes" entries, add only what dark mode needs); empty states for pages with no data (`TimeTracker.tsx`, `ProgressHistory.tsx`, `ManageTags.tsx`, `Earnings.tsx`); and a mobile layout pass on `Sidebar.tsx` and `AppShell.tsx`. There is no Calendar page screenshot, so base it on the Calendar card in /prototype/Home Tab (2).png and the panel style of the other pages. Colors must come from tag data, so make sure dark mode doesn't hardcode any. Verify that sessions on a given date appear on that calendar date and that the theme persists after a refresh before finishing.

Also explain each file you create in one sentence.

## Phase 8 — Landing page + auth/sync
Read AGENTS.md and BUILD_PLAN.md. We're doing Phase 8 only. Plan it before writing code.

Deliverables: a public Landing page (Home, Features, About, Credits sections) in `src/pages/Landing.tsx` rendered OUTSIDE the AppShell with no sidebar: add a second route group in `src/App.tsx` next to the AppShell group, and keep `src/components/navItems.ts` as the app's sidebar and router source. Then swap `src/lib/storage.ts` to a backend (Supabase is the suggested pick) so data syncs across devices, plus an auth layer (sign in/out, route guard for the AppShell routes). Only `storage.ts` and the auth layer may change: `useTagStore`, `useSessionStore` and `useSettingsStore` keep their current API, and `src/lib/aggregate.ts` is untouched. Do the landing page first and confirm it before starting sync, and never put keys or secrets in source: use env vars. Match /prototype/Main Page.png (hero with the Houra logo over the app preview, nav with Home, Services, About us, tagline button), /prototype/Main Page (2).png (same, with the "Buy me a Choco-kape" button), /prototype/Feature Page.png, /prototype/Description Page.png and /prototype/Credits Page.png. Verify that signing in on two browsers shows the same sessions before finishing.

Also explain each file you create in one sentence.

## Plan-review checklist (use before approving every plan)
1. Any tag name outside seed.ts? 
2. Any totals, filtering or date math inside a page component? Move to `lib/aggregate.ts`.
3. Does anything write to localStorage directly instead of through `storage.ts`?
4. Does the code match the data model exactly, including optional fields?
5. Is the plan trying to do two phases at once? Split it.
