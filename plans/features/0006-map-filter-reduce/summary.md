# 0006 Topic: map, filter, reduce and find: summary

**PR:** https://github.com/Alseals1/stepwise/pull/18 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Topic** (`src/topics/map-filter-reduce/`, id `map-filter-reduce`): `record()` runs `map`, `filter`, `reduce` and `find` one after the other on the same list, one step per callback call (default `[3, 4, 8, 5, 12]`: 24 steps). Rows view: the untouched `nums` row plus a growing result row (`doubled`, `big`, `total`, `first`); the item being processed is `current`, dropped filter items and checked find items are `dim`. Negative numbers are written in brackets inside sums and products. The last step compares how many items each method visited.
- **Predict mode:** four number questions, one per method, on its first callback. Wrong-answer options are always non-negative counts.
- `code.ts` (JS and TS, same lines), `content.ts` (conveyor-belt analogy and where it breaks, `O(n)` time and space, 4-question quiz, javascript.info "Array methods" as the source), `index.ts` with a number-list editor ("List", 0 to 6 numbers from -99 to 99).
- Registered; stage `map-filter-reduce` set to available. "The hidden loop" now unlocks after this stage; the e2e unlock setups were updated.

## Tests
- Unit: 1447 passing (62 files), written red first. `record()` is checked against the real array methods over 200 generated lists, plus exact sequences and edge lists; the shared contract tests picked the topic up.
- E2E: 332 passing (166 tests x desktop and phone); new `map-filter-reduce.spec.ts` (15 tests); map, hidden-loop and has-duplicate specs updated.
- Lint, typecheck and build pass. No new dependencies, no screenshot assertions.

## Deviations from the plan
- None in behavior. The old e2e test "opens even though the stage before it is still coming soon" was removed because no unbuilt stage now sits before the hidden loop; the unit tests still cover the "unbuilt stages don't block" rule.

## Follow-ups
- No watch-first video: none was verified. javascript.info's page describes the four methods but does not say outright that `map` and `filter` leave the original alone; the topic states that from how they behave, and the reference test pins it.
- Remaining planned topics: two pointers, binary search, hash map two sum; 0019 common bugs mode.
