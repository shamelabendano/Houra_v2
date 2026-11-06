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

## Plan-review checklist (use before approving every plan)
1. Any tag name outside seed.ts? 
2. Any totals, filtering or date math inside a page component? Move to `lib/aggregate.ts`.
3. Does anything write to localStorage directly instead of through `storage.ts`?
4. Does the code match the data model exactly, including optional fields?
5. Is the plan trying to do two phases at once? Split it.
