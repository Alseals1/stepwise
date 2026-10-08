# Stepwise — Roadmap

A web app that teaches algorithms, data structures and JS array methods by **animating each step** next to the code and a **plain-English analogy**.

**Audience:** built for the owner's own interview prep first, and written so other learners can use it later. The UI has no personal references (no project names, no links to private lessons).

Built from what has worked in `../leet_code_practice`: video-first, "see it work step by step", analogies, predict-before-reveal (`assets/two-pointer-viz.js`), and the gaps in the learning records. Lesson numbers below are internal notes for where the material came from.

---

## 1. The core idea: record steps, then play them back

Every visualization works the same way as the existing `two-pointer-viz.js`:

1. **Run** the algorithm once on the input and record a list of **frames** (snapshots).
2. **Play back** the frames with a media-player style control bar.

```js
// One frame = everything the screen needs at that moment
{
  line: 4,                              // code line to highlight
  vars: { left: 0, right: 5, sum: 12 }, // variables panel
  array: [1, 3, 4, 6, 8, 11],
  highlight: { 0: 'left', 5: 'right' }, // which boxes get colored or labeled
  say: '12 is more than 10, so 11 can never be in the answer. Move R left.',
  ask: { q: 'Which pointer moves?', options: ['L', 'R'], answer: 1 } // optional predict prompt
}
```

Adding a new topic means writing one `record(input) → frames[]` function. The player, code panel and controls are shared, so new topics come cheaply.

---

## 2. Screen layout (one page per topic)

```
┌──────────────────────────────────────────────────────────────┐
│  Two Pointers · Two Sum II         [JS|TS]   [?] How to use │
│  🎁 Analogy: Spending a $10 gift card exactly…   (collapsible)│
├───────────────────────────────┬──────────────────────────────┤
│   VISUAL                      │  CODE                        │
│   [1] [3] [4] [6] [8] [11]    │  while (left < right) {      │
│    L                    R     │ ▶  const sum = a[l] + a[r]   │
│                               │    if (sum === target) …     │
│                               │  VARIABLES                   │
│                               │  left 0 · right 5 · sum 12   │
├───────────────────────────────┴──────────────────────────────┤
│  💬 12 is more than 10, so 11 can never be in the answer.     │
│     Move R left.                                             │
├──────────────────────────────────────────────────────────────┤
│  ⏮  ◀  ▶ Play  ▶|  ⏭     Step 2 / 5    Speed ━━●━━   🔮 Predict │
│  Input: [1,3,4,6,8,11]  target: 10   [Try my own] [Random]   │
└──────────────────────────────────────────────────────────────┘
```

- **Visual:** animated boxes, pointers, a Set or hash map drawn as buckets, a step counter.
- **Code:** the current line is highlighted and the live variables are shown under it. A **JS / TS toggle** switches the language; both versions keep the same line numbering so one frame's `line` works for both.
- **Narration:** one sentence per step about *what* happens and *why*.
- **Predict mode** (on/off): pauses before key steps and asks what happens next. Same idea as the predict-the-move stepper in Lesson 07. The on/off choice is remembered.
- **Custom input:** edit the array or target and replay. Bad input gets a friendly message, never a crash.

---

## 3. Keeping it simple to use

- **First-visit tour:** three tooltips ("This is the picture → This is the code → Press ▶ or Space"). Can be skipped and replayed from the **[?] How to use** button.
- **Keyboard:** `Space` to play/pause, `→`/`←` to step, `R` to restart.
- **Home page is a level map:** topics are stages on a path. Each stage has an icon, a one-line description and a difficulty dot, and shows its state (locked, open or completed with 1 to 3 stars from the quiz score). Opening a stage goes straight into a working animation with a sample input.
- Every topic page starts with **"What this does" (one sentence)** and the **analogy card**, then the animation.
- A **"Watch first"** video link at the top of each topic (NeetCode or similar).
- A short **"Check yourself"** quiz at the bottom of each page (same idea as `quiz.js`).
- **Progress is saved in the browser** (`localStorage`): completed topics, quiz scores and stars, **daily streak**, **badges**, speed, predict mode, language choice, and whether the tour was seen. No accounts.
- **Game feel:** a dark, game-launcher look (violet and cyan, glowing progress, chunky buttons, small celebration animations). Tone is fun but grown-up. No XP or levels in v1, and no mascot.
- **Desktop first, phone OK:** on narrow screens the panels stack and stay usable.
- The **Big O** answer appears at the end of every run as "Time O(n) because… Space O(1) because…", matching the coaching rule.

---

## 4. Content: what to build, in order

Analogies are taken from the existing lessons wherever one exists. ⭐ = targets a gap from the learning records.

