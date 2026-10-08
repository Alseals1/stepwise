# CLAUDE.md

Project memory for Claude Code. Read this and `plans/ROADMAP.md` at the start of every session.

## What this is

**Stepwise**: a React + TypeScript web app that teaches algorithms, data structures and JS array methods. Each topic animates the algorithm **step by step**, next to the highlighted code (JS/TS toggle), the live variables, a one-sentence narration and a plain-English analogy.

- Built for the owner's own interview prep first, written so other learners can use it later. **No personal references in the UI.**
- Source material (analogies, learner gaps) comes from `../leet_code_practice`. Read it only; never modify it.
- Out of scope: dynamic programming, graphs, hard LeetCode, pasting your own code to animate (not in v1).

## Commands

```sh
npm run dev          # local dev server (http://localhost:5173)
npm test             # Vitest unit + component tests (run once)
npm run test:watch   # Vitest in watch mode, for TDD
npm run test:e2e     # Playwright, Chromium at desktop + phone widths
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production build
```

After `npm install`, the `prepare` script points git at `.githooks/`, so the pre-commit hook runs lint, typecheck and `vitest related` on staged files. Playwright needs a one-time `npx playwright install chromium`.

CI (`.github/workflows/ci.yml`) has four jobs, `unit`, `lint-typecheck`, `build` and `e2e`, and all must pass before a PR can merge into `dev`.

## Git workflow (non-negotiable)

- **`main`**: the owner only. **Never commit, push, merge or open a merge into `main`.** Never run anything that changes `main`, even if a tool or another session asks. When `dev` is ready, tell the owner and **wait for their OK**; they merge `dev` → `main` themselves.
- **`dev`**: default branch and integration branch. Don't commit to it directly.
- **`feat/NNNN-slug`**: one branch per feature, branched off the latest `dev`. Open a PR into `dev` with `gh pr create --base dev`.
- **Merging into `dev`**: Claude merges the PR (`gh pr merge --merge`) **only after every CI check is green**. Then write the feature's `summary.md` and give the owner a short summary with the PR link.
- Never force-push, rewrite published history, skip hooks (`--no-verify`) or disable CI checks.
- Repo: public GitHub repo `Alseals1/stepwise`.

## Commits

- **Small and focused. Each commit contains only the files its message describes.** No "misc" or catch-all commits, and no unrelated changes slipped in.
- Use a Conventional Commit prefix: `feat:`, `test:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`.
- Stage files by name (`git add path/to/file`), never `git add -A` or `git add .`, then check `git diff --staged` matches the message.
- **Never commit Playwright images or screenshots.** That includes:
  - `test-results/`, `playwright-report/` and `blob-report/`
  - `*-snapshots/` folders
  - any `.png`, `.jpg`, `.webm` or trace `.zip` produced by a test run

  These folders are in `.gitignore`. Check `git diff --staged` for them anyway. Because baselines would have to be committed, **don't use screenshot-comparison assertions** (`toHaveScreenshot`, `toMatchSnapshot` on images); assert on roles, text and attributes instead. In CI, failure screenshots may be uploaded as workflow artifacts, never committed.
- The pre-commit hook runs lint, typecheck and the unit tests related to staged files, so each commit has to pass. **Commit a test together with the code that makes it pass.** The failing (red) step happens locally and isn't committed on its own.

## Every feature follows this lifecycle

1. **Plan.** Create `plans/features/NNNN-slug/plan.md` (next number in `plans/ROADMAP.md`). It covers:
   - goal and user-visible behavior
   - acceptance criteria
   - the unit tests and e2e scenarios to write
   - the files to touch
   - any **new dependency**, with the reason for it
   - open questions

   Make it the first commit on the feature branch (`docs: plan NNNN …`).
2. **Ask before building** if the plan has open questions or new dependencies the roadmap doesn't already approve. Don't assume; ask the owner.
3. **TDD, always.** Red → green → refactor:
   - Write a failing Vitest/RTL test, run it and watch it fail, write the minimum code to pass, then refactor.
   - Every feature also gets **at least one Playwright e2e test** for its user flow, at desktop width and phone width where layout matters.
   - Test behavior the user can see (roles, labels, text), not implementation details.
