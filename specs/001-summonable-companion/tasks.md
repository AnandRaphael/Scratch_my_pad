---

description: "Task list for the Summonable Companion feature"
---

# Tasks: Summonable Companion

**Input**: Design documents from `/specs/001-summonable-companion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: Not requested. The project has no test harness; the constitution asks for manual-first verification. Each story ends with a validation task that runs the matching [quickstart.md](quickstart.md) scenarios. The only code-level check is the console snippet for `nextBlinkDelay`.

**Organization**: Tasks are grouped by user story so each can be implemented and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US4)
- Paths are relative to the repository root

## Path Conventions

Flat, no-build layout (plan.md, Structure Decision):

- `index.html`: page markup (edited)
- `style.css`: styles (edited, new "companion" section at the end)
- `companion.js`: new file for all companion logic
- `app.js`: **must stay unchanged**
- `README.md`: usage docs (edited in the polish phase)

Three of these files are shared by several stories, so tasks that edit the same file are not marked [P] against each other.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the empty pieces everything else fills in.

- [ ] T001 Create `companion.js` as a single IIFE with `'use strict'` and labelled comment sections in this order: `// ---------- constants ----------`, `// ---------- state ----------`, `// ---------- artwork ----------`, `// ---------- dom ----------`, `// ---------- lifecycle ----------`, `// ---------- blinking ----------`, `// ---------- input ----------`, `// ---------- boot ----------`, matching the style of `app.js`
- [ ] T002 Add `<script src="companion.js"></script>` to `index.html` on the line after `<script src="app.js"></script>`
- [ ] T003 [P] Append a new section to `style.css` headed `/* ---------- companion ---------- */` containing the bear palette as CSS variables declared on `#companion` (not on `:root`, so nothing outside the companion can pick them up): `--bear-fur: #a8683a`, `--bear-fur-dark: #8a5129`, `--bear-muzzle: #e0b98a`, `--bear-outline: #3a2a22`, `--bear-blush: #e98a74`, `--bear-rust: #c0552f`, `--bear-mustard: #e0a93b`, `--bear-teal: #4f9a8c`, `--bear-cream: #f1e3c8`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The overlay, the button, and the state object that every story depends on.

**CRITICAL**: No user story work can start until this phase is complete.

- [ ] T004 In `index.html`, add `<button id="btn-companion" aria-pressed="false" title="Summon the companion (B)">🧸 Buddy</button>` inside `#menu` immediately before the `#btn-clear` button, and add `<div id="companion" hidden aria-hidden="true"></div>` immediately after the closing `</div>` of `#desk` and before `<header id="brand">`
- [ ] T005 [P] In `style.css` (companion section), add the base overlay rule: `#companion { position: fixed; left: 20px; bottom: 20px; width: 150px; }` plus `#companion, #companion * { pointer-events: none; user-select: none; }`, and `#companion[hidden] { display: none; }`
- [ ] T006 In `companion.js`, implement the state object from data-model.md: `{ visible: false, pose: 'hidden', blinking: false }`; look up `#companion` and `#btn-companion` once (return quietly if either is missing so a broken page cannot throw); and expose the test hook `window.__companion = { get visible() { return state.visible; } }` (the `nextBlinkDelay` property is added in T021)

**Checkpoint**: The page loads with no visible change, no console errors, and a new `🧸 Buddy` button in the top-right menu that does nothing yet.

---

## Phase 3: User Story 1 - Summon and dismiss the companion (Priority: P1) 🎯 MVP

**Goal**: The user can summon a bear with the button or `B`, and dismiss it with the button, `B`, or `Esc`. Only one ever exists, and when dismissed it leaves no trace.

**Independent Test**: Quickstart scenarios 1 and 2. A simple stand-in bear is enough here; the final artwork and animation arrive in User Story 3.

### Implementation for User Story 1

