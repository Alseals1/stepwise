# 0019 Common bugs mode for the duplicate check: summary

**PR:** https://github.com/Alseals1/stepwise/pull/22 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **A "Common bugs" panel under the player** (`src/components/BugsPanel.tsx`) on the Duplicate check topic: three buttons, one per classic mistake. Pressing one replays the same algorithm with that bug, with the broken code in the code panel and a "Why it goes wrong" sentence in the panel. "Back to the correct version" returns to the real run, and pressing the active bug replays it from step 1.
- **The three bugs** (`src/topics/has-duplicate/bugs.ts`), each a short 7-line function rather than the two-function listing:
  1. **`.has` on the array**: `items.has(item)` instead of `seen.has(item)`. The run ends with `TypeError: items.has is not a function`, described in a frame rather than actually thrown (`record()` stays pure).
  2. **`i` instead of `items[i]`**: `if (i === j) return true` is never true, because `j` starts at `i + 1`, so the answer is always `false`.
  3. **Never calling `.add`**: the `seen.add(item)` line is a comment, so the Set stays empty, every lookup misses and the answer is always `false`.
- **A bug run needs a list with a repeat**, or two of the three bugs would answer `false`, which is also right for the default list. It uses the learner's list when that has a repeat, otherwise `[3, 1, 3]`, and says so in the first step.
- **A bug run is a lesson, not a run:** it records no run, stars, streak or badges (`onRunComplete` is left off in bug mode), and its frames carry no `ask`, so the predict switch is hidden. Applying a list, Random or Reset leaves bug mode and shows the correct version on that list.
- **Engine and wiring:** `Bug<Input>` and an optional `Topic.bugs` (`src/engine/types.ts`); `EntryBug` and `TopicEntry.bugs` hide the input type the way `editor` does, recording on the learner's current text (`src/topics/registry.ts`); `TopicPage` keeps the bug state and remounts the Player by key. A topic without `bugs` renders exactly as before.

## Tests
- Unit: 1882 passing (71 files), written red first: `bugs.test.ts` (15), `BugsPanel.test.tsx` (7), `commonBugs.test.tsx` (15, against the real topic page) and 4 registry tests. They cover each bug's wrong answer and explanation, the matching JS/TS line counts, the panel's `aria-pressed` and switching, and that a bug run earns nothing.
- E2E: 448 passing (224 tests x desktop and phone); 10 new tests in `e2e/has-duplicate.spec.ts`.
- Lint, typecheck and build pass. No new dependencies, no screenshot assertions. Re-run in the main checkout before merging.

## Deviations from the plan
- None from the approved design. (Built by a subagent in a worktree; its Write tool refused to create this summary, so it was written here from the agent's report and a review of the branch.)

## Follow-ups
- A bug run's last step still shows the generic "Run complete" label; a bug-aware label would read better.
- Any other topic can opt in by adding `bugs` to its `Topic`.
- Keeping the same bug active when a new list is applied is a possible refinement.
