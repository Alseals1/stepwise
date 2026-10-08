# 0002 Step engine

## Goal
The shared player every topic will use: record a list of frames once, then play them back with controls, a highlighted code panel (JS/TS toggle), a variables panel and narration.

## User-visible behavior
For now the home page shows a demo ("Add up the numbers") on the player. 0003 replaces the demo with the topic grid.
- The array boxes show the current frame; the box being worked on is highlighted, finished ones are marked.
- The code panel shows the topic's code with the current line highlighted. A **JS | TS** toggle switches language; the same line stays highlighted.
- The variables panel lists the live variables. The narration sentence explains the step (announced to screen readers via `aria-live="polite"`).
- Controls: Restart, Back, Play/Pause, Next, a Speed slider, and "Step 3 of 7".
- Keyboard: `Space` play/pause, `→` next, `←` back, `R` restart.
- Playing stops by itself on the last frame; pressing Play on the last frame starts over.

## Acceptance criteria
- A topic only needs `record()` plus two code strings; the engine needs no changes per topic.
- JS and TS code of a topic have the same number of lines (a contract test enforces this, so one frame `line` works for both).
- Highlighting still works if Shiki hasn't loaded yet: plain text shows first, colors arrive when loaded.
- Keyboard shortcuts are ignored while typing or when a form control (slider, input, select) has focus. `Space` is ignored on a focused button, so the button's own action wins.
- No sideways scrolling at 390 px; controls stay usable on a phone.

## Design decisions (made here, shout if you disagree)
1. **Frame type** (`src/engine/types.ts`): `line` (1-based), `vars`, `say`, optional `array` and `marks`. The predict prompt (`ask`) is added in 0004, not now.
2. **No Motion yet.** Boxes just change style. Motion arrives with the first topic whose boxes actually move (0005).
3. **No router.** The demo renders on the home page; 0003 builds the shell.
4. **Shiki, without `dangerouslySetInnerHTML`.** Use `codeToTokens` and render each line as React elements, so the current line is a normal element we can test (`aria-current="step"`). Fine-grained import (JS regex engine, only the JS and TS grammars and one theme, `catppuccin-mocha`, which matches the code colors `#1e1e2e` / `#cdd6f4`) to keep the bundle small.
5. **Language choice** lives in component state for now; remembering it is part of 0004 (localStorage).
6. **Speed** is a slider, 0.5x to 4x; delay between frames is 1200 ms divided by speed.

## Tests (red first)
Unit (Vitest + RTL, fake timers for autoplay):
- `sumDemo.record`: frame count, lines, vars, and the final `return` frame.
- Topic contract: JS and TS code have the same line count; every frame `line` is within range.
- `useStepper`: next/back clamp at the ends; restart; play advances by the speed-based delay and stops at the end; play on the last frame restarts; changing speed changes the delay.
- Keyboard: each shortcut works; ignored in an input and on a slider; Space ignored on a focused button.
- `CodePanel`: plain lines first; the current line has `aria-current`; toggle switches code; same line stays current.
- `VariablesPanel`, `Narration`, `ArrayBoxes`: render the frame; narration is a polite live region.

E2E (Playwright, desktop and phone):
- Click Next: step counter, narration and highlighted line change; Back undoes it.
- Keyboard: `→`, `←`, `Space`, `R`.
- Toggle to TS: the same line stays highlighted and the code text changes.
- Press Play at max speed: it reaches the last step and stops.
- No sideways scroll.

## Files
`src/engine/{types.ts,useStepper.ts,Controls.tsx,CodePanel.tsx,highlighter.ts,VariablesPanel.tsx,Narration.tsx,Player.tsx}`, `src/visuals/ArrayBoxes.tsx`, `src/topics/sum-demo/{record.ts,code.ts}`, matching `*.test.ts(x)`, `src/App.tsx` (render the demo), `e2e/player.spec.ts`, styles in `src/index.css`.

## Dependencies
- `shiki`: already approved in the roadmap. Nothing else.

## Open questions
None blocking.