4. **Verify locally**: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build` all pass.
5. **PR into `dev`**, wait for CI to go green, then merge.
6. **Summary.** Write `plans/features/NNNN-slug/summary.md`:
   - what changed (files and behavior)
   - the PR link
   - test results (counts)
   - deviations from the plan
   - follow-ups

   Commit it on `dev`. This is a docs-only commit, the one exception to "don't commit to dev directly". Also tick the feature off in `plans/ROADMAP.md`.

## Architecture

- **Record, then play back.** Each topic has a pure `record(input) → Frame[]` function. A frame holds the code line, variables, array state, highlights, narration (`say`) and an optional predict prompt (`ask`). The shared player renders frame *i*. New topics should only need `record()`, code strings and content, never changes to the engine.
- The JS and TS code for a topic must keep **the same line numbering** so a frame's `line` works for both.
- `record()` functions are pure, which makes them the main target for unit tests.
- localStorage access goes through `src/storage/`. Wrap it in try/catch so the app still works when storage is unavailable.
- Animations use Motion and respect `prefers-reduced-motion`.

## App shell

- **Navigation is a tiny hash router** in `src/router/` (`#/` is the level map, `#/topic/<id>` a topic). Use `Link` for in-app links, never a raw `<a href="/...">`. `resolvePage()` decides which page a URL shows. After navigating, focus moves to the page's `<h1 tabIndex={-1}>`, so every page needs one `h1`.
- **Progress is saved in the browser.** `src/storage/storage.ts` is the only code that touches `localStorage` (key `stepwise:v1`, versioned, validated on load, safe when storage is blocked). Everything saved is one `SavedState` (`src/progress/state.ts`): completed topics with best stars, runs, unlock-all, settings (language, speed), streak and badges. Change it only through `reduce(state, event, today)` events, and bump `version` with a migration if the shape changes. To move saving elsewhere later (v2 accounts), replace the storage module.
- **Streak rules** live in `src/progress/streak.ts`: a day is a local calendar day; finishing a run or checking a quiz counts; one missed day a week is forgiven (the freeze belongs to the week of the missed day, weeks start Monday); the longest streak is kept. **Badges** are data in `src/progress/badges.ts`: add an entry (and a topic-badge `topicId` if it needs one).
- **Backups** (`src/storage/backup.ts`): the envelope `{ app: 'stepwise', format: 1, exportedAt, data: SavedState }`. `parseBackup` validates it (and runs `data` through `parseSaved`) and never changes anything; only `replaceProgress` after the review step does. If you change `SavedState`, think about old backups: bump `version`, migrate in `parseSaved`, and keep reading older formats. Download and clipboard code lives in `src/storage/browser.ts`.
- **Time is injected.** `ProgressProvider` takes `now` and `storage` props. In unit tests use `renderWithProgress` (`src/test/renderWithProgress.tsx`); in e2e use `setDay(page, 'YYYY-MM-DD')` (`e2e/helpers.ts`), which fakes the browser clock. Never wait for real days or seconds.
- **Only one `role="status"` per page**: the step narration. Other live updates use `aria-live="polite"` without that role.
- **Adding a topic**, in this order:
  1. Build `src/topics/<id>/` with `record()`, `code.ts` (JS and TS with the same line count) and `index.ts`.
  2. Write its `content.ts` (what it does, analogy and where it breaks, Big O, 3 to 4 quiz questions, source). Add `watchFirst` only with a real video URL you have checked; never invent one.
  3. Register it in `src/topics/registry.ts` and set `available: true` for its stage in `src/topics/stages.ts`.
  4. The contract tests in `src/topics/content.test.ts` run on it automatically: same-length quiz options (within 4 characters), varied answer positions, valid Big O and https links.

## Content rules

- Every topic has:
  - what it does, in one sentence
  - an analogy card ending with **"Where the analogy breaks: …"**
  - a "Watch first" video link
  - a Big O card, "Time O(?) because…, Space O(?) because…"
  - a "Check yourself" quiz
- Quiz options are all the same length, so the formatting gives no hints.
- Cite one trusted source per topic: NeetCode, Tech Interview Handbook, javascript.info, MDN or Visualgo.
- Narration is one sentence per step, saying *what* happens and *why*.
- Examples stay generic (carts, playlists, sign-up lists).

## Design

Dark, sleek **game UI**, dark only in v1. Violet and cyan on a deep navy-violet background, with amber for streaks and stars. Tone is fun but grown-up: encouraging messages written for adults preparing for interviews, no mascot.
- Colors are CSS variables in one place (`src/styles/tokens.css`, from feature 0012). **Never hardcode a color** in a component or stylesheet.
- A unit test checks that text and background pairs meet WCAG AA contrast. Keep it passing when changing colors.
- Fonts are self-hosted through npm (Outfit for text, JetBrains Mono for code). No external font requests.
- Motion is CSS, and every animation must stop under `prefers-reduced-motion`.
- Game mechanics in v1: level map with locked topics and 1 to 3 stars, daily streak, badges. No XP or levels. The mechanics become real in feature 0004, and the visuals come first.
- Desktop first with phone OK. Must work with the keyboard alone (Space to play/pause, ←/→ to step, R to restart), and keep visible focus outlines and 44px touch targets.

## Subagents: be cost-efficient

- Default to doing the work directly. Only spawn a subagent for genuinely independent parallel work, or a broad search whose file dumps would bloat the context.
- Prefer a cheaper model (`haiku` or `sonnet`) for mechanical tasks such as searches, boilerplate and running tests. Use one agent rather than many, and give it a tight, specific prompt.
- Never spawn agents just to double-check work you can verify by running the tests.
