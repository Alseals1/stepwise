# 0004 Saved progress, streak and badges: summary

**PR:** https://github.com/Alseals1/stepwise/pull/7 (merged into `dev` after all four CI checks passed)

## What changed
- **Pure core** (`src/progress/`): `streak.ts` (local day keys, UTC day math, Monday weeks, `recordStudy`, `currentStreak`, weekly freeze), `badges.ts` (9 data-driven badges), `state.ts` (`SavedState`, `reduce`, `normalizeSpeed`).
- **Storage** (`src/storage/storage.ts`): the only code that touches `localStorage`. Key `stepwise:v1`, version 1, `parseSaved` validates every field and drops what is wrong, `load` and `save` tolerate blocked or full storage.
- **Provider** (`ProgressContext.tsx`): loads once, saves after each event, injectable `storage` and `now`, stable action identities, a toast queue.
- **UI**: header HUD (streak and badge chips), streak panel and storage notice on the map, confirmed Reset progress, badges page (`#/badges`), badge cards, toasts.
- **Engine**: `Player` and `useStepper` take saved language and speed and report a finished run (`onRunComplete`); `TopicPage` wires them to the provider.
- Roadmap: old 0004 split into 0004, 0013 (tour, how-to), 0014 (predict mode, custom input), plus 0015 (export and import). Accounts and sync (Supabase) are noted as v2.
- `CLAUDE.md`: storage, streak rules, badges and the injected-time testing approach.

## Tests
- Unit: 306 passing (35 files), written red first.
- E2E: 92 passing (46 tests x desktop and phone), driven by a faked browser clock.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- Vitest cleans `localStorage` after every test (added to `src/test/setup.ts`) so tests stay independent.
- Two real bugs surfaced by the e2e tests and were fixed: the real checkbox of the Unlock switch was under its visual track, and toasts could cover links (they are now click-through except the dismiss button).
- A misleading e2e title was caught in review ("a new week brings a new freeze" actually showed a Sunday miss belonging to the old week). It was renamed and a true new-week test added.
- The 7-day streak badge e2e runs seven studied days in one test; it takes a few seconds, which is fine.

## Follow-ups
- Progress is per browser. Backup and restore come with export and import (0015); accounts and sync are v2.
- The streak display is computed on render, so a tab left open past midnight shows yesterday's value until the next action or reload.
- No cross-tab sync: two open tabs can overwrite each other's saves (last write wins).
- Next: 0015 export and import (small), 0013 tour and how-to page, 0014 predict mode and custom input, then the topics.