### v1 (MVP), built in this order
| # | Topic | Analogy | What the animation shows |
|---|-------|---------|--------------------------|
| 1 | **Array basics: push / pop / unshift / shift** | Cinema seats (Lesson 07) | `push` drops into the end seat. `unshift` makes every box slide one seat right, with a "moves: n" counter. |
| 2 | **map / filter / reduce / find** | Assembly line (new) | Items go through one at a time; the callback result and the new array or accumulator build up live. |
| 3 | ⭐ **includes / indexOf: the hidden loop** | Phone book flip (Lesson 06) | `.includes()` inside a `for` loop runs an inner scan that animates too, so the counter climbs to n². |
| 4 | ⭐ **hasDuplicate: nested loops vs Set** | Guest list at the door (new) | Side by side. Left: an i/j grid fills in cell by cell with an n² counter. Right: the `seen` Set grows and `.has()` lights up in O(1). Shows the exact moment `return true` stops the function. **Common bugs mode** replays 3 classic mistakes (`.has` on the array, `i` instead of `arr[i]`, never calling `.add`). |
| 5 | **Two pointers: Two Sum II + isPalindrome** | Gift card (Lesson 07) | Port of `two-pointer-viz.js`. Each ruled-out number is **greyed out for good**, and a step counter is compared with n ("every move rules out one number"). The palindrome version stops at the first mismatch (early return). |
| 6 | **Binary search** | Phone book, open to the middle (Lesson 06) | lo/mid/hi markers. The discarded half greys out, and a step counter is compared with log₂(n). |
| 7 | **Hash map: Two Sum (unsorted)** | Coat check tickets (new) | Each number checks "is my partner's ticket already here?", then hangs up its own coat. |

**Content rules** (carried over from the lessons):
- Every analogy card ends with **"Where the analogy breaks: …"**.
- Examples stay generic (shopping carts, playlists, sign-up lists), with no personal project names.
- Every topic ends with a Big O card: "Time O(?) because…, Space O(?) because…".
- Quiz options are all the same length, so the formatting gives no hints.
- Each topic cites one trusted source: NeetCode, Tech Interview Handbook, javascript.info or Visualgo.
- The variables panel always shows `i`, `left`/`right`, `seen` and the return value.

### v2
Sliding window (max sum or longest substring; next on the NeetCode roadmap), **event loop visualizer** (call stack, microtask queue and macrotask queue for the A-C-B and 3-1-4-2 orderings, with narration of *why* await gives up control; restaurant-buzzer analogy for Promises), stack (valid parentheses), linked list reverse, sorting (bubble sort vs. a `sort` comparator), closures (backpack).

**Out of scope** (matches MISSION.md): dynamic programming, graphs, hard LeetCode.

---

## 5. Tech stack (decided)

- **Vite + React + TypeScript**, using **npm**.
- **Motion** (formerly Framer Motion) for box movement via `layout` animations. Respects `prefers-reduced-motion`.
- **Shiki** for code highlighting (JS and TS).
- **Vitest + React Testing Library** for unit and component tests. **Playwright** (Chromium only) for e2e, at desktop and phone widths.
- **ESLint + `tsc`** for lint and typecheck. A pre-commit hook runs lint, typecheck and the unit tests related to staged files.
- **GitHub Actions** on every PR into `dev`: unit tests, e2e tests, typecheck + lint, and a production build all have to pass.
- **Visual style: dark, sleek game UI (dark only in v1; a light theme can come later).** Violet and cyan on a deep navy-violet background, with amber for streaks and stars. Fonts are self-hosted through npm (`@fontsource-variable/outfit` for text, `@fontsource-variable/jetbrains-mono` for code). Colors are CSS variables, and a unit test checks their text contrast (WCAG AA). Animations are CSS and respect `prefers-reduced-motion`. Details in feature 0012.
- No backend. **Not deployed yet**; it runs locally with `npm run dev`.
- Any other dependency (e.g. a router) is proposed in that feature's `plan.md` before it's added.

```
src/
  engine/       Player.tsx, Controls.tsx, CodePanel.tsx, useStepper.ts, types.ts
  visuals/      ArrayBoxes.tsx, Pointers.tsx, HashMapBuckets.tsx, CounterRace.tsx
  topics/       two-sum-ii/{record.ts, code.js.ts, code.ts.ts, content.ts}, binary-search/…
  pages/        Home.tsx, Topic.tsx, HowToUse.tsx
  storage/      progress.ts (localStorage, safe when storage is unavailable)
e2e/            Playwright specs
plans/          ROADMAP.md, features/NNNN-slug/{plan.md, summary.md}
```

---

## 6. Features (each one = one folder in plans/features, one branch, one PR into dev)

Feature numbers are fixed IDs (they appear in branch names and folders). **The order of the table is the order they are built in.**

