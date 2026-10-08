# 0004 Saved progress, streak and badges

## Goal
Make the game real. Everything the learner earns (stars, unlocks, streak, badges) and their settings (language, speed, unlock-all) are saved in the browser and survive a reload. Add the daily streak with a weekly freeze, nine badges, a header display and a badges page.

## Decisions (from the owner)
- **Streak day:** finishing a run (reaching the last step of an animation) or checking a quiz. Opening the app doesn't count.
- **Missed day:** one missed day a week is forgiven (a free freeze). The longest streak is kept.
- **Badges:** milestones plus topic badges tied to the owner's known gaps.
- Split from the old 0004: the tour and how-to page are 0013; predict mode and custom input are 0014.

## Rules I'm setting (shout if you disagree)
- **Days are local calendar days** (your computer's date), not 24-hour windows.
- **Freeze:** if you study after missing exactly one day, and no freeze was used in that missed day's week (weeks start Monday), the streak continues (+1 for the day you came back; the missed day isn't counted). Two or more missed days, or a second miss in the same week, resets the streak to 1.
- **The streak shown** is 0 as soon as it can no longer be saved: more than one day missed, or one day missed with the week's freeze already used. If today isn't studied yet but yesterday was, it still shows (at risk, not lost).
- **Reset progress** (a button on the map, with an inline "Are you sure?") clears stars, streak, badges and run history, but keeps settings.
- Progress stays on this browser only. No accounts, no sync between tabs or devices. Backup comes from export and import (feature 0015). Accounts and sync (for example Supabase) are v2, after deploy; all saving goes through `src/storage` with a versioned format so that module can be swapped.
- Corrupted or unknown saved data is ignored and the app starts fresh, without crashing.

## User-visible behavior
- **Header chips:** a flame with "3-day streak" (amber; "Start a streak" when 0) and a medal chip "2 of 9 badges" that links to the badges page.
- **Map stats panel:** current streak, best streak, and "Freeze ready" or "Freeze used this week".
- **Badges page** (`#/badges`): a grid of all nine; earned ones show the date, locked ones show how to earn them. Topic badges for unbuilt topics say so.
- **Toast** when a badge unlocks: "Badge unlocked: First Run", dismissible, auto-hides, polite screen-reader announcement (not `role="status"`).
- **Saved settings:** the JS/TS choice and the speed slider are remembered across topics and reloads; Unlock all topics too.
- If the browser can't store data (private mode or blocked), the map says "Progress can't be saved in this browser" and everything else still works for the session.

## Badges
| Badge | Earned when |
|-------|-------------|
| First Run | You play any animation to its last step |
| First Quiz | You check your answers on any quiz |
| Perfect Score | 3 stars on any topic |
| 3-Day Streak / 7-Day Streak | Your streak reaches 3 / 7 days |
| Path Complete | All 8 stages completed |
| Hidden Loop Spotter | Complete "The hidden loop" |
| Set Master | Complete "Duplicate check: loops vs a Set" |
| Pointer Pro | Complete "Two pointers" |

Badges are data (`id`, title, description, hint, and a pure `earned(state)` check), so adding one is one entry.

## Design
- **Pure core** in `src/progress/`: `streak.ts` (`dayKey`, `daysBetween`, `weekKey`, `recordStudy`, `currentStreak`; date math uses UTC parts so daylight-saving changes can't break it), `badges.ts` (definitions and `evaluateBadges`), `state.ts` (the saved shape, `reduce(state, event, today)` for events `runFinished`, `quizChecked`, `setUnlockAll`, `setLanguage`, `setSpeed`, `reset`; it returns new badges earned).
- **Storage** in `src/storage/`: key `stepwise:v1`, a versioned shape, `load()` validates everything (unknown version, bad JSON, wrong types, out-of-range speed) and falls back to a fresh state; `save()` is wrapped in try/catch and reports failure.
- **Provider:** `ProgressProvider` loads once, saves after each change, takes an injectable clock (`now`) for tests, and queues toasts.
- **Player** stays generic: new optional props `initialLanguage`, `onLanguageChange`, `initialSpeed`, `onSpeedChange`, `onRunComplete` (fires once each time the last step is reached, not at mount). `TopicPage` wires them to the provider.

## Acceptance criteria
- A reload keeps stars, unlocks, streak, badges, language, speed and unlock-all.
- Streak rules are covered for: same day twice, next day, one missed day with and without a freeze, two missed days, a freeze already used that week, week boundaries (Sunday to Monday), month and year boundaries, and daylight-saving dates.
- No crash with bad or missing storage; the app works in memory.
- One `role="status"` per page still holds (toast uses `aria-live`).
- Colors only from tokens; animation respects reduced motion; no sideways scroll at 390 px.

## Tests (red first)
Unit:
- `streak`: the table above, plus `currentStreak` for "alive", "at risk" and "broken", and `longest`.
- `badges`: each badge's condition, the "Path Complete" needs all 8, and `evaluateBadges` never un-earns.
- `state.reduce`: each event, new badges reported once, reset keeps settings.
- `storage`: round trip; invalid JSON, wrong version, wrong types, bad speed; throwing `localStorage` for read and for write.
- Provider: loads, saves after changes, toast queue, injected clock.
- UI: header chips, stats panel, badges page (earned vs locked), toast (dismiss, auto-hide with fake timers), reset flow, the storage-unavailable notice.
- `Player`: `onRunComplete` fires on reaching the last step, not at mount and not twice in a row; language and speed callbacks; `initial*` props.

E2E (Playwright; the browser clock is set with `page.clock.setFixedTime`, no real waiting):
- Play a run to the end: "First Run" toast, badge on the badges page, streak chip "1-day streak".
- Check the quiz with all correct: stars, "First Quiz" and "Perfect Score".
- Reload: everything is still there, including JS/TS and speed; unlock-all too.
- Next day: streak 2. A missed day with the freeze: streak continues and "Freeze used". A second miss in the same week, or two days missed: reset, with the best streak kept.
- Reset progress (cancel, then confirm).
- Storage blocked (init script makes `localStorage` throw): the notice shows and the app still works. Corrupted saved data: starts fresh.
- Keyboard: the badges link, toast dismiss, reset buttons. No sideways scroll.

## Files
`src/progress/{streak.ts,badges.ts,state.ts,ProgressContext.tsx}`, `src/storage/{storage.ts}`, `src/components/{StreakChip,BadgeChip,StatsPanel,BadgeCard,Toast,ResetProgress,StorageNotice,Icons}.tsx`, `src/pages/{Badges,Home,TopicPage}.tsx`, `src/router/parseRoute.ts`, `src/pages/resolvePage.ts`, `src/engine/{Player,useStepper}.ts(x)`, `src/App.tsx`, `src/index.css`, matching tests, `e2e/{progress,streak,badges}.spec.ts`.

## Dependencies
None.

## Not in this feature
First-visit tour and How-to page (0013). Predict mode and custom input (0014). Cross-tab sync. Export and import (0015). Accounts and sync (v2). XP and levels (not planned).

## Open questions
None blocking.
