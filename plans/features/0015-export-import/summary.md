# 0015 Export and import progress: summary

**PR:** https://github.com/Alseals1/stepwise/pull/8 (merged into `dev` after all four CI checks passed)

## What changed
- **`src/storage/backup.ts`**: the envelope `{ app: 'stepwise', format: 1, exportedAt, data }`, `buildBackup`, `serializeBackup` (pretty file, one-line text), `backupFileName`, `parseBackup` (never changes anything), `summarize`, and plain-words failure messages. Inner data goes through `parseSaved`.
- **`src/storage/browser.ts`**: `downloadText` (Blob URL and a temporary link) and `copyText` (false if the browser refuses).
- **State**: a `replace` event in `reduce`, and `replaceProgress` on the provider (stable identity, saves, clears toasts, awards nothing).
- **Components**: `BackupExport` (download, copy, selected fallback box), `BackupImport` (file or paste, review with both sets of numbers, confirm, cancel and Escape, focus handling), `YourData` (the card, which now also holds Reset progress).
- Styles for the card, the paste box, the file button (real input hidden but focusable) and the review panel.
- `CLAUDE.md`: the backup format and the rule for changing saved data.

## Tests
- Unit: 366 passing (40 files), written red first.
- E2E: 108 passing (54 tests x desktop and phone): real clipboard, a real file download and upload, wiped browser restored, cancel and Escape, bad inputs, blocked clipboard, keyboard-only flow, no sideways scroll.
- Lint, typecheck and build pass. No new dependencies.

## Deviations from the plan
- Review wording changed to "Replacing overwrites your current progress. Download a backup first to keep it." (the first draft read awkwardly).
- A literal invisible BOM character got written into two source files; ESLint caught it and both now use the `﻿` escape.
- My test probe used an `<output>` element, which is itself a live region and broke the "no status role" check. A plain `<span>` replaced it. (Same trap as in 0002; worth remembering for test helpers.)

## Follow-ups
- Backups are not encrypted and are not merged: restoring replaces everything, by design.
- A scheduled backup reminder could be nice later, once there is enough progress to lose.
- Accounts and sync (Supabase) remain v2; `backup.ts` and `storage.ts` would be replaced together.
- Next in the roadmap: 0013 (tour and how-to page), then 0014 (predict mode and custom input), then the topics.
