import { charts, phases } from './charts.js';
import { edgeStatus } from './rules.js';

const definitions = `
  <defs>
    <pattern id="waves" width="35" height="24" patternUnits="userSpaceOnUse">
      <path d="M1 13q7-5 14 0m4 0q7-5 14 0" fill="none" stroke="#80b4a5" stroke-opacity=".19"/>
    </pattern>
    <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <path d="M0 0V8" stroke="#d6c99e" stroke-opacity=".28"/>
    </pattern>
    <radialGradient id="glow"><stop stop-color="#ffe79c" stop-opacity=".75"/>
      <stop offset="1" stop-color="#ffe79c" stop-opacity="0"/></radialGradient>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M0 0L8 4 0 8Z" fill="#e8bc78"/>
    </marker>
  </defs>`;

function landmark(kind) {
  if (kind === 'village') return `
    <g transform="translate(65 78)" fill="#e5d6ae" stroke="#3c6057" stroke-width="2">
      <path d="M0 37V19L13 9l13 10v18M29 37V14L43 3l14 11v23M61 37V22l12-9 12 9v15"/>
      <path d="M7 24h5v6H7zm30-4h5v6h-5zm10 0h5v6h-5zm21 7h5v6h-5z" fill="#e5af69"/>
      <path d="M-8 38h102M45 3v-9h4v12" fill="none"/>
    </g>`;
  if (kind === 'fort') return `
    <g transform="translate(386 240)" fill="#d9d0a6" stroke="#37584f" stroke-width="2">
      <path d="M0 34V9h8V2h9v7h13V2h9v7h9v25z"/>
      <path d="M18 34V22q6-10 12 0v12M6 15h5v5H6zm30 0h5v5h-5z" fill="#3a6057"/>
      <path d="M-8 35h64" fill="none"/>
    </g>`;
  if (kind === 'needle') return `
    <g transform="translate(500 218)" fill="#ddd6b6" stroke="#395b5b" stroke-width="3">
      <path d="M0 40L25 -40 48 40Z"/><path d="M13 40V17h22v23" fill="#416767"/>
      <path d="M25 -40v-15m-6 14h12M-12 41h72" fill="none"/>
    </g>`;
  return `
    <g transform="translate(321 268)" fill="none" stroke="#dbd2aa" stroke-width="3">
      <path d="M0 24V4l8-7 8 7v20M21 24V-3l9-7 9 7v27M-8 24h55"/>
      <path d="M5 24V12h6v12M27 24V9h6v15" stroke-width="2"/>
    </g>`;
}

function decoration(chart) {
  const palettes = [
    ['#715e62', '#17454b', '#526f62'], ['#536c79', '#163b4a', '#526b70'],
    ['#343453', '#172e42', '#4e5961'], ['#73918d', '#244b59', '#647e72'],
  ];
  const [sky, sea, land] = palettes[charts.indexOf(chart)];
  return `${definitions}
    <defs><linearGradient id="sea-gradient" x2="0" y2="1"><stop stop-color="${sky}"/>
      <stop offset=".43" stop-color="${sea}"/><stop offset="1" stop-color="#102d38"/></linearGradient></defs>
    <rect width="900" height="610" fill="url(#sea-gradient)"/>
    <rect width="900" height="610" fill="url(#waves)"/>
    ${chart.tideKey ? '<path d="M80 65Q300 -10 500 65T880 45" fill="none" stroke="#a6e1c8" stroke-opacity=".28" stroke-width="30"/>' : ''}
    <path d="${chart.land}" fill="${land}" stroke="#c4cba8" stroke-width="3"/>
    <path d="${chart.land}" fill="url(#hatch)" stroke="#a6c3a9" stroke-width="12" stroke-opacity=".18"/>
    <path d="M28 28H872V582H28Z M38 38H862V572H38Z" fill="none" stroke="#d4d4b3" stroke-opacity=".3"/>
    ${landmark(chart.landmark)}
    <g transform="translate(795 500)" stroke="#d8d6b6" fill="none" opacity=".65">
      <circle r="36"/><circle r="28"/>
      <path d="M0-48V48M-48 0H48M-26-26L26 26M26-26L-26 26M0-39L-5-5 0-12 5-5Z"/>
      <text x="-4" y="-53" fill="#e8dfc3" stroke="none" font-size="12">N</text>
    </g>
    <text x="48" y="565" class="sub">soundings &amp; currents · not for navigation</text>`;
}

