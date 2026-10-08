# 0006 Topic: map, filter, reduce and find

## Goal
Make the callback syntax (`nums.map(n => n * 2)`) stop being something to google. Four array methods, run one after the other on the same list, each showing the small function being called once per item and what it builds. This targets the "googles array syntax" gap noted in the source repo.

## Decisions (mine, since the owner said to do what I recommend)
- **Four methods, one after the other, on one list**, like the duplicate check: `map`, `filter`, `reduce`, then `find`. One function `demo(nums)` with one line per method, so the learner sees the whole syntax at once. The highlighted line stays on the method's line while the callback runs, once per step.
- **Default list `[3, 4, 8, 5, 12]`**: map gives `[6, 8, 16, 10, 24]`; filter (`n > 5`) keeps `[8, 12]`; reduce sums to `32`; find stops at the third item (`8`), so the contrast "filter checks everything, find stops at the first match" is visible.
- **Rows view**: an `nums` row that never changes (the original is untouched, which is the point) and a result row that grows: `doubled`, `big`, `total` (one box holding the running sum), and `first`.
- **Marks:** the item being processed is `current`; earlier items are `done` (map, reduce, a kept filter item), `dim` (a filter item that was dropped, and find's items that were never looked at).
- **Predict mode** asks four number questions, one per method, on its first callback: how many items the new list will have (map), how many items filter will keep, what the final total will be (reduce), how many items find checks before it stops.
- **Custom input**: "List", 0 to 6 numbers from -99 to 99 (the existing number-list editor). Empty list: map and filter give `[]`, reduce gives its starting `0`, find gives `undefined`; no questions are asked.
- Unlock: stage `map-filter-reduce` opens after Array basics; "The hidden loop" now opens after **this** stage (the nearest earlier built stage), so the e2e setups that seeded "Array basics completed" are updated.

## What the learner sees
- Code (JS and TS, same line count): `function demo(nums) { const doubled = nums.map(n => n * 2) … find … return { doubled, big, total, first } }`.
- One sentence per callback: "The callback gets n = 3 and returns 3 * 2 = 6, which goes into the new list."
- A closing step: "Same list, four results. map, filter and reduce visited all 5 items; find stopped after 3."

## Content (draft)
- **What it does:** Calls a small function on each item of a list to build something new: map transforms every item, filter keeps some, reduce boils the list down to one value, find returns the first match.
- **Analogy:** A factory conveyor belt. map is a stamping machine that treats every item the same; filter is an inspector who pulls items off the belt; reduce is a packer who adds each item to one running tally; find is a worker who grabs the first item that fits and stops the belt. *Where it breaks:* the real belt moves its items along; these methods leave the original list untouched and give you a new result.
- **Big O:** time `O(n)` because the callback runs once per item (find may stop earlier but can still check all); space `O(n)` because map and filter build a new list as long as the input (reduce and find only keep one value).
- **Quiz:** three questions (how long map's result is; what reduce starts from / returns for an empty list; which method stops early).
- **Source:** javascript.info "Array methods" (opened: describes map, filter, find and reduce). No watch-first video unless one is verified.

## Acceptance criteria
- For every list of 0 to 6 numbers, the four results equal what the real methods return (checked against `Array.prototype` over generated lists); the narration, marks and variables agree at every step.
- Questions are fair for all extreme and random lists (shared contract tests).
- No sideways scroll at 390 px; colors from tokens; keyboard-only usable; one `role="status"` per page.

## Tests (red first)
Unit: `record()` exact sequence for the default list; results equal the real methods over 200 generated lists; callbacks counts; edge lists (empty, one item, all dropped, none matching); four asks with right answers and varied positions; no non-negative-count distractor goes negative; contract tests pick the topic up; stage list, registry, level map and unlock-order tests updated.
E2E (desktop and phone): locked until Array basics is done, then opens; the hidden loop now says "Finish map, filter and reduce"; walkthrough steps and variables; the result rows grow; find stops early; predict mode scored 4 of 4; custom list incl. empty; quiz; phone fit.

## Files
`src/topics/map-filter-reduce/{index,record,code,content}.ts` (+ tests), `src/topics/{registry,stages}.ts`, `src/topics/content.test.ts`, level map and badge tests as needed, `e2e/map-filter-reduce.spec.ts`, `e2e/{map,badges,hidden-loop,has-duplicate,array-basics}.spec.ts`, `plans/ROADMAP.md`.

## Dependencies
None.