| # | Feature | Done when… |
|---|---------|------------|
| 0001 ✅ | **Project scaffold**: Vite/React/TS, Vitest+RTL, Playwright, ESLint, pre-commit hook, GitHub Actions CI, branch protection status checks | An empty app renders, a sample unit test and e2e test pass locally and on CI. |
| 0002 ✅ | **Step engine**: frame types, `useStepper`, controls (play/pause/step/restart/speed), keyboard shortcuts, code panel with JS/TS toggle, variables panel, narration | A test topic can be stepped forward and back with the mouse and keyboard, and the highlighted line stays in sync in both languages. |
| 0012 ✅ | **Game theme** (do this next): dark game design tokens and fonts, restyled player and controls, step progress bar, chunky buttons, game-style animations | Every existing screen uses the new look; contrast test passes; e2e passes at both widths. |
| 0003 ✅ | **App shell**: level-map home, topic page template (what-it-does, analogy card with "where it breaks", watch-first link, Big O card, quiz), star and lock visuals | A topic page renders from a content file; the map shows locked, open and completed stages. |
| 0004 ✅ | **Saved progress, streak and badges**: save progress and settings in localStorage (safe when storage is unavailable), real daily streak with a weekly freeze, 9 badges, header HUD, badges page, reset progress | Stars, unlocks, streak, badges, language and speed survive a reload; the streak follows the day rules; badges unlock with a toast. |
| 0015 ✅ | **Export and import progress**: save progress to a file and load it back, with validation and a clear confirmation | Exporting then importing on a cleared browser restores stars, streak, badges and settings; a bad file is rejected without changing anything. |
| 0016 ✅ | **Your data modal**: the backup, restore and reset tools open in a modal from a header button | The map is shorter; the modal opens from any page and traps keyboard focus; Escape and Close work. |
| 0017 ✅ | **Glass tour bubble**: a frosted-glass look for the tour's tip bubble | The bubble is see-through with the page blurred behind it, readable in the worst case, with solid fallbacks. |
| 0013 ✅ | **Guided help**: first-visit tour, How-to-use page | A new visitor sees the tour once and can replay it; the how-to page explains the controls and keyboard shortcuts. |
| 0014 ✅ | **Predict mode**: frames can ask "what happens next?" (multiple choice) and the player pauses, explains a wrong answer and carries on; a remembered on/off switch; a score at the end of the run | Predict mode pauses at each question, reveals the step after an answer, explains wrong answers, never blocks, and shows "You predicted 4 of 5" at the end. |
| 0018 ✅ | **Custom input**: edit the input and replay, with friendly validation and a Random button | Bad input shows a message, never a crash; a good one re-records the run. |
| 0005 | Topic: Array basics (push/pop/unshift/shift) | Each topic: unit tests for `record()` frames, plus an e2e test that plays it through, answers a predict prompt and completes the quiz. |
| 0006 | Topic: map / filter / reduce / find | 〃 |
| 0007 | Topic: includes / indexOf, the hidden loop | 〃 |
| 0008 | Topic: hasDuplicate, nested loops vs Set (+ common bugs mode) | 〃 |
| 0009 | Topic: Two pointers, Two Sum II + isPalindrome | 〃 |
| 0010 | Topic: Binary search | 〃 |
| 0011 | Topic: Hash map Two Sum | 〃 |

---

## 7. Decisions log

| Decision | Choice |
|----------|--------|
| Stack | React + TypeScript (Vite), npm |
| Paste-your-own-code animation | Not in v1 |
| Audience | Owner first, others later; no personal references in the UI |
| Repo | Public GitHub repo `stepwise`; `dev` is the default branch |
| Workflow | `feat/*` off `dev` → PR into `dev`; Claude merges once CI is green and writes `summary.md`; **only the owner merges `dev` → `main`** |
| Commits | Small and focused; each commit contains only the files its message describes |
| Tests | TDD; Vitest + RTL; Playwright e2e in Chromium only |
| CI gates | Unit, e2e, typecheck + lint, build |
| Local hook | Fast checks only (lint, typecheck, related unit tests) |
| Deploy | Not yet |
| Devices | Desktop first, phone OK |
| Progress | Saved in the browser (localStorage) |
| v1 extras | Predict mode, watch-first videos, quizzes |
| Visual design | Dark sleek game UI, violet + cyan, dark only in v1 (switched from the light Tufte look on 2026-10-08) |
| Game mechanics | Level map with locked topics and stars, daily streak, badges. No XP or levels. Look first (0012, 0003); real mechanics in 0004 |
| Tone | Fun but grown-up; no mascot |
| Streak | A day counts when you play a run to its last step or check a quiz (local time). One missed day a week is forgiven (a free freeze). Longest streak is kept |
| Badges | 9: First Run, First Quiz, Perfect Score, 3-day streak, 7-day streak, Path Complete (all 8 stages), plus topic badges Hidden Loop Spotter, Set Master and Pointer Pro |
| Accounts and sync | Not in v1. v2 may add Supabase (login, sync across devices) once the app is deployed. All saving goes through one storage module with a versioned format so it can be swapped. Export and import (0015) covers backup until then |
| Your data tools | In a modal opened from a header chip (decided after 0015; built as 0016) |
| Predict mode | Multiple choice at chosen steps; a wrong answer is explained and the run carries on (never blocks); a score at the end of the run only, with no effect on stars, streak or badges; the on/off choice is remembered |
| Custom input | Split out of 0014 into its own feature, 0018 |
| Split | Former 0004 split into 0004 (progress, streak, badges), 0013 (tour, how-to) and 0014 (predict mode, custom input) |
| Fonts | Self-hosted via npm: Outfit (text) and JetBrains Mono (code) |
| Code panel | JS + TS toggle |
| Topic order | Follows the lessons (array basics first) |
| Libraries | Motion + Shiki (Motion arrives with the first animation CSS can't do) |