function ferry() {
  return `<g transform="translate(0 -18)">
    <ellipse cy="14" rx="17" ry="5" fill="#08282b" opacity=".5"/>
    <path d="M-16 4H17L11 12H-10Z" fill="#d8ad65" stroke="#f7e4b5" stroke-width="1.5"/>
    <path d="M-8 3V-7H6L11 3Z" fill="#f6eacb" stroke="#d7b46c"/>
    <path d="M-4-7v-7h3v7M-5-3h4v4h-4M3-3h4v4H3" fill="#264d4a"/>
    <path d="M-13 7h26" stroke="#775936"/>
  </g>`;
}

function lighthouse(x, y, lit = false) {
  return `<g transform="translate(${x} ${y})">
    ${lit ? '<circle cy="-14" r="50" fill="url(#glow)"/>' : ''}
    <path d="M-12 12L-8-12H8L12 12Z" fill="#f2dfb7" stroke="#cdbd92"/>
    <path d="M-7-12v-8H7v8M-11-20l11-8 11 8" fill="#bc725f" stroke="#f3d5a3"/>
    <path d="M-3-18h6v5h-6" fill="#f8d678"/><path d="M-17 13h34" stroke="#e5d4ac"/>
  </g>`;
}

function coverArt() {
  return `<svg class="cover-art" viewBox="0 0 900 610" preserveAspectRatio="xMidYMid slice" role="img"
      aria-label="A lighthouse sweeps its beam across the night sea as a tender approaches">
    <defs><linearGradient id="poster-sky" x2="0" y2="1"><stop stop-color="#111f3b"/>
      <stop offset="1" stop-color="#39596a"/></linearGradient>
      <linearGradient id="beam" x1="1" x2="0"><stop stop-color="#f7db9c" stop-opacity=".55"/>
      <stop offset="1" stop-color="#f7db9c" stop-opacity="0"/></linearGradient></defs>
    <rect width="900" height="610" fill="url(#poster-sky)"/>
    <g fill="#eadcb8" opacity=".8"><circle cx="68" cy="65" r="2"/><circle cx="160" cy="98" r="2"/>
      <circle cx="276" cy="54" r="3"/><circle cx="397" cy="100" r="2"/><circle cx="512" cy="47" r="2"/>
      <circle cx="625" cy="95" r="2"/><circle cx="808" cy="55" r="3"/></g>
    <path d="M645 148L15 190 0 340 645 164Z" fill="url(#beam)"/>
    <path d="M0 315Q110 260 220 320T410 305T610 300T900 280V610H0Z" fill="#203e51"/>
    <path d="M0 385Q130 340 265 390T530 380T900 345V610H0Z" fill="#234e5b"/>
    <path d="M0 455Q110 415 210 460T430 450T650 440T900 415V610H0Z" fill="#2b5d65"/>
    <g fill="none" stroke="#b5d7c3" stroke-opacity=".6" stroke-width="2">
      <path d="M25 382q60-22 120 0m38 9q70-25 140 0m80-8q62-20 125 0"/>
      <path d="M30 465q72-25 145 0m75 10q65-24 130 0m90-5q80-30 160 0"/>
      <path d="M55 535q85-30 170 0m65 18q90-28 180 0m95-20q80-25 160 0"/>
    </g>
    <path d="M510 610Q560 555 570 490L608 450 620 375 672 345 680 280 723 250
      744 209 900 170V610Z" fill="#172e38" stroke="#a9bca3" stroke-width="3"/>
    <path d="M570 535Q620 485 628 428L682 397 693 330 738 305 760 240" fill="none" stroke="#91a893" stroke-width="3"/>
    <path d="M600 565q80-45 100-100m-64 92q70-38 93-80m-52 60q70-42 86-74" fill="none" stroke="#678b81"/>
    <g transform="translate(744 172)">
      <path d="M-25 105L-17-10H17L25 105Z" fill="#eee3c5" stroke="#d1b789" stroke-width="3"/>
      <path d="M-20 55L20 35l2 19-44 21z M-17 10L17-7v18l-35 18z" fill="#b56e60"/>
      <path d="M-20-10v-25h40v25z" fill="#294b50" stroke="#ead5a6" stroke-width="3"/>
      <path d="M-12-30h24v14h-24z" fill="#ffdf86"/><path d="M-25-36L0-52 25-36Z" fill="#b56e60"/>
      <path d="M-34 105h68" stroke="#e8d6ae" stroke-width="4"/>
    </g>
    <g fill="#efca7b" opacity=".8"><path d="M710 387h6v7h-6zm24-27h6v7h-6zm38-25h6v7h-6z"/>
      <path d="M595 490h34v3h-34zm-30 16h48v2h-48zm35 14h54v2h-54z"/></g>
    <g transform="translate(350 515) scale(2.3)">${ferry()}<rect x="-5" y="-22" width="5" height="4" fill="#ffdc87"/></g>
    <path d="M290 535q-42 12-77 0m63 13q-55 14-100 0" fill="none" stroke="#c0dfca" stroke-width="3"/>
  </svg>`;
}

