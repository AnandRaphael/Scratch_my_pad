(() => {
  'use strict';

  // ---------- constants ----------
  const BLINK_MS = 140;   // how long the eyelids stay closed during one blink

  // ---------- state ----------
  // Runtime only: nothing here is saved, exported, or added to undo history.
  const state = { visible: false, pose: 'hidden', blinking: false };

  // ---------- artwork ----------
  // The bear, drawn as layers so the arm and the eyelids can move on their own.
  // Colours come from the --bear-* variables in style.css. Constant markup, never user text.
  const BEAR_SVG = `
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="bear-sweater-clip"><ellipse cx="100" cy="166" rx="56" ry="50"/></clipPath>
      </defs>

      <g class="bear-body">
        <g class="bear-sweater">
          <ellipse class="sweater-base" cx="100" cy="166" rx="56" ry="50"/>
          <g clip-path="url(#bear-sweater-clip)">
            <rect class="sweater-rust" x="40" y="148" width="120" height="14"/>
            <rect class="sweater-teal" x="40" y="176" width="120" height="14"/>
            <path class="sweater-cable" d="M86 130 V216 M100 130 V216 M114 130 V216"/>
          </g>
          <ellipse class="sweater-outline" cx="100" cy="166" rx="56" ry="50"/>
        </g>
        <ellipse class="foot" cx="68" cy="206" rx="22" ry="12"/>
        <ellipse class="foot" cx="132" cy="206" rx="22" ry="12"/>
        <ellipse class="pad" cx="68" cy="208" rx="11" ry="6"/>
        <ellipse class="pad" cx="132" cy="208" rx="11" ry="6"/>
        <g class="arm-left">
          <path class="sleeve-outline" d="M64 138 Q48 162 80 174"/>
          <path class="sleeve" d="M64 138 Q48 162 80 174"/>
          <circle class="paw" cx="86" cy="173" r="11"/>
        </g>
      </g>

      <g class="bear-scarf">
        <rect class="scarf-band" x="54" y="108" width="92" height="30" rx="15"/>
        <path class="knit" d="M68 118 V134 M84 120 V138 M100 120 V138 M116 120 V138 M132 118 V134"/>
      </g>

      <g class="bear-arm-rest">
        <path class="sleeve-outline" d="M136 138 Q152 162 120 174"/>
        <path class="sleeve" d="M136 138 Q152 162 120 174"/>
        <circle class="paw" cx="114" cy="173" r="11"/>
      </g>
      <g class="bear-arm-wave">
        <path class="sleeve-outline" d="M138 138 Q170 128 168 92"/>
        <path class="sleeve" d="M138 138 Q170 128 168 92"/>
        <circle class="paw" cx="168" cy="82" r="12"/>
      </g>

      <g class="bear-head">
        <g class="bear-ears">
          <circle class="ear" cx="60" cy="38" r="15"/>
          <circle class="ear-inner" cx="60" cy="38" r="8"/>
          <circle class="ear" cx="140" cy="38" r="15"/>
          <circle class="ear-inner" cx="140" cy="38" r="8"/>
        </g>
        <circle class="head" cx="100" cy="74" r="46"/>
        <g class="bear-face">
          <ellipse class="cheek" cx="68" cy="87" rx="8" ry="5"/>
          <ellipse class="cheek" cx="132" cy="87" rx="8" ry="5"/>
          <ellipse class="muzzle" cx="100" cy="88" rx="21" ry="16"/>
          <ellipse class="nose" cx="100" cy="80" rx="7" ry="5"/>
          <path class="mouth" d="M100 85 V90 M91 91 Q100 99 109 91"/>
        </g>
        <g class="bear-eyes">
          <circle cx="80" cy="66" r="4.5"/>
          <circle cx="120" cy="66" r="4.5"/>
          <circle class="glint" cx="81.6" cy="64.4" r="1.4"/>
          <circle class="glint" cx="121.6" cy="64.4" r="1.4"/>
        </g>
        <g class="bear-eyelids">
          <ellipse cx="80" cy="66" rx="6.8" ry="6.8"/>
          <ellipse cx="120" cy="66" rx="6.8" ry="6.8"/>
          <path class="lash" d="M74 67 Q80 71 86 67 M114 67 Q120 71 126 67"/>
        </g>
      </g>

      <g class="bear-headphones">
        <path class="hp-band" d="M54 62 Q54 14 100 14 Q146 14 146 62"/>
        <rect class="hp-cup" x="42" y="48" width="22" height="40" rx="10"/>
        <rect class="hp-pad" x="46" y="54" width="14" height="28" rx="7"/>
        <rect class="hp-cup" x="136" y="48" width="22" height="40" rx="10"/>
        <rect class="hp-pad" x="140" y="54" width="14" height="28" rx="7"/>
      </g>
    </svg>`;

  // ---------- dom ----------
  const overlay = document.getElementById('companion');
  const button = document.getElementById('btn-companion');
  if (!overlay || !button) return;   // page without the companion markup: do nothing

  // ---------- lifecycle ----------
  // hidden -> arriving -> waving -> seated -> leaving -> hidden   (see data-model.md)
  let built = false;
  let pending = null;   // cancels the arrival/wave/leave wait that is currently in flight

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    if (built) return;
    overlay.innerHTML = BEAR_SVG;   // built once, on the first summon: never duplicated
    built = true;
  }

  function setPose(pose) {
    state.pose = pose;
    overlay.classList.remove('is-arriving', 'is-waving', 'is-seated', 'is-leaving');
    if (pose !== 'hidden') overlay.classList.add('is-' + pose);
  }

  function syncButton() {
    button.setAttribute('aria-pressed', String(state.visible));
    button.title = state.visible ? 'Dismiss the companion (B)' : 'Summon the companion (B)';
  }

  function cancelPending() { if (pending) pending(); }

  // Run done() when an event we care about fires, or after fallbackMs if it never does
  // (for example when animations are switched off). Only one wait is ever in flight.
  function waitFor(eventType, matches, fallbackMs, done) {
    cancelPending();
    const finish = () => { cancelPending(); done(); };
    const onEvent = (e) => { if (matches(e)) finish(); };
    const timer = setTimeout(finish, fallbackMs);
    overlay.addEventListener(eventType, onEvent);
    pending = () => { clearTimeout(timer); overlay.removeEventListener(eventType, onEvent); pending = null; };
  }
  // Transitions and animations fire per property and per child, so match only our own events.
  const ownOpacity = (e) => e.target === overlay && e.propertyName === 'opacity';
  const waveEnded = (e) => e.target.classList && e.target.classList.contains('bear-arm-wave');

  function summon() {
    if (state.visible) return;
    build();
    state.visible = true;
    syncButton();
    cancelPending();
    overlay.hidden = false;
    startBlinking();
    void overlay.offsetWidth;   // force a reflow so the fade-in starts from the hidden look instead of popping in
    if (reducedMotion()) { setPose('seated'); return; }   // no slide, no wave: straight to the seated pose
    setPose('arriving');
    waitFor('transitionend', ownOpacity, 700, () => {
      setPose('waving');
      waitFor('animationend', waveEnded, 3500, () => setPose('seated'));
    });
  }

  function dismiss() {
    if (!state.visible) return;
    state.visible = false;
    syncButton();
    stopBlinking();
    setPose('leaving');
    waitFor('transitionend', ownOpacity, 400, () => { overlay.hidden = true; setPose('hidden'); });
  }

  const toggle = () => (state.visible ? dismiss() : summon());

  // ---------- blinking ----------
  // A blink every few seconds, never on a fixed beat. Sometimes a quick double blink.
  // Pure function so it can be checked from the console without the page: rand is in [0, 1).
  function nextBlinkDelay(rand) {
    if (rand < 0.15) return 250;                          // follow-up blink right after one
    return 2500 + ((rand - 0.15) / 0.85) * 3500;          // 2.5 s up to just under 6 s
  }

  let blinkTimer = 0;

  function scheduleBlink() {
    blinkTimer = setTimeout(() => {
      state.blinking = true;
      overlay.classList.add('is-blinking');
      blinkTimer = setTimeout(() => {
        state.blinking = false;
        overlay.classList.remove('is-blinking');
        scheduleBlink();
      }, BLINK_MS);
    }, nextBlinkDelay(Math.random()));
  }

  function stopBlinking() {
    clearTimeout(blinkTimer);
    blinkTimer = 0;
    state.blinking = false;
    overlay.classList.remove('is-blinking');
  }

  function startBlinking() {
    stopBlinking();   // single timer chain: two can never run at once
    scheduleBlink();
  }

  // a background tab does no work: pause the blink chain, resume it on return
  document.addEventListener('visibilitychange', () => {
    if (!state.visible) return;
    if (document.hidden) stopBlinking(); else startBlinking();
  });

  // ---------- input ----------
  button.addEventListener('click', toggle);

  const desk = document.getElementById('desk');
  const typing = () => document.activeElement && document.activeElement.isContentEditable;
  // Capture phase: this runs before app.js, so it sees the selection before Esc clears it.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Esc keeps its usual jobs first (finish typing, deselect, back to Select tool);
      // it only sends the companion away when none of those apply.
      // No preventDefault or stopPropagation here, so app.js still handles Esc as before.
      if (state.visible && !typing() && !document.querySelector('.item.selected') && desk && desk.classList.contains('tool-select')) dismiss();
      return;
    }
    if (e.key.toLowerCase() !== 'b' || e.metaKey || e.ctrlKey || e.altKey || e.repeat || typing()) return;
    e.preventDefault();
    toggle();
  }, { capture: true });

  // ---------- boot ----------
  // tiny hook so the console (and manual checks) can inspect the companion
  window.__companion = {
    nextBlinkDelay,
    get visible() { return state.visible; },
  };
})();
