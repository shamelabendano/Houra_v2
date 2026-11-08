# Decisions

One line per settled choice. Read before starting work; change a line only when the user says so.

- 2026-11-08: Deleting a tag also deletes its sub-tags; their sessions become untagged (see `useTagStore.deleteTag`).
- 2026-11-08: Weeks start on Monday (`rangeForPreset`).
- 2026-11-08: A session belongs to the day/range its start time falls in.
- 2026-11-08: Default currency is PHP.
- 2026-11-08: Single-device use is fine for now; sync is last-write-wins per key. Per-session merge is on the roadmap.
- 2026-11-08: First sign-in merges existing local data into the account.
- 2026-11-08: Imports use CSV (Clockify export format); JSON is for Houra's own backup. PDF is not supported.
- 2026-11-08: ESLint/CI are added only after the user confirms.