function shell(state, body, footer = false) {
  return `<div class="shell">
    <header class="top">
      <div class="brand"><b>✳</b> Tideglass <span>/</span> The lantern atlas</div>
      <div class="top-note">A voyage in four charts</div>
      <button class="sound" data-action="sound" aria-pressed="${state.sound}">
        Sound ${state.sound ? 'on' : 'off'}
      </button>
    </header>
    ${body}
    ${footer ? '<footer class="foot"><span>Field notes · No. 01—04</span><span>Made for the light between tides</span></footer>' : ''}
  </div>`;
}

export function cover(state) {
  const progress = charts.map((chart, index) => {
    const best = state.best[index];
    const available = index === 0 || state.best[index - 1] != null;
    return `<button class="chart-choice" data-level="${index}" ${available ? '' : 'disabled'}>
      <span>0${index + 1} &nbsp; ${chart.name}</span>
      <small>${best == null ? (available ? 'Start chart' : 'Locked') : `Best ${best} · ${best <= chart.par ? 'Par achieved' : `Par ${chart.par}`}`}</small>
    </button>`;
  }).join('');
  return shell(state, `<section class="cover">
    <div class="cover-copy">
      <div class="eyebrow">Three crossings &amp; a bonus voyage</div>
      <h1>Tide<em>glass</em></h1>
      <p class="lead">The coast is going dark. Guide a little tender through the changing tide and carry lantern light home.</p>
      <button class="dispatch-launch" data-action="dispatch-start">
        <span>NEW · RESCUE MODE</span><strong>Stormwatch Dispatch →</strong>
        <small>Save lives. Read the forecast. Bring everyone home.</small>
      </button>
      <div class="campaign-caption">THE LANTERN ATLAS · FOUR PUZZLES</div>
      <div class="chart-list" aria-label="Choose a chart">${progress}</div>
      <p class="bottom">Your best crossings are saved on this device. The sea moves only when you do.</p>
    </div>${coverArt()}
  </section>`, true);
}

