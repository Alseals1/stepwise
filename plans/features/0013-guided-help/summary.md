# 0013 Guided help: summary

**PR:** https://github.com/Alseals1/stepwise/pull/11 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Tour** (`src/tour/`): `placeTooltip` (pure geometry), `steps.ts` (picture, code, controls), `Tour.tsx` (spotlight cut out of a dimmed page, bubble with arrow, Back, Next or Done, Skip tour, Escape, focus handling). It reads the DOM (which targets exist and where they are) through `useSyncExternalStore`.
- `Player`, `CodePanel` and `Controls` carry `data-tour` markers; no layout changes.
- `TopicPage` runs the tour when `!tourSeen || tourRequested`; finishing or skipping calls `markTourSeen`.
- **Saved state:** `help.tourSeen` (additive, a missing value means not seen); `reduce` handles `tourSeen`; Reset keeps it; backups carry it. The provider gains `markTourSeen` and an in-memory `requestTour`.
- **How-to page** (`#/how-to`) and a "How to use" header link; `goTo` helper in the router; `SHORTCUTS` (`src/engine/shortcuts.ts`) as the single list of keyboard shortcuts, with a test that fires each documented key at the real handler.
- Styles for the spotlight, bubble, header actions and the How-to page.
- `CLAUDE.md`: how the tour works, the shortcuts rule, and how tests treat the tour.

## Tests
- Unit: 441 passing (47 files), written red first.
- E2E: 162 passing (81 tests x desktop and phone). A new tour spec starts from a fresh browser; every older spec starts with the tour seen through the Playwright config.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- `Tour` reads the DOM through `useSyncExternalStore` instead of component state set in effects, because React's lint rule rejects `setState` inside an effect.
- The `SHORTCUTS` list and its test were written together, so that test never ran red. It still pins the real handler mapping (a wrong key or handler fails it).
- My first end-to-end check that "the page behind stays usable" clicked Play, which on a phone is under the bubble by design. It now clicks the JS/TS switch inside the highlighted code.
- A small test helper (`markTourSeenInStorage`) and a no-op `scrollIntoView` stand-in were added for the unit tests.

## Process note
This is the first feature merged under the corrected workflow: the summary and the roadmap tick were committed on the feature branch before merging, so nothing was pushed to `dev` directly.

## Follow-ups
- Predict mode (0014) will need a short mention on the How-to page and probably a fourth tour step.
- If a topic page ever gets a different layout, update the `data-tour` markers; the tour skips a step whose target is missing.
- Next in the roadmap: 0014 (predict mode and custom input), then the topics.
