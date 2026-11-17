import { charts } from './charts.js';
import { edgeStatus, newVoyage, takeTurn, undo } from './rules.js';
import { cover, dialog, play, victory } from './render.js';
import { dispatchScore, dispatchStatus, dispatchTurn, newShift, ports, shifts, undoDispatch } from './dispatch-rules.js';
import { dispatchDebrief, dispatchPlay } from './dispatch-render.js';
import { mountNightTow } from './night-tow.js';

const app = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const storageKey = 'tideglass-best-v1';
const dispatchStorageKey = 'tideglass-dispatch-best-v1';

function loadBest() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) {
      return charts.map((_, i) => Number.isInteger(saved[i]) && saved[i] > 0 ? saved[i] : null);
    }
  } catch {
    // Storage can be unavailable, including in private browsing.
  }
  return charts.map(() => null);
}

const state = {
  screen: 'cover', level: 0, sound: false, best: loadBest(),
  voyage: null, travel: null, message: '', result: null,
  shiftIndex: 0, dispatch: null, dispatchTravel: null, dispatchPickup: 0,
  dispatchMessage: '', dispatchBest: loadDispatchBest(),
};

function loadDispatchBest() {
  try {
    const saved = JSON.parse(localStorage.getItem(dispatchStorageKey));
    if (Array.isArray(saved)) {
      return shifts.map((_, i) => Number.isInteger(saved[i]) && saved[i] > 0 ? saved[i] : null);
    }
  } catch {
    // A shift is still fully playable when storage is unavailable.
  }
  return shifts.map(() => null);
}

function render(focusNode = null) {
  app.innerHTML = state.screen === 'cover' ? cover(state)
    : state.screen === 'victory' ? victory(state)
    : state.screen === 'dispatch' ? dispatchPlay(state)
    : state.screen === 'dispatch-debrief' ? dispatchDebrief(state) : play(state);
  if (announcer) announcer.textContent = state.screen === 'play' ? state.message
    : state.screen === 'victory' ? 'All lights home. Your captain’s log is complete.'
    : state.screen === 'dispatch' ? state.dispatchMessage
    : state.screen === 'dispatch-debrief' ? 'Shift complete. Your rescue report is ready.' : '';
  if (state.result) {
    app.insertAdjacentHTML('beforeend', dialog(...state.result));
    app.querySelector('.modal .primary')?.focus();
  } else if (state.screen === 'victory') {
    app.querySelector('.victory-copy h1')?.focus();
  } else if (state.screen === 'dispatch-debrief') {
    app.querySelector('.debrief-copy h2')?.focus();
  } else if (focusNode != null) {
    const selector = state.screen === 'dispatch' ? 'data-dispatch-node' : 'data-node';
    app.querySelector(`[${selector}="${focusNode}"]`)?.focus();
  }
}

function startDispatch(index) {
  state.shiftIndex = index;
  state.dispatch = newShift(shifts[index]);
  state.dispatchTravel = null;
  state.dispatchPickup = 0;
  state.dispatchMessage = shifts[index].briefing;
  state.screen = 'dispatch';
  state.result = null;
  render();
}

function sailDispatch(destination, keyboard = false) {
  if (state.screen !== 'dispatch') return;
  const previous = state.dispatch.pos;
  const result = dispatchTurn(shifts[state.shiftIndex], state.dispatch, destination);
  state.dispatch = result.state;
  state.dispatchMessage = result.message;
  state.dispatchTravel = result.allowed && destination !== null ? previous : null;
  state.dispatchPickup = result.pickup ?? 0;
  if (result.allowed) tone();
  if (result.finished) {
    const score = dispatchScore(shifts[state.shiftIndex], state.dispatch).score;
    state.dispatchBest[state.shiftIndex] = Math.max(state.dispatchBest[state.shiftIndex] ?? 0, score);
    try { localStorage.setItem(dispatchStorageKey, JSON.stringify(state.dispatchBest)); } catch { /* In-memory best remains. */ }
    state.screen = 'dispatch-debrief';
  }
  render(keyboard ? (destination ?? previous) : null);
}

function start(level) {
  state.level = level;
  state.screen = 'play';
  state.voyage = newVoyage(charts[level]);
  state.travel = null;
  state.result = null;
  state.message = level === 3
    ? 'Arm the Tide key to cross one tide-closed channel. It cannot reverse a current.'
    : level === 2
    ? 'Gold arrows mark one-way currents. Choose a glowing neighbor.'
    : 'Choose a glowing neighboring buoy to sail.';
  render();
}

function tone() {
  if (!state.sound) return;
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 520;
    gain.gain.setValueAtTime(.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .18);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + .18);
    oscillator.onended = () => audio.close();
  } catch {
    // Audio is optional; a failed audio device must not affect play.
  }
}

function advance(destination, keyboard = false) {
  if (state.result) return;
  const chart = charts[state.level];
  const previous = state.voyage.pos;
  const result = takeTurn(chart, state.voyage, destination);
  state.message = result.reason ?? result.message;
  state.travel = result.allowed && destination !== null ? previous : null;
  state.voyage = result.voyage;
  if (result.allowed) tone();
  if (result.won) {
    const turns = state.voyage.turn;
    state.best[state.level] = Math.min(state.best[state.level] ?? Infinity, turns);
    try { localStorage.setItem(storageKey, JSON.stringify(state.best)); } catch { /* In-memory progress still works. */ }
    const score = `Crossing complete in ${turns} turns. ${turns <= chart.par ? 'Par achieved!' : `Par is ${chart.par}.`}`;
    if (state.level === charts.length - 1) {
      state.screen = 'victory';
      state.result = null;
    } else {
      state.result = ['Light delivered', `A warm window shines across the water. ${score}`,
        state.level === 2 ? 'Open bonus chart' : 'Next chart', 'next'];
    }
  } else if (result.lost) {
    state.result = ['The tide has turned',
      'The tender is safe, but the lights did not make it home in time. Retry or undo your last turn.',
      'Retry chart', 'retry'];
  }
  render(keyboard ? (destination ?? previous) : null);
}

