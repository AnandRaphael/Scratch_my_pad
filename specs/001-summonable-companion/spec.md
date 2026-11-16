# Feature Specification: Summonable Companion

**Feature Branch**: `001-summonable-companion` (no branch created; work stays on `main`)

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Companion: a cozy character the user can summon on demand on the Scratch Pad canvas. Hidden by default and appears only when the user asks for it. When dismissed it stays out of the way of the canvas and does not interfere with pan, zoom, drawing, or selecting. Its visual style should match the cozy feel planned for the notebook (soft typography, warm palette). It must keep the app zero-build, local-only, and fully usable without it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Summon and dismiss the companion (Priority: P1)

A user working on a board wants a bit of company. They ask for the companion through an obvious control, and a small, friendly character appears on the desk. When they are done, they dismiss it and it disappears completely, leaving the board exactly as it was.

**Why this priority**: Summoning and dismissing is the whole feature. Without it there is no companion, and everything else builds on it.

**Independent Test**: Open the pad in a fresh browser. Confirm no companion is visible. Summon it, confirm it appears. Dismiss it, confirm it is gone and the board is unchanged.

**Acceptance Scenarios**:

1. **Given** the pad has just opened, **When** the user looks at the desk, **Then** no companion is visible.
2. **Given** the companion is hidden, **When** the user summons it, **Then** the companion appears on the desk within one second.
3. **Given** the companion is visible, **When** the user dismisses it, **Then** it disappears and no trace of it remains on the desk.
4. **Given** the companion is visible, **When** the user summons it again, **Then** it stays a single companion; no duplicates appear.

---

### User Story 2 - Companion never gets in the way of the canvas (Priority: P1)

A user keeps the companion on screen while they work. They pan, zoom, draw, select, and edit notes as usual. The companion never blocks, captures, or changes any of those actions, and it never covers the controls the user needs.

**Why this priority**: The canvas is the product. A companion that interferes with drawing or panning would make the feature a net negative.

**Independent Test**: With the companion visible, perform each core action (pan, zoom, pen, eraser, select, move, resize, edit text, undo/redo) in the area around and beneath the companion and compare the results with the same actions when it is hidden.

**Acceptance Scenarios**:

1. **Given** the companion is visible, **When** the user pans or zooms the desk, **Then** the board moves as usual and the companion stays at a fixed place on screen without drifting, scaling, or lagging.
2. **Given** the companion is visible, **When** the user draws, erases, or drags items across the area where it sits, **Then** the action works exactly as it does without the companion.
3. **Given** the companion is dismissed, **When** the user performs any canvas action, **Then** nothing behaves differently from before the companion existed.
4. **Given** the companion is visible, **When** the user saves, opens, or exports a board as an image, **Then** the companion is not included in the saved file or the image.

---

### User Story 3 - A cozy bear who feels present (Priority: P2)

A user summons the companion and meets a small, friendly teddy bear in the style of the reference illustration (`assets/character-reference.png`): a brown bear wearing warm over-ear headphones and a chunky, multicolor knit sweater with a rust scarf. The bear waves hello when it appears, then settles into a seated pose and blinks naturally from time to time, so it feels like someone is really there.

**Why this priority**: The cozy, present character is the reason for the feature, but a functional companion still delivers value before the animation is polished.

**Independent Test**: Summon the companion and watch it for 30 seconds. Confirm it waves once on arrival, settles into a seated pose, and blinks at uneven intervals. Compare its look with the reference illustration.

**Acceptance Scenarios**:

1. **Given** the companion is hidden, **When** the user summons it, **Then** the bear appears and waves, then settles into a seated pose.
2. **Given** the bear is seated, **When** the user watches it for 30 seconds, **Then** it blinks several times at uneven, natural-feeling intervals and never appears frozen.
3. **Given** the companion is visible, **When** the user views it, **Then** its character design (brown bear, headphones, knit sweater, scarf) and warm hand-drawn style match the reference illustration, and any text it shows uses the pad's soft handwritten typography.
4. **Given** the user has reduced-motion enabled in their system, **When** the companion appears, **Then** it skips the wave and shows the seated pose directly, with no looping movement.
5. **Given** the companion is dismissed, **When** the user summons it again, **Then** it waves and sits again from the start.

---

### User Story 4 - Pad stays fully usable without the companion (Priority: P2)

A user who never summons the companion, or who uses the pad offline or in a locked-down browser, gets the same pad as before. Nothing about the companion is required, downloaded, or running in the background.

**Why this priority**: The project promises a pad that works with nothing installed and nothing sent anywhere. This protects that promise.

**Independent Test**: Open the pad with no network connection and never summon the companion; confirm every existing feature works. Then summon it offline and confirm it still works.

**Acceptance Scenarios**:

1. **Given** the user never summons the companion, **When** they use the pad, **Then** every existing feature works and nothing about the companion is visible.
2. **Given** there is no network connection, **When** the user summons the companion, **Then** it appears and works normally.
3. **Given** the companion is summoned, **When** the user inspects network activity, **Then** no board content or companion data leaves the device.

---

### Edge Cases

