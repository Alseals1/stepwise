# 0012 Game theme

## Goal
Replace the light "Tufte lesson" look with a dark, sleek game UI. Restyle everything that exists today (header, step player, controls, code panel, variables, array boxes, narration) and lay the design foundation the level map (0003) and game mechanics (0004) will build on.

## Decisions (from the owner)
Dark only in v1 · violet + cyan (amber for streaks and stars) · fun but grown-up tone · no mascot · fonts self-hosted through npm · level map, daily streak and badges later (no XP or levels) · look first, real mechanics in 0004.

## User-visible behavior
- **Page:** deep navy-violet background with a soft violet glow at the top. A header with a "Stepwise" wordmark and a small inline-SVG step icon.
- **Panels:** the player, code, variables and controls sit on raised dark cards with rounded corners, thin violet borders and a soft glow.
- **Buttons:** chunky, with a solid lower edge that sinks when pressed. Violet for the main action (Play/Pause), dark for the rest.
- **Step progress:** a glowing cyan progress bar next to "Step 5 of 9".
- **Array boxes:** tiles. The current tile glows cyan and pops in when it becomes current; finished tiles turn emerald.
- **Code panel:** keeps the Shiki colors; the current line gets a cyan edge and violet highlight.
- **Finish moment:** on the last step, a "Run complete" badge appears with a short sparkle animation.
- Fonts: Outfit for text, JetBrains Mono for code, bundled with the app (no external requests).
- All animation stops under `prefers-reduced-motion`.

## Acceptance criteria
- Colors exist only as CSS variables in `src/styles/tokens.css`. No hex or `rgb()` color anywhere else in the CSS.
- Every text and background pair that matters meets WCAG AA (4.5:1 for text, 3:1 for the focus ring), checked by a unit test.
- Visible keyboard focus outline on all controls; touch targets stay at least 44px.
- Existing behavior and all existing tests still pass (only styling and the new progress bar and finish badge are added).
- No sideways scrolling at 390 px.

## Tests (red first)
Unit:
- `tokens.css`: parse the variables; contrast ratios for the text, muted, primary-button, accent, cyan, amber, success and danger pairs; focus ring against the background.
- No hex or `rgb()` colors in any `src/**/*.css` except `tokens.css`.
- `ProgressBar`: `role="progressbar"` with `aria-valuenow/min/max` and a label; clamps values outside the range.
- `Controls`: shows the progress bar at the right position (step 3 of 7 means 3/7).
- `Player`: "Run complete" appears on the last step only.
- `App`: header wordmark.

E2E (no screenshot comparisons):
- The page background is dark (luminance below a threshold) at both widths.
- The Outfit font is loaded (`document.fonts.check`).
- Keyboard Tab shows a visible focus outline.
- With reduced motion emulated, the current tile has `animation-name: none`.
- Last step shows "Run complete"; Restart hides it.
- Existing player tests still pass; no sideways scroll.

I will also look at screenshots by eye at both widths, kept outside the repo.

## Files
`src/styles/tokens.css`, `src/styles/tokens.test.ts`, `src/index.css` (restyle), `src/main.tsx` (font + token imports), `src/App.tsx` (header), `src/engine/ProgressBar.tsx` + test, `src/engine/Controls.tsx`, `src/engine/Player.tsx` + tests, `e2e/theme.spec.ts`, `CLAUDE.md` if commands or rules change.

## Dependencies (approved: "self-hosted via npm")
- `@fontsource-variable/outfit`
- `@fontsource-variable/jetbrains-mono`

I picked these two fonts myself from "a rounded display font plus a mono font". Shout if you want different ones.

## Not in this feature
Level map, streak, badges, stars, locking (0003 and 0004). A mascot (decided against). A light theme (later, if wanted). Motion library (CSS only for now).

## Open questions
None blocking.
