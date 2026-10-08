# 0001 Project scaffold: summary

**PR:** https://github.com/Alseals1/stepwise/pull/2 (merged into `dev` after all four CI checks passed)

## What changed
- Vite + React 19 + TypeScript app (npm). `npm run dev` shows the "Stepwise" heading and tagline.
- Vitest + React Testing Library with jsdom and jest-dom (`src/test/setup.ts`).
- Playwright in Chromium with two projects: `desktop` and `phone` (390 px wide). Screenshots only on failure, written to the git-ignored `test-results/`.
- ESLint (flat config, typescript-eslint, react-hooks) and `tsc -b` typecheck.
- `.githooks/pre-commit` (enabled by the npm `prepare` script): rejects Playwright artifacts, then runs lint, typecheck and `vitest related` on staged `src` files. Verified to block a lint error and a staged screenshot.
- GitHub Actions `ci.yml` with four jobs: `unit`, `lint-typecheck`, `build`, `e2e`. On failure, `test-results/` is uploaded as a workflow artifact, never committed.
- `dev` branch protection now **requires** `unit`, `e2e`, `lint-typecheck` and `build`. No force-push or deletion on `dev` or `main`.
- `CLAUDE.md` command list filled in.

## Tests
- Unit: 1 passing (`App` heading and tagline).
- E2E: 4 passing (2 tests x 2 widths): heading and tagline visible, no sideways scroll.
- Lint, typecheck and build pass locally and on CI.

## Deviations from the plan
- The Vite template ships with oxlint; I used ESLint as decided in the roadmap.
- My first e2e test was too loose: Playwright matches names as substrings, so a broken heading ("Stepwise App") still passed. Added `exact: true` and re-proved the test fails on a wrong heading. Keep `exact: true` on name checks.
- No new dependencies beyond those already approved in the roadmap.

## Follow-ups
- GitHub's "required checks" is not enforced against admins (`enforce_admins: false`), so it can't stop the owner's own account from bypassing it. The rules in `CLAUDE.md` cover that.
- Feature 0002 (step engine) is next. It will be the first to add Shiki; Motion arrives with the first animated visual.
