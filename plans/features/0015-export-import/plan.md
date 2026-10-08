# 0015 Export and import progress

## Goal
Let the learner back up their progress and restore it: after clearing browser data, on a new browser, or on another device. No accounts. This is the safety net before anyone relies on a long streak.

## Decisions (from the owner)
- **Import replaces everything.** The backup becomes the progress. A review step shows what's in the file and what it will replace, and the learner confirms.
- **File plus copy/paste text.** Export downloads a file or copies the backup text; import picks a file or takes pasted text. Pasting works well on phones.

## Rules I'm setting (shout if you disagree)
- **Format:** a small JSON envelope, `{ "app": "stepwise", "format": 1, "exportedAt": "<ISO time>", "data": <the saved progress> }`. The file is pretty-printed; the copied text is one compact line. The file name is `stepwise-progress-YYYY-MM-DD.json` (local date).
- **What's included:** everything saved (stars, runs, streak, badges, language, speed, unlock-all).
- **Validation reuses the loader.** The inner data goes through the same checks as saved data (`parseSaved`), so bad entries are dropped rather than trusted. Anything not usable is rejected with a specific message, and **nothing changes** until the learner confirms.
- **Rejected with a clear message:** empty input, not JSON, not a Stepwise backup, a newer format than this app understands ("update the app first"), unusable data, a file over 1 MB.
- **A restored streak can look lapsed.** Old backups keep their best streak, but the current streak follows the normal day rules from today.
- **Imported badges don't pop toasts**, since they were already earned.
- **Clipboard may be blocked.** If copying fails, show the backup text in a box, selected, so it can be copied by hand.
- **Only the envelope is accepted** (not raw saved data), to keep the rules simple and the messages clear.
- **Where it lives:** a "Your data" card at the bottom of the map, which also holds the existing Reset progress.

## User-visible behavior
**Your data card** (map page) with a line "Your progress is saved in this browser only. Back it up before clearing browser data or switching devices." and:
- **Download backup:** saves `stepwise-progress-2026-10-08.json`.
- **Copy backup:** copies the text, then "Backup copied." (or the fallback box).
- **Restore from a backup:** a file picker ("Choose backup file") and a text box ("Or paste your backup") with a **Review backup** button.
- **Review step:** "This backup was saved Oct 8, 2026. It has 3 topics completed, a best streak of 5 days and 4 badges. It will replace your current progress: 1 topic completed, a best streak of 2 days and 3 badges." Buttons: **Replace my progress** and **Cancel** (focus starts on Cancel, Escape cancels).
- After replacing: "Progress restored." and the map updates. Settings come from the backup too.
- Errors appear next to the input in plain words, and are announced politely (`aria-live`, not a second `status` region).
- **Reset progress** stays, below the backup tools.

## Acceptance criteria
- Export then import on an empty browser restores everything, including the badge dates.
- Importing never partly applies: any rejection leaves current progress untouched.
- A hand-edited or hostile file can't break the app or inject bad values (reuses `parseSaved`; speed and days are clamped and checked).
- All of it works with the keyboard alone, and on a phone width with no sideways scroll.
- Colors from tokens only; reduced motion respected; one `role="status"` per page still holds.

## Design
- **Pure** (`src/storage/backup.ts`): `buildBackup(state, now)`, `serializeBackup(backup, 'file' | 'text')`, `parseBackup(text)` returning `{ ok: true, state, exportedAt }` or `{ ok: false, reason }`, `summarize(state)` (topics completed, best streak, badge count) and `backupFileName(day)`. This sits next to `storage.ts`, so a v2 account backend replaces both.
- `reduce` gets a `replace` event (the state is already validated). The provider gets `replaceProgress(state)` with a stable identity; it saves like any change and queues no toasts.
- **Browser bits** isolated and injectable for tests: `downloadText(name, text)` (Blob URL plus a temporary link) and clipboard access.
- **Components:** `YourData` (card), `BackupExport`, `BackupImport` (input, review, confirm), `ResetProgress` (moved inside the card, unchanged).

## Tests (red first)
Unit:
- `buildBackup` and `parseBackup`: round trip; each failure reason; newer format; wrong app; whitespace and a leading BOM; inner data cleaned by `parseSaved`; size limit; the summary numbers; the file name uses the day.
- `reduce('replace')` and the provider's `replaceProgress`: replaces, saves, no toasts, stable identity.
- `BackupExport`: download calls the helper with the right name and content; copy success message; copy denied or unavailable gives the selected fallback box.
- `BackupImport`: paste a valid backup, see the review with both sets of numbers, confirm, progress replaced and "Progress restored."; invalid text shows the right error and changes nothing; cancel and Escape change nothing; file upload works; an oversized file is rejected; focus moves to the review and back.
- `YourData` composition, including Reset progress still working.

E2E (Playwright, with granted clipboard permissions and a faked date):
- Copy backup, wipe storage, paste, review, replace: stars, streak, badges and settings come back.
- Download the file (checks the file name), clear storage, upload the file, confirm: restored.
- Cancel at the review leaves progress alone. Garbage text, a non-Stepwise JSON and a newer-format file each show their message and change nothing.
- Clipboard blocked: the fallback box appears with the backup text.
- Keyboard-only run of the paste flow; no sideways scroll at 390 px.

## Files
`src/storage/backup.ts` (+ test), `src/progress/state.ts` (`replace` event), `src/progress/ProgressContext.tsx`, `src/components/{YourData,BackupExport,BackupImport}.tsx` (+ tests), `src/components/ResetProgress.tsx` (unchanged), `src/pages/Home.tsx`, `src/index.css`, `e2e/backup.spec.ts`, `CLAUDE.md` (backup format note).

## Dependencies
None.

## Not in this feature
Merging backups, encryption or a password, automatic or scheduled backups and reminders, cloud or account sync (v2), a QR code.

## Open questions
None blocking.