function map(chart, voyage, travel) {
  const edges = chart.edges.map(([a, b, tide, direction]) => {
    const [x1, y1] = chart.nodes[a];
    const [x2, y2] = chart.nodes[b];
    const near = a === voyage.pos || b === voyage.pos;
    const other = a === voyage.pos ? b : a;
    const open = near && edgeStatus(chart, voyage, other).allowed;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const current = direction ? (() => {
      const [sx, sy] = chart.nodes[direction[0]];
      const [ex, ey] = chart.nodes[direction[1]];
      return `<path d="M${sx * .4 + ex * .6} ${sy * .4 + ey * .6} L${sx * .3 + ex * .7} ${sy * .3 + ey * .7}"
        stroke="#e8bc78" stroke-width="3" marker-end="url(#arrow)"/>
        <text x="${mx + 15}" y="${my}" class="current-label">ONE WAY</text>`;
    })() : '';
    return `<line class="route ${near ? (open ? 'open' : 'blocked') : ''}"
      x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
      ${tide == null ? '' : `<g transform="translate(${mx} ${my})">
        <path d="M0-12L12 0 0 12-12 0Z" fill="#173b40" stroke="#e38470" stroke-width="2"/>
        <text text-anchor="middle" y="4" class="gate-number">${tide + 1}</text>
        <text text-anchor="middle" y="-19" class="gate-label">${phases[tide].toUpperCase()}</text>
      </g>`}${current}`;
  }).join('');
  const nodes = chart.nodes.map(([x, y, label], index) => {
    const reachable = index !== voyage.pos && edgeStatus(chart, voyage, index).allowed;
    const light = chart.lights.includes(index);
    const lit = voyage.collected.includes(index);
    const description = `${label}${light ? (lit ? ', light collected' : ', lantern to collect') : ''}`;
    return `<g class="node ${index === voyage.pos ? 'current' : ''} ${reachable ? 'reachable' : ''}"
      data-node="${index}" tabindex="0" role="button" aria-label="${description}${reachable ? ', sail here' : ''}"
      transform="translate(${x} ${y})">
      ${lit ? '<circle r="35" fill="url(#glow)"/>' : ''}
      <circle class="hit" r="45"/>
      ${index === chart.start ? '<path class="home-mark" d="M-11 7h22M-8 7V0l8-7 8 7v7"/>' : '<circle class="ring" r="10"/>'}
      ${light ? `<path d="M-4-2h8v8h-8z M-3-4h6" fill="${lit ? '#fff2ae' : '#e5b96c'}" stroke="#f6e3b5"/>` : ''}
      ${index === chart.goal ? '<path d="M-5 5L-3-5H3L5 5Z" fill="#f4e4bd" stroke="#c88c72"/>' : ''}
      <text class="label" text-anchor="middle" y="35">${label}${lit ? ' ✓' : ''}</text>
    </g>`;
  }).join('');
  const [x, y] = chart.nodes[voyage.pos];
  const from = travel == null ? null : chart.nodes[travel];
  const wake = from ? `<line class="wake" x1="${from[0]}" y1="${from[1]}" x2="${x}" y2="${y}"/>` : '';
  const track = voyage.track.map(([a, b]) => {
    const [ax, ay] = chart.nodes[a];
    const [bx, by] = chart.nodes[b];
    return `<line class="sailed" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>`;
  }).join('');
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = from && !reduced
    ? `<animateTransform attributeName="transform" type="translate" from="${from[0]} ${from[1]}"
        to="${x} ${y}" dur=".7s" fill="freeze"/>` : '';
  return `<svg class="map" viewBox="0 0 900 610" role="group" aria-label="Interactive nautical chart">
    ${decoration(chart)}${track}${edges}${wake}${nodes}
    <g transform="translate(${x} ${y})" class="ship">${motion}${ferry()}</g>
    ${lighthouse(chart.nodes[chart.goal][0] + 22, chart.nodes[chart.goal][1] - 22,
      voyage.pos === chart.goal && voyage.collected.length === chart.lights.length)}
  </svg>`;
}