- [ ] T007 [US1] In `companion.js` (artwork section), add a constant `BEAR_SVG` holding a deliberately simple stand-in: an inline `<svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">` with a head circle, two ear circles, and a body ellipse, all using the `--bear-*` variables through classes `bear-head`, `bear-ears`, `bear-body`. Comment it as a stand-in replaced in T016
- [ ] T008 [US1] In `companion.js` (lifecycle section), implement `summon()`, `dismiss()`, and `toggle()` per data-model.md. `summon()`: do nothing if `state.visible`; on the first call insert `BEAR_SVG` into `#companion` (build once, never duplicate); remove the `hidden` attribute; set `state.visible = true`; set class `is-arriving`, then `is-seated` when the arrival transition ends (with a 700 ms timeout fallback). `dismiss()`: do nothing if not visible; set `is-leaving`, then after the transition (400 ms fallback) restore the `hidden` attribute, clear the state classes, and set `state.visible = false`, `state.pose = 'hidden'`. Both functions keep `#btn-companion` in sync: `aria-pressed` `"true"/"false"` and `title` `Dismiss the companion (B)` / `Summon the companion (B)`. A `toggle()` that dismisses if visible and summons otherwise
- [ ] T009 [US1] In `companion.js` (input section), wire `#btn-companion` `click` to `toggle()`
- [ ] T010 [US1] In `companion.js` (input section), add a `window` `keydown` listener registered with `{ capture: true }`. `B` (case-insensitive): ignore if `e.metaKey || e.ctrlKey || e.altKey`, if `e.repeat`, or if `document.activeElement && document.activeElement.isContentEditable`; otherwise call `toggle()` and `e.preventDefault()`. `Escape`: only if the companion is visible AND `document.querySelector('.item.selected')` is null AND `document.getElementById('desk').classList.contains('tool-select')` AND the user is not typing, call `dismiss()`; never call `preventDefault()` or `stopPropagation()` on `Escape` so the existing handler in `app.js` still runs
- [ ] T011 [US1] In `style.css` (companion section), add the state styles for the overlay using only `opacity` and `transform`: base `#companion { opacity: 0; transform: translateY(16px); transition: opacity .5s ease, transform .5s cubic-bezier(.3, 1.4, .5, 1); }`; `#companion.is-arriving, #companion.is-waving, #companion.is-seated { opacity: 1; transform: none; }`; `#companion.is-leaving { opacity: 0; transform: translateY(8px); transition-duration: .3s; }`. Also add a visible focus ring for `#btn-companion:focus-visible` (for example `outline: 3px solid var(--accent); outline-offset: 3px`)
- [ ] T012 [US1] Run quickstart.md scenarios 1 and 2 in a browser and fix any failure. Confirm: hidden on load, one click or `B` summons within 1 second, a second press dismisses, repeated quick presses never create two bears, `Esc` dismisses only when nothing is selected and the Select tool is active, `B` typed inside a sticky types the letter

**Checkpoint**: User Story 1 works on its own: a stand-in bear can be summoned and dismissed from the button and keyboard.

---

## Phase 4: User Story 2 - Companion never gets in the way of the canvas (Priority: P1)

**Goal**: With the bear visible, every canvas action behaves exactly as it does with it hidden, and the bear stays on screen and clear of the controls at any window size.

**Independent Test**: Quickstart scenarios 4, 5, and 8.

### Implementation for User Story 2

- [ ] T013 [US2] In `style.css` (companion section), add a responsive rule `@media (max-width: 900px) { #companion { width: 100px; bottom: 100px; left: 12px; } }` so the bear shrinks and sits above the toolbar row instead of covering toolbar buttons, and confirm the bear stays fully on screen down to a 360 px wide window
- [ ] T014 [US2] Review `companion.js` and confirm by search that it never references `localStorage`, `sessionStorage`, `window.__scratchpad`, `state.items`, `state.strokes`, `fetch`, `XMLHttpRequest`, `Blob`, or `FileReader`, and never adds listeners to `#desk` (run `grep -nE "localStorage|sessionStorage|__scratchpad|fetch|XMLHttpRequest|Blob|FileReader|desk\.addEventListener" companion.js` and expect no matches other than the permitted `#desk` class check in T010). Fix `companion.js` if anything matches
- [ ] T015 [US2] Run quickstart.md scenarios 4, 5, and 8 in a browser and fix any failure: pan, zoom, pen, eraser, select, move, resize, edit text, undo, and redo behave identically with the pointer over the bear; saved JSON and exported PNG are identical with the bear hidden or visible; summoning does not enable Undo; the bear stays on screen and clear of the toolbar in a narrow window

**Checkpoint**: User Stories 1 and 2 both work. The stand-in bear can stay visible while the user works.

---

## Phase 5: User Story 3 - A cozy bear who feels present (Priority: P2)

**Goal**: The stand-in is replaced by the real bear in the reference style. It waves once on arrival, settles into a seated pose, and blinks at irregular intervals until dismissed.

**Independent Test**: Quickstart scenarios 3, 7, 9, and the console checks.

### Implementation for User Story 3

