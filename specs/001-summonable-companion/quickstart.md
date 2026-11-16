# Quickstart: Validate the Summonable Companion

A manual validation guide. It needs no install or build: open `index.html` in a current desktop browser. Contract details live in [contracts/ui-contract.md](contracts/ui-contract.md); states and transitions in [data-model.md](data-model.md).

## Prerequisites

- A browser (Chrome, Safari, Firefox, or Edge, current version).
- `open index.html` from the project folder.
- DevTools console available for two small checks.
- For scenario 7, a way to switch on "Reduce motion" in the operating system or in the browser's rendering tools.

## Scenarios

### 1. Hidden by default (Story 1, FR-001, FR-004)

1. Load the page (also try after a reload with the bear previously summoned).
2. **Expect**: no bear on screen. Pressing `Tab` through the page never lands on an invisible bear. The `🧸 Buddy` button reads `aria-pressed="false"`.

### 2. Summon and dismiss (Story 1, FR-002, FR-003, FR-005; SC-001, SC-002)

1. Click `🧸 Buddy`. **Expect**: the bear is visible within 1 second.
2. Click `🧸 Buddy` again. **Expect**: the bear is gone within 1 second and the desk looks as before.
3. Press `B`, then `B` again. **Expect**: same result.
4. With the bear visible, press `B` several times quickly, ending visible. **Expect**: never more than one bear.
5. With the bear visible, make sure nothing is selected and the Select tool is active, then press `Esc`. **Expect**: the bear is dismissed.
6. Select a sticky, press `Esc`. **Expect**: the sticky is deselected and the bear stays.
7. Click inside a sticky to type and press `B`. **Expect**: the letter "b" is typed and the bear does not appear.
8. Keyboard activation (FR-012): press `Tab` until `🧸 Buddy` is focused. **Expect**: a visible focus ring. Press `Enter`; the bear toggles. Press `Space`; it should toggle too. If `Space` does nothing, note it as a known pad-wide quirk (`app.js` captures `Space` for panning, and the other menu buttons behave the same) and do not change `app.js` in this feature.
9. First-time user (SC-001): ask someone who has not seen the pad to summon the bear without instructions, and time them. **Expect**: under 5 seconds.

### 3. Wave, sit, blink (Story 3, FR-014, FR-015; SC-007)

1. Summon the bear and watch for 30 seconds.
2. **Expect**: it waves once, settles into a seated pose, and stays seated. It blinks at least 3 times, at uneven intervals, and never looks frozen.
3. Dismiss and summon again. **Expect**: it waves again from the start.

### 4. Never in the way (Story 2, FR-006, FR-007; SC-003)

With the bear visible, repeat each action, including with the pointer directly over the bear:

- Drag the empty desk to pan, scroll to pan, `Cmd/Ctrl` + scroll to zoom.
- Pen: draw across the bear. Eraser: erase a stroke under it.
- Select, move, and resize a sticky near it. Double-click to edit text.
- Undo and redo.

- Touch: with browser touch emulation (or a tablet), summon and dismiss with the button, then pan with one finger across the bear.

**Expect**: every action behaves exactly as with the bear hidden. The bear stays fixed on screen while the board pans and zooms.

### 5. Not part of saved data (FR-008; SC-004)

1. Make a small board (one sticky, one stroke) with the bear hidden. Click `💾 Save` and `🖼️ PNG`.
2. Summon the bear. Click `💾 Save` and `🖼️ PNG` again.
3. **Expect**: the two JSON files are identical (compare with a diff tool or `shasum`) and the two PNGs look identical with no bear in either.
4. Open the saved board with `📂 Open`. **Expect**: the bear is not part of it.
5. Note the Undo button before and after summoning the bear. **Expect**: no change, and no new history step.

### 6. Offline and local-only (Story 4, FR-011; SC-005)

1. Turn off the network (or use DevTools offline mode) and reload.
2. Summon the bear. **Expect**: it works normally.
3. Open the DevTools Network tab, summon and dismiss the bear. **Expect**: no new requests.
4. In DevTools, Application tab: **Expect**: no new storage keys and no changes under `scratchpad.v1` caused by the bear.

### 7. Reduced motion (FR-010)

1. Turn on "Reduce motion" and reload.
2. Summon the bear. **Expect**: no wave, no sliding. The bear appears directly in the seated pose. Blinking continues.

### 8. Small windows (edge cases)

1. Resize the window narrower than about 900 px. **Expect**: the bear shrinks and stays fully on screen, clear of the toolbar buttons.
2. Resize back. **Expect**: it returns to the bottom-left corner.

### 9. Look and feel (FR-009; SC-006, SC-008)

1. Put the bear next to `assets/character-reference.png`.
2. **Expect**: a reviewer can name it as the same character (brown bear, headphones, knit sweater, scarf) with a warm, hand-illustrated look. Ask 5 people if they would call it "cozy", "warm", or "friendly"; at least 4 should.

### 10. Performance and background tabs (FR-016)

1. Make a board of about 200 stickies. Run this in the DevTools console to download one, then load it with `📂 Open`:

   ```js
   const items = Array.from({length: 200}, (_, i) => ({ id: 't' + i, kind: 'note', x: (i % 20) * 200, y: Math.floor(i / 20) * 190, w: 180, h: 160, rot: 0, color: '#ffe66d', text: 'note ' + i }));
   const blob = new Blob([JSON.stringify({ app: 'scratchpad', version: 1, state: { items, strokes: [] } })], { type: 'application/json' });
   Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'busy-board.json' }).click();
   ```

2. In DevTools Performance, record 5 seconds of panning and zooming with the bear hidden, then again with the bear seated. **Expect**: no additional dropped frames and no new long tasks with the bear visible.
3. Switch to another tab for a minute, then return. **Expect**: the bear resumes blinking without a burst of rapid blinks.

## Console checks

Run in the DevTools console with the page open:

```js
// Always positive and within range
Array.from({length: 1000}, () => window.__companion.nextBlinkDelay(Math.random()))
  .every(ms => ms > 0 && ms <= 6000)          // expect true

// Not a fixed rhythm: many distinct values
new Set(Array.from({length: 200}, () => Math.round(window.__companion.nextBlinkDelay(Math.random())))).size > 20   // expect true

window.__companion.visible                     // expect false before summon, true after
```

## Done when

All ten scenarios pass and the console checks return the expected values. Any regression in Save, Open, undo/redo, or autosave is a release blocker (constitution, Principle V).
