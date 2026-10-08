# 0017 Glass look for the tour bubble: summary

**PR:** https://github.com/Alseals1/stepwise/pull/12 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- The tour bubble and its arrow are frosted glass: about 78% opaque, the page behind blurred and slightly more saturated, a fine light border and a highlight along the top edge. The cyan ring around the highlighted target is unchanged.
- The arrow is a glass triangle without a border.
- All text in the bubble uses the main text color; the step label and "Skip tour" no longer use the muted color.
- Two tokens were added: `--glass-percent` (78%) and `--glass-blur` (14px).
- Solid fallbacks: `@supports not (backdrop-filter ...)` and `@media (prefers-reduced-transparency: reduce)`.
- The "Your data" modal was not changed.
- **Also fixed (found by CI on this PR):** the tour spotlight could end up away from its target if the page layout shifted by itself after the tour started (for example a web font loading and the text above re-wrapping), because the tour only re-measured on scroll and resize. It now also re-measures when the page's size changes (a `ResizeObserver` on the body) and when fonts finish loading. This was a real bug that a slow connection could have shown to a learner.

## Tests
- Unit: 452 passing (48 files). `src/styles/glass.test.ts` is new: worst-case contrast from the tokens, the token-based see-through background, no muted text inside any `.tour-*` rule, and both fallbacks present.
- E2E: 166 passing (83 tests x desktop and phone). One new test confirms in a real browser that the bubble has a blur backdrop filter and a background alpha between 0.6 and 1; another reproduces a layout shift under the tour.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- The plan was only styling. The first CI run on this PR failed an older tour test (the spotlight was 25px off its target on the phone project), which exposed the layout-shift bug above. The fix and its tests are part of this PR rather than a separate one, because merging was blocked by the failure.
- The browser test that reproduces the shift has to switch off scroll anchoring: otherwise the browser compensates with a scroll event, which the old code did listen for, and the bug stays hidden. It was checked to fail on the old code and pass on the fix.
- The exact-pixel spotlight check now allows 1px of sub-pixel rounding.

## Follow-ups
- 78% is about the most see-through the "white page behind the glass" worst case allows while keeping text above 4.5:1. A more transparent look would need the test to use the realistic worst case (the page behind the bubble is dimmed by the spotlight, except when the bubble is docked over the target).
- The same glass treatment could be applied to the "Your data" modal and the toasts if wanted.
- Next in the roadmap: 0014 (predict mode and custom input), then the topics.