function action(name) {
  switch (name) {
    case 'night-tow':
      state.screen = 'night-tow';
      state.result = null;
      mountNightTow(app, { onExit: () => { state.screen = 'cover'; render(); } });
      break;
    case 'dispatch-start': startDispatch(0); break;
    case 'dispatch-retry': startDispatch(state.shiftIndex); break;
    case 'dispatch-next': startDispatch((state.shiftIndex + 1) % shifts.length); break;
    case 'dispatch-atlas': state.screen = 'cover'; render(); break;
    case 'dispatch-wait':
      sailDispatch(null);
      if (state.screen === 'dispatch') app.querySelector('[data-action="dispatch-wait"]')?.focus();
      break;
    case 'dispatch-undo':
      state.dispatch = undoDispatch(state.dispatch);
      state.dispatchTravel = null;
      state.dispatchPickup = 0;
      state.dispatchMessage = 'Last turn undone; forecast and calls restored.';
      state.screen = 'dispatch';
      render();
      app.querySelector('[data-action="dispatch-undo"]')?.focus();
      break;
    case 'sound':
      state.sound = !state.sound;
      render();
      app.querySelector('[data-action="sound"]')?.focus();
      break;
    case 'atlas': state.screen = 'cover'; state.result = null; render(); break;
    case 'retry': start(state.level); break;
    case 'next': start(state.level + 1); break;
    case 'key':
      if (state.voyage.key === 'spent') break;
      state.voyage.key = state.voyage.key === 'armed' ? 'available' : 'armed';
      state.message = state.voyage.key === 'armed'
        ? 'Key armed: the next tide-closed channel uses it. One-way currents still apply.'
        : 'Key available. Arm it when you need a closed channel.';
      state.travel = null;
      render();
      app.querySelector('[data-action="key"]')?.focus();
      break;
    case 'wait':
      advance(null);
      if (!state.result) app.querySelector('[data-action="wait"]')?.focus();
      break;
    case 'undo':
      state.voyage = undo(state.voyage);
      state.travel = null;
      state.result = null;
      state.message = 'Last turn undone.';
      render();
      app.querySelector('[data-action="undo"]')?.focus();
      break;
  }
}

app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button) return action(button.dataset.action);
  const chart = event.target.closest('[data-level]');
  if (chart && !chart.disabled) return start(Number(chart.dataset.level));
  const dock = event.target.closest('[data-dispatch-node]');
  if (dock) return sailDispatch(Number(dock.dataset.dispatchNode));
  const node = event.target.closest('[data-node]');
  if (node) advance(Number(node.dataset.node));
});

function preview(event) {
  const dock = event.target.closest?.('[data-dispatch-node]');
  if (dock && state.screen === 'dispatch') {
    const destination = Number(dock.dataset.dispatchNode);
    const status = dispatchStatus(shifts[state.shiftIndex], state.dispatch, destination);
    const message = status.allowed ? `Sail to ${ports[destination].name}: 1 turn.` : status.message;
    const hint = app.querySelector('.dispatch-brief');
    if (hint) hint.textContent = message;
    if (announcer && event.type === 'focusin') announcer.textContent = message;
    return;
  }
  const node = event.target.closest?.('[data-node]');
  if (!node || state.screen !== 'play' || state.result) return;
  const destination = Number(node.dataset.node);
  const status = edgeStatus(charts[state.level], state.voyage, destination);
  const next = ['Ebb', 'Slack', 'Flood'][(state.voyage.turn + 1) % 3];
  const message = status.allowed
    ? `Sail: 1 turn${status.usesKey ? ', spends Tide key' : ''}. Next tide: ${next}.`
    : status.reason;
  const hint = app.querySelector('.hint');
  if (hint) hint.textContent = message;
  if (announcer && event.type === 'focusin') announcer.textContent = message;
}

app.addEventListener('pointerover', preview);
app.addEventListener('focusin', preview);
app.addEventListener('pointerout', event => {
  if (event.target.closest?.('[data-dispatch-node]')) {
    const hint = app.querySelector('.dispatch-brief');
    if (hint) hint.textContent = state.dispatchMessage;
  }
  if (event.target.closest?.('[data-node]')) {
    const hint = app.querySelector('.hint');
    if (hint) hint.textContent = state.message;
  }
});

document.addEventListener('keydown', event => {
  if (state.result && event.key === 'Tab') {
    const buttons = [...app.querySelectorAll('.modal button')];
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }
  const dock = event.target.closest?.('[data-dispatch-node]');
  if (dock && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    sailDispatch(Number(dock.dataset.dispatchNode), true);
    return;
  }
  if (state.screen === 'dispatch') {
    if (event.key.toLowerCase() === 'w') { event.preventDefault(); action('dispatch-wait'); }
    if (event.key.toLowerCase() === 'z') { event.preventDefault(); action('dispatch-undo'); }
    return;
  }
  const node = event.target.closest?.('[data-node]');
  if (node && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    advance(Number(node.dataset.node), true);
    return;
  }
  if (state.screen !== 'play' || state.result) return;
  if (event.key.toLowerCase() === 'w') { event.preventDefault(); action('wait'); }
  if (event.key.toLowerCase() === 'z') { event.preventDefault(); action('undo'); }
});

render();
