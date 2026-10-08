# 0005 Topic: Array basics (push, pop, shift, unshift)

## Goal
The first real topic. It shows what `push`, `unshift`, `pop` and `shift` do to an array and, above all, **how many other elements each one has to move**, which is the whole Big O idea: the end of an array is cheap (O(1)), the front is expensive (O(n)).

## Decisions (from the owner)
- **One fixed walkthrough of all four operations** on the learner's array: `push(9)`, `unshift(1)`, `pop()`, `shift()`, one step at a time.
- **Predict-mode questions ask "How many elements will move?"** before each operation.
- Same analogy as the lessons: **cinema seats**.

## What the learner sees
- A **row of numbered seats** with a box in each occupied seat. When an element has to move, its box **glides** to the next seat (and the "elements moved" counter goes up by one), so the O(n) cost is visible as a line of boxes sliding one by one.
- **`push(9)`:** 9 appears in the next free seat at the end. Nothing else moves (0 moves).
- **`unshift(1)`:** seat 0 is needed, so every element slides one seat to the right, starting from the last, one step per element. Then 1 takes seat 0.
- **`pop()`:** the last box is marked as removed, and its value is shown as returned. Nothing else moves.
- **`shift()`:** the first box is marked as removed, then every remaining element slides one seat to the left, one step each.
- Final step: return the array.
- The code panel shows the five-line function (JS and TS, same line count) with the running line highlighted; the variables panel shows the array as it stands, the moves so far and the last returned value.
- **Predict mode** asks four questions, one per operation: "How many elements will move when we push / unshift / pop / shift?"
- **Try your own starting array:** 1 to 6 whole numbers from -99 to 99. More elements means a longer unshift and shift, which is the point.
- Quiz, analogy, Big O card, source and (only if a real one is found) a watch-first video, like every topic.

## Content (draft, all plain language)
- **What it does:** Shows what push, unshift, pop and shift do to an array, and how many elements each one has to move.
- **Analogy:** a row of cinema seats. Every seat has a number, so walking straight to seat 7 is instant. Someone sitting in the empty seat at the end of the row bothers nobody. Someone squeezing in at the front makes everyone shift over one seat. *Where it breaks:* real seats don't grow, but JavaScript arrays resize themselves automatically. That resizing doesn't change the costs you quote in an interview.
- **Big O:** time `O(1) or O(n)` because push and pop only touch the last seat (O(1)) while shift and unshift make every other element move over (O(n)); space `O(1)` because they change the array in place.
- **Quiz:** three questions (which operation moves every other element; what pop does to the others; which call is slowest on a 1,000-element array), with options of similar length and the right answer in different positions.
- **Source:** the Tech Interview Handbook's array page (array operation costs), which the earlier lessons already used. **Watch-first:** I will search for a short, free, reputable video and **only link it if I have opened the link and confirmed it exists and matches**; otherwise the topic ships without one.

## Rules I'm setting (shout if you disagree)
- The new values are fixed (9 pushed, 1 unshifted) so the code reads naturally; the learner's numbers are the starting array only.
- The seat row has as many seats as the run ever needs (start length + 2), so it never changes width mid-run, and boxes get smaller on narrow screens so up to 8 fit on a phone.
- Removed elements stay visible for one step, struck through, so the removal is its own step.
- The topic is **locked until the warm-up is completed** (the map's normal rule), so the Locked page finally gets its first real browser test.

## Acceptance criteria
- Every starting array (1 to 6 numbers, including -99 and 99) produces a correct run and fair predict questions; the shared contract tests prove it.
- The seat row shows exactly the elements the narration describes at every step; positions and the counters never disagree.
- Movement is animated with CSS only and stops under reduced motion (the final positions are still correct).
- No sideways scroll at 390 px with 8 seats; colors from tokens; one `role="status"` per page; keyboard-only usable.

## Design
- New **`Seat`** frame data and a **`SeatRow`** component: boxes are positioned by a `--seat` CSS variable, so changing a box's seat between frames makes it glide with a CSS transition. Each box has a stable `id` so React keeps the same element across frames. Empty seats are drawn as dashed outlines. Sizes come from a container query so the row fits any width.
- `Player` shows `SeatRow` when a frame has `seats`, otherwise the existing `ArrayBoxes` (the warm-up is untouched).
- `src/topics/array-basics/` follows the topic checklist: `record()`, `code.ts`, `content.ts`, `index.ts` with a `numberListEditor` (label "Starting array", 1 to 6 numbers), registered in `registry.ts`, with its stage set to `available: true`.
- **No new dependency.** The roadmap approved Motion, but CSS transitions are enough here and keep the bundle small; Motion can still come later for something CSS can't do.

## Tests (red first)
Unit:
- `record()`: frame counts for several lengths; the exact sequence of events for `[3, 5, 8]` (push, then unshift's moves last-to-first, the insert, pop's removal, shift's removal and moves); box ids stay stable and only seats change; the moves counter and returned value are right; no two boxes ever share a seat; the final array is correct; lines match the code; four asks with the right counts, positions varying.
- Edge inputs: one element, six elements, equal values, -99 and 99.
- `SeatRow`: seats drawn, boxes positioned by seat, marks, accessible labels, empty seats.
- Contract tests (already generic) pick the new topic up: content shape, fair quiz and predict questions, extreme and random inputs.
- Stage list and registry: array-basics is available and registered; the map unlocks it after the warm-up.

E2E (Playwright, desktop and phone; `unlockAll` seeded so the topic is reachable):
- Open from the map after finishing the warm-up (Next up moves to it); direct link while locked shows the Locked page naming the warm-up.
- Step through a run: seats, counters and narration agree at each step; a box really slides (its position changes between steps); final array matches.
- Predict mode asks the four questions with the right answers (including 0 for push and pop and n for unshift and shift).
- Your own starting array changes the run; the quiz works and completes the topic.
- Reduced motion: boxes end in the right seats with no transition.
- Fits a phone with 8 seats and no sideways scroll; tour and How-to still work on this topic.

## Files
`src/topics/array-basics/{index,record,code,content}.ts`, `src/topics/{registry,stages}.ts`, `src/engine/{types,Player}.ts(x)`, `src/visuals/SeatRow.tsx`, `src/index.css`, matching tests, `e2e/array-basics.spec.ts`, `e2e/map.spec.ts`, `CLAUDE.md` if the topic recipe changes.

## Dependencies
None.

## Not in this feature
Choosing an operation yourself, other array methods (`splice`, `slice`, `concat`), visual cost graphs, or moving the warm-up to the seat visual.

## Open questions
None blocking.
