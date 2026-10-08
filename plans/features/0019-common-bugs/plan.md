# 0019 Common bugs mode for the duplicate check

## Goal
Learners meet the three classic mistakes people make when writing the duplicate check, and see each one fail. A "Common bugs" panel under the player on the existing Duplicate check page replays the algorithm **with a bug**: the code panel shows the broken code, the run plays like any run, the outcome is visibly wrong, and one sentence says why. The right version is one click away.

No new stage and no map change.

## Decisions (approved by the owner, recorded here)
- **Three bugs**, one button each:
  1. `.has` on the array: `if (items.has(item))` instead of `seen.has(item)`. The run ends with `TypeError: items.has is not a function`. `record()` stays pure: the last frame *describes* the crash, nothing throws.
  2. `i` instead of `items[i]`: `if (i === j) return true`. `j` starts at `i + 1`, so it is never true and the answer is always `false`.
  3. Never calling `.add`: the `seen.add(item)` line is missing, the Set stays empty, every lookup misses, the answer is always `false`.
- **The bug run needs a list with a repeat**, or bugs 2 and 3 return `false`, which is also the right answer. Rule: use the learner's current list if it contains a repeat, otherwise `[3, 1, 3]`, and say so in the first step: "A list with a repeat shows the bug: [3, 1, 3]."
- **A bug run is not a run**: no stars, streak or badges (`onRunComplete` is not passed in bug mode). No predict questions in a bug run (the frames carry no `ask`, so the predict switch does not appear). Everything else about the player is the same.
- Switching bug or going back **remounts `Player` with a new key**, like custom input.

## Design choices (mine, within the approval)
- Each bug shows **one short function** (7 lines), not the two-function listing: the bug is on a visible line (for bug 3, a comment where `seen.add(item)` should be, so the highlight has somewhere to land). JS and TS have the same line count.
- The panel shows the bug's explanation ("why") as a caption in an `aria-live="polite"` paragraph (no `role="status"`) as soon as a bug is pressed; the final narration step states the wrong outcome too.
- Pressing the already pressed bug replays it from step 1. Applying the learner's own list (Apply, Random, Reset) leaves bug mode and shows the correct version on the new list.
- The panel is generic: a topic opts in by adding `bugs` to its `Topic`. A topic without `bugs` renders exactly as before.

## Acceptance criteria
- Each bug's `record()` ends with the wrong answer (or the crash) and the right explanation, on `[3, 1, 3]` and on a learner's list with a repeat; the correct version returns `true` on the same list.
- Bug code strings: JS and TS the same line count, and every frame's `line` inside them.
- Panel: three buttons with `aria-pressed`, switching runs, "Back to the correct version", an accessible name, 44px targets, keyboard reachable, no sideways scroll at 390px.
- A bug run played to the end does not complete the topic, count a run, or light the streak.
- Topics without bugs show no panel. Existing contract tests keep passing.

## Tests (red first)
Unit:
- `src/topics/has-duplicate/bugs.test.ts`: the three bugs on `[3, 1, 3]`, on a learner's list with a repeat, and on a list without one (substituted, with the sentence); correct version returns `true`; code line counts and frame lines; no `ask` in any frame; purity.
- `src/components/BugsPanel.test.tsx`: renders the buttons, `aria-pressed`, callbacks, Back button only while a bug is on.
- Topic page test: pressing a bug swaps frames and code, Back restores, a bug run to its last step records nothing (no run count, topic not completed), a topic without bugs has no panel, applying a list leaves bug mode.
- `makeEntry` exposes `bugs`, and a topic without them has none.

E2E (`e2e/has-duplicate.spec.ts`, desktop and phone): panel under the player; each bug runs and ends wrongly with its reason; the code panel shows the broken line; going back restores the correct run; a bug run to the end does not complete the topic or light the streak; the panel fits a phone.

## Files
`src/engine/types.ts` (`Bug`, `Topic.bugs`), `src/topics/registry.ts` (`EntryBug`, `TopicEntry.bugs`), `src/topics/has-duplicate/{bugs.ts,bugs.test.ts,index.ts}`, `src/components/{BugsPanel.tsx,BugsPanel.test.tsx}`, `src/pages/TopicPage.tsx` (+ test), `src/index.css`, `e2e/has-duplicate.spec.ts`, `CLAUDE.md` (one line on bugs), `plans/ROADMAP.md` (tick the row).

## Dependencies
None.

## Not in this feature
Bugs for other topics, predicting a bug's outcome, and a bug on the two-function listing.

## Open questions
None (the owner is not available; the decisions above are approved).
