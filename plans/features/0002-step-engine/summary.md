# 0002 Step engine: summary

**PR:** https://github.com/Alseals1/stepwise/pull/4 (merged into `dev` after all four CI checks passed)

## What changed
- `src/engine/`: `types.ts` (Frame, Topic), `useStepper`, `useStepperKeys`, `Controls`, `CodePanel`, `highlighter`, `VariablesPanel`, `Narration`, `Player`.
- `src/visuals/ArrayBoxes.tsx`, `src/topics/sum-demo/` (temporary demo topic, replaced by the topic grid in 0003).
- Styles in `src/index.css` (desktop two-column, phone single column with controls pinned to the bottom).
- A topic needs only `record()` plus JS and TS code; a contract test checks both versions have the same line count.

## Tests
- Unit: 57 passing across 11 files, written red first.
- E2E: 20 passing (10 tests x desktop and phone), including real Shiki colors in the browser.
- Lint, typecheck and build pass. `dist/` is 5 files.

## Deviations from the plan
- Added `@shikijs/langs` and `@shikijs/themes` (Shiki's own sub-packages, version 4.5.0). The all-languages loader emitted 309 build files.
- `<output>` for the speed readout was replaced with a `<span>`: `<output>` is a live region and would compete with the narration. The slider uses `aria-valuetext` instead.
- Phone controls are `position: sticky` at the bottom (not in the plan) so Next stays in reach.
- Test setup: added RTL `cleanup` after each test, since Vitest globals are off.

## Lessons for later features
- Playwright key presses right after `goto` can be lost, because React renders after the load event. Wait for visible content first.
- Use `exact: true` on Playwright name matches.
- Fake-timer tests must advance one tick per `act()` when each tick re-arms an effect.

## Follow-ups
- Language choice isn't remembered yet (0004). Predict mode (`ask` on frames) comes in 0004. Motion arrives with the first topic whose boxes move (0005).
