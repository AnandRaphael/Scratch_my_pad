# UI Contract: Summonable Companion

Scratch Pad has no API. Its external interface is what users see and press, plus the small browser-console hook used for testing. This contract fixes those so tasks and tests have something concrete to check.

## 1. Summon / dismiss control

| Item | Contract |
|---|---|
| Element | `<button id="btn-companion">` in the top-right `#menu`, before the Clear button. |
| Label | `🧸 Buddy` |
| Tooltip (`title`) | `Summon the companion (B)` when hidden, `Dismiss the companion (B)` when visible. |
| State | `aria-pressed="false"` when hidden, `"true"` when visible. |
| Action | Click toggles the companion. |
| Focus | Visible focus ring, reachable by `Tab`. |

## 2. Keyboard

| Key | Behaviour |
|---|---|
| `B` | Toggles the companion. Ignored while typing in a note or text item, and when `Cmd`, `Ctrl`, or `Alt` is held. |
| `Esc` | Dismisses the companion only if it is visible and nothing else needs `Esc`: no item is selected, the active tool is Select, and the user is not typing. Otherwise `Esc` keeps its existing meaning. |

No existing shortcut changes (`V N T P E 0`, `Space`, `Delete`, `Backspace`, `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, `Cmd/Ctrl+Y`).

## 3. Overlay element

| Item | Contract |
|---|---|
| Element | `<div id="companion" hidden aria-hidden="true">` placed in `<body>` right after the `#desk` element and before `#brand`, outside `#desk`. Because the brand, menu, toolbar, zoom badge, and toast come later in the page, they stack above it with no `z-index` changes to existing rules. |
| Input | `pointer-events: none` on the container and every child. |
| Position | `position: fixed`, bottom-left, 20 px from the edges, about 150 px wide. Below about 900 px viewport width: smaller and raised above the toolbar row. |
| Stacking | Above the desk, below `#brand`, `#menu`, `#toolbar`, `#zoom`, and `#toast` (achieved by page order, see Element). |
| Content | One inline SVG bear, inserted on first summon. |
| Text | None. The companion shows no text or messages. |

## 4. Visible states (for tests and styling)

The overlay carries one state class at a time:

| Class on `#companion` | Meaning | Expected look |
|---|---|---|
| (none, `hidden` attribute set) | Dismissed | Nothing visible or focusable. |
| `is-arriving` | Just summoned | Bear fades and rises in, about 0.5 s. |
| `is-waving` | Greeting | Waving arm moves for about 2 to 3 s, once. |
| `is-seated` | Settled | Arm at rest, bear stays seated until dismissed. |
| `is-leaving` | Dismissing | Short fade out, then `hidden` is restored. |

A separate `is-blinking` class is added to the overlay for about 140 ms at a time while visible.

With `prefers-reduced-motion: reduce`: no `is-arriving` motion and no `is-waving`; the bear goes straight to `is-seated`. Blinking continues.

## 5. Test hook

```js
window.__companion = {
  nextBlinkDelay(rand),   // pure; rand is a number in [0, 1); returns milliseconds
  get visible()           // boolean
};
```

`nextBlinkDelay(rand)`:

- Returns a number from 2500 to 6000 inclusive for most inputs.
- May return a short value of about 250 (a double-blink follow-up) for a small share of inputs (rand below 0.15).
- Never returns zero or a negative number for any `rand` in [0, 1).

## 6. Things the companion must not change

| Area | Required result |
|---|---|
| Board file (`Save`) | Byte-for-byte the same content whether or not the bear is visible. |
| PNG export | Identical image whether or not the bear is visible. |
| Autosave data (`scratchpad.v1`) | No new keys and no changes to existing ones. |
| Undo / redo | Summoning or dismissing adds no history entry and does not enable the Undo button. |
| Pan, zoom, pen, eraser, select, drag, resize, text editing | Same behaviour with the bear visible or hidden, including under the bear. |
