# 0010 Topic: Binary search: summary

**PR:** https://github.com/Alseals1/stepwise/pull/20 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Topic** (`src/topics/binary-search/`, id `binary-search`): `record()` runs the iterative `binarySearch(nums, target)`. Each round is a "probe" step (the middle of `low..high`) and a decision step: found, or drop the half the target cannot be in, with the count of numbers left. Everything outside `low..high` fades (`dim`), so half the list visibly disappears each step. A `probes` counter sits in the variables, and the last step compares it with what a left-to-right scan would have needed. Default `[2, 5, 8, 12, 16, 23, 38, 56, 72, 91]` with target 23: drop the left half, drop the right half, then a match, 3 probes against 6 comparisons.
- **Pointer tags for three pointers:** `low`, `mid` and `high` tags under their boxes (`mid` in violet, `low` and `high` matching the existing cyan and amber). A frame may now set `pointerSlots`, the most tags that can land on one box, so boxes keep room for all three and do not grow when the pointers meet (`Frame.pointerSlots`, an `ArrayBoxes` prop and a `--pointer-slots` CSS variable).
- **Input:** the existing `sortedListWithTargetEditor` (up to 10 numbers), wrapped by the topic so the unsorted refusal says "Binary search only works on a sorted list" and Random usually picks a target that is in the list.
- **Predict mode:** "What happens next?" after every probe, with `search the left half`, `search the right half` and `stop, it is a match`.
- `code.ts` (JS and TS, same lines), `content.ts` (analogy, `O(log n)` time and `O(1)` space, a 4-question quiz, Tech Interview Handbook "Sorting and searching" as the source), registered; stage `binary-search` set to available; it unlocks after "Two pointers".
- The "not built yet" fixtures in `src/App.test.tsx` and `e2e/topic-page.spec.ts` now point at `hash-map-two-sum`, and `e2e/map.spec.ts` expects one "Coming soon".

## Tests
- Unit: 1792 passing (67 files), written red first. `record()` is checked against a reference binary search over many generated sorted lists and targets (result and probe count), the search space shrinks every round, probes never exceed `floor(log2 n) + 1`, pointers stay in range, plus exact sequences and edge lists; the shared contract tests picked the topic up.
- E2E: 394 passing (197 tests x desktop and phone); new `binary-search.spec.ts`.
- Lint, typecheck and build pass. No new dependencies, no screenshot assertions.

## Deviations from the plan
- The default list has 10 numbers, not 8: with 8 the saving is 3 probes against 3 comparisons, which hides the point.
- `pointerSlots` was added to the engine, which the plan did not foresee; without it a box grows when `low`, `mid` and `high` meet.
- The match option is worded "stop, it is a match" so the three options stay within 4 characters of each other, as the contract test requires.
- Built by a subagent in a worktree; the owner's long-running dev server on port 5173 made Playwright's `reuseExistingServer` serve the wrong checkout, so the agent ran e2e on another port. The suite was then re-run in the main checkout before merging (one unrelated flake in `streak.spec.ts` under parallel load, which passes on its own and on CI).

## Follow-ups
- No watch-first video: none was verified. The Tech Interview Handbook page covers binary search only in general terms (intro, complexity table, "sorted inputs").
- Once 0011 lands, no stage is unbuilt, so the "not built yet" fixtures in `src/App.test.tsx` and `e2e/topic-page.spec.ts` need a new one.
