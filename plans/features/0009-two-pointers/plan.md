# 0009 Topic: Two pointers, Two Sum II

## Goal
Teach the two-pointer move through the gift-card story from the source lesson: in a **sorted** list, find two numbers that add up to a target by standing at both ends and **dropping one number at every step**. The picture to remember: every move rules out one number for good, so the loop can run at most n times (O(n)).

## Decisions (mine, since the owner said to do what I recommend)
- **Palindrome is split into its own feature (0020).** The roadmap said "Two Sum II + isPalindrome", but isPalindrome needs a text (letters) input, and this topic already adds a new input kind and a new visual. Same approach as 0019 (split to keep each PR reviewable).
- **New visual: pointer tags.** A frame may carry `pointers: { label, index }[]`; `ArrayBoxes` shows each one as a small tag under its box (`left` in cyan, `right` in amber, matching the box marks). Numbers that have been **ruled out** fade (`dim`), which makes the "every move drops one number" insight visible. Space for the tags is reserved, so boxes do not jump when a pointer moves.
- **New input kind: a sorted list plus a target**, in the one text field: `1, 3, 4, 6, 8, 11 target 10`. It needs up to 8 numbers from -99 to 99, **in order, smallest first**, and a target from -198 to 198. An unsorted list is **refused with a message that teaches the rule** ("Two pointers only works on a sorted list: 5 is followed by 3"), rather than silently sorted.
- **Default `[1, 3, 4, 6, 8, 11]`, target 10** (the source lesson's own example): both directions of movement and a match: 5 sums, 13 steps, against 15 pairs for nested loops.
- **Per round: a sum step, then a decision step** (match, drop the big end, or drop the small end). Narration says *why* the move is safe.
- **Predict mode** asks, on every decision step, "What happens next?" with three options (`left moves right`, `right moves left`, `it is a match`), the right one rotating position.
- Returns **0-based positions**, like the code on screen (LeetCode's version is 1-based; a note in the narration is not needed).
- Unlocks after "Duplicate check" (the nearest earlier built stage). "Pointer Pro" becomes a badge whose topic is built, so the badge tests move on to a different "not built yet" example if any remain.

## What the learner sees
- Code (JS and TS, same lines, 11): `twoSumSorted(nums, target)` with `left`, `right`, `sum`, a `while (left < right)` loop and the three outcomes.
- The list as boxes, `left` and `right` tags under their boxes, ruled-out numbers faded, the pair glowing green when found.
- Variables: `left`, `right`, `sum`, `target`, and `sums` (how many sums so far).
- The last step says how many sums it took against the most pairs nested loops could need (n(n-1)/2).

## Content (draft)
- **What it does:** Finds two numbers in a sorted list that add up to a target by walking in from both ends and dropping one number at every step.
- **Analogy (from the source lesson):** spending a gift card exactly: a price list sorted cheapest first, one finger on the cheapest item and one on the dearest. Total too high: the dear item is too pricey even next to the cheapest, so drop it. Too low: drop the cheap one. *Where it breaks:* it only works because the list is sorted; on an unsorted list "move left to get bigger" means nothing.
- **Big O:** time `O(n)` because every step drops one number for good, so there are at most n steps; space `O(1)` because it keeps only two pointers and a sum.
- **Quiz:** four questions (what to do when the sum is too big; why it is O(n); what happens on an unsorted list; how much extra memory).
- **Source:** Tech Interview Handbook, array "Two pointers" section (opened: the heading exists; it covers the technique in general, not Two Sum II specifically). No watch-first video unless one is verified.

## Acceptance criteria
- For every sorted list and target in range, the result and the number of sums equal a reference implementation; every move drops exactly one number; pointers never leave the list.
- Unsorted lists, a missing target, an out-of-range target and a ninth number are refused with friendly messages.
- Questions are fair for all extreme and random inputs (shared contract tests).
- No sideways scroll at 390 px (boxes wrap on a phone); colors from tokens; keyboard-only usable; one `role="status"`.

## Tests (red first)
Unit: `record()` exact sequence for the default; matches a reference over many sorted lists and targets (found or not, sums count, ruled-out count rises by one per move); empty, single, equal and no-match lists; asks (right answer per step, varied positions); the editor (parse good and bad text, the unsorted message, round-trip via `format`, extremes, random); `ArrayBoxes` pointer tags (shown, both on one box, none); contract tests; stage list and badge tests.
E2E (desktop and phone): locked then unlocked after Duplicate check; the default walkthrough with pointers and fading; the match and the closing sentence; a no-match list; predict mode scored 5 of 5; custom input with every refusal message; the quiz; a phone fit.

## Files
`src/engine/{types,inputs}.ts` (+tests), `src/visuals/ArrayBoxes.tsx` (+test), `src/engine/Player.tsx`, `src/index.css`, `src/topics/two-pointers/*`, `src/topics/{registry,stages}.ts`, `src/topics/content.test.ts`, badge tests, `plans/ROADMAP.md` (0009 row text, new 0020, decision rows), `CLAUDE.md` (pointer tags, the sorted-list editor), `e2e/two-pointers.spec.ts`, other e2e specs touched by the unlock order.

## Dependencies
None.
