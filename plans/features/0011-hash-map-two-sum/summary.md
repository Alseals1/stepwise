# 0011 Topic: Hash map Two Sum: summary

**PR:** https://github.com/Alseals1/stepwise/pull/21 (opened by the builder, not merged by it; merged only after all four CI checks are green, including the run after this summary)

## What changed
- **Topic** (`src/topics/hash-map-two-sum/`, id `hash-map-two-sum`): `record()` runs `twoSumHash(nums, target)`: setup (call, empty Map), then per item a complement step, a lookup step and, on a miss, a store step; on a hit a return step with `[stored index, i]`. The lookup comes before the store, so an item never pairs with itself (a narration step says so when its complement is itself) and `[3, 3]` target 6 works. Storing a repeated value replaces its index in place, like a real `Map`. The last step compares lookups with the n(n-1)/2 pairs nested loops could need and states the trade against two pointers. Default `[7, 2, 5, 9, 3, 6]`, target 10: 17 steps, four misses, then `[0, 4]`.
- **Visual:** two `rows`, `nums` (current item marked) and `seen (value → index)`; on a hit the current item, the stored partner and the Map box turn `done`. Variables: `i`, `complement`, `lookups`, `result`.
- **Engine extension:** optional `Row.indexes` and an `indexes` prop on `ArrayBoxes` show a given number under each box instead of its position (the Map's stored index).
- **Input editor** `listWithTargetEditor` (`src/engine/targetInputs.ts`): the any-order twin of `sortedListWithTargetEditor`, built from one shared internal builder; same format, limits and messages; Random is unsorted and usually has a pair; extremes add `[3, 3]`, a pair only the last item completes, negatives and a repeated value. The sorted editor's behavior and tests are unchanged.
- **Predict mode:** three questions, "What complement do we look for?" (second item, numbers via `buildChoices`) and "Is c already stored in the Map?" (third item and the hit; Yes/No with a rotating position).
- `code.ts` (JS and TS, 11 lines each), `content.ts` (coat-check analogy and where it breaks, `O(n)` time and `O(n)` space, 4-question quiz, MDN Map as the source), registered; stage set to available; `CLAUDE.md` got one line.

## Tests
- Unit: 1804 passing (66 files), written red first. `record()` is checked against the real Map algorithm over 400 generated lists (result, lookups, Map contents and indexes); exact sequences for the default and for empty, one item, `[3, 3]`, negatives, no pair, pair at the end and a repeated value; the Map never holds the current item before its lookup; new editor tests; 3 row-index tests.
- E2E: 396 runs passing (198 tests x desktop and phone); new `e2e/hash-map-two-sum.spec.ts` (17 tests); `e2e/map.spec.ts` "Coming soon" count updated.
- Lint, typecheck and build pass. No new dependencies, no screenshot assertions.

## Deviations from the plan
- None in scope. The e2e runs used a throwaway, uncommitted `playwright.local.config.ts` on port 5175 (with a Chromium host-resolver rule mapping `localhost:5173` to it), because the owner's own dev server was already holding port 5173; the shared lock was therefore not needed.

## Follow-ups
- No watch-first video: none verified. The MDN Map page covers key-value pairs, `has`/`get`/`set` and sub-linear average access, but not Two Sum itself, so the narration carries the specifics.
- The "locked" e2e test expects "Finish Two pointers to unlock"; once binary search (0010) is built it should expect that stage instead.
- The empty Map shows the generic "Empty array" text.
