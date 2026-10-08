# 0010 Topic: Binary search

## Goal
Teach binary search on a **sorted** list: look at the middle, decide which half the target can still be in, throw the other half away, repeat. The picture to remember: **every step halves the search space**, so a million items need about 20 steps (O(log n)).

## Decisions (mine; the owner could not be asked)
- **Input: reuse `sortedListWithTargetEditor`** (`2, 5, 8, 12 target 8`) unchanged, with `maxLength` 10 (ten boxes wrap on a phone; checked in e2e at 390 px). The editor lives in `src/engine/targetInputs.ts`, which another feature may change, so it is not edited. Two small things differ for this topic, so the topic **wraps** the editor in `index.ts`: (1) its "unsorted" refusal says "Binary search only works on a sorted list" instead of naming two pointers; (2) Random puts the target in the list about three times in four, because "found" is the interesting case here (the editor's own Random aims at a pair sum).
- **Default `[2, 5, 8, 12, 16, 23, 38, 56, 72, 91]`, target 23**: mid 4 (16, too small: drop the left half), mid 7 (56, too big: drop the right half), mid 5 (23, found). Both directions, then a match: 3 probes against 6 for a left-to-right scan. (The brief's 8-item example gives 3 vs 3, which would not show the saving.)
- **Visual:** boxes, pointer tags `low` (cyan, like `left`), `mid` (violet) and `high` (amber, like `right`). Numbers outside `low..high` fade (`dim`), so half the list disappears each round; `mid` is marked `current`; a found item is `done`. Pointers are given in every frame (even `[]`).
- **Stable boxes:** three tags can land on one box (low, mid and high all meet), so the area under a box would grow by two lines on that step. A frame may say how many tag lines every box reserves (`pointerSlots`, default 1, binary search uses 3), which `ArrayBoxes` turns into a minimum height. Small, tested, no behavior change for other topics.
- **Per round, two steps:** "pick the middle" (`mid`, the value there, `probes` goes up) and "decide" (found, target is bigger so drop the left half, target is smaller so drop the right half) with the reason in one sentence. The last step compares probes with what a left-to-right scan needs (index + 1 if found, n if not).
- **Probes** are the number of middles looked at. At most `floor(log2 n) + 1`.
- **Duplicates:** returns whichever matching index the real algorithm reaches (not necessarily the first); checked against a reference implementation.
- **Predict mode:** on every decision step, "The middle is 16 and the target is 23. What happens next?" with `search the left half`, `search the right half`, `it is a match`, right answer rotating.
- **Code (11 lines, JS and TS):** iterative `binarySearch(nums, target)` with `low`, `high`, `mid = Math.floor((low + high) / 2)`.
- Unlocks after "Two pointers" (nearest earlier built stage). Badges: no new badge.
- **Analogy:** looking a word up in a dictionary: open to the middle, see if your word comes before or after, and throw away the half it cannot be in. *Where it breaks:* the words have to be in order, and you can only jump to the middle of what is left (not to any page you like); on an unsorted list the middle tells you nothing.
- **Source:** Tech Interview Handbook, "Binary search" (to be opened and checked; the page must exist and cover the topic). No watch-first video unless one is verified.

## What the learner sees
- Code with `low`, `high`, `mid`, the `while (low <= high)` loop and three outcomes.
- Variables: `low`, `high`, `mid`, `target`, `probes`, `result`.

## Acceptance criteria
- For every sorted list and target in range, `record()` returns the same index (or -1) and the same probe count as a reference binary search; the search space (`high - low + 1`) strictly shrinks every round; probes <= floor(log2 n) + 1; pointers stay inside the list.
- Empty list, one item, target below everything, above everything, duplicates all work.
- Unsorted lists and other bad input are refused with friendly messages (shared editor).
- Predictions fair for all extreme and random inputs (shared contract tests).
- No sideways scroll at 390 px with ten numbers; colors from tokens only; keyboard-only usable; one `role="status"`.

## Tests (red first)
Unit: `record()` exact sequence for the default; reference comparison over many sorted lists and targets; shrinking, probe bound and pointer range; edge cases; asks (right answer per step, varied positions); the wrapped editor (message, Random); `ArrayBoxes` `pointerSlots`; contract tests; stage list.
E2E (desktop and phone), `e2e/binary-search.spec.ts`: locked then unlocked after Two pointers; walkthrough with highlight, narration, tags and fading; found, not found, empty list; predict mode scored 3 of 3; custom input refusals; quiz; phone fit with ten numbers; a box does not move when pointers move (`offsetTop`). `e2e/map.spec.ts` and the "not built yet" tests move to the one remaining planned stage.

## Files
`src/topics/binary-search/*`, `src/topics/{registry,stages}.ts`, `src/topics/content.test.ts`, `src/engine/types.ts`, `src/engine/Player.tsx`, `src/visuals/ArrayBoxes.tsx` (+test), `src/index.css`, `src/App.test.tsx`, `e2e/{binary-search,map,topic-page}.spec.ts`, `plans/ROADMAP.md` (tick), `CLAUDE.md` (one bullet).

## Dependencies
None.

## Open questions
None (the owner cannot be asked; the decisions above are the recommendations).
