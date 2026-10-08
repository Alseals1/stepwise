# 0007 Topic: The hidden loop (`includes()` inside a loop)

## Goal
Make a hidden loop visible. `seen.includes(item)` looks like one step, but it secretly loops over `seen`. Put it inside a `for` loop and the whole function becomes O(n²). This was one of the gaps in the earlier learning records ("one loop = O(n)" without its condition, and `return` inside a loop), so the topic also shows an **early return** stopping the function.

## What the learner sees
- Two labelled rows of boxes: **items** (the input) and **seen** (the array being built).
- For each item: one step to pick it, then **one step per element `includes()` compares it with**: the same highlighted code line repeated, a cursor moving along `seen`, and a **comparisons counter** climbing in the variables panel. The learner watches one line of code turn into many steps.
- If a match is found, `includes` stops at once (so it does *not* always scan everything), `return true` runs and the function ends: a visible early return.
- If not, the item is pushed onto `seen` and the next item starts; at the end, `return false`.
- **Predict mode** asks, before each `includes`: "How many comparisons will includes make for 5?" (the answer is the size of `seen`, or the position of the first match plus one).
- **Try your own list:** 0 to 6 whole numbers from -99 to 99, so duplicates and no-duplicates can both be tried and the count compared.
- Cinema-seat-style analogy for this topic: a **bouncer rereading the guest list** for every new arrival.

## Content (draft)
- **What it does:** Shows how checking `seen.includes(item)` inside a loop secretly re-scans the list every time.
- **Analogy:** A club bouncer with a paper guest list. For every person who arrives, the bouncer reads the list from the top to see whether they are already inside. It is one question, but each answer takes a pass down the list. By the 100th arrival, that pass is 99 names long. *Where it breaks:* a real bouncer remembers faces, but `includes()` has no memory. It starts from the top every time, and it stops early the moment it finds a match.
- **Big O:** time `O(n²)` because each of the n items runs `includes`, which can scan up to n elements; space `O(n)` because `seen` can end up holding every item.
- **Quiz:** three questions (which line hides a second loop; how many comparisons for items that are all different; why the function can finish before reading every item), similar-length options, answers in different positions.
- **Source:** MDN's `Array.prototype.includes` page, **opened and confirmed before linking**. **Watch-first:** only if I can open a video and confirm it matches; otherwise none.
- Next topic in the roadmap ("Duplicate check: loops vs a Set") is the cure, so the Big O card ends by pointing forward to it.

## Rules I'm setting (shout if you disagree)
- **Unbuilt stages no longer block later built ones.** A stage opens once the nearest earlier *built* stage is completed (the first built stage is always open). Otherwise this topic could never unlock while "map, filter and reduce" is still coming soon. The lock message names that earlier built stage. The map's other rules are unchanged.
- The function and its numbers are fixed (`hasDuplicate(items)`), and the learner changes only the list.
- Every comparison is its own step (so up to 15 comparisons plus the item and push steps for six distinct numbers: 27 steps). Six is the maximum length so runs stay watchable.
- The two rows are a new, generic "rows" visual, not special-cased to this topic; the warm-up and array basics are untouched.

## Acceptance criteria
- Every list of 0 to 6 numbers produces a correct run: the comparison count always equals what real `includes` would do (it stops at the first match), the returned value is right, and the questions are fair (the shared contract tests prove it on extremes and random lists).
- At every step the highlighted row elements and the counter agree with the narration.
- The map unlocks this topic after Array basics is completed, with "map, filter and reduce" still unbuilt, and shows the right lock message before that.
- No sideways scroll at 390 px; colors from tokens; one `role="status"` per page; keyboard-only usable; reduced motion respected.

## Design
- `Frame` gains optional `rows: { label, values, marks }[]`; a small `RowsView` renders them (reusing `ArrayBoxes`, which gains an optional accessible label). `Player` shows seats, else rows, else the plain array.
- `src/topics/hidden-loop/{index,record,code,content}.ts` per the topic checklist, with a number-list editor, registered and its stage (`hidden-loops`) set to `available`.
- `stageStates` finds the nearest earlier built stage for the unlock rule.
- No new dependency.

## Tests (red first)
Unit:
- `stageStates`: an unbuilt stage in the middle doesn't block the next built one; the lock message names the earlier built stage; the first built stage is open; completed, unlock-all and next-up unchanged.
- `record()`: the exact step sequence for a list with a duplicate (`[3, 1, 3]`) and one without (`[4, 7, 2]`); the comparison count equals a reference implementation of `includes` for 200 generated lists; the early return ends the run with the right narration and `returned` value; marks and rows consistent every step; empty and one-element lists; asks (one per `includes`, the right answers, varied positions).
- `RowsView` and the Player showing rows.
- Contract tests pick the topic up (content, quiz, questions, editor extremes).

E2E (desktop and phone):
- Locked until Array basics is done (message), then unlocks and is "Next up" while the topic before it is still coming soon.
- Walk through `[3, 1, 3]`: one line highlighted for many steps, the counter climbing, the early return at the second 3 with "stops right away" and a total of 4 comparisons.
- A list with no duplicates ends in `return false` with the full count (6 for `[4, 7, 2, 9]`).
- Predict mode asks and scores correctly; own list works; the quiz completes the topic.
- Two rows fit a phone without sideways scroll; reduced motion unaffected.

## Files
`src/progress/{progress.ts,progress.test.ts}`, `src/engine/{types,Player}.ts(x)`, `src/visuals/{ArrayBoxes,RowsView}.tsx`, `src/topics/hidden-loop/*`, `src/topics/{registry,stages}.ts`, `src/index.css`, tests, `e2e/hidden-loop.spec.ts`, `e2e/map.spec.ts`, `CLAUDE.md`.

## Dependencies
None.

## Not in this feature
The fix (a Set), which is the next topic; a side-by-side comparison of loops versus a Set; a graph of comparisons against list length.

## Open questions
None blocking.
