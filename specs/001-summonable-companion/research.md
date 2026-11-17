# Research: Summonable Companion

All Technical Context items were resolvable from the spec, the constitution, and the existing code (`index.html`, `style.css`, `app.js`). No `NEEDS CLARIFICATION` remained. The decisions below record the choices that mattered.

## 1. How to draw the bear and its poses

**Decision**: Hand-authored inline SVG, built from named layers (body, head, ears, face, eyes, eyelids, headphones, sweater, scarf, resting arm, waving arm), styled to echo the reference illustration: warm browns, dark outline, soft cheek blush.

**Rationale**: The wave and the blink need separate moving parts. Layered SVG lets the waving arm rotate on its own pivot and the eyelids close independently, with no extra image files and no build step. It scales crisply on high-density screens and works from `file://`.

**Alternatives considered**:
- *Cut the bear out of the reference PNG*: gives the exact look, but the image is a single still pose, with no separate arm or closed eyes, so the wave and blink would need repainted frames anyway. It also adds a 1.8 MB asset to a pad that loads instantly.
- *Pre-drawn sprite frames (PNG/WebP)*: needs an artist or image tool, adds files, and gives stiff motion.
- *Canvas drawing*: harder to style and animate than SVG, and not accessible to CSS.
- *Lottie/animation library*: violates the no-dependencies spirit of the zero-build rule.

**Note**: The reference stays in `assets/` as the visual target. The final SVG will be a stylised redraw, so SC-008 (recognisable as the reference character) is checked by eye during implementation.

## 2. Inline SVG vs. a separate `.svg` file

**Decision**: Keep the SVG markup as a constant string in `companion.js`, inserted when the companion is first summoned.

**Rationale**: Browsers block `fetch()` of local files on `file://`, which is how the README says to run the pad. An `<img src="bear.svg">` works on `file://` but its inner parts cannot be reached by page CSS or JS, so the blink would not be controllable. Inline markup avoids both problems, and building it lazily means a user who never summons the bear pays nothing.

**Alternatives considered**: Static `<svg>` in `index.html` (always in the DOM, even when hidden, and clutters the page); `<object>` embed (same reach problem as `<img>`).

## 3. Wave and arrival animation

**Decision**: CSS keyframes on `transform` and `opacity` only. Arrival: a short rise and fade-in (about 0.5 s). Wave: the arm group rotates around its shoulder pivot for roughly 2 to 3 s, then the class is removed on `animationend` and the arm returns to the seated pose.

**Rationale**: Transform and opacity animations run on the compositor, so they cannot slow pan, zoom, or drawing (FR-016). Driving "done waving" from `animationend` keeps pose changes event-based with no extra timer.

**Reduced motion**: A `prefers-reduced-motion: reduce` media query removes the arrival slide and the wave, so the bear appears directly in the seated pose (FR-010).

**Alternatives considered**: `requestAnimationFrame` loop (more code, runs every frame, unnecessary); Web Animations API (fine, but CSS keeps motion design in the stylesheet beside the other animations such as `pop` and `poof`).

## 4. Natural blinking

**Decision**: A `setTimeout` chain. Each delay comes from a pure function `nextBlinkDelay(rand)` returning a value between about 2.5 s and 6 s, with an occasional short double-blink (the next delay is about 0.25 s). A blink is the `blinking` class held for about 140 ms; the eyelid layer scales closed with a CSS transition.

**Rationale**: Irregular intervals avoid the robotic rhythm that FR-015 forbids. Taking `rand` as a parameter makes the function deterministic to test from the console without the DOM.

**Lifecycle**: The chain starts when the bear becomes seated and is cleared on dismiss. It is also cleared when `document.hidden` becomes true and restarted when the tab is visible again (FR-016), so a background tab does no work.

**Reduced motion**: Blinking is kept. It is a small eye-state change, not movement across the screen (spec Assumptions). The fallback, if a reviewer objects, is to disable it.

**Alternatives considered**: CSS-only infinite blink animation (fixed rhythm, cannot be irregular, cannot pause cleanly on hidden tabs); `setInterval` (fixed rhythm).

## 5. Layering and input

**Decision**: The overlay `#companion` is `position: fixed`, `pointer-events: none`, placed in the page right after `#desk` so the toolbar, menu, and other fixed controls (which come later) stack above it, and sits outside `#desk`. It uses `aria-hidden="true"` and `hidden` when dismissed. The summon/dismiss control is a normal menu button.

**Rationale**: With `pointer-events: none` every pointer event reaches the desk beneath, so pan, zoom, pen, eraser, select, drag, and resize are untouched (FR-006, FR-007). Being outside `#desk` and outside the `world` transform means it ignores pan and zoom by construction. The `hidden` attribute removes it from layout, hit-testing, and the tab order when dismissed (FR-004).

**Why not make the bear itself clickable to dismiss**: it would capture input over the canvas and conflict with FR-007.

**Alternatives considered**: Putting the bear inside `#world` (it would scale and pan with the board and appear in no saved data, but would break the fixed-position requirement); making only the bear's body capture clicks (blocks drawing under it).

## 6. Summon shortcut and `Esc`

**Decision**: `B` toggles the companion. It is not used by any existing shortcut (`V N T P E 0`, `Space`, `Delete`, `Backspace`, `Cmd/Ctrl+Z/Y`). The key is ignored while typing in a note and when a modifier key is held. `Esc` dismisses the bear only when nothing else needs `Esc` (no item selected, tool is Select, not typing). The listener is registered in the capture phase so it can check state before `app.js` clears the selection.

**Rationale**: FR-003 asks for `Esc` as a way to dismiss, but `Esc` already means "finish editing" or "clear selection and return to Select". Hijacking it would make a normal deselect also remove the bear. The rule above satisfies the spec without breaking existing behaviour.

**Alternatives considered**: Not supporting `Esc` (violates FR-003); always dismissing on `Esc` (surprising side effect); using a different key such as `C` (cursor/colour confusion with the colour dots).

## 7. Placement

**Decision**: Fixed to the bottom-left corner, about 20 px in from the edges, roughly 150 px wide. Below about 900 px viewport width it shrinks and moves up above the toolbar row so it never covers toolbar controls.

**Rationale**: Bottom-left is the only free corner: the brand is top-left, the menu top-right, the zoom badge bottom-right, and the toolbar bottom-centre. The edge-case rule in the spec says it must stay on screen and clear of the main controls when the window is small.

**Alternatives considered**: Bottom-centre next to the toolbar (crowded); draggable placement (adds interaction and persistence, out of scope for the first cut).

## 8. Exclusion from saved data

**Decision**: No code change is needed. Saved boards serialise only `state` (`items`, `strokes`). PNG export draws from that same state onto an off-screen canvas. Undo snapshots are `JSON.stringify(state)`. The companion holds no data in `state`, so FR-008 holds by design.

**Verification**: The quickstart compares a saved JSON file and an exported PNG made with the bear visible against ones made with it hidden.

## 9. Testing without a harness

**Decision**: Expose a small hook, `window.__companion = { nextBlinkDelay, get visible() }`, mirroring the existing `window.__scratchpad` test hook. Acceptance checks are manual and listed in the quickstart.

**Rationale**: Matches the constitution's manual-first rule and the existing convention, with no new tooling.
