# 0020 Topic: Palindrome with two pointers

## Goal
Teach the two-pointer move on a word: one pointer at each end walks inward, comparing characters, and the first mismatch returns `false` at once. This is the twin of Two Sum II (0009): same technique, different question. The picture to remember: a palindrome is checked from the outside in, and **a mismatch ends the check early**.

## Decisions (approved; the owner could not be asked)
- **Letters and digits only** (not LeetCode's "skip punctuation" version): the learner's own `isPalindrome` compares `str[front] !== str[back]` directly. Capitals are read as lowercase (said in the hint).
- **Default input `racecar`**: 7 characters, 3 comparisons, a middle character nobody compares, and a clean `true`.
- **New editor `wordEditor`** in `src/engine/inputs.ts` (pure, next to `numberListEditor`): up to 12 characters, A to Z and 0 to 9 only; capitals become lowercase; surrounding whitespace is trimmed, spaces or punctuation inside are refused by name ("Letters and digits only: leave out the space."); an **empty word is allowed** (a palindrome by definition; `record()` skips the loop with a clear sentence). `format` returns the lowercase word, so it round-trips.
- **Visual: widen, do not duplicate.** `Frame.array` and `ArrayBoxes` accept `(string | number)[]`, so characters are boxes like numbers. `front` (cyan) and `back` (amber) pointer tags use the same colors as `left`/`right`. One new mark, `mismatch` (danger color), for the pair that ends a failed check; matched pairs are `done`.
- **Per round: a compare step, then a decision step** (match: both pointers move inward; mismatch: return false and stop). A `comparisons` counter is in the variables. When the pointers meet or cross a loop-check step says why the loop ends (naming the middle character for odd lengths), then `return true`.
- **Predict mode:** at the first compare, "How many comparisons will this word need?" (numbers via `buildChoices`); at every decision, "What happens next?" with `Keep going` / `Return false` / `Return true`, the right one rotating. Words of 0 or 1 characters have no loop, so no questions.
- **Map placement:** stage `palindrome` (title "Palindrome", difficulty 2) right after `two-pointers`. This shifts the unlock chain: Binary search now unlocks after Palindrome, and the e2e specs that name the old chain are updated.
- **Path Complete badge** hint no longer says a number ("Complete every stage.") so it cannot go stale again.
- **Source:** Tech Interview Handbook, Strings, "Palindrome" section (opened and confirmed: it describes starting two pointers at both ends and moving inward). No watch-first video (none verified).

## What the learner sees
- Code (JS and TS, 12 lines each): `isPalindrome(str)` with `front`, `back`, the loop, the mismatch return and `return true`.
- The word as character boxes, `front` and `back` tags, the pair being compared in cyan and amber, matched characters green, a mismatch pair red.
- Variables: `str`, `front`, `back`, `comparisons`, and `result` at the end.

## Content (draft)
- **What it does:** Checks whether a word reads the same backwards by comparing characters from both ends and walking inward, stopping at the first mismatch.
- **Analogy:** two people reading the same word from opposite ends (or folding a strip of paper in half): letters that land on each other must match. *Where it breaks:* the pointers never read the middle letter of an odd word (it faces itself), and a real reader would not stop at the first difference.
- **Big O:** time `O(n)` (at most n/2 comparisons, and half of n is still O(n)); space `O(1)` (two pointers, unlike `str.split('').reverse().join('')`, which builds a whole copy).
- **Quiz:** four questions (what a mismatch does; the middle character; time; extra memory).

## Acceptance criteria
- For every generated word the result and the comparison count equal a plain reference `isPalindrome`; a mismatch stops early; pointers stay in range; the word never changes.
- Bad input (a space, punctuation, an accent, 13 characters) is refused with a message that names the problem; Random and extremes feed the shared contract tests.
- Every existing topic still renders numbers in `ArrayBoxes`.
- No sideways scroll at 390 px with a 12-character word; colors from tokens; keyboard-only; one `role="status"`.

## Tests (red first)
Unit: `record()` exact sequence for `racecar`; reference comparison over many words; even, odd, one-character, empty, mismatch first and last; asks; `wordEditor` (accepted and refused text with exact messages, lowercasing, round trip, random, extremes); `ArrayBoxes` with strings and with numbers; contract tests, stage list, badge tests.
E2E (`e2e/palindrome.spec.ts`, desktop and phone): locked then unlocked; the walkthrough with highlight, narration and pointer tags; a palindrome and a non-palindrome; the middle character; predict mode scored; custom input with every refusal message; the quiz; a 12-character word on a phone.

## Files
`src/engine/{types,inputs}.ts` (+tests), `src/visuals/ArrayBoxes.tsx` (+test), `src/index.css`, `src/topics/palindrome/*`, `src/topics/{registry,stages}.ts`, `src/topics/content.test.ts`, `src/progress/badges.ts` (+tests), `CLAUDE.md` (one line on string boxes and the word editor), `plans/ROADMAP.md` (tick the row), `e2e/palindrome.spec.ts`, and the e2e specs touched by the unlock order (`map`, `binary-search`, `hash-map-two-sum`).

## Dependencies
None.

## Open questions
None (all decided above).
