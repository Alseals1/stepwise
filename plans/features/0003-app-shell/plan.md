# 0003 App shell

## Goal
Turn the single demo page into a real app: a **level-map home**, a **topic page template** that every topic fills in with content, simple navigation, and the star, lock and completion visuals. Progress lives in memory for now; feature 0004 saves it in the browser.

## Decisions (from the owner)
- **Navigation:** a tiny hash router written for this app (no new dependency). URLs look like `/#/topic/sum-demo`. Easy to swap for react-router later, because all navigation goes through one `Link` and one `useRoute` hook.
- **Completion and stars:** finishing the quiz completes the topic with at least 1 star. 3 stars for all correct, 2 for at least half, 1 otherwise. Retrying keeps the best score.
- **Locks:** stages unlock in order, plus an **"Unlock all" switch** on the map. (Remembering the switch is part of 0004.)

## User-visible behavior

### Level map (home, `#/`)
- A vertical path of stages, each a card on a node: stage number, title, one-line blurb, difficulty dots, and a status.
  - **Open:** a link to the topic. The first unfinished open stage is marked "Next up" with a pulsing ring.
  - **Completed:** green check and 1 to 3 stars.
  - **Locked:** lock icon and "Finish *previous topic* to unlock". Not clickable.
  - **Coming soon:** for planned topics that aren't built yet. Not clickable.
- An **"Unlock all topics"** switch above the map opens every built stage.
- Stages: **Warm-up: Add up the numbers** (the existing demo, built) and the 7 planned v1 topics from the roadmap (coming soon).
- Phone: the path becomes a straight column.

### Topic page (`#/topic/<id>`)
In this order:
1. "← Back to map" link, topic title, difficulty dots.
2. **What this does** (one sentence).
3. **Watch first** video link (only when the topic has one; opens in a new tab).
4. **Analogy card** with a "Where the analogy breaks: …" line.
5. The **step player** (from 0002).
6. **Big O card:** "Time O(?) because…, Space O(?) because…".
7. **Check yourself** quiz: one multiple-choice question per block, "Check answers" enabled once all are answered, then per-question right/wrong with a short explanation, the score, the stars earned and "Try again".
8. **Source** link.
- Unknown or not-yet-built topic ids show a friendly "Nothing here yet" page with a link back to the map. A locked topic opened by URL shows what to finish first, with a link back.
- Navigating moves keyboard focus to the page heading and updates the browser tab title.

## Acceptance criteria
- Adding a topic = one content file and one registry entry; no changes to the shell.
- Back button and refresh work on every page (hash URLs).
- Locked and coming-soon stages can't be opened by keyboard or mouse. Status is announced as text, not just icon or color. Stars have an accessible label ("2 of 3 stars").
- Quiz options in every question are about the same length (spread of at most 4 characters), enforced by a content test across all topics.
- Only one `role="status"` region on a page (the narration). Quiz feedback uses `aria-live="polite"` without that role.
- No sideways scroll at 390 px. All animation respects reduced motion. Colors come only from tokens.

## Design
- Registry: `src/topics/stages.ts` is the ordered list (`id`, `title`, `blurb`, `difficulty`, `available`). Content: `src/topics/<id>/content.ts` (type `TopicContent`: `whatItDoes`, `analogy {text, breaks}`, `watchFirst?`, `bigO {time, timeBecause, space, spaceBecause}`, `quiz[] {question, options, answer, explain}`, `source {label, url}`). I will not invent video URLs: the warm-up has none, and real topics get theirs from a web search when they are built.
- Pure functions (unit-tested): `starsFor(correct, total)`, `stageStates(stages, progress)`, `parseRoute(hash)`.
- Progress: an in-memory React context (`completed: id -> stars`, `unlockAll`) with `completeTopic(id, correct, total)` and `setUnlockAll`. Its shape is what 0004 will persist.
- Stage rule: coming soon if not built; completed if finished; open if `unlockAll`, first, or the previous stage is completed; otherwise locked.

## Tests (red first)
Unit (Vitest + RTL):
- `parseRoute`: `#/`, `#/topic/x`, empty hash, junk, trailing slash; `useRoute` reacts to `hashchange`; `Link` sets the hash and `href`.
- `starsFor` boundaries (0/3, 1/3, 1.5/3 rounding, 2/3, 3/3, 0 questions); progress keeps the best stars.
- `stageStates`: first open, next locked, after completion next opens, `unlockAll`, coming soon never open.
- `Stars` (labels), `LevelMap` (each status renders the right text and link or no link; Next up marker; switch toggles), `AnalogyCard`, `BigOCard`, `WatchFirst`, `Quiz` (all-answered gating, scoring, explanations, retry, equal-length contract), `TopicPage` (section order, missing watch-first hidden), not-found and locked pages.
- Content contract for every topic: required fields present, quiz answer index valid, option length spread at most 4, analogy has a "breaks" line.
- `App`: routes render the right page; focus moves to the heading; document title updates.

E2E (Playwright, desktop and phone):
- Home shows the map: warm-up open and marked Next up, the rest coming soon, none clickable.
- Open the warm-up: analogy, player (Next works), Big O card and quiz appear; Back to map returns home.
- Answer the quiz with all correct: "3 of 3", 3 stars; back on the map the warm-up shows a check and 3 stars. Retry with a wrong answer keeps 3 stars (best score).
- Browser Back and a page refresh on `#/topic/sum-demo` both work. An unknown URL shows the friendly page.
- Keyboard-only path: Tab to the warm-up link, Enter, focus lands on the heading.
- Unlock-all switch on and off; no sideways scroll.

## Files
`src/router/{parseRoute.ts,useRoute.ts,Link.tsx}`, `src/progress/{progress.ts,ProgressContext.tsx}`, `src/topics/{stages.ts,types.ts}`, `src/topics/sum-demo/content.ts`, `src/components/{Stars,Icons,LevelMap,AnalogyCard,BigOCard,WatchFirst,Quiz,DifficultyDots}.tsx`, `src/pages/{Home,TopicPage,NotFound,Locked}.tsx`, `src/App.tsx`, `src/index.css`, matching tests, `e2e/{map,topic-page}.spec.ts`. Update the older e2e specs, which now start from `#/topic/sum-demo`.

## Dependencies
None.

## Not in this feature
Saving progress, daily streak, badges, the first-visit tour and the how-to page (0004). Real topics (0005 onward). A light theme.

## Open questions
None blocking. I'm assuming the warm-up demo stays as stage 1; say so if you'd rather it be hidden once real topics exist.
