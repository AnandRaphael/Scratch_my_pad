(() => {
  'use strict';

  // ---------- constants ----------
  const STORAGE_KEY = 'scratchpad.v1';
  const COLORS = ['#ffe66d', '#ff9ecb', '#8fe3cf', '#9bc4ff', '#ffb26b', '#2b2a33', '#ff4d4d'];
  const PROMPTS = [
    'What would make this 10x simpler?',
    "Who's the user, really?",
    'Write the worst idea first.',
    "What's the one thing that must be true?",
    "If we only had a week, what ships?",
    'What are we pretending not to know?',
    'Explain it like I\'m five.',
    'What would make this a no-brainer?',
  ];
  const MILESTONES = { 5: 'Look at you go 🔥', 10: 'Ten stickies. Brainstorm mode: ON 🧠', 25: 'A masterpiece of chaos 🎨' };
  const MIN_ZOOM = 0.2, MAX_ZOOM = 3;

  // ---------- dom ----------
  const $ = (s) => document.querySelector(s);
  const desk = $('#desk'), world = $('#world'), ink = $('#ink'), ctx = ink.getContext('2d');
  const emptyEl = $('#empty'), toastEl = $('#toast'), zoomEl = $('#zoom');

  // ---------- state ----------
  let state = { items: [], strokes: [] };       // persisted content
  let view = { x: 0, y: 0, z: 1 };               // pan/zoom
  let tool = 'select';
  let color = COLORS[0];
  let selectedId = null;
  let history = [], hIndex = -1;
  let spaceDown = false;
  let action = null;                             // current pointer interaction

  const uid = () => Math.random().toString(36).slice(2, 9);
  const itemEls = new Map();

  // ---------- helpers ----------
  const toWorld = (sx, sy) => ({ x: (sx - view.x) / view.z, y: (sy - view.y) / view.z });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const find = (id) => state.items.find((i) => i.id === id);

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  // ---------- persistence ----------
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, view })); } catch (e) { /* storage may be blocked */ }
    }, 250);
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (raw && raw.state) { state = raw.state; view = raw.view || view; }
    } catch (e) { /* ignore corrupt data */ }
  }

  // ---------- history (undo/redo) ----------
  function commit() {
    history = history.slice(0, hIndex + 1);
    history.push(JSON.stringify(state));
    if (history.length > 100) history.shift();
    hIndex = history.length - 1;
    updateHistoryButtons();
    save();
    updateEmpty();
  }
  function restore(snapshot) {
    state = JSON.parse(snapshot);
    selectedId = null;
    renderItems();
    drawInk();
    updateHistoryButtons();
    save();
    updateEmpty();
  }
  const undo = () => { if (hIndex > 0) restore(history[--hIndex]); };
  const redo = () => { if (hIndex < history.length - 1) restore(history[++hIndex]); };
  function updateHistoryButtons() {
    $('#btn-undo').disabled = hIndex <= 0;
    $('#btn-redo').disabled = hIndex >= history.length - 1;
  }

  // ---------- items ----------
  function applyItemStyle(it, el) {
    el.style.left = it.x + 'px';
    el.style.top = it.y + 'px';
    el.style.setProperty('--rot', it.rot + 'deg');
    el.style.setProperty('--c', it.color);
    if (it.kind === 'note') { el.style.width = it.w + 'px'; el.style.height = it.h + 'px'; }
  }

  function buildItemEl(it) {
    const el = document.createElement('div');
    el.className = 'item ' + it.kind;
    el.dataset.id = it.id;
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = it.text || '';
    el.appendChild(content);
    if (it.kind === 'note') {
      const h = document.createElement('div');
      h.className = 'handle';
      el.appendChild(h);
    }
    applyItemStyle(it, el);
    itemEls.set(it.id, el);
    world.appendChild(el);
    return el;
  }

  function renderItems() {
    world.innerHTML = '';
    itemEls.clear();
    state.items.forEach(buildItemEl);
    // restored items shouldn't replay the pop animation
    itemEls.forEach((el) => (el.style.animation = 'none'));
  }

  function select(id) {
    if (selectedId && itemEls.has(selectedId)) itemEls.get(selectedId).classList.remove('selected');
    selectedId = id;
    if (id && itemEls.has(id)) {
      const el = itemEls.get(id);
      el.classList.add('selected');
      // bring to front
      // (re-attaching an element drops its focus, so skip when it's already on top)
      if (world.lastElementChild !== el) {
        const it = find(id);
        state.items.splice(state.items.indexOf(it), 1);
        state.items.push(it);
        world.appendChild(el);
      }
    }
  }

  function createItem(kind, wx, wy) {
    const it = kind === 'note'
      ? { id: uid(), kind, x: wx - 90, y: wy - 80, w: 180, h: 160, rot: +(Math.random() * 6 - 3).toFixed(1), color: color === COLORS[5] ? COLORS[0] : color, text: '' }   // dark ink isn't a sticky color
      : { id: uid(), kind, x: wx, y: wy - 20, w: 0, h: 0, rot: 0, color: color === COLORS[0] ? COLORS[5] : color, text: '' };
    state.items.push(it);
    const el = buildItemEl(it);
    select(it.id);
    startEdit(it.id);
    if (kind === 'note') {
      const n = state.items.filter((i) => i.kind === 'note').length;
      if (MILESTONES[n]) toast(MILESTONES[n]);
    }
    updateEmpty();
    return el;
  }

  function startEdit(id) {
    const el = itemEls.get(id);
    if (!el) return;
    const content = el.querySelector('.content');
    el.classList.add('editing');
    content.contentEditable = 'plaintext-only';
    if (content.contentEditable !== 'plaintext-only') content.contentEditable = 'true';
    content.focus();
    // caret at end
    const range = document.createRange();
    range.selectNodeContents(content);
    range.collapse(false);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    content.addEventListener('blur', () => endEdit(id), { once: true });
  }

  function endEdit(id) {
    const el = itemEls.get(id);
    if (!el) return;
    const it = find(id);
    const content = el.querySelector('.content');
    el.classList.remove('editing');
    content.contentEditable = 'false';
    getSelection().removeAllRanges();
    if (!it) return;
    const text = content.innerText.replace(/\n$/, '');
    if (!text.trim()) { removeItem(id, true); return; }   // empty items vanish
    const changed = text !== it.text;
    it.text = text;
    if (it.kind === 'text') { it.w = el.offsetWidth; it.h = el.offsetHeight; }
    if (changed || it.kind === 'text') commit();
  }

  function removeItem(id, silent) {
    const el = itemEls.get(id);
    const idx = state.items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    state.items.splice(idx, 1);
    itemEls.delete(id);
    if (selectedId === id) selectedId = null;
    if (el) { el.classList.add('poof'); setTimeout(() => el.remove(), 320); }
    commit();
    if (!silent) updateEmpty();
  }

  // ---------- ink ----------
  function resizeInk() {
    const dpr = window.devicePixelRatio || 1;
    ink.width = Math.round(innerWidth * dpr);
    ink.height = Math.round(innerHeight * dpr);
    drawInk();
  }

  function pathStroke(c, s) {
    const p = s.pts;
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    if (p.length === 1) c.lineTo(p[0][0] + 0.01, p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
      c.quadraticCurveTo(p[i][0], p[i][1], mx, my);
    }
    if (p.length > 1) c.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    c.strokeStyle = s.color;
    c.lineWidth = s.size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  }

  function drawInk() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ink.width, ink.height);
    ctx.setTransform(dpr * view.z, 0, 0, dpr * view.z, dpr * view.x, dpr * view.y);
    state.strokes.forEach((s) => pathStroke(ctx, s));
    if (action && action.type === 'pen') pathStroke(ctx, action.stroke);
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function eraseAt(wx, wy) {
    const r = 12 / view.z;
    const before = state.strokes.length;
    state.strokes = state.strokes.filter((s) => {
      const p = s.pts;
      if (p.length === 1) return Math.hypot(p[0][0] - wx, p[0][1] - wy) > r + s.size / 2;
      for (let i = 0; i < p.length - 1; i++) {
        if (distToSeg(wx, wy, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]) <= r + s.size / 2) return false;
      }
      return true;
    });
    if (state.strokes.length !== before) { action.erased = true; drawInk(); }
  }

  // ---------- view ----------
  function applyView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
    const g = 28 * view.z;
    desk.style.backgroundSize = `${g}px ${g}px`;
    desk.style.backgroundPosition = `${view.x}px ${view.y}px`;
    zoomEl.textContent = Math.round(view.z * 100) + '%';
    drawInk();
    save();
  }
  function zoomAt(sx, sy, factor) {
    const nz = clamp(view.z * factor, MIN_ZOOM, MAX_ZOOM);
    const k = nz / view.z;
    view.x = sx - (sx - view.x) * k;
    view.y = sy - (sy - view.y) * k;
    view.z = nz;
    applyView();
  }

  // ---------- tools ----------
  function setTool(t) {
    tool = t;
    desk.className = 'tool-' + t;
    document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === t));
    if (t !== 'select') select(null);
  }

  function buildColors() {
    const box = $('#colors');
    COLORS.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'swatch';
      b.style.setProperty('--c', c);
      b.dataset.color = c;
      b.title = 'Color';
      b.addEventListener('click', () => {
        setColor(c);
        const sel = selectedId && find(selectedId);
        if (sel && !(sel.kind === 'note' && c === COLORS[5])) { const it = sel; it.color = c; itemEls.get(selectedId).style.setProperty('--c', c); commit(); }
      });
      box.appendChild(b);
    });
    setColor(color);
  }
  function setColor(c) {
    color = c;
    document.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('active', b.dataset.color === c));
  }

  // ---------- pointer interaction ----------
  desk.addEventListener('pointerdown', (e) => {
    const itemEl = e.target.closest('.item');
    // let the user select text while editing
    if (itemEl && itemEl.classList.contains('editing')) return;
    if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();

    desk.setPointerCapture(e.pointerId);

    if (e.button === 1 || spaceDown) {
      action = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      desk.classList.add('panning');
      return;
    }
    if (e.button !== 0) return;
    const w = toWorld(e.clientX, e.clientY);

    if (tool === 'select') {
      if (e.target.classList.contains('handle')) {
        const it = find(itemEl.dataset.id);
        action = { type: 'resize', it, el: itemEl, sx: e.clientX, sy: e.clientY, w0: it.w, h0: it.h };
        return;
      }
      if (itemEl) {
        const it = find(itemEl.dataset.id);
        select(it.id);
        action = { type: 'drag', it, el: itemEl, sx: e.clientX, sy: e.clientY, x0: it.x, y0: it.y, moved: false };
        return;
      }
      select(null);
      action = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };   // drag empty desk to pan
      desk.classList.add('panning');
    } else if (tool === 'note' || tool === 'text') {
      if (itemEl) { select(itemEl.dataset.id); return; }
      e.preventDefault();
      createItem(tool, w.x, w.y);
      setTool('select');
    } else if (tool === 'pen') {
      // yellow is for stickies; the pen falls back to dark ink so it's visible on paper
      const pc = color === COLORS[0] ? COLORS[5] : color;
      action = { type: 'pen', stroke: { id: uid(), color: pc, size: pc === COLORS[5] ? 3 : 4, pts: [[w.x, w.y]] } };
      drawInk();
    } else if (tool === 'eraser') {
      action = { type: 'erase', erased: false };
      eraseAt(w.x, w.y);
    }
  });

  // stop the browser stealing focus from a freshly created note (it would blur + auto-delete it)
  desk.addEventListener('mousedown', (e) => {
    const itemEl = e.target.closest('.item');
    if (!(itemEl && itemEl.classList.contains('editing'))) e.preventDefault();
  });

  desk.addEventListener('pointermove', (e) => {
    if (!action) return;
    if (action.type === 'pan') {
      view.x = action.vx + (e.clientX - action.sx);
      view.y = action.vy + (e.clientY - action.sy);
      applyView();
    } else if (action.type === 'drag') {
      const dx = (e.clientX - action.sx) / view.z, dy = (e.clientY - action.sy) / view.z;
      if (!action.moved && Math.hypot(dx, dy) * view.z < 3) return;
      action.moved = true;
      action.el.classList.add('dragging');
      action.it.x = action.x0 + dx;
      action.it.y = action.y0 + dy;
      action.el.style.left = action.it.x + 'px';
      action.el.style.top = action.it.y + 'px';
    } else if (action.type === 'resize') {
      action.it.w = Math.max(100, action.w0 + (e.clientX - action.sx) / view.z);
      action.it.h = Math.max(80, action.h0 + (e.clientY - action.sy) / view.z);
      action.el.style.width = action.it.w + 'px';
      action.el.style.height = action.it.h + 'px';
    } else if (action.type === 'pen') {
      const w = toWorld(e.clientX, e.clientY);
      const last = action.stroke.pts[action.stroke.pts.length - 1];
      if (Math.hypot(w.x - last[0], w.y - last[1]) * view.z > 1.5) {
        action.stroke.pts.push([w.x, w.y]);
        drawInk();
      }
    } else if (action.type === 'erase') {
      const w = toWorld(e.clientX, e.clientY);
      eraseAt(w.x, w.y);
    }
  });

  function endAction() {
    if (!action) return;
    const a = action;
    action = null;
    desk.classList.remove('panning');
    if (a.type === 'drag') { a.el.classList.remove('dragging'); if (a.moved) commit(); }
    else if (a.type === 'resize') commit();
    else if (a.type === 'pen') { state.strokes.push(a.stroke); commit(); drawInk(); }
    else if (a.type === 'erase') { if (a.erased) commit(); }
    else if (a.type === 'pan') save();
  }
  desk.addEventListener('pointerup', endAction);
  desk.addEventListener('pointercancel', endAction);

  desk.addEventListener('dblclick', (e) => {
    const itemEl = e.target.closest('.item');
    if (itemEl) { select(itemEl.dataset.id); startEdit(itemEl.dataset.id); return; }
    if (tool === 'select') {
      const w = toWorld(e.clientX, e.clientY);
      createItem('note', w.x, w.y);
    }
  });

  desk.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
    else { view.x -= e.deltaX; view.y -= e.deltaY; applyView(); }
  }, { passive: false });

  zoomEl.addEventListener('click', () => { view = { x: 0, y: 0, z: 1 }; applyView(); });

  // ---------- keyboard ----------
  const typing = () => document.activeElement && document.activeElement.isContentEditable;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (typing()) document.activeElement.blur(); else { select(null); setTool('select'); } return; }
    if (typing()) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod) return;
    if (e.code === 'Space') { spaceDown = true; desk.style.cursor = 'grab'; e.preventDefault(); return; }
    const map = { v: 'select', n: 'note', t: 'text', p: 'pen', e: 'eraser' };
    const k = e.key.toLowerCase();
    if (map[k]) { e.preventDefault(); setTool(map[k]); }
    else if (k === '0') { view = { x: 0, y: 0, z: 1 }; applyView(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); removeItem(selectedId); }
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') { spaceDown = false; desk.style.cursor = ''; } });

  // ---------- empty state ----------
  let promptIdx = 0;
  function updateEmpty() {
    emptyEl.classList.toggle('hidden', state.items.length > 0 || state.strokes.length > 0);
  }
  function rotatePrompt() {
    promptIdx = (promptIdx + 1) % PROMPTS.length;
    $('#prompt').textContent = PROMPTS[promptIdx];
  }

  // ---------- export / import ----------
  function download(name, href) {
    const a = document.createElement('a');
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function wrapLines(c, text, maxW) {
    const out = [];
    text.split('\n').forEach((para) => {
      let line = '';
      para.split(' ').forEach((word) => {
        const t = line ? line + ' ' + word : word;
        if (c.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
      });
      out.push(line);
    });
    return out;
  }

  function exportPNG() {
    if (!state.items.length && !state.strokes.length) { toast('Nothing to export yet 🙈'); return; }
    // bounds of everything
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const grow = (x, y) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); };
    state.items.forEach((i) => { grow(i.x - 10, i.y - 20); grow(i.x + (i.w || 200) + 10, i.y + (i.h || 50) + 10); });
    state.strokes.forEach((s) => s.pts.forEach((p) => grow(p[0] - s.size, p[1] - s.size) || grow(p[0] + s.size, p[1] + s.size)));
    const pad = 40, scale = 2;
    const W = x2 - x1 + pad * 2, H = y2 - y1 + pad * 2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(W * scale); cv.height = Math.ceil(H * scale);
    const c = cv.getContext('2d');
    c.scale(scale, scale);
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#fbf5e6';
    c.fillRect(0, 0, W, H);
    c.translate(pad - x1, pad - y1);
    const family = getComputedStyle(document.body).fontFamily;

    state.items.forEach((it) => {
      c.save();
      const cx = it.x + (it.w || 0) / 2, cy = it.y + (it.h || 0) / 2;
      c.translate(cx, cy); c.rotate((it.rot * Math.PI) / 180); c.translate(-cx, -cy);
      if (it.kind === 'note') {
        c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 12; c.shadowOffsetY = 6;
        c.fillStyle = it.color;
        c.beginPath(); c.roundRect(it.x, it.y, it.w, it.h, [3, 3, 18, 3]); c.fill();
        c.shadowColor = 'transparent';
        c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(it.x + it.w / 2 - 27, it.y - 9, 54, 18);
        c.fillStyle = '#2b2a33'; c.font = `500 24px ${family}`; c.textBaseline = 'top';
        wrapLines(c, it.text, it.w - 32).forEach((ln, i) => c.fillText(ln, it.x + 16, it.y + 14 + i * 27.6));
      } else {
        c.fillStyle = it.color; c.font = `700 34px ${family}`; c.textBaseline = 'top';
        it.text.split('\n').forEach((ln, i) => c.fillText(ln, it.x + 6, it.y + 4 + i * 39));
      }
      c.restore();
    });
    state.strokes.forEach((s) => pathStroke(c, s));
    download('scratchpad.png', cv.toDataURL('image/png'));
    toast('PNG saved 🖼️');
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ app: 'scratchpad', version: 1, state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    download('scratchpad-board.json', url);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Board saved 💾');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const s = data.state || data;
        if (!Array.isArray(s.items) || !Array.isArray(s.strokes)) throw new Error('bad shape');
        state = { items: s.items, strokes: s.strokes };
        selectedId = null;
        renderItems(); drawInk(); commit();
        toast('Board opened 📂');
      } catch (err) { toast("Hmm, that file isn't a board 🤔"); }
    };
    reader.readAsText(file);
  }

  function clearBoard() {
    if (!state.items.length && !state.strokes.length) return;
    if (!confirm('Clear the whole board? (You can undo with Cmd/Ctrl+Z)')) return;
    state = { items: [], strokes: [] };
    selectedId = null;
    renderItems(); drawInk(); commit();
    toast('Fresh desk ✨');
  }

  // ---------- wire up ----------
  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('#btn-undo').addEventListener('click', undo);
  $('#btn-redo').addEventListener('click', redo);
  $('#btn-png').addEventListener('click', exportPNG);
  $('#btn-export').addEventListener('click', exportJSON);
  $('#btn-import').addEventListener('click', () => $('#file-import').click());
  $('#file-import').addEventListener('change', (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ''; });
  $('#btn-clear').addEventListener('click', clearBoard);
  window.addEventListener('resize', resizeInk);

  // ---------- boot ----------
  load();
  buildColors();
  renderItems();
  resizeInk();
  applyView();
  setTool('select');
  rotatePrompt();
  setInterval(rotatePrompt, 6000);
  history = [JSON.stringify(state)]; hIndex = 0;
  updateHistoryButtons();
  updateEmpty();

  // tiny hook so automated tests can inspect state
  window.__scratchpad = { get state() { return state; }, get view() { return view; } };
})();
