# 0018 Custom input: summary

**PR:** https://github.com/Alseals1/stepwise/pull/14 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **`numberListEditor`** (`src/engine/inputs.ts`): a pure editor for a list of whole numbers with `parse`, `format` and `random`. Limits live with each topic (the warm-up uses up to 8 numbers from -99 to 99). Accepts commas, spaces and semicolons, leading zeros and a typographic minus; `-0` becomes 0; an empty field is an empty list. Rejects decimals, exponents, plus signs, text, too many numbers, out-of-range values and over-long input, each with a plain message that names the first problem.
- **Topic and registry:** `Topic.inputEditor`; `makeEntry` (exported) bridges any topic's editor type-erased as `entry.editor` (`example`, `apply`, `random`).
- **`InputPanel`** ("Try your own numbers"): label, hint, Apply (also Enter), Random, Reset; errors tied to the field and announced politely.
- **`TopicPage`** holds the current run; applying input swaps the frames and remounts `Player` with a new key, which resets step, playback, question, answers and score in one go. Language, speed and Predict mode are re-read from progress.
- **Tour:** a fifth step for the card; the replay hint moved out of step text into a `finishNote` prop shown on whichever step is last.
- **How-to page:** a "Try your own numbers" entry.
- `App` keys `TopicPage` by topic so state can't carry across topics. Styles for the card. `CLAUDE.md` explains the editor, the per-run remount and the contract test.

## Tests
- Unit: 615 passing (55 files), written red first, including a contract test that runs every editor-enabled topic through extreme and random inputs and applies the question-fairness rules to each.
- E2E: 226 passing (113 tests x desktop and phone); new `input.spec.ts` (18 tests); the tour spec updated for five steps.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- `makeEntry` is exported (it was an internal `entry` helper) so the bridge can be tested with fake topics.
- A few unit and e2e tests were written together with the code rather than strictly red first (the plural fix in the editor messages, and the How-to paragraph). They still pin the behavior.
- Several early e2e attempts used macOS-sensitive keys (Control+A) or left the caret at the start so Backspace deleted nothing. Logging confirmed typing works normally in the field, including after an error, and the tests now type like a person.

## Follow-ups
- Only number lists exist. The first topic that needs another kind of input (a sorted list plus a target, or text for palindromes) adds its own editor.
- Sharing your numbers by link, remembering them, and number chips were deliberately left out.
- Next: build the first real topic, array basics (0005), now that the engine, tour, predict mode and custom input are in place.
