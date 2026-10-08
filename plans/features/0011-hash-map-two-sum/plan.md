# 0011 Topic: Hash map Two Sum

## Goal
Sequel to the Set topic: solve Two Sum on an **unsorted** list in one pass with a `Map` from value to index. For each item, work out the **complement** (`target - item`), ask the Map whether it already holds it, and either return both indexes or store the item for later. The picture to remember: order does not matter any more, but the Map costs memory (O(n)), where two pointers needed a sorted list and no extra memory.

## Decisions (made without the owner, following the brief)
- **Check before store.** The lookup comes before `seen.set`, so `[3, 3]` target 6 works and an item never pairs with itself. One narration step says so when an item's complement is itself.
- **Input:** an unsorted list plus a target in one field, same text format as the sorted editor (`4, 9, 1, 7 target 8`). A new exported `listWithTargetEditor` in `src/engine/targetInputs.ts` shares one internal builder with `sortedListWithTargetEditor`; the sorted editor's behavior, messages and tests are unchanged. Label "List and target", up to 8 numbers from -99 to 99, target -198 to 198. Random is not sorted and usually has a pair. Extremes include empty, one item, `[3, 3]`, a pair at the very end, negatives, limits and unreachable targets.
- **Visual:** two `rows`: `nums` (current item marked) and `seen (value → index)`, the Map's keys in insertion order. The small number under each Map box is the index it maps to. That needs a **small engine extension**: an optional `Row.indexes` (and an `indexes` prop on `ArrayBoxes`) that replaces the position number under a box. Reason: when a repeated value is stored again, `Map.set` replaces the index in place, so box position and stored index differ. Tested; one bullet in CLAUDE.md.
- **Found:** the current item, the stored partner in `nums`, and the Map box are all `done`.
- **Default `[7, 2, 5, 9, 3, 6]`, target 10**: four misses (including 5, whose complement is itself and is not stored yet), then 3 finds 7 stored at index 0: result `[0, 4]`, 5 lookups against up to 15 pairs. The hit is not on the second item and the pair is not adjacent. 17 steps. (The brief's example `[6, 1, 9, 4, 7, 3]` hits on index 2 with an adjacent pair, so it was replaced.)
- **Frames:** setup (call, empty Map), then per item a complement step, a lookup step, and, on a miss, a store step; on a hit a return step. The last step compares lookups with the n(n-1)/2 pairs nested loops could need, and states the trade against two pointers.
- **Predict mode (2 or 3 asks per run, never on step 1):** "What complement do we look for?" at the second item (numbers via `buildChoices`), and "Is c already stored in the Map?" (Yes/No, rotating position) at the third item and at the hit.
- **No watch-first video** (none verified). Source: MDN `Map` (opened: it covers key-value pairs, `has`/`get`/`set` and sub-linear average access; it does not mention Two Sum, so the narration carries the specifics).
- Unlocks after the nearest earlier *built* stage (currently "Two pointers").

## Code (JS and TS, same line count, 11)
`twoSumHash(nums, target)`: `const seen = new Map()`, a `for` loop, `const complement = target - nums[i]`, `if (seen.has(complement))`, `return [seen.get(complement), i]`, `seen.set(nums[i], i)`, `return []`.

## Content (draft)
- **What it does:** Finds two numbers in any list that add up to a target in one pass, by remembering each number's position in a Map and looking up the partner it needs.
- **Analogy:** a coat check. Each person hands in a coat and gets a ticket with their position; before hanging up, each person checks whether the partner they need already left a coat. *Where it breaks:* the Map stores every item (extra memory) and remembers positions, not just that someone exists.
- **Big O:** time `O(n)` because one pass with O(1) average lookups; space `O(n)` because the Map can hold every item.
- **Quiz (4):** the complement, what the Map stores, why check before store, the trade against two pointers.

## Acceptance criteria
- For every list and target in range, the result and the lookup count equal a reference implementation of the real algorithm (including repeated values and `Map.set` replacing); indexes in range; the Map never contains the current item before its lookup (unless an equal value was stored earlier).
- Any order is accepted; a missing or out-of-range target, bad numbers and a ninth number are refused with the existing messages.
- Contract tests pass (fair asks for every extreme and random input). No sideways scroll at 390 px with 8 numbers; colors from tokens; one `role="status"`.

## Tests (red first)
Unit: editor (accepts unsorted, same refusals, hint, format, random, extremes); `ArrayBoxes`/`RowsView` indexes; `record()` exact default sequence, edge lists (empty, one, `[3, 3]`, negatives, no pair, pair at the end, repeated value overwrite), reference comparison over generated lists, asks; contract tests; stage list.
E2E (desktop and phone, `e2e/hash-map-two-sum.spec.ts`): locked then unlocked; walkthrough (highlight, narration, Map filling, complement shown); found, not found, empty list; `[3, 3]` target 6; predict mode scored; custom input refusals and an unsorted list accepted; quiz; phone fit with 8 numbers.

## Files
`src/engine/{targetInputs,types}.ts` (+tests), `src/visuals/{ArrayBoxes,RowsView}.tsx` (+tests), `src/topics/hash-map-two-sum/*`, `src/topics/{registry,stages}.ts`, `src/topics/content.test.ts`, `e2e/hash-map-two-sum.spec.ts`, `e2e/map.spec.ts` (Coming soon count), `CLAUDE.md` (one bullet), `plans/ROADMAP.md` (tick).

## Dependencies
None. Open questions: none.
