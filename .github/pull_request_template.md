Closes #<ticket>

## What changed
-

## Verified
<!-- The phase's Verify step from BUILD_PLAN.md, and what you actually saw. -->
- [ ] Phase Verify step passed:
- [ ] Scalability Gate (if this phase has one) passed
- [ ] `npm run build` and `npm test` pass

## Playbook checks
- [ ] No tag names outside `seed.ts`
- [ ] No totals/date math in components (all in `lib/aggregate.ts`)
- [ ] Nothing touches localStorage except `lib/storage.ts`
- [ ] No secrets committed (env vars only)
- [ ] One phase only

## Not done / follow-ups
-
