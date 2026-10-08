# 0008 Topic: Duplicate check, loops vs a Set: summary

**PR:** https://github.com/Alseals1/stepwise/pull/17 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Topic** (`src/topics/has-duplicate/`, id `has-duplicate`): `record()` runs `hasDuplicateSlow` (nested loops, one step per pair) and then `hasDuplicateFast` (a `Set`, one `has` lookup per item and an `add` for each new one) on the same list, one after the other. Both counters (`comparisons`, `lookups`) stay in the variables panel, each part stops early at a repeat, and the last step names both costs (default `[4, 7, 2, 9, 5, 1]`: 31 steps, 15 comparisons vs 6 lookups).
- **Predict mode** asks "How many comparisons will the nested loops make?" and "How many lookups will the Set make?".
- **Visuals:** a new `compare` mark (amber) for the inner item of a pair, next to the cyan current item; the Set is shown as the `seen` row.
- `code.ts` (JS and TS, same lines), `content.ts` (bouncer-who-stamps-hands analogy and where it breaks, `O(n²)` vs `O(n)` time and `O(1)` vs `O(n)` space, a 3-question quiz, MDN's `Set` page as the source), `index.ts` with a number-list editor ("List", 0 to 6 numbers from -99 to 99).
- Registered; stage `has-duplicate` set to available; it unlocks after "The hidden loop". Badges page and its tests now treat "Set Master" as built ("Pointer Pro" is the remaining unbuilt-topic badge).

## Tests
- Unit: 1223 passing (61 files), written red first. `record()` is checked against plain reference implementations of both functions over 200 generated lists, plus exact sequences and edge lists; the shared contract tests picked the topic up.
- E2E: 302 passing (151 tests x desktop and phone); new `has-duplicate.spec.ts` (11 tests); the map and badges specs updated.
- Lint, typecheck and build pass. No new dependencies, no screenshot assertions.

## Deviations from the plan
- The planned end-of-run sentence about 100 items (4,950 comparisons vs 100 lookups) moved into the quiz (question 3's explanation mentions about 500,000) instead of the narration, which now names the two counts for the learner's own list.
- "Common bugs mode" was split out of this feature into 0019.
- No watch-first video: none was verified. MDN's `Set` page was opened and states that `has` is on average faster than `Array.prototype.includes`.

## Follow-ups
- 0019: common bugs mode for this topic (`.has` on the array, `i` vs `arr[i]`, never calling `.add`).
- Remaining planned topics: map, filter and reduce; two pointers; binary search; hash map two sum.
