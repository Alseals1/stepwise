# 0020 Topic: Palindrome with two pointers: summary

**PR:** https://github.com/Alseals1/stepwise/pull/23 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Topic** (`src/topics/palindrome/`, id `palindrome`): `record(str)` runs `isPalindrome(str)`. Each round is a compare step and a decision step (a match moves both pointers inward; a mismatch returns false and stops). A `comparisons` counter sits in the variables. Matched characters are `done`, the pair in play is `current`/`compare`, and a failed pair gets the new red `mismatch` mark. A loop-end step explains why the loop stopped: for an odd word it names the middle character nobody compares, for an even word the pointers crossing. Default `racecar`: 11 steps, 3 comparisons. Empty and one-character words skip the loop.
- **Characters in boxes, without a second component:** `Frame.array` and `ArrayBoxes` now take `(string | number)[]`, the `mismatch` mark carries hidden "does not match" text for screen readers, and `front` (cyan) and `back` (amber) tag colors come from the existing tokens.
- **Word editor** (`src/engine/wordInputs.ts`): up to 12 letters or digits, capitals read as lowercase, ends trimmed, an empty word allowed, anything else refused by name. Random mixes palindromes with near-misses, and it supplies extremes for the contract tests.
- **Predict mode:** the first compare asks how many comparisons the word needs (`buildChoices`), and every compare asks "What happens next?" with Keep going / Return false / Return true in a rotating position. No questions for a word of 0 or 1 characters.
- `code.ts` (12 lines in JS and TS), `content.ts` (two-readers analogy and where it breaks, `O(n)` time, `O(1)` space, a 4-question quiz, Tech Interview Handbook's Strings "Palindrome" section as the source, opened and confirmed). No watch-first video.
- **Map:** the stage sits right after Two pointers, so **Binary search now unlocks after Palindrome**; the map, binary-search and hash-map-two-sum e2e specs were updated. The "Path Complete" badge hint now counts the stages instead of saying eight.

## Tests
- Unit: 1925 passing on the branch, written red first. `record()` is checked against a plain reference `isPalindrome` over 300+ generated words (result, comparisons, stopping early, at most n/2), plus exact sequences, 38 editor tests, character tests for `ArrayBoxes` and the badge tests.
- E2E: 470 passing on the branch (235 tests x desktop and phone); new `palindrome.spec.ts` (17 tests).
- **After merging `dev` in: 1966 unit tests and 490 e2e runs pass**, with lint, typecheck and build.

## Deviations from the plan
- The editor is its own module, `wordInputs.ts`, rather than living in `inputs.ts`.
- The Path Complete hint is computed from `stages.length` instead of a fixed phrase.
- A loop-end step was added (line 4) so the middle character gets its own moment.
- A new `mismatch` mark was added to the engine; the plan only asked for the pair to be "marked clearly".
- Built by a subagent in a worktree; its Write tool refused to create this summary, so it was written here from the agent's text plus the integration notes below.

## Integration with 0019 (common bugs), done when merging
- `dev` was merged into this branch and git resolved every file by itself: the two features touched different parts of `types.ts`, `registry.ts`, `index.css` and `CLAUDE.md`. Nothing was hand-edited, and the whole suite was re-run afterwards in the main checkout.

## Follow-ups
- LeetCode's "skip spaces and punctuation" variant could be a later feature.
- Add a watch-first video only after opening one and confirming it matches.
