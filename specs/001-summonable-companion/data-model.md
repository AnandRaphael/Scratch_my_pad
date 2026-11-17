# Data Model: Summonable Companion

The companion has runtime state only. Nothing here is persisted, saved to board files, or placed in undo history (spec FR-008, Assumptions).

## Entity: Companion

| Field | Type | Description |
|---|---|---|
| `visible` | boolean | Whether the bear is summoned. `false` on every page load. |
| `pose` | `"hidden"` \| `"arriving"` \| `"waving"` \| `"seated"` \| `"leaving"` | Current phase of the lifecycle. |
| `blinking` | boolean | True for about 140 ms during a blink. Only changes while `pose` is `"seated"` or `"waving"`. |

Derived and internal (not part of the contract):

- `blinkTimer`: handle of the pending blink timeout, or none.
- `reducedMotion`: read from the user's `prefers-reduced-motion` setting each time the bear is summoned.

## State transitions

```text
                summon (button or B)
   hidden ──────────────────────────────► arriving
      ▲                                       │ arrival ends
      │                                       ▼
      │                                    waving ── (reduced motion: skipped)
      │                                       │ wave ends
      │          dismiss (button, B, or Esc) │
      │                                       ▼
   leaving ◄──────────────────────────── seated ◄─┐
      │  leave ends                          │     │ blink cycle (irregular)
      └──► hidden                            └─────┘
```

Rules:

- Summoning while `visible` is true does nothing (FR-005). The `B` key and the button act as a toggle, so a second press dismisses.
- Dismissing from any visible pose goes to `leaving`, then `hidden`. All timers are cleared. The next summon starts again from `arriving` and waves again.
- With reduced motion on, `arriving` and `waving` are skipped and the bear is `seated` immediately. With the tab hidden, the blink timer is paused and resumed on return.
- `hidden` means the overlay has the `hidden` attribute: no layout, no hit-testing, no tab stop.

## Validation rules

- At most one companion element exists in the DOM at a time.
- `blinking` is never true while `pose` is `hidden` or `leaving`.
- Blink delays are always positive and fall inside the documented range (see `nextBlinkDelay` in the [UI contract](contracts/ui-contract.md)).

## Relationship to board data

None. The companion does not read or write `state.items`, `state.strokes`, `view`, the history stack, or `localStorage`.
