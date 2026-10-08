# 0007 Topic: The hidden loop: summary

**PR:** https://github.com/Alseals1/stepwise/pull/16 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Topic** (`src/topics/hidden-loop/`, id `hidden-loops`): `record()` runs `hasDuplicate(items)` with `seen.includes(item)` inside a loop and gives every comparison its own step (15 steps for `[3, 1, 4, 1]`, 17 for a distinct four, 2 for an empty list), a comparisons counter, a visible early return, and one predict question per `includes` ("How many comparisons will includes make for 5?"). `code.ts` (JS and TS, same lines), `content.ts` (the club-bouncer analogy and where it breaks, Big O `O(n²)` / `O(n)`, a 3-question quiz, MDN's `Array.prototype.includes` as the source) and `index.ts` with a number-list editor ("List", 0 to 6 numbers from -99 to 99, default `[3, 1, 4, 1]`).
- **Engine:** `Row` and `Frame.rows`; `RowsView` (`src/visuals/RowsView.tsx`) shows several labelled arrays with `ArrayBoxes` (which gained an optional `label`); `Player` shows seats, else rows, else the plain array.
- **Unlock rule:** `stageStates` opens a stage when the nearest earlier built stage is completed, so unbuilt stages no longer block later built ones, and the lock message names that earlier built stage.
- Registered, stage `hidden-loops` set to available; row styles; `CLAUDE.md` documents rows topics and the unlock rule.
- The badges page and its unit and e2e tests now treat "Hidden Loop Spotter" as a badge whose topic is built (Set Master and Pointer Pro still say not built).

## Tests
- Unit: 997 passing (60 files), written red first. `record()` is checked against a plain reference `includes` over 200 generated lists, plus exact sequences and edge lists; the shared contract tests picked the topic up.
- E2E: 280 passing (140 tests x desktop and phone); new `hidden-loop.spec.ts` (13 tests); the map and badges specs updated.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- The plan's example said the early return in `[3, 1, 3]` makes 4 comparisons; the correct count for that list is 2, and the topic's default list is `[3, 1, 4, 1]` (5 comparisons), which shows a longer scan before the match. The tests use the right numbers.
- A test caught a negative answer option ("-1") for the first `includes` call; the answer candidates are now always non-negative.
- No watch-first video: none was verified. MDN's page describes `includes` but does not spell out that it stops at the first match; the topic states that from how `includes` behaves, and the reference-implementation test pins it.
- Two e2e expectations were corrected: the includes line is highlighted on exactly 7 of the 14 steps, and the question for the last item is attached to its first comparison, so the match and the return are the two steps after answering.

## Follow-ups
- The next topic, "Duplicate check: loops vs a Set", is the cure this one points to.
- Remaining planned topics: map, filter and reduce; duplicate check; two pointers; binary search; hash map two sum.