- What happens when the browser window is very small or is resized while the companion is visible? It stays fully on screen and never covers the main toolbar controls.
- What happens when the user summons the companion repeatedly or very quickly? Only one companion ever exists.
- What happens when the board is empty, or very full? The companion looks and behaves the same.
- What happens when the user reloads the page while the companion is visible? See Assumptions: it is hidden again after reload.
- What happens when the companion sits over a note or stroke and the user wants to interact with that item? The user can still select, move, and edit it.
- What happens when the user presses canvas shortcut keys (for example `N`, `T`, `P`, `Delete`) while the companion is visible? They keep working exactly as before.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The companion MUST be hidden whenever the pad first opens, and MUST appear only after the user explicitly asks for it.
- **FR-002**: Users MUST be able to summon the companion through a visible control and through a keyboard shortcut.
- **FR-003**: Users MUST be able to dismiss the companion at any time, through a visible control and through the same keyboard shortcut or `Esc`.
- **FR-004**: When dismissed, the companion MUST be fully hidden and MUST NOT take up space, capture input, or cover any part of the desk or toolbar.
- **FR-005**: At most one companion MUST exist at a time, regardless of how often it is summoned or dismissed.
- **FR-006**: While visible, the companion MUST remain at a fixed place on the screen during panning and zooming, and MUST NOT change the board's pan, zoom, or content.
- **FR-007**: While visible, the companion MUST NOT block or alter any existing canvas action, including pan, zoom, draw, erase, select, move, resize, edit text, recolor, delete, and undo/redo.
- **FR-008**: The companion MUST NOT appear in saved board files or exported images, and MUST NOT add entries to undo/redo history.
- **FR-009**: The companion MUST be a teddy bear that follows the supplied reference illustration (`assets/character-reference.png`): brown bear, over-ear headphones, multicolor knit sweater, and scarf, drawn in a warm, hand-illustrated style. Any text it shows MUST use the pad's soft handwritten typography, and its colors MUST come from a warm palette consistent with the cozy style planned for the notebook.
- **FR-010**: The companion MUST respect the user's reduced-motion preference: when it is set, the wave MUST be skipped and no looping movement MUST play.
- **FR-014**: When summoned, the companion MUST wave once, then settle into a seated pose and stay seated until dismissed.
- **FR-015**: While visible, the companion MUST blink at irregular, natural-feeling intervals (not at a fixed, mechanical rhythm) so it feels present, and the blinking MUST NOT stop while it is visible.
- **FR-016**: The companion's animation MUST NOT noticeably slow the pad: pan, zoom, drawing, and typing MUST stay as responsive as with the companion hidden, and animation MUST pause while the browser tab is not visible.
- **FR-011**: The companion MUST work with no network connection and MUST NOT send any board or companion data off the device.
- **FR-012**: The companion MUST be reachable by keyboard and have text or accessible labels for its controls, with a visible focus state.
- **FR-013**: For the first release, the companion MUST be a purely decorative presence: it MUST NOT display prompts or messages, accept input, respond to board content, or provide any function beyond being visible. Its only behaviours are the wave, the seated pose, and blinking (FR-014, FR-015), subject to FR-010.

### Key Entities *(include if feature involves data)*

- **Companion**: The summonable teddy bear. Has a visible/hidden state, a screen position, and a current pose (waving, seated) with a blink state. It is not part of the board's content.
- **Companion preference** (only if the user's choice of visibility is remembered; see Assumptions): whether the companion should be shown or hidden. It is not part of the board's content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can summon the companion in under 5 seconds without instructions, using the visible control.
- **SC-002**: After summoning, the companion is visible within 1 second, and dismissing it removes it within 1 second.
- **SC-003**: With the companion visible, every core canvas action (pan, zoom, pen, eraser, select, move, resize, edit text, undo/redo) produces the same result as with the companion hidden, in 100% of manual checks.
- **SC-004**: Saved board files and exported images are identical whether or not the companion was visible when they were created.
- **SC-005**: The pad opens and works with no companion visible and no network connection, with zero loss of existing features.
- **SC-006**: In an informal check, at least 4 out of 5 people who see the companion next to the pad describe its look as "cozy", "warm", or "friendly".
- **SC-007**: In a 30-second observation, the companion waves once on arrival, then stays seated and blinks at least 3 times at uneven intervals, in 100% of checks.
- **SC-008**: In a side-by-side check, a reviewer can identify the companion as the character in the reference illustration (bear, headphones, sweater, scarf) without being told.

## Assumptions

- The companion's visible/hidden choice is not remembered across reloads for v1: every fresh open starts with the companion hidden, which keeps the "hidden by default" promise simple.
- The summon control is placed with the pad's other controls, and the keyboard shortcut is chosen to avoid the existing single-key shortcuts.
- The companion is a single character with a fixed look; choosing or customizing characters is out of scope for v1.
- The reference illustration is a full scene (window, books, cushions, quilt). Only the bear is the companion; the surrounding scene is mood reference for the palette and is not drawn on the desk. The bear sits against the desk with a transparent background.
- The reference shows a still pose, so the wave, seated pose, and blink are new artwork drawn in the same style. The wave is a short, one-time greeting of a few seconds.
- Under reduced motion, blinking is kept because it is a tiny eye change rather than movement across the screen, and the wave and any looping movement are removed. If reviewers disagree, the safer fallback is a fully static pose.
- The bear faces slightly toward the desk and sits in a corner of the screen, clear of the main toolbar; exact placement is decided at planning time.
- The companion has no memory of the user and learns nothing from board content.
- The first cut is decorative only. Prompts, encouragement, and any interactive or model-driven behaviour (ideas #3 and #5) are separate future features and are not delivered here.
- Touch support follows the rest of the pad; if the controls work with touch there, they work here.
- The notebook (idea #2) does not exist yet, so "matches the notebook" is read as matching the pad's existing paper-desk look, warmed up, until the notebook is built.
