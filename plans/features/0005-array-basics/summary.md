# 0005 Topic: Array basics: summary

**PR:** https://github.com/Alseals1/stepwise/pull/15 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Topic** (`src/topics/array-basics/`): `record()` runs `push(9)`, `unshift(1)`, `pop()` and `shift()` on the learner's array with one step per element moved (13 steps for `[3, 5, 8]`, 7 for an empty array), a moves counter, the returned values, and four predict questions ("How many elements will move when we push / unshift / pop / shift?"). `code.ts` (JS and TS, same lines), `content.ts` (cinema-seats analogy and where it breaks, Big O `O(1) or O(n)`, a 3-question quiz, the Tech Interview Handbook array page as the source) and `index.ts` with a number-list editor ("Starting array", 0 to 6 numbers from -99 to 99).
- **Engine:** `Seat` and `Frame.seats`/`seatCount`; `SeatRow` (`src/visuals/SeatRow.tsx`) places each box by a `--seat` CSS variable so a changed seat makes the box glide; `Player` shows `SeatRow` when a frame has seats.
- **Contract:** `numberListEditor.extremes()` and `EntryEditor.extremes`, so each editor supplies its own boundary inputs to the shared contract test (it was hard-coded for the warm-up).
- **Registry and map:** registered, and its stage set to `available`. It unlocks after the warm-up, which gave the Locked page its first browser test.
- Styles for the seat row (container-query sizing, glide transitions, marks). `CLAUDE.md` documents seat-row topics, the video rule and extremes.

## Tests
- Unit: 756 passing (58 files), written red first, including properties over 40+ starting arrays and the shared contract tests picking up the topic.
- E2E: 254 passing (127 tests x desktop and phone); new `array-basics.spec.ts` (14 tests); the map spec updated.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- The plan said "1 to 6 numbers"; an empty starting array is accepted too (it is a clean edge case and the walkthrough handles it), so the limit is 0 to 6.
- The topic ships **without a watch-first video**. A promising candidate exists ("Why Is Unshift Slower Than Push For JavaScript Arrays?", JavaScript Toolkit, https://www.youtube.com/watch?v=n1lYl7XwPMA) and its title was confirmed, but its content and length could not be read, so it was not linked. The owner can vet it and ask for it to be added.
- Motion was not added: CSS transitions were enough for the glide.
- Two e2e assumptions were wrong at first and corrected: the boxes sit in the page in id order (so they can glide), not seat order, and a box was measured while its pop-in scale animation was still running.

## Follow-ups
- Decide on the video above.
- Next topics in the roadmap, in order: map, filter and reduce; the hidden loop; duplicate check; two pointers; binary search; hash map two sum. Each follows the topic checklist in `CLAUDE.md`, and the shared tests check it.
- `Path Complete` still needs all 8 stages, so no badge changed.
