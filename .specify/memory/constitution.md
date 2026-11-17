<!--
SYNC IMPACT REPORT (temporary; remove before commit)
Version change: (template, unversioned) → 1.0.0
Modified principles: none (initial adoption; all placeholders filled)
Added sections: Core Principles I–V, Technical Constraints, Development Workflow, Governance
Removed sections: none
Deferred items: none. Ratification date set to the amendment date (first adoption).
-->
# Scratch Pad Constitution

## Core Principles

### I. Zero-Build, Zero-Backend Simplicity
Scratch Pad MUST run by opening `index.html` in a browser. It MUST NOT require an install step,
bundler, transpiler, server, or backend service. Every dependency MUST be justified in the spec or
plan that introduces it, and the default answer is no.
Rationale: "No install, no build, no backend" is the product's core promise and what makes it
instantly usable on a screen share and deployable as static files.

### II. Local-First Data Ownership
All user content MUST stay on the user's device. Boards autosave to browser storage and move
between browsers only through explicit Save/Open file export and import. No feature may transmit
board content over the network. Every storage read and write MUST tolerate failure (blocked or
full storage) without crashing, and the persisted format MUST be versioned (e.g. `scratchpad.v1`)
with a migration or graceful fallback for older data.
Rationale: Users dump unfiltered thoughts here; privacy and resilience are non-negotiable.

### III. Instant, Playful Interaction
The canvas MUST feel immediate: pan, zoom, drawing, and dragging MUST stay responsive with
hundreds of items and strokes. Every primary action MUST be reachable by a single-key shortcut and
by pointer or touch, and undo/redo MUST cover every content-changing action. The tone (hand-drawn
paper desk, light copy) MUST be preserved in new UI.
Rationale: The tool exists for fast, low-friction thinking; lag or friction defeats its purpose.

### IV. Plain, Readable Code
Source MUST remain vanilla HTML, CSS, and JavaScript with no framework. Code MUST stay organised
in clearly labelled sections (constants, DOM, state, rendering, input, persistence), avoid
globals (keep the IIFE/module scope), and prefer small, named functions over cleverness.
Complexity beyond the current structure MUST be justified in the plan's complexity notes.
Rationale: A small codebase stays maintainable only if new contributors can read it in one
sitting.

### V. Verified Behaviour (Manual-First Testing)
Every user-facing change MUST define acceptance scenarios in its spec and MUST be verified in a
real browser before it is considered done. Logic that is pure and non-trivial (geometry, hit
testing, serialisation, migration) SHOULD be isolated so it can be tested without the DOM.
Regressions in save/open, undo/redo, or autosave MUST be treated as release blockers.
Rationale: Without a build or test harness, disciplined verification is the safety net for data
loss and interaction bugs.

## Technical Constraints

- Stack: static `index.html`, `style.css`, `app.js`. Hosting is static (GitHub Pages from `main`,
  root folder).
- Browsers: current evergreen desktop browsers MUST be supported; touch input SHOULD work on
  tablets.
- External network use is limited to non-essential assets (e.g. web fonts); the app MUST remain
  fully usable offline with fallback fonts.
- Accessibility: interactive controls MUST have text or aria labels and visible focus states;
  colour MUST NOT be the only way to convey state.
- Security: user-entered text MUST be inserted as text (not raw HTML), and imported board files
  MUST be validated before use.

## Development Workflow

- Features follow the Spec Kit flow: specify → (clarify) → plan → tasks → (analyze) → implement.
- Each plan MUST include a Constitution Check against the principles above.
- Work happens on short-lived branches off `main`; `main` MUST always be deployable.
- Commits use clear imperative messages; changes to the persisted data format MUST be called out
  in the commit or PR description.
- `README.md` MUST be updated when shortcuts, features, or deployment steps change.

## Governance

This constitution supersedes other practices for this project. Amendments MUST be made by editing
`.specify/memory/constitution.md` via `/speckit-constitution`, with a stated rationale and a check
that dependent specs, plans, and tasks remain consistent.

Versioning follows semantic versioning: MAJOR for removing or redefining a principle in a
backward-incompatible way, MINOR for adding a principle or materially expanding guidance, PATCH
for wording and clarifications.

Compliance is reviewed at plan time (Constitution Check) and at review time for every change.
Any violation MUST be justified in writing in the plan or PR, or the change MUST be revised. Use
`README.md` for runtime usage guidance and `IDEAS.md` for the product backlog.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
