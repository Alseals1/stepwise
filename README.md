# Stepwise

Learn algorithms, data structures and JavaScript array methods by **watching them run one step at a time**.

Each topic puts four things side by side:

- an **animation** of the data (array boxes, pointers, sets) that moves one step at a time
- the **code**, with the current line highlighted (JavaScript or TypeScript)
- the **live variables**, plus a one-sentence explanation of *what* happened and *why*
- a plain-English **analogy** (cinema seats, a phone book, a gift card) to make the idea stick

You control the pace with play, pause, step forward, step back and a speed slider. An optional **predict mode** asks what happens next before it shows you.

> **Status: early development.** The project is scaffolded and tested, but the step player and the first topics aren't built yet. See the [roadmap](plans/ROADMAP.md) for what's coming and in what order.

## Planned topics (v1)

1. Array basics: `push`, `pop`, `unshift`, `shift`
2. `map`, `filter`, `reduce`, `find`
3. `includes` / `indexOf` and the hidden loop
4. Duplicate check: nested loops vs. a Set
5. Two pointers: Two Sum II and palindromes
6. Binary search
7. Hash map: Two Sum

## Run it locally

You need Node 24 or newer.

```sh
git clone https://github.com/Alseals1/stepwise.git
cd stepwise
npm install
npx playwright install chromium   # one-time, only needed for e2e tests
npm run dev                       # http://localhost:5173
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm test` | Unit and component tests (Vitest + React Testing Library) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | End-to-end tests (Playwright, Chromium, desktop and phone widths) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck and production build |

## How the project is run

- **Test-driven.** Every feature starts with a failing unit test and has at least one Playwright e2e test. Tests check what a user can see (roles, text), not screenshots, and no screenshots are committed.
- **Every feature has a plan.** `plans/features/NNNN-name/plan.md` is written before the code and `summary.md` after it merges.
- **Branches.** `dev` is the default branch. Each feature is built on a `feat/*` branch and merged into `dev` by pull request once CI is green (unit, e2e, lint + typecheck, build). `main` is updated only by the project owner.
- **Small commits.** Each commit contains only the files its message describes. A pre-commit hook runs lint, typecheck and the unit tests related to staged files.

More detail for contributors and AI assistants is in [CLAUDE.md](CLAUDE.md).

## Tech

React, TypeScript, Vite, Vitest, React Testing Library, Playwright, ESLint. Shiki (code highlighting) and Motion (animation) arrive with the features that use them.
