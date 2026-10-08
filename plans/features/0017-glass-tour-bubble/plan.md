# 0017 Glass look for the tour bubble

## Goal
Give the tour's tip bubble a frosted-glass look: translucent, with the page showing through blurred, a fine light edge and a soft glow. Requested by the owner.

## Scope
Only the tour bubble and its arrow. The "Your data" modal is not changed (it can get the same treatment later if wanted).

## User-visible behavior
- The bubble's background is see-through (about 78% opaque) and blurs and slightly saturates what is behind it.
- A thin light border and a faint highlight along the top edge replace the solid cyan outline. The cyan ring around the highlighted target stays, so the pointer relationship is still obvious.
- The arrow is glass too, without a border, so it reads as part of the bubble.
- All bubble text is the main text color, so it stays readable over whatever the page shows behind.
- **Fallbacks:** with "reduce transparency" turned on in the operating system, or in a browser without backdrop blur, the bubble is solid as before.

## Acceptance criteria
- The text in the bubble keeps at least 4.5:1 contrast even in the worst case (the bubble over a pure white page). A test computes it from the tokens.
- No hardcoded colors; the glass amount and blur live as tokens.
- Both fallbacks exist in the CSS and are checked by a test.
- The bubble stays fully on screen and keeps all its existing behavior (tests unchanged).

## Tests (red first)
Unit: the contrast calculation with the glass opacity token; no `--text-muted` inside any `.tour-*` rule; the bubble rule has `backdrop-filter`; both fallback blocks exist.
E2E: in a real browser, the bubble has a blur backdrop filter and a background that is not fully opaque.

## Files
`src/styles/tokens.css`, `src/index.css`, `src/styles/glass.test.ts`, `e2e/tour.spec.ts`.

## Dependencies
None.

## Open questions
None.
