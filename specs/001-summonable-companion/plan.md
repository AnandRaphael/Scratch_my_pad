# Implementation Plan: Summonable Companion

**Branch**: `001-summonable-companion` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-summonable-companion/spec.md`

## Summary

A decorative teddy bear (brown, headphones, knit sweater, scarf, per the reference illustration) that the user summons with a menu button or the `B` key. On summon it waves once, settles into a seated pose, and blinks at random intervals until dismissed. It lives in its own overlay layer that ignores pointer input, sits outside the canvas and the board state, and is never saved, exported, or added to undo history.

Technical approach (see [research.md](research.md)): a hand-authored inline SVG bear built by a new `companion.js` on first summon, animated with CSS transforms (wave) and a tiny JS timer (blink), styled in a new section of `style.css`. No dependencies, no build, no storage, no network. `app.js` is not modified.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES2020, same as `app.js`), HTML5, CSS3, inline SVG

**Primary Dependencies**: None (the existing Caveat web font is already loaded and is only used if text is ever shown)

**Storage**: N/A. The summoned state is intentionally not remembered across reloads (spec Assumptions). Nothing is written to `localStorage` or to saved board files.

**Testing**: Manual acceptance scenarios in [quickstart.md](quickstart.md), plus one DOM-free pure function (blink delay generator) checkable from the browser console. No test framework is added.

**Target Platform**: Current evergreen desktop browsers opened from `index.html` (file:// or GitHub Pages); touch follows the rest of the pad

**Project Type**: Static single-page web app (no build)

**Performance Goals**: Animation uses only `transform` and `opacity`; zero timers while the companion is hidden or the tab is not visible; pan, zoom, pen, and typing indistinguishable from baseline with the companion visible (SC-003, FR-016)

**Constraints**: Zero-build and offline-capable; no network use; must not alter pointer, keyboard, save/export, or undo behaviour; reduced-motion respected

**Scale/Scope**: One character, one overlay, about 250 lines of new code across `companion.js`, `style.css`, and `index.html`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | How the plan satisfies it |
|---|---|---|
| I. Zero-Build, Zero-Backend | PASS | Two static files touched or added (`companion.js`, edits to `index.html` and `style.css`). No bundler, install, or server. SVG is inline, so it also works from `file://` (a fetched `.svg` would not). |
| II. Local-First Data Ownership | PASS | No storage and no network calls. No board content is read. The companion adds nothing to `scratchpad.v1` or to exported files, so no format change or migration is needed. |
| III. Instant, Playful Interaction | PASS | Summon is one click or one key (`B`). The overlay has `pointer-events: none`, so pan, zoom, draw, and select behave identically underneath it. Undo is unaffected because the companion is not content. Tone matches the paper-desk look. |
| IV. Plain, Readable Code | PASS | Vanilla JS in labelled sections, scoped in an IIFE, no globals beyond a small test hook. A separate file is justified because `app.js` is already 578 lines and the companion shares no state with the board. |
| V. Verified Behaviour | PASS | Each user story maps to a quickstart scenario. The blink-delay generator is a pure function so it can be tested without the DOM. Save/open/undo regressions are an explicit quickstart check. |
| Technical Constraints: accessibility | PASS | Toggle button has a text label, `aria-pressed`, and a visible focus ring. The bear is decorative (`aria-hidden`). State is conveyed by label text, not colour alone. |
| Technical Constraints: security | PASS | The SVG markup is a constant string. No user text or imported data is inserted. |

**Result**: No violations. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged, all PASS. Design added only a decision to dismiss on `Esc` when nothing else needs it (research item 6), which keeps existing `Esc` behaviour intact.

## Project Structure

### Documentation (this feature)

```text
specs/001-summonable-companion/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # Phase 1 output
├── assets/
│   └── character-reference.png
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html     # + menu button #btn-companion, + #companion overlay container, + <script src="companion.js">
style.css      # + "companion" section: overlay, bear colours, wave/blink/arrive keyframes, reduced-motion rules
companion.js   # NEW: SVG markup, summon/dismiss, wave, blink timer, keyboard handling
app.js         # UNCHANGED
```

**Structure Decision**: Keep the existing flat, no-build layout. Add one script file next to `app.js` and one CSS section inside `style.css`. No `src/` or `tests/` folders are introduced, because the project has no build or test harness and the constitution asks for manual-first verification.

## Complexity Tracking

No Constitution Check violations. Nothing to justify.