- [ ] T016 [US3] In `companion.js` (artwork section), replace the stand-in `BEAR_SVG` with the full layered bear, `viewBox="0 0 200 220"`, `aria-hidden="true"`, `focusable="false"`, with no `xmlns` attribute (it is not needed for inline SVG, and omitting it keeps the T025 network search clean), following `specs/001-summonable-companion/assets/character-reference.png`: brown fur, rounder head with small ears and a lighter muzzle, dark nose, two dark eyes, soft cheek blush, a gentle smile, over-ear headphones in rust and cream, a chunky knit sweater with horizontal stripes (rust, mustard, teal) and a rust scarf, dark outline strokes, seated with both paws resting in the lap. Use these class names so styles can target them: `bear-body`, `bear-head`, `bear-ears`, `bear-face`, `bear-eyes`, `bear-eyelids`, `bear-headphones`, `bear-sweater`, `bear-scarf`, `bear-arm-rest`, `bear-arm-wave`. `bear-eyelids` sits over the eyes, drawn in fur colour, and is open by default. `bear-arm-wave` is a raised right arm drawn from the shoulder so it can pivot there, and `bear-arm-rest` is the resting arm
- [ ] T017 [P] [US3] In `style.css` (companion section), colour the bear layers with the `--bear-*` variables from T003 (fill and stroke per class from T016), and add `#companion svg { width: 100%; height: auto; display: block; }`
- [ ] T018 [US3] In `style.css` (companion section), add the wave: `@keyframes bear-wave` rotating `.bear-arm-wave` about its shoulder pivot (`transform-origin` at the shoulder point of the arm in the SVG) between about -8deg and -32deg over four swings, `#companion.is-waving .bear-arm-wave { animation: bear-wave 2.4s ease-in-out 1 both; }`. The wave arm is hidden unless `is-waving` is set, and the rest arm is hidden while it is: `#companion .bear-arm-wave { visibility: hidden; } #companion.is-waving .bear-arm-wave { visibility: visible; } #companion.is-waving .bear-arm-rest { visibility: hidden; }`
- [ ] T019 [US3] In `style.css` (companion section), add the blink: `#companion .bear-eyelids { transform-box: fill-box; transform-origin: center; transform: scaleY(0); transition: transform .06s ease-in; } #companion.is-blinking .bear-eyelids { transform: scaleY(1); }`
- [ ] T020 [US3] In `style.css` (companion section), add `@media (prefers-reduced-motion: reduce)` that sets `#companion { transform: none; transition: opacity .2s linear; }` and `#companion .bear-arm-wave { animation: none; visibility: hidden; }` so the bear fades in without sliding or waving. Do not disable the eyelid blink
- [ ] T021 [US3] In `companion.js` (blinking section), implement the pure function `nextBlinkDelay(rand)` exactly per contracts/ui-contract.md: for `rand` in [0, 1), return `250` when `rand < 0.15` (double-blink follow-up), otherwise `2500 + ((rand - 0.15) / 0.85) * 3500` (so 2500 up to just under 6000). Add it to the test hook: `window.__companion.nextBlinkDelay = nextBlinkDelay`
- [ ] T022 [US3] In `companion.js` (blinking section), implement `startBlinking()` and `stopBlinking()`: `startBlinking()` schedules one `setTimeout` with `nextBlinkDelay(Math.random())`; when it fires it adds class `is-blinking` to `#companion` and sets `state.blinking = true`, then after 140 ms removes the class, sets `state.blinking = false`, and schedules the next one. Keep a single stored timer handle and clear it before scheduling so two chains can never run. `stopBlinking()` clears the timer and removes `is-blinking`. Add a `document` `visibilitychange` listener: when `document.hidden` call `stopBlinking()`; when visible again and `state.visible`, call `startBlinking()`; do nothing at all when the companion is not visible
- [ ] T023 [US3] In `companion.js` (lifecycle section), update `summon()` and `dismiss()` to the full lifecycle from data-model.md: `summon()` sets `is-arriving`; on its transition end sets `is-waving` and `state.pose = 'waving'`; on the `animationend` of `.bear-arm-wave` (with a 3500 ms timeout fallback) sets `is-seated` and `state.pose = 'seated'`; calls `startBlinking()` as soon as the bear is visible. At each summon read `window.matchMedia('(prefers-reduced-motion: reduce)').matches`; if true skip `is-arriving` and `is-waving` and go straight to `is-seated`. `dismiss()` calls `stopBlinking()` and clears any pending timeout so a quick summon-dismiss-summon never leaves stale timers or a duplicate wave
- [ ] T024 [US3] Run quickstart.md scenarios 3, 7, and 9 plus the three console checks, and fix any failure. Confirm: one wave on arrival then seated; at least 3 uneven blinks in 30 seconds; dismiss then summon waves again; reduced motion shows the seated pose directly and still blinks; the bear is recognisable as the reference character

**Checkpoint**: User Stories 1, 2, and 3 work together: a recognisable, animated bear that stays out of the way.

---

## Phase 6: User Story 4 - Pad stays fully usable without the companion (Priority: P2)

