# 0008 Topic: Duplicate check, nested loops vs a Set

## Goal
Show the trade at the heart of many interview problems: **spend a little memory to save a lot of time.** The same question ("does this list contain a duplicate?") answered two ways, one after the other on the same list, with the cost of each counted on screen. It is the cure for the previous topic, "The hidden loop".

## Decisions (mine, since the owner said to do what I recommend)
- **The two versions run one after the other, not at the same time.** First the nested loops (compare every pair), then the Set version, on the same list. Both counters (`comparisons` and `lookups`) stay in the variables panel, so the learner sees 15 against 6 at the end. This reuses every visual already built and keeps the code panel to one highlighted line at a time.
- **The "common bugs mode" is split into its own later feature (0019)** so this topic stays reviewable.
- A longer default list with **no duplicate**, so the full cost of the nested loops shows. The early-return case was the point of the last topic and can be tried by editing the list.

## What the learner sees
- The code panel holds both functions (17 lines, JS and TS the same length): `hasDuplicateSlow` with a loop inside a loop, then `hasDuplicateFast` with a `Set`.
- **Part 1, nested loops:** the `items` row with the pair being compared marked (the outer item in cyan, the inner item in amber); one step per comparison with its count; an equal pair is a match and ends it with `return true`.
- **Part 2, the Set:** the `items` and `seen` rows. Each item gets one `has` lookup (a step) and, if it is new, an `add` (a step). The Set is shown as the row of items it holds.
- The end shows both costs, for example: "The Set needed 6 lookups; the nested loops needed 15 comparisons." and what the gap would be for 100 items (4,950 against 100).
- **Predict mode** asks two questions: "How many comparisons will the nested loops make?" and "How many lookups will the Set make?"
- **Try your own list:** 0 to 6 whole numbers from -99 to 99. Default `[4, 7, 2, 9, 5, 1]` (no duplicate).

## Content (draft)
- **What it does:** Finds out whether a list has a duplicate two ways, nested loops and a Set, and counts the work each one does.
- **Analogy:** A bouncer who stamps each guest's hand as they go in. A stamped hand means that person is already inside, which is one glance. The nested-loops bouncer instead compares every guest with every other guest. *Where it breaks:* a Set is not a stamp on the person: it stores the items themselves, which uses extra memory. That memory is the price of the instant check.
- **Big O:** time `O(n²) vs O(n)` because the nested loops compare every pair (about n × n ÷ 2) while the Set does one lookup per item; space `O(1) vs O(n)` because the nested loops need no extra memory but the Set stores every item it has seen.
- **Quiz:** three questions (how many comparisons for 5 different items; what the Set version pays for being faster; roughly how many lookups for 1,000 items).
- **Source:** MDN's `Set` page, **opened and confirmed**: it says `has` is, on average, faster than `Array.prototype.includes`. No watch-first video unless one is verified.

## Rules I'm setting (shout if you disagree)
- Both parts stop at the first duplicate, as the real code does.
- A new mark, **compare** (amber), shows the inner item of a pair; the existing marks are unchanged.
- The two predict questions are numbers, like every other topic's.
- This topic unlocks after "The hidden loop" (the unlock rule from the last feature).

## Acceptance criteria
- For every list of 0 to 6 numbers, both counts equal what real code does (checked against reference implementations), and the narration, marks and counters agree at every step.
- The questions are fair for all extreme and random lists (the shared contract tests).
- No sideways scroll at 390 px; colors from tokens; keyboard-only usable; one `role="status"` per page.

## Design
- `src/topics/has-duplicate/{index,record,code,content}.ts` per the topic checklist, id `has-duplicate` (the stage id), number-list editor with up to 6 numbers.
- `Mark` gains `'compare'`; one style rule. Frames use the existing `rows`.
- No new dependency.

## Tests (red first)
Unit:
- `record()`: exact sequences for a distinct list and for one with a duplicate; both final counters equal reference implementations over 200 generated lists; the counters only ever rise by one step at a time; matches end each part with `return true`; edge lists (empty, one item, two equal items); two asks with the right answers and varied positions; no shared state between runs.
- The `compare` mark renders; the shared contract tests pick the topic up (content, quiz, questions, extreme and random inputs).
- Stage list and the badge notes (Set Master now has its topic built).

E2E (desktop and phone):
- Locked until "The hidden loop" is done, then unlocks.
- The distinct default: 31 steps, the highlight moves from the nested function to the Set function, the final counters are 15 and 6, and the closing sentence names both.
- A list with a duplicate ends each part with `return true` at the right counts.
- Predict mode: both questions, scored.
- Your own list, a limit message, the quiz, and a phone fit.

## Files
`src/topics/has-duplicate/*`, `src/topics/{registry,stages}.ts`, `src/engine/types.ts`, `src/visuals/ArrayBoxes.tsx` (if needed), `src/index.css`, the badges tests, `plans/ROADMAP.md`, `e2e/has-duplicate.spec.ts`, `e2e/map.spec.ts`, `e2e/badges.spec.ts`, `CLAUDE.md` if the recipe changes.

## Dependencies
None.

## Not in this feature
The side-by-side race, the common bugs mode (0019), a graph of the two counts, and a Map-based version.

## Open questions
None blocking.
