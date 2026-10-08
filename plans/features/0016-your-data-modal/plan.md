# 0016 "Your data" as a modal

## Goal
Move the "Your data" card (backup, restore, reset) off the map and into a modal that opens from a button, so the map stays short and the tools are reachable from any page.

## Decisions (from the owner)
- **Button in the header, on every page**, as a third chip next to the streak and badge chips.
- **Standard centered modal.**

## User-visible behavior
- A **Your data** chip in the header opens a modal titled "Your data" containing exactly what the card held: the intro, **Download backup**, **Copy backup**, **Restore from a backup** (file, paste, review, confirm) and **Start over / Reset progress**.
- The map no longer has the card; it ends after the stages.
- **Closing:** the Close button, the Escape key, or clicking the dimmed area. Focus returns to the Your data chip.
- **Nested steps keep their own Escape:** inside the restore review or the reset confirmation, Escape closes only that step; a second Escape closes the modal.
- **While open:** focus starts on the title and stays inside the modal, the page behind can't be clicked or scrolled, and the content scrolls inside the modal when it is taller than the screen.
- Closing and reopening starts clean (no leftover review or error).
- **Phone:** the modal nearly fills the screen and scrolls inside.

## Design
- Uses the browser's native `<dialog>` and `showModal()`, which gives the focus trap, inert background and Escape for free. No new dependency.
- A reusable `Dialog` component (open state in, `onClose` out, title, children). Content is only mounted while open, so state resets. It restores focus to the opener itself, so it behaves the same in every browser.
- `YourData` loses its card and heading (the modal provides the title). Reset, backup and restore components are unchanged.
- The test environment's DOM doesn't implement `showModal`, so `src/test/setup.ts` gets a small stand-in. Real behavior is covered by the Playwright tests.

## Acceptance criteria
- Everything that worked in the card still works in the modal (all backup, restore and reset flows).
- The modal is reachable and usable with the keyboard alone and its focus can't leave it.
- Opening it never changes progress; closing it never loses an unfinished review without the user acting.
- No hardcoded colors; reduced motion respected; no sideways scroll at 390 px; touch targets of at least 44 px.
- Only one `role="status"` per page still holds.

## Tests (red first)
Unit:
- `Dialog`: closed means not in the accessibility tree and no content mounted; open has role `dialog` named by its title; the Close button, the native close event and a click on the backdrop all call `onClose` once; a click inside the content doesn't; focus lands on the title when opened and returns to the opener when closed; closing from the parent doesn't call `onClose` again.
- Header button: opens the modal with all four tools; Close returns focus to the chip.
- Home no longer shows the card.
- The nested Escape handlers stop the key from also closing the modal.
- Existing backup, restore and reset unit tests keep passing unchanged.

E2E (Playwright, desktop and phone):
- Open from the map and from a topic page; the content is there; focus is on the title.
- Escape, Close and a backdrop click each close it and return focus to the chip.
- Focus can't escape with Tab (many presses, always inside); the page behind doesn't scroll.
- Escape inside the restore review closes only the review; a second Escape closes the modal.
- Reopening starts clean.
- Phone: the modal fits the screen, no sideways scroll.
- The existing backup, restore and reset e2e specs are updated to open the modal first and still pass.

## Files
`src/components/{Dialog,YourData,YourDataButton,Hud}.tsx` (+ tests), `src/components/{BackupImport,ResetProgress}.tsx` (Escape handling), `src/components/Icons.tsx`, `src/pages/Home.tsx`, `src/test/setup.ts`, `src/index.css`, `e2e/{your-data-modal,backup,progress}.spec.ts`, `e2e/helpers.ts`, `CLAUDE.md`.

## Dependencies
None.

## Not in this feature
A side drawer, animations beyond a quick fade, moving Unlock all topics or other settings into the modal.

## Open questions
None blocking.