**Goal**: A user who never summons the companion, or who is offline, sees and gets exactly the same pad as before, and nothing runs in the background while the bear is hidden.

**Independent Test**: Quickstart scenario 6 and scenario 10 (background tab).

### Implementation for User Story 4

- [ ] T025 [US4] Review `companion.js` for zero cost while hidden: confirm that on page load the only things created are the click, keydown, and visibilitychange listeners (no timers, no intervals, no animation frames, no DOM insertion into `#companion`), that the SVG is only inserted on the first `summon()`, and that the `visibilitychange` handler returns immediately when `state.visible` is false. Confirm by search that there are no network references: `grep -nE "http|fetch|XMLHttpRequest|WebSocket|import\(" companion.js` returns nothing. Fix any finding in `companion.js`
- [ ] T026 [US4] Run quickstart.md scenarios 6 and 10 and fix any failure: with the network off the pad works and the bear can be summoned; DevTools shows no new network requests or storage keys; a background tab does not accumulate blinks and the bear resumes normally on return; with the bear never summoned every existing feature works as before

**Checkpoint**: All four stories work.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final verification.

- [ ] T027 [P] In `README.md`, add a row to the "Use it" table: `| Companion | Click **🧸 Buddy** or press `B`. Press `B` again (or `Esc` when nothing is selected) to send it away |`
- [ ] T028 [P] In `IDEAS.md`, under "## 4. Companion", add a line `- Status: first cut built as a decorative bear (waves, sits, blinks). See specs/001-summonable-companion/. Prompts and agent behaviour are still future work (#3, #5)`
- [ ] T029 Confirm `app.js` is unchanged by running `git diff --stat -- app.js` and expecting no output; revert any accidental edit
- [ ] T030 Run the whole quickstart.md (all ten scenarios and the console checks) one last time in a fresh browser profile and fix any failure. Any regression in Save, Open, undo/redo, or autosave blocks completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies; start immediately.
- **Foundational (Phase 2)**: needs Setup; blocks all user stories.
- **US1 (Phase 3)**: needs Foundational. This is the MVP.
- **US2 (Phase 4)**: needs Foundational and, to be meaningfully tested, US1 (something to summon). Edits `style.css`, so it follows US1's `style.css` task.
- **US3 (Phase 5)**: needs US1 (it replaces the stand-in artwork and extends `summon()`/`dismiss()`). Its CSS tasks follow US1's and US2's `style.css` edits.
- **US4 (Phase 6)**: needs US3 complete, because it reviews the final timers and listeners.
- **Polish (Phase 7)**: needs all desired stories.

### Within a story

- Markup (`index.html`) before logic (`companion.js`) before styling polish (`style.css`) only where one needs the other; otherwise follow task order.
- A story's validation task is always last in its phase.

### Parallel Opportunities

- T003 can run in parallel with T001 and T002 (different file from T001, no dependency on T002).
- T005 can run in parallel with T004 and T006 (different file from both).
- T017 can run in parallel with T016 (different files; the shared class names are fixed in T016's text).
- T027 and T028 can run in parallel with each other and with T029.
- Most other tasks touch `companion.js` or `style.css` and are sequential by design, since two tasks editing the same file must not run at once.

---

## Parallel Example: Foundational phase

```text
# After T001 to T003:
Task: "T004 Add the button and overlay to index.html"           (index.html)
Task: "T005 Add base overlay styles to style.css"               (style.css)
Task: "T006 Add state object and test hook to companion.js"     (companion.js)
```

## Parallel Example: User Story 3

```text
# At the start of Phase 5:
Task: "T016 Draw the full bear in companion.js"                 (companion.js)
Task: "T017 Colour the bear layers in style.css"                (style.css)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup (T001 to T003).
2. Phase 2: Foundational (T004 to T006).
3. Phase 3: User Story 1 (T007 to T012).
4. **Stop and validate**: a stand-in bear can be summoned and dismissed by button, `B`, and `Esc`.

### Incremental Delivery

1. Setup + Foundational gives the button and overlay shell.
2. Add US1 for summon and dismiss, then check it.
3. Add US2 for out-of-the-way guarantees and the narrow-window layout, then check it.
4. Add US3 for the real bear, the wave, the seated pose, and the blinking, then check it.
5. Add US4 for the zero-cost and offline audit, then check it.
6. Finish with the polish phase.

### Notes

- Never edit `app.js`; T029 enforces this.
- No new dependencies, build steps, network calls, or storage keys.
- Commit after each phase or logical group of tasks, keeping the constitution rule that `main` stays deployable.
- Each phase ends with a checkpoint where the pad should still work end to end.
