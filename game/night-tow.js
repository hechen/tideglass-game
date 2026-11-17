import { newPassage, passages, stepPassage, toggleLine } from './night-tow-sim.js';
import { drawNightTow } from './night-tow-art.js';

export function mountNightTow(root, { onExit }) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = newPassage(0);
  let paused = true;
  let sound = false;
  let lastTime = 0;
  let accumulator = 0;
  let frame = 0;
  let lastEvent = 0;
  let target = null;
  const keys = new Set();
  const pointers = new Map();
  root.innerHTML = `<div class="tow-shell">
    <header class="tow-header"><div><span class="tow-kicker">TIDEGLASS / RESCUE SERVICE</span>
      <h1>Night <em>Tow</em></h1></div><div class="tow-header-actions">
      <button data-tow="sound" aria-pressed="false">Sound off</button>
      <button data-tow="pause">Pause</button><button data-tow="restart">Restart</button>
      <button data-tow="exit">Atlas</button></div></header>
    <div class="tow-game"><canvas id="night-tow-canvas" width="1000" height="600"
      aria-label="Night Tow sea. Use arrow keys or WASD to steer; Space attaches or releases the line."></canvas>
      <div class="tow-overlay" id="tow-overlay"></div>
    </div>
    <div class="tow-instruments"><div><span>PASSAGE</span><strong id="tow-passage"></strong></div>
      <div><span>HULL</span><strong id="tow-hull"></strong></div>
      <div><span>RESCUED</span><strong id="tow-rescued"></strong></div>
      <div><span>WEATHER</span><strong id="tow-clock"></strong></div>
      <div class="tow-tension"><span>LINE TENSION</span><div><i id="tow-tension"></i></div></div>
      <div><span>LINE / TOW</span><strong id="tow-line-state"></strong></div></div>
    <div class="tow-control-row"><div class="tow-helm" aria-label="Steering controls">
      <button data-steer="up" aria-label="Steer north">▲</button>
      <button data-steer="left" aria-label="Steer west">◀</button>
      <button data-steer="down" aria-label="Steer south">▼</button>
      <button data-steer="right" aria-label="Steer east">▶</button>
    </div><p id="tow-message" role="status"></p>
      <button class="tow-line-button" data-tow="line">Throw line / Space</button></div>
    <p class="tow-hint">Arrow keys / WASD steer · hold on the sea to steer toward a point · Space throws or drops the line · P pauses</p>
  </div>`;
  const canvas = root.querySelector('#night-tow-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = root.querySelector('#tow-overlay');
  const elements = Object.fromEntries(['passage', 'hull', 'rescued', 'clock', 'tension', 'line-state', 'message']
    .map(name => [name, root.querySelector(`#tow-${name}`)]));

  function intro() {
    overlay.innerHTML = `<div class="tow-card"><span class="tow-kicker">A REAL-TIME RESCUE · 3 PASSAGES</span>
      <h2>Bring them<br><em>home.</em></h2><p>Steer to the orange flare. Point toward the lifeboat and throw a line inside its dotted ring.
      Tow it into the gold harbor ring before the weather closes in.</p>
      <div class="tow-card-notes"><span>ARROWS / WASD · STEER</span><span>SPACE · LINE</span><span>P · PAUSE</span></div>
      <button class="tow-primary" data-tow="launch">Launch rescue →</button></div>`;
    overlay.hidden = false;
    overlay.querySelector('button').focus();
  }

  function tone(kind) {
    if (!sound) return;
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = kind === 'hit' || kind === 'snap' ? 'triangle' : 'sine';
      oscillator.frequency.value = kind === 'home' ? 660 : kind === 'hook' ? 510 : 180;
      gain.gain.setValueAtTime(.04, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .25);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + .25);
      oscillator.onended = () => audio.close();
    } catch { /* Sound is optional. */ }
  }

  function updateHud() {
    elements.passage.textContent = `${state.index + 1} / 3 · ${passages[state.index].name}`;
    elements.hull.textContent = `${state.hull} / 3`;
    elements.rescued.textContent = `${state.rescued} lives`;
    elements.clock.textContent = `${Math.ceil(state.time)}s`;
    elements.tension.style.width = `${Math.round(state.tension * 100)}%`;
    elements.tension.style.background = state.tension > .7 ? '#ed8667' : '#efc47c';
    elements['line-state'].textContent = `${state.attached ? 'Attached' : 'Free'} · ${state.towHealth}/3`;
    if (elements.message.textContent !== state.message) elements.message.textContent = state.message;
    root.querySelector('[data-tow="line"]').textContent = state.attached ? 'Release line / Space' : 'Throw line / Space';
    root.querySelector('[data-tow="pause"]').textContent = paused ? 'Resume' : 'Pause';
  }

  function finishCard() {
    const failed = state.status === 'failed';
    const final = state.index === passages.length - 1;
    const title = failed ? 'The weather<br>won this watch.' : final ? 'Every light<br>made it home.' : 'Safe in harbor.';
    overlay.innerHTML = `<div class="tow-card tow-result"><span class="tow-kicker">${failed ? 'RESCUE INTERRUPTED' : final ? 'FLEET REPORT · COMPLETE' : 'PASSAGE COMPLETE'}</span>
      <h2>${title}</h2><p>${failed ? state.message : `${passages[state.index].lives} lives rescued · ${state.clean ? 'clean tow' : 'tow completed with damage'}`}</p>
      <div class="tow-result-stats"><div><strong>${state.rescued}</strong><span>LIVES HOME</span></div>
        <div><strong>${state.score}</strong><span>RESCUE SCORE</span></div>
        <div><strong>${failed ? '—' : state.award}</strong><span>THIS PASSAGE</span></div></div>
      <p class="tow-scoring">100 per life · 150 clean-tow bonus · 2 per second remaining</p>
      <div class="tow-result-actions">${!failed && !final ? '<button class="tow-primary" data-tow="next">Next passage →</button>' : ''}
        <button class="tow-secondary" data-tow="restart">${failed || final ? 'Replay from the start' : 'Restart run'}</button>
        <button class="tow-secondary" data-tow="exit">Return to atlas</button></div></div>`;
    overlay.hidden = false;
    overlay.querySelector('button').focus();
  }

  function steering() {
    let x = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
    let y = Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
    for (const direction of pointers.values()) {
      if (direction === 'left') x--;
      if (direction === 'right') x++;
      if (direction === 'up') y--;
      if (direction === 'down') y++;
    }
    if (!x && !y && target) {
      const dx = target.x - state.cutter.x;
      const dy = target.y - state.cutter.y;
      const d = Math.hypot(dx, dy);
      if (d > 12) return { x: dx / d * Math.min(1, d / 75), y: dy / d * Math.min(1, d / 75) };
    }
    return { x, y };
  }

  function tick(now) {
    const delta = lastTime ? Math.min((now - lastTime) / 1000, .1) : 0;
    lastTime = now;
    if (!paused && state.status === 'running') {
      accumulator += delta;
      while (accumulator >= 1 / 60 && state.status === 'running') {
        stepPassage(state, steering(), 1 / 60);
        accumulator -= 1 / 60;
      }
      if (state.eventId !== lastEvent) { lastEvent = state.eventId; tone(state.event); }
      if (state.status !== 'running') {
        paused = true;
        keys.clear();
        pointers.clear();
        target = null;
        finishCard();
      }
    }
    drawNightTow(ctx, state, reduced);
    updateHud();
    frame = requestAnimationFrame(tick);
  }

  function reset() {
    state = newPassage(0);
    paused = false;
    lastEvent = 0;
    accumulator = 0;
    keys.clear();
    pointers.clear();
    target = null;
    overlay.hidden = true;
    lastTime = 0;
  }

  function pause() {
    if (state.status !== 'running' || !overlay.hidden) return;
    paused = !paused;
    keys.clear();
    pointers.clear();
    target = null;
    state.message = paused ? 'Paused. Press P or Resume to continue.' : 'Under way.';
  }

  root.addEventListener('click', event => {
    const action = event.target.closest('[data-tow]')?.dataset.tow;
    if (!action) return;
    if (action === 'exit') { cleanup(); onExit(); }
    if (action === 'restart') reset();
    if (action === 'launch') { overlay.hidden = true; paused = false; lastTime = 0; }
    if (action === 'next') {
      state = newPassage(state.index + 1, state.score, state.rescued);
      lastEvent = 0;
      accumulator = 0;
      overlay.hidden = true;
      paused = false;
      lastTime = 0;
    }
    if (action === 'pause') pause();
    if (action === 'line' && !paused) { toggleLine(state); updateHud(); }
    if (action === 'sound') {
      sound = !sound;
      event.target.textContent = `Sound ${sound ? 'on' : 'off'}`;
      event.target.setAttribute('aria-pressed', String(sound));
    }
  }, options);

  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault();
      if (!paused) keys.add(key);
    }
    if (key === ' ' && !event.repeat && !paused) { event.preventDefault(); toggleLine(state); }
    if (key === 'p' && !event.repeat) { event.preventDefault(); pause(); }
  }, options);
  document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()), options);
  window.addEventListener('blur', () => { if (!paused) pause(); }, options);

  root.addEventListener('pointerdown', event => {
    const button = event.target.closest('[data-steer]');
    if (button && !paused) {
      event.preventDefault();
      pointers.set(event.pointerId, button.dataset.steer);
      button.setPointerCapture(event.pointerId);
    }
  }, options);
  root.addEventListener('pointerup', event => pointers.delete(event.pointerId), options);
  root.addEventListener('pointercancel', event => pointers.delete(event.pointerId), options);
  root.addEventListener('lostpointercapture', event => pointers.delete(event.pointerId), options);
  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    target = { x: (event.clientX - bounds.left) / bounds.width * 1000,
      y: (event.clientY - bounds.top) / bounds.height * 600 };
  }
  canvas.addEventListener('pointerdown', event => {
    if (paused) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    point(event);
  }, options);
  canvas.addEventListener('pointermove', event => { if (canvas.hasPointerCapture(event.pointerId)) point(event); }, options);
  canvas.addEventListener('pointerup', () => { target = null; }, options);
  canvas.addEventListener('pointercancel', () => { target = null; }, options);

  function cleanup() {
    cancelAnimationFrame(frame);
    abort.abort();
  }
  intro();
  updateHud();
  frame = requestAnimationFrame(tick);
  return cleanup;
}
