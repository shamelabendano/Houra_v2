# Playbook Improvement Notes

Running list of improvements to the Houra playbook (AGENTS.md, BUILD_PLAN.md, PROMPTS.md).

## 1. One branch per ticket (per phase)

**Observed:** Phases 0 and 1 were committed straight to the main line. Neither AGENTS.md nor BUILD_PLAN.md defines a git workflow, so none was followed.

**Recommendation:** Work each phase on its own branch and merge it through a pull request.

- Branch name: `phase-<n>-<short-name>`, e.g. `phase-2-time-tracker`.
- One phase = one branch = one PR.
- Merge into `main` only after the phase's **Verify** step passes.
- Scalability Gates (after Phases 2 and 4) are checked on the branch before merging, so a failed gate is easy to roll back.
- `main` always holds the last known-good version.

**Where to add it:**
- BUILD_PLAN.md: a "Workflow" line at the top, and "create branch" as the first step of each phase.
- AGENTS.md: a short "Git workflow" section so every agent session follows it.

**Also tidy up:**
- The local branch was `master` while GitHub uses `main`; use `main` everywhere.
- `tsconfig.app.tsbuildinfo` is tracked in git; it is a build artifact and should be in `.gitignore`.

## 2. Tickets and PRs (added 2026-11-08)

**Observed:** PRs were created, but there were no tickets (GitHub issues), no PR template, and no rule for what a PR description must contain. Phase 8 work drifted onto the Phase 7 branch (which had an open PR) because nothing said "new phase = new branch before the first edit".

**Done:** `AGENTS.md` now has a "Git workflow" section; `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/phase-ticket.md` exist. One ticket = one branch = one PR, with `Closes #N`.

**Still to decide:** whether tickets are created by hand or by the agent at the start of a phase (the agent can run `gh issue create` from the BUILD_PLAN phase text).

## 3. Verification is manual and unrepeatable

**Observed:** Every "Verify" step in BUILD_PLAN.md is a human-in-the-browser check. No tests, no lint, no CI. A later phase can silently break an earlier one.

**Recommendation:**
- Unit tests for `aggregate.ts` / `format.ts` from the start (Phase 2 onward: each new helper ships with tests). Added in `chore-aggregate-tests`; writing them immediately found a real bug (`formatDayLabel` ignored its `now` argument).
- Add a `npm run build && npm test` GitHub Action once the first tests exist, so a PR shows red/green.
- Add ESLint (`react-hooks`, no-restricted-syntax for `localStorage`) so the "only through storage.ts" rule is enforced by tooling, not by the plan-review checklist.

## 4. Playbook rules the agent can check mechanically

The PROMPTS.md plan-review checklist is currently only for the human. Add a "Self-check before finishing" block to every phase prompt: grep for tag names outside seed, `localStorage` outside storage, inline `/3600` or `reduce` in components. (Small leftovers today: `TimeByTagChart.tsx` does `seconds / 3600`; `TagEditor.tsx` converts goal hours <-> seconds inline. Both belong in `format.ts` / `aggregate.ts`.)

## 5. Data-safety phase is missing

BUILD_PLAN Phase 8 swaps storage to a backend but never says what happens to existing local data, or conflicts. Today sync is whole-value last-write-wins per key (`sessions` is one array), so two devices editing offline overwrite each other. Add to the plan: first-sign-in migration of local data, a conflict rule (per-session merge by id + updatedAt), and an export/import JSON backup in Settings.

## 6. Prompts hard-code file names, drifting from the code

PROMPTS.md names files that later phases rename or add. Add a rule: the prompt states deliverables and constraints; the agent finds files itself and reports the list. Also add "Definition of done" to each prompt: build passes, tests pass, branch pushed, PR opened with the template, ticket linked.

## 7. Session hygiene

- Start every session with `git status` and `git branch --show-current`; stop and ask if the tree is dirty or the branch is not the ticket's.
- Commit `PLAYBOOK_NOTES.md` changes on a `docs-` branch, not on a feature branch.
- Every project keeps a `DECISIONS.md` (one line per settled choice, with the date) and every session reads it first, so decisions aren't re-litigated. The playbook ships a blank template; each project fills its own. Houra's is `DECISIONS.md`.
- Tickets: at the start of a phase the agent drafts the issue text from BUILD_PLAN.md; the user approves before it is created.
