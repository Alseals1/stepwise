# 0016 "Your data" as a modal: summary

**PR:** https://github.com/Alseals1/stepwise/pull/9 (merged into `dev` after all four CI checks passed)

## What changed
- **`Dialog`** (`src/components/Dialog.tsx`): a reusable modal on the native `<dialog>` with `showModal()`. Content mounts only while open; focus starts on the title and returns to the opener; Close, Escape and a click on the dimmed area all close it; it only calls `onClose` when the learner closed it, not when the parent did.
- **`YourDataButton`** in the header HUD (a third chip, with a new `DataIcon`) opens the modal. `YourData` lost its card and heading and now only holds the tools; the modal supplies the title. `Home` no longer shows the card.
- **Nested Escape**: the restore review and the reset confirmation call `preventDefault()` and `stopPropagation()` on Escape, so the first press closes just that step and the second closes the modal.
- Styles: centered window, dimmed and blurred backdrop, page scroll lock, scrolling inside on short screens, a phone layout that nearly fills the screen.
- `src/test/setup.ts`: a small stand-in for `showModal()` and `close()`, since jsdom lacks them.
- `CLAUDE.md`: the Dialog pattern and its nested-Escape rule.

## Tests
- Unit: 381 passing (41 files), written red first.
- E2E: 126 passing (63 tests x desktop and phone). A new spec covers opening from the map and a topic page, three ways to close, keyboard-only use, focus never reaching the page behind, the page behind not clickable or scrollable, nested Escape, clean reopening, and fit on desktop, phone and a short screen. The older backup, restore and reset specs now open the modal first.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- My first focus test assumed a hard focus trap. A native modal lets Tab pass to the browser's own UI after the last control (the page reports `BODY`) and then wraps to Close. The test now asserts the real requirement: focus never lands on the page behind.
- Playwright's accessibility lookup doesn't treat the page behind a modal as hidden, so "unreachable" is tested by trying to click it (the backdrop takes the pointer).
- One CI run stalled for about 8 minutes in the "install Chromium" step (GitHub infrastructure, before any test ran). I cancelled and re-ran it; it then passed in under 2 minutes. No code change was needed.

## Follow-ups
- If more tools join the modal later (for example settings), group them under their own headings inside `YourData`.
- Next in the roadmap: 0013 (first-visit tour and how-to page), 0014 (predict mode and custom input), then the topics.
