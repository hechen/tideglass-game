import { charts } from './charts.js';
import { edgeStatus, newVoyage, takeTurn, undo } from './rules.js';
import { cover, dialog, play, victory } from './render.js';

const app = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const storageKey = 'tideglass-best-v1';

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
};

function render(focusNode = null) {
  app.innerHTML = state.screen === 'cover' ? cover(state)
    : state.screen === 'victory' ? victory(state) : play(state);
  if (announcer) announcer.textContent = state.screen === 'play' ? state.message
    : state.screen === 'victory' ? 'All lights home. Your captain’s log is complete.' : '';
  if (state.result) {
    app.insertAdjacentHTML('beforeend', dialog(...state.result));
    app.querySelector('.modal .primary')?.focus();
  } else if (state.screen === 'victory') {
    app.querySelector('.victory-copy h1')?.focus();
  } else if (focusNode != null) {
    app.querySelector(`[data-node="${focusNode}"]`)?.focus();
  }
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
  const node = event.target.closest('[data-node]');
  if (node) advance(Number(node.dataset.node));
});

function preview(event) {
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
