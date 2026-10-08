# 0017 Glass look for the tour bubble: summary

**PR:** https://github.com/Alseals1/stepwise/pull/12 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- The tour bubble and its arrow are frosted glass: about 78% opaque, the page behind blurred and slightly more saturated, a fine light border and a highlight along the top edge. The cyan ring around the highlighted target is unchanged.
- The arrow is a glass triangle without a border.
- All text in the bubble uses the main text color; the step label and "Skip tour" no longer use the muted color.
- Two tokens were added: `--glass-percent` (78%) and `--glass-blur` (14px).
- Solid fallbacks: `@supports not (backdrop-filter ...)` and `@media (prefers-reduced-transparency: reduce)`.
- The "Your data" modal was not changed.

## Tests
- Unit: 449 passing (48 files). `src/styles/glass.test.ts` is new: worst-case contrast from the tokens, the token-based see-through background, no muted text inside any `.tour-*` rule, and both fallbacks present.
- E2E: 164 passing (82 tests x desktop and phone). One new test confirms in a real browser that the bubble has a blur backdrop filter and a background alpha between 0.6 and 1.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
None.

## Follow-ups
- 78% is about the most see-through the "white page behind the glass" worst case allows while keeping text above 4.5:1. A more transparent look would need the test to use the realistic worst case (the page behind the bubble is dimmed by the spotlight, except when the bubble is docked over the target).
- The same glass treatment could be applied to the "Your data" modal and the toasts if wanted.
- Next in the roadmap: 0014 (predict mode and custom input), then the topics.
