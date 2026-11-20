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

### Phase 8 — Landing page + auth/sync (IN PROGRESS, draft PR #10)
Public landing page (Home, Features, About, Credits from the prototype) rendered OUTSIDE the AppShell with no sidebar. Then swap `storage.ts` to a backend (Supabase is the suggested pick) so data syncs across devices. Only `storage.ts` and the auth layer change.

Status: code is written on `phase-8-landing-auth-sync` but has never run against a real Supabase project. Remaining: create the Supabase project, set env vars, run the two-browser check, merge.

Verify: sign in on two browsers and see the same sessions.

### Phase 9 — Export / Import (Settings)
Settings page with a Backup section: export tags, sessions, settings and dashboard to a JSON file, and import one back (Merge adds records with new ids; Replace overwrites). Storage is still only touched through `storage.ts`; logic lives in `lib/backup.ts`.

Verify: export, import into a second browser, and see the same sessions; invalid or non-Houra files show an error and change nothing.

### Phase 9.5 — Group UX Fixes (Calendar, uncommitted on `local-preview`)
Interaction fixes on top of the Phase 7 time-grid calendar and its drag-to-move. All edits go through `useSessionStore`; `Session`, `Tag` and `Settings` do not change, and durations still come from `aggregate.ts`.

Changes (all in `src/pages/Calendar.tsx` unless noted):
- **Undo:** each calendar edit (move, resize, create) pushes the previous session onto a stack (limit 20); a toast offers Undo for 6 seconds. Backed by the new `restoreSession(session)` in `src/store/useSessionStore.ts`, which replaces a session by id or re-inserts it if it was deleted.
- **Drag across midnight:** a drag now moves the session by minutes (`shiftMin`) instead of days + minutes, so a block can cross midnight into other days. The move is recomputed from the pointer plus how far the grid scrolled since the press.
- **Select, then drag:** the first press only selects a block; a selected block can then be dragged. Drag threshold raised from 4px to 8px so small hand wobbles don't count as a drag.
- **Resize:** drag a block's top or bottom edge to change its start or end. Only the real start/end of a session can be resized, not a midnight clip.
- **Create from the grid:** clicking an empty spot starts a new time block to fill in.
- **Auto-scroll while dragging:** near the top or bottom edge of the grid the view keeps scrolling so far-away times are reachable.
- **End-time label:** shown only on tall, full-width blocks (`END_TIME_MIN_HEIGHT_PX`, about 1h at base zoom); short blocks show their end by their bottom edge, and overlapping lanes are too narrow for the extra line.
- **Time label placement:** sits above the block, or below it when too close to the top of the day, never on top of the block.

Verify: move a session across midnight and Undo puts it back exactly; resize both edges and the day total changes to match; click an empty slot, save, and it appears in Today and History; delete then Undo restores the session; export a backup before and after and confirm only the edited sessions differ.

Status: not committed or merged. Remaining: split into small `Calendar:` commits, open a PR, add it to the order of work.

### Phase 10 — Revamp: Today / History / Insights
Merge the overlapping views by job: Today (timer + today's log + quick totals, replaces Home and Time Tracker), History (Day / Week / Month toggle, replaces Calendar and the Progress History list), Insights (trends, goals, streaks, earnings). UI and navigation only; `Session`, `Tag` and `Settings` do not change. Before starting, decide: keep or drop the Home widget grid (dropping it changes the stored dashboard layout, which sync uploads), and where Pomodoro, Earnings, Manage Tags and Settings live.

Verify: every number matches the pre-revamp pages for the same date range; nothing that was reachable before is lost.

### Phase 11 — Landing page polish
Update landing screenshots and copy to match the revamped app.

---

## Order of work (from now)
1. Land the open PRs: #7 (calendar), time-grid calendar branch, title-spaces fix, #11 (Phase 9), #9 (tests), #8 (docs).
2. Commit and PR the Group UX Fixes (Phase 9.5).
3. Finish Phase 8 (Supabase check, merge #10).
4. Phase 10 revamp.
5. Phase 11 landing polish.
ESLint/CI stay on ROADMAP.md until the user confirms.
