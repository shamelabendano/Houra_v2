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
