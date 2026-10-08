# 0003 App shell: summary

**PR:** https://github.com/Alseals1/stepwise/pull/6 (merged into `dev` after all four CI checks passed)

## What changed
- **Router** (`src/router/`): `parseRoute`, `useRoute` (hash URLs), `Link`, `useDocumentTitle`. No new dependency.
- **Progress** (`src/progress/`): `starsFor`, `recordResult` (keeps the best stars), `stageStates` (open, completed, locked, coming soon, next up) and an in-memory `ProgressProvider` with `unlockAll`.
- **Topics** (`src/topics/`): `types.ts` (`TopicContent`, `StageInfo`), `stages.ts` (warm-up plus the 7 planned topics), `registry.ts`, `sum-demo/content.ts`, and contract tests that run on every registered topic.
- **Components** (`src/components/`): `LevelMap`, `Stars`, `DifficultyDots`, `Icons`, `AnalogyCard`, `BigOCard`, `WatchFirst`, `Quiz`.
- **Pages** (`src/pages/`): `Home`, `TopicPage`, `NotFound`, `Locked`, and `resolvePage` (a pure function choosing the page for a URL).
- `App` now has a header with a brand link and routes between pages; focus moves to the new page's heading after navigation.
- Styles for the map, cards, quiz and a shared `.btn` style (in `index.css`, tokens only).
- `CLAUDE.md`: router, progress and an "adding a topic" checklist.

## Tests
- Unit: 185 passing (25 files), written red first.
- E2E: 52 passing (26 tests x desktop and phone).
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- Added a content rule not in the plan: quiz answers must not all sit in the same position. My first warm-up quiz had every right answer as option A, so the new test failed first and the content was fixed.
- Quiz option length is "within 4 characters" across options, as planned, but quiz wording for the warm-up needed rewording to meet it.
- The "Stages" heading on the map and the "Analogy", "Big O" and "Check yourself" headings share one small-caps style.
- The earlier `e2e/home.spec.ts` was replaced by `e2e/map.spec.ts`.

## Follow-ups
- Progress resets on refresh. Saving it (plus daily streak, badges, first-visit tour, how-to page) is feature 0004.
- The warm-up has no "watch first" video. Real topics will get verified links from a web search when built.
- A locked page can't be reached yet (only one topic is built, and it is stage 1); it is covered by unit tests on `resolvePage` and the page itself. The first e2e for it arrives with topic 2.
- `--amber` is now used for stars; it's contrast-tested.
