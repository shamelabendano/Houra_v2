# Roadmap

Ideas not yet ticketed. Move an item to a GitHub issue when it is scheduled.

- Phase 8: verify landing + auth + sync with two browsers (needs a Supabase project and env vars).
- Sync: per-session merge by id + `updatedAt` instead of last-write-wins (changes the `Session` type, update AGENTS.md first).
- Settings: export/import JSON backup.
- Settings: import Clockify CSV (create missing tags, skip duplicates).
- Tooling: ESLint (flag `localStorage` outside `storage.ts`, hook mistakes) and a GitHub Actions workflow for build + test + lint. Ask before adding.
- Tidy: move inline `/3600` conversions in `TimeByTagChart.tsx` and `TagEditor.tsx` into `format.ts` / `aggregate.ts`.
