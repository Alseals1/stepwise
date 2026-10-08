# 0014 Predict mode: summary

**PR:** https://github.com/Alseals1/stepwise/pull/13 (merged into `dev` after all four CI checks passed, including the run after this summary)

## What changed
- **Engine:** `Ask` on `Frame`; `buildChoices` (`src/engine/choices.ts`) for number answers with the right one in a rotating position; `useStepper` gets a `gate` and `pendingIndex` and `release()` (moving forward stops before a gated frame; Back, Restart and turning predict mode off never leave it stranded); `PredictPanel` and `PredictFeedback`; `Controls` gets the Predict mode switch, a lock on Next and Play while a question waits, and the end-of-run score; `Player` keeps this run's answers.
- **Keys:** 1 to 4 answer a question (`useStepperKeys`, and a new "Answer a prediction" row in `SHORTCUTS`, which the How-to page and its test read).
- **Warm-up topic:** four questions (the total after each of the three additions, and what the function returns).
- **Saved state:** `settings.predictMode` (additive; a missing value means off), in `reduce`, storage validation, the provider and backups.
- **Tour and How-to:** a "Predict mode" tour step (skipped where the switch doesn't exist; the replay hint stays on the last step) and a section in the How-to page.
- Styles for the question, feedback, switch and score. `CLAUDE.md` explains how a topic adds predict mode.
- Roadmap: 0014 narrowed to predict mode; custom input became 0018.

## Tests
- Unit: 526 passing (51 files), written red first, including a content contract for every topic's questions (valid answer, unique options, lengths within 4 characters, varied positions, none on the first frame).
- E2E: 190 passing (95 tests x desktop and phone). New `predict.spec.ts` (12 tests); the tour and How-to specs were updated.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- The plan said predict mode would be mentioned in the tour; it became a fourth step placed *before* "The controls", so the replay hint stays on the last step.
- Two bugs found while building were fixed in this PR: the player shortcuts ignored a focused checkbox (so pressing → after toggling the Predict switch did nothing), and revisiting an answered step re-grabbed focus. Both have unit tests.
- One earlier-existing CodePanel test failed once under load and passed on three re-runs; it is timing sensitive and worth watching.
- The "predictions never change stars" e2e test is deliberately modest: it only checks that predicting alone doesn't complete a topic.

## Follow-ups
- Custom input is next (0018), with its own plan and questions.
- Each new topic should add `ask` frames; the contract test already checks them.
- A prediction accuracy history (per topic, over time) was left out on purpose.
