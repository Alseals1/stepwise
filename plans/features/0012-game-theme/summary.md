# 0012 Game theme: summary

**PR:** https://github.com/Alseals1/stepwise/pull/5 (merged into `dev` after all four CI checks passed)

## What changed
- `src/styles/tokens.css`: all colors, fonts and radii as CSS variables. Violet `#7c3aed` primary, cyan highlights, amber for streaks and stars (not used yet), on a navy-violet background.
- `src/index.css` rewritten: header, raised panels with soft glow, chunky 3D-press buttons, array tiles (current pops and glows cyan, done turns emerald), cyan edge on the current code line, variables chips, narration card, glowing progress bar, sticky controls on phones.
- `src/engine/ProgressBar.tsx` (accessible), used by `Controls`; "Run complete" badge on the last step.
- `src/App.tsx`: header with a three-step logo (inline SVG) and the wordmark.
- Self-hosted fonts via `@fontsource-variable/outfit` and `@fontsource-variable/jetbrains-mono`.
- Roadmap and `CLAUDE.md` design rules updated for the game direction. Feature 0012 is built before 0003.

## Tests
- Unit: 85 passing (14 files). New: token contrast (19), no-hardcoded-colors, ProgressBar (4), Controls progress and Run complete (2), App banner (1).
- E2E: 30 passing (15 tests x desktop and phone). New: dark background, fonts bundled with zero outside requests, visible focus outline, reduced motion, Run complete and Restart.
- Lint, typecheck and build pass. `dist/` is 12 files.

## Deviations from the plan
- Vitest got `css: true` so tests can read `tokens.css?raw` (by default Vitest stubs CSS out and `?raw` returned `undefined`).
- The no-hardcoded-colors test lives in its own file, so tokens could be committed before the restyle without a failing test.
- Reserved space for the Run complete badge (`min-height` on the progress block) after a screenshot check showed the panel jumping.

## Follow-ups
- `--amber` is defined and contrast-tested but not used yet; it's for streaks and stars (0003 and 0004).
- Level map, locked and completed stages, stars: 0003. Real unlocking, streak and badges: 0004.
- Open question for 0004: should locked topics ever be skippable (an "unlock all" switch), since the owner is studying on a deadline?
- The wordmark uses gradient text; both gradient ends pass contrast on the page background, but the middle can't be measured by the test.