export function play(state) {
  const chart = charts[state.level];
  const voyage = state.voyage;
  return shell(state, `<div class="play-head">
    <div><div class="eyebrow">Chart 0${state.level + 1} / 04 ${chart.tideKey ? '· BONUS' : ''}</div><h1>${chart.name}</h1><p>${chart.subtitle}</p></div>
    <div class="progress small">${voyage.collected.length} / ${chart.lights.length} lights aboard</div>
  </div>
  <div class="game-layout">
    <div class="map-wrap">${map(chart, voyage, state.travel)}</div>
    <aside class="side">
      <div class="side-section intro"><div class="small gold">Your commission</div>
        <h2>Bring the lights home</h2><p>Collect every lantern, then reach the harbor before your turns run out.</p></div>
      <div class="side-section"><div class="small">Tide at departure</div>
        <div class="phase">${phases.map((phase, i) => `<span class="${voyage.turn % 3 === i ? 'active' : ''}">${i + 1} ${phase}</span>`).join('')}</div></div>
      <div class="side-section stats"><div><div class="small">Turns left</div><strong>${chart.budget - voyage.turn}</strong></div>
        <div><div class="small">Par / best</div><strong>${chart.par} / ${state.best[state.level] ?? '—'}</strong></div></div>
      <p class="hint">${state.message}</p>
      ${chart.tideKey ? `<div class="key-panel"><button class="secondary key-button" data-action="key"
        aria-pressed="${voyage.key === 'armed'}" ${voyage.key === 'spent' ? 'disabled' : ''}>
        Tide key · ${voyage.key}</button><p>Arm to cross one tide-closed channel. Never against a current; undo refunds it.</p></div>` : ''}
      <div class="controls"><button class="secondary" data-action="wait">Wait / W</button>
        <button class="secondary" data-action="undo" ${voyage.history.length ? '' : 'disabled'}>Undo / Z</button>
        <button class="secondary" data-action="retry">Retry</button><button class="secondary" data-action="atlas">Atlas</button></div>
      <div class="legend"><span>◇ Named tide opens a channel</span><span>→ One-way current &nbsp; ··· Sailed route</span></div>
    </aside>
  </div>
  <div class="bottom">Select a neighboring buoy to sail. Each sail or wait advances the tide.
    Tab to a buoy and press Enter or Space; W waits, Z undoes.</div>`);
}

export function victory(state) {
  const total = state.best.reduce((sum, value) => sum + (value ?? 0), 0);
  const par = charts.reduce((sum, chart) => sum + chart.par, 0);
  return shell(state, `<section class="victory-page">
    <div class="victory-art" aria-hidden="true">
      <svg viewBox="0 0 680 360"><defs><radialGradient id="victory-glow">
        <stop stop-color="#f9dd91" stop-opacity=".75"/><stop offset="1" stop-color="#f9dd91" stop-opacity="0"/>
      </radialGradient></defs>
      <path d="M25 270Q170 185 330 270T655 245" fill="none" stroke="#9fcdb8" stroke-width="2" stroke-dasharray="5 9"/>
      ${[100, 260, 420, 580].map((x, i) => `<g transform="translate(${x} ${165 + (i % 2) * 35})">
        <circle r="70" fill="url(#victory-glow)"/><path d="M-14 15L-10-17H10L14 15Z" fill="#f3e4be"/>
        <path d="M-14-18L0-29 14-18Z" fill="#c97f68"/><rect x="-5" y="-13" width="10" height="11" fill="#ffd77d"/>
      </g>`).join('')}
      <text x="340" y="335" text-anchor="middle" fill="#bcd5c0" font-size="14" letter-spacing="4">FOUR LIGHTS · ONE COAST</text></svg>
    </div>
    <div class="victory-copy"><div class="eyebrow">The captain's log · complete</div>
      <h1 tabindex="-1">All lights home.</h1><p>The coast is bright again.</p>
      <div class="victory-score"><strong>${total}</strong> best turns <span>/ ${par} fleet par</span></div>
      <p class="bottom">The total adds your best crossing on each chart.</p>
      <button class="primary" data-action="atlas">Return to atlas &amp; replay →</button>
    </div></section>`, true);
}

export function dialog(title, copy, button, action) {
  return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="eyebrow">Tideglass · field journal</div><h2 id="modal-title">${title}</h2><p>${copy}</p>
    <button class="primary" data-action="${action}">${button} →</button><br>
    <button class="quiet" data-action="${action === 'retry' ? 'undo' : 'retry'}">
      ${action === 'retry' ? 'Undo last turn' : 'Sail this chart again'}</button>
    ${button === 'Open bonus chart' ? '<button class="quiet" data-action="atlas">Return to atlas</button>' : ''}
  </div></div>`;
}
