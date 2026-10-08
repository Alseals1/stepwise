# 0014 Predict mode

## Goal
Turn watching into practice. With predict mode on, the player pauses before key steps and asks "what happens next?". The learner guesses, sees whether they were right and why, and the run carries on. Custom input is its own feature (0018).

## Decisions (from the owner)
- **Multiple choice**, two to four answers, at steps the topic's author chooses.
- **Explain and carry on:** a wrong answer shows the right one with a one-sentence reason, then the step is revealed. Nobody gets stuck.
- **A score at the end of the run only:** "You predicted 4 of 5." It has no effect on stars, streak or badges.
- Split from the old 0014: custom input moves to 0018.

## User-visible behavior
- A **Predict mode** switch in the controls panel, **off by default**, remembered across topics and reloads, and shown only on topics that have questions.
- **Predict mode on:** pressing Next, or autoplay, reaching a question step pauses *before* showing the step. The picture and code still show the previous step; a question panel asks, for example, "What will total be after adding 4?" with answers A to C.
  - Pick an answer with the mouse, or press **1** to **4**.
  - The step is revealed at once, with a feedback line: "Right! total was 2 and 4 is added, so it becomes 6." or "Not quite. The answer was 6: total was 2 and 4 is added." Feedback is announced politely and stays until the next step.
  - While a question is waiting, Next and Play do nothing (Back still works and cancels the question). Autoplay stops at a question; press Play to carry on.
  - A question is asked once per run: going Back and forward again doesn't repeat it. **Restart** starts a fresh run with fresh questions and a fresh score.
- **After the last step:** "You predicted 3 of 4." next to the "Run complete" badge (only if the run had questions).
- Turning predict mode off mid-question reveals the step and carries on.
- The warm-up gets four questions: what `total` becomes after each of the three additions, and what the function returns.

## Rules I'm setting (shout if you disagree)
- A question belongs to the frame it is *about* (the one revealed after the answer), so the first frame can't have one.
- Answers shown are in different positions across a topic (the right answer isn't always A), and options are about the same length (within 4 characters), like the quiz rules. A content test enforces all of this for every topic.
- Predictions aren't saved: they last for the current run only.
- The How-to page and the tour mention predict mode (a fourth tour step, shown only where the switch exists).

## Acceptance criteria
- With predict mode off, every existing behavior and test is unchanged.
- No way to get stuck: a question can always be answered, skipped by Back, or cancelled by turning predict mode off.
- Fully keyboard-usable (1 to 4, Tab and Enter on the answers) and announced to screen readers; focus moves to the question, then to the feedback.
- Still one `role="status"` per page (the narration); the feedback uses `aria-live="polite"`.
- No sideways scroll at 390 px; colors from tokens only; reduced motion respected.

## Design
- `Frame` gets an optional `ask: { question, options, answer, explain }`.
- `useStepper` gets an optional `gate(target)`: when moving forward would reveal a gated frame, it records a `pendingIndex` and stops playback instead; `release()` reveals it; Back, Restart and a changed gate clear it.
- `Player` keeps this run's answers, builds the gate from them (`predictOn && frame.ask && not answered`), shows a `PredictPanel` while a question is pending, and a feedback line afterwards. `Controls` gets the switch and the end-of-run score.
- `SavedState.settings.predictMode` (additive, defaults to off); `reduce` handles `setPredictMode`; the provider exposes `setPredictMode`.
- `SHORTCUTS` gains "pick an answer" (1 to 4), so the How-to table and its test stay in sync; `useStepperKeys` handles it.
- A small helper builds answer choices (dedupes, fills, places the right answer in a rotating position) for `record()` functions.

## Tests (red first)
Unit:
- `record()` for the warm-up: four asks, on the right frames, with valid answers; the choice helper (dedupe, count, rotation).
- Content contract for every topic's asks: valid answer index, unique options, equal-ish lengths, varied answer positions, no ask on frame 0.
- `useStepper` gate: Next and autoplay are intercepted and stop playback; `release()` reveals; Back and Restart clear; nothing changes without a gate.
- `PredictPanel` and feedback: options, labels, keyboard, right and wrong text.
- `Player`: off means no questions; on pauses before the question frame and shows the previous step; Next and Play do nothing while pending; answering reveals and shows feedback; asked once per run; Restart resets; the switch is hidden without questions; callbacks and the saved value; the score at the end; number keys; focus moves.
- State, storage, provider and backup for `predictMode` (default, validation, reset keeps it, round trip).
- `SHORTCUTS`, the How-to page and the tour (four steps where the switch exists).

E2E (Playwright, desktop and phone):
- Switch it on, press Next into the first question: the step isn't shown yet; a wrong answer shows the explanation and reveals the step; a right one says so.
- Autoplay stops at a question; Play carries on after answering. Keys 1 to 4 answer.
- A mixed run ends with the right score. Restart clears the score and asks again.
- The setting survives a reload. Off by default; with it off nothing pauses.
- Back cancels a question; turning the switch off mid-question reveals the step.
- The question panel fits on a phone with no sideways scroll.
- Tour shows the Predict mode step; How-to lists the 1 to 4 keys.

## Files
`src/engine/{types,useStepper,useStepperKeys,shortcuts,Player,Controls,PredictPanel,choices}.ts(x)`, `src/topics/sum-demo/record.ts`, `src/topics/content.test.ts`, `src/progress/{state,ProgressContext}.ts(x)`, `src/storage/storage.ts`, `src/pages/{TopicPage,HowTo}.tsx`, `src/tour/steps.ts`, `src/index.css`, matching tests, `e2e/predict.spec.ts`, `e2e/tour.spec.ts`, `CLAUDE.md`.

## Dependencies
None.

## Not in this feature
Custom input (0018). Click-the-picture or typed predictions. Saving prediction history or accuracy over time. A badge for predictions. Predictions for topics that aren't built yet (each new topic adds its own).

## Open questions
None blocking.
