# 0001 Project scaffold

## Goal
An empty but fully wired app: Vite + React + TypeScript, unit tests, e2e tests, lint, typecheck, a local pre-commit hook and GitHub Actions CI. No product features yet.

## User-visible behavior
`npm run dev` shows a page with the heading "Stepwise" and a one-line tagline.

## Acceptance criteria
- `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck` and `npm run build` all pass locally.
- Pre-commit hook runs lint, typecheck and the unit tests related to staged files.
- GitHub Actions runs four jobs on every PR into `dev`: `unit`, `e2e`, `lint-typecheck`, `build`.
- After the first green run, those four checks are required on `dev` branch protection.
- Playwright screenshots, videos and traces are not produced into tracked paths (config uses `screenshot: 'only-on-failure'` into the ignored `test-results/`).

## Tests (written first, watched failing)
- Unit (Vitest + RTL): `App` renders the heading "Stepwise" and the tagline.
- E2E (Playwright, Chromium): the home page shows the heading, at a desktop width and a phone width.

## Files
`package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/{main,App}.tsx`, `src/App.test.tsx`, `src/test/setup.ts`, `playwright.config.ts`, `e2e/home.spec.ts`, `.githooks/pre-commit`, `.github/workflows/ci.yml`, `CLAUDE.md` (fill in commands), `plans/ROADMAP.md` (tick off).

## Dependencies (all already approved in the roadmap)
React, Vite, TypeScript, ESLint, Vitest, React Testing Library, jest-dom, jsdom, Playwright.
Not added yet: Motion and Shiki (added by the features that use them).

**No husky / lint-staged.** The pre-commit hook is a plain script in `.githooks/`, enabled by `git config core.hooksPath .githooks` in an npm `prepare` script. This avoids two extra dependencies.

## Open questions
None.
