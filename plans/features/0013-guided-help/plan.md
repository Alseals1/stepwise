# 0013 Guided help: first-visit tour and How-to page

## Goal
Make the app easy to learn without reading anything first: a short pointing tour the first time someone opens a topic, plus a How-to page that explains everything and can replay the tour.

## Decisions (from the owner)
- **Pointing tooltips** on the real screen (not a plain welcome window).
- **The tour starts the first time you open a topic.** The map gets no tour; its instructions live on the How-to page.

## User-visible behavior

### The tour (topic page, first visit)
Three steps, each highlighting a part of the real screen with a speech bubble next to it:
1. **The picture:** "This is the picture. It shows your data and changes at every step."
2. **The code:** "This is the code. The highlighted line is the one running right now. Switch between JS and TS here."
3. **The controls:** "Press Play to watch, or use Next and Back to go one step at a time. Keyboard: Space plays or pauses, the arrow keys step, R restarts. You can replay this tour from How to use."

Each bubble shows "Step 2 of 3" and has **Back**, **Next** (**Done** on the last step) and **Skip tour**. Escape also skips. The highlighted area is cut out of a dimmed page. The page underneath is not blocked, so you can try Play during the tour.
- Finishing or skipping saves "tour seen", so it never starts by itself again (it is kept when you reset progress, and travels in backups).
- Leaving the page mid-tour doesn't count as seen, so it returns on the next topic you open.
- On phones the bubble sits above or below the highlight and stays fully on screen; the page scrolls the highlighted part into view.

### How-to page (`#/how-to`, "How to use" link in the header)
Plain-language sections:
1. **Quick start** in three steps.
2. **Controls and keyboard shortcuts** (a table: Play/Pause, Next, Back, Restart, Speed, JS/TS).
3. **Reading a topic page:** the picture, the code, the variables, the narration, the analogy, Big O and the quiz.
4. **Stars, streak, badges** including the weekly freeze, in two or three sentences each.
5. **Your data:** where progress lives, backup and restore.
6. A **Replay the tour** button: opens the first topic and starts the tour again.

## Acceptance criteria
- The tour never blocks the app: the bubble and highlight stay inside the screen on desktop and phone widths, and the bubble doesn't cover the part it explains.
- Fully usable with the keyboard alone: focus moves into the bubble, Tab reaches Back, Next and Skip, Escape skips, and focus returns to the page when it ends. The arrow keys and Space on the tour's buttons don't also drive the player behind.
- A screen reader hears the bubble as a labelled, non-modal dialog and each step's title when focus moves.
- A missing target (layout changed) skips that step instead of breaking.
- The how-to table matches the real shortcuts. No sideways scroll at 390 px; colors from tokens; reduced motion respected; one `role="status"` per page still holds.

## Design
- **Targets:** `data-tour="picture" | "code" | "controls"` on the existing parts of `Player`. No layout changes.
- **`Tour`** component: takes steps (`target`, `title`, `text`), finds each target, scrolls it into view, draws a spotlight (a fixed box over the target whose huge box-shadow dims the rest) and positions the bubble. Re-measures on resize and scroll.
- **`placeTooltip`**: a pure function (target rectangle, bubble size, viewport) giving the bubble's position and side (below, else above, else docked at the bottom), clamped inside the screen. Unit-tested without a browser.
- **Saved state:** `help: { tourSeen: boolean }` is added to `SavedState` (an additive field, still version 1; missing means `false`). Reset keeps it; backups carry it; `parseSaved` defaults and validates it.
- **Provider:** `markTourSeen()` and an in-memory `tourRequested` with `requestTour()`, used by Replay.
- `TopicPage` shows the tour when `!tourSeen || tourRequested`.
- New route `how-to`; header gets a "How to use" link; `goTo(path)` helper in the router for Replay.
- **Tests that open topics:** unit tests mark the tour as seen in their setup; Playwright seeds `tourSeen: true` for every test through the config's `storageState`, except the tour spec, which starts fresh.

## Tests (red first)
Unit:
- `placeTooltip`: below, flip above, docked, clamped at the left and right edges, a target taller than the screen, tiny viewport.
- `Tour`: step text and "Step n of 3"; focus goes to the bubble heading; Next, Back (disabled on step 1), Done and Skip; Escape skips; arrow keys and R inside the bubble don't reach the document; the spotlight matches the target's rectangle; a missing target is skipped, and no targets at all ends the tour; scrolls the target into view; re-measures on resize.
- State, storage, backup: `help.tourSeen` default, validation, reset keeps it, replace carries it, a backup round trip.
- Provider: `markTourSeen`, `requestTour` (cleared once seen), stable identities.
- `TopicPage`: starts the tour on a first visit, not after it is seen, does start on request; finishing and skipping mark it seen; the map and badges pages never start it.
- How-to page: all six sections, the shortcuts table, Replay requests the tour and opens the first topic; the route; the header link; document title and focus.

E2E (fresh browser state for the tour spec, `tourSeen: true` seeded elsewhere):
- First topic visit shows step 1 around the picture; Next reaches steps 2 and 3; Done ends it; reload shows no tour.
- Skip, Escape and keyboard-only (Tab, Enter) all end it and persist.
- At desktop and phone widths: the bubble is fully on screen and does not overlap the highlighted target; the target scrolled into view.
- While the bubble is focused, ArrowRight does not step the player; after the tour it does.
- The tour doesn't appear on the map, the badges page or the How-to page.
- How-to page: from the header link; sections; the table; Replay starts the tour from step 1 even after it was seen; no sideways scroll.
- A backup that says the tour was seen restores that.

## Files
`src/tour/{placeTooltip.ts,steps.ts,Tour.tsx}` (+ tests), `src/engine/Player.tsx` (targets), `src/progress/{state.ts,ProgressContext.tsx}`, `src/storage/{storage.ts,backup.ts}`, `src/pages/{HowTo,TopicPage}.tsx` and `src/pages/resolvePage.ts`, `src/router/{parseRoute.ts,navigate.ts}`, `src/components/{Hud,HowToLink}.tsx`, `src/App.tsx`, `src/index.css`, `src/test/tour.ts`, `playwright.config.ts`, `e2e/{tour,how-to}.spec.ts`, `CLAUDE.md`.

## Dependencies
None.

## Not in this feature
A tour of the map, per-topic tours, a video, analytics, a hint system inside the player. Predict mode help arrives with predict mode (0014).

## Open questions
None blocking.
