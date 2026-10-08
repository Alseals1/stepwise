# 0018 Custom input

## Goal
Let the learner run an algorithm on their own numbers: type a list, press Apply, and the picture, code, narration and predict questions all follow. This is the "try it yourself" half of learning.

## Decisions (from the owner)
- **Up to 8 numbers, each from -99 to 99.**
- **A text field plus Random and Reset** (not number chips).
- **A run on your own numbers counts** for the streak and the First Run badge, like any finished run. Quiz stars are unaffected.

## User-visible behavior
- A **Try your own numbers** card under the player, on topics that support it. It holds:
  - a text field, pre-filled with the example (`2, 4, 6`), with a short hint: "Up to 8 whole numbers from -99 to 99, separated by commas or spaces.";
  - **Apply** (also Enter in the field), **Random** (fills in a fresh example and runs it) and **Reset** (back to the example).
- **Apply** restarts the run on the new numbers: step 1, a fresh picture, new code walkthrough, new narration (`Call sum with [5, 10].`), predict questions about the new numbers, a fresh score, playback stopped. Language, speed and the Predict switch are kept.
- **Friendly errors**, one at a time, right under the field, with the first problem named: `"abc" isn't a number.`, `"2.5" isn't a whole number.`, `Use at most 8 numbers (you entered 10).`, `Numbers must be between -99 and 99 (found 150).`. A bad entry changes nothing: the current run carries on untouched.
- An **empty field** means an empty list, which the warm-up accepts: it is a good edge case to watch.
- The keyboard shortcuts (Space, arrows, R, 1 to 4) are off while you type in the field, as for any text field.
- Your numbers are **not remembered**: leaving the topic or reloading goes back to the example.
- The tour gets a fifth step for the card (skipped where there isn't one). The replay hint moves out of a step's text into a note the tour shows on its last step, whichever it is. The How-to page explains the card.

## Rules I'm setting (shout if you disagree)
- **Accepted:** whole numbers, an optional leading minus (a typographic minus is also fine), separators of commas, spaces, semicolons or any mix, repeated separators, leading zeros (`007` is 7), and `-0` is 0.
- **Rejected:** decimals, exponents (`1e3`), plus signs, text, more than 8 numbers, values outside -99 to 99, and absurdly long input (over 200 characters).
- **The limits live with each topic**, so later topics (a sorted list and a target, for example) can set their own. Only number lists are built now; other kinds of input arrive with the topics that need them.
- **The same questions are asked** (the content contract test also runs on extreme inputs: empty, one number, eight negatives, eight of 99) so no input can produce a broken frame or an unfair question.

## Acceptance criteria
- Any accepted input produces a full, correct run; any rejected input changes nothing and says why.
- The previous run's state never leaks: step, pending question, answers, score and autoplay all reset.
- Fully keyboard-usable and announced: the field has a label and hint, errors are tied to it (`aria-invalid`, `aria-describedby`) and announced politely (no second `role="status"`).
- No sideways scroll at 390 px; 44px tap targets; colors from tokens; reduced motion respected.

## Design
- **`numberListEditor(options)`** (`src/engine/inputs.ts`) builds a topic's editor: `parse(text)` (ok with the list, or a message), `format(list)`, `random(rng?)`, limits and labels. Pure and heavily unit-tested.
- A topic exposes its editor next to `record`; **`TopicEntry`** becomes the type-erased bridge the page uses: `frames` for the example, plus (when there is an editor) `editor.apply(text)`, `editor.random()` and `editor.reset()`, each giving frames and the normalized text. Topics stay generic over their input type.
- **`InputPanel`** is the card. **`TopicPage`** holds the current frames and a run key; `Player` is remounted on each Apply, which resets all of its state at once (its saved language, speed and predict choices are re-read from progress).
- No change to progress: `onRunComplete` already records a run on whatever frames are showing.

## Tests (red first)
Unit:
- `numberListEditor.parse`: every accepted form and every rejection with its exact message; empty means an empty list; the length limit; the range limit; very long input; the first problem wins; `format` and `random` (seeded, always valid, within the limits, readable length).
- Contract tests per topic with an editor: the example's text parses back to the default input; random inputs are always valid; the topic's `record()` works for extreme inputs and its frames fit the code lines; the predict-question rules hold on all of them.
- `InputPanel`: label, hint, buttons; errors with `aria-invalid` and the described-by message; Enter applies; Apply, Random and Reset behavior; a rejected entry reports nothing to the page.
- `TopicPage`: Apply swaps the run (step 1, new length, new narration), resets a waiting question, answers and score; Random and Reset; shortcuts off while typing; a custom run still records a finished run; leaving and returning shows the example.
- Tour (five steps where the card exists, the note on the last step), How-to text.

E2E (desktop and phone):
- Type `5, 10` and Apply: 7 steps, the narration names 5 and 10, the picture shows the new boxes. Enter applies.
- Each error message, with the current run unchanged; empty means an empty list.
- Random and Reset; the field is not remembered after a reload.
- With predict mode on, the questions are about the new numbers; typing digits in the field doesn't answer one.
- A finished run on custom numbers shows the First Run toast and a streak.
- Tour shows the new step and the replay note; the card fits a phone without sideways scrolling.

## Files
`src/engine/{inputs,InputPanel,types}.ts(x)`, `src/topics/{registry.ts,content.test.ts}`, `src/topics/sum-demo/{index,record}.ts`, `src/pages/{TopicPage,HowTo}.tsx`, `src/tour/{steps.ts,Tour.tsx}`, `src/index.css`, matching tests, `e2e/input.spec.ts` and the tour spec, `CLAUDE.md`.

## Dependencies
None.

## Not in this feature
Remembering custom input, sharing it by link, number chips, other kinds of input (a target, text, a sorted list), saving a history of tries.

## Open questions
None blocking.
