# Houra — Build Plan

One phase per session. Start a fresh agent session for each. Read AGENTS.md first, every time.

### Phase 0 — Foundation
Scaffold Vite + React + TS, install Tailwind, Zustand, React Router, date-fns. Create `types/index.ts` exactly as in AGENTS.md, `lib/storage.ts` (get/set JSON by key, nothing else), the three empty stores, the theme (Poppins, colors), and the AppShell: top bar + sidebar with all nav items routing to placeholder pages. No features. This is the skeleton everything hangs on.

Verify: `npm run dev` runs, clicking each sidebar item changes the page and highlights the item, and refreshing keeps you on the same route.

### Phase 1 — Tags (the data-driven backbone)
Build `useTagStore` (add, edit, delete, list) persisted through `storage.ts`, seed data in `lib/seed.ts`, and the Manage Tags page: "Your Tags" column and "Sub Tags" column, an add-tag row, and a three-dot menu for edit/delete (name, color, icon, parent). Tags come first because every later screen needs them to exist.

Verify: add a tag, refresh, it is still there. Delete a tag and its sub-tags are handled (decide: block delete if sessions use it, or reassign to untagged).

**SCALABILITY GATE 1 (run after Phase 2):** add a brand-new tag called "Reading" from the UI. It must appear in the tag picker on the Time Tracker and in the history rows with its own color and icon, with zero code changes. If it needs code, fix the leak first.

### Phase 2 — Time Tracker (the core record)
`useSessionStore` with `startSession(title, tagId)` and `stopSession()`, enforcing one running session. Time Tracker page: the top entry row (title input, tag picker, start/stop, live elapsed time), then a list of sessions grouped by day with a day total. Group and total using `aggregate.ts` (`totalByDay`, `durationSec`), formatting using `format.ts`. Allow manual add/edit of start and end times through the row's menu.

Verify: start a timer, refresh the page mid-run, the timer keeps counting from the real start time. Stop it, it appears under "Today" with the correct duration and day total.

### Phase 3 — Progress History + "where does my time go?"
Progress History page reads the same sessions and adds a range filter (This Week, Last Week, This Month) via `rangeForPreset` and `inRange`. Add a "Time by tag" bar or donut chart using Recharts, fed by `totalByTag`. This is the screen that answers the original question.

Verify: switch ranges and the list, totals and chart all change together. Chart totals equal the sum of the listed sessions.

### Phase 4 — Home dashboard + widget registry
`widgets/registry.ts` and a DashboardGrid that only does `registry[widget.type].component`. Register: TagStat (tracked vs weekly goal, from `goalProgress`), TimeTracker (compact), Clock, Calendar. Dashboard layout (`DashboardWidget[]`) stored in settings with an "Add a tag" card that creates a TagStat widget.

Verify: all widgets render with real data from Phases 1–3.

**SCALABILITY GATE 2:** register one extra widget (e.g. a "Today total" card) by adding one component and one registry line. It must appear on the Home dashboard with no edits to the grid component.

### Phase 5 — Pomodoro
Pomodoro page and widget: focus length, break length, skip breaks. Completed focus blocks are saved as `Session` records with `source: "pomodoro"`, so they automatically show up in history, charts and totals.

Verify: finish a short 1-minute focus block, it appears in Today's list and in the tag totals.

### Phase 6 — Earnings
Add hourly rate to tags (sub-tags inherit the parent's). `aggregate.earnings(sessions, tags)` and the Earnings page plus the "Current Session ₱0000.00" live card and Earnings widget on Home.

Verify: tag with rate 200/hr, 30-minute session shows 100.00 everywhere it appears.

### Phase 7 — Calendar, Dark mode, polish
Calendar page showing sessions by day, dark mode toggle in Settings, empty states, mobile layout check.

Verify: sessions on a given date appear on that calendar date; theme persists after refresh.

### Phase 8 — Landing page + auth/sync
Public landing page (Home, Features, About, Credits from the prototype) rendered OUTSIDE the AppShell with no sidebar. Then swap `storage.ts` to a backend (Supabase is the suggested pick) so data syncs across devices. Only `storage.ts` and the auth layer change.

Verify: sign in on two browsers and see the same sessions.
