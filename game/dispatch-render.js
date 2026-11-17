import { dispatchScore, dispatchStatus, links, ports, shifts } from './dispatch-rules.js';

const islandShapes = [
  'M-135 10Q-120-28-76-40L-43-63 15-58 35-70 86-52 125-25 139 3 110 28 52 39-18 35-75 27Z',
  'M-115 9L-98-19-62-29-35-57 9-52 34-67 73-44 114-25 125 8 88 27 18 37-62 30Z',
  'M-110 8Q-96-22-60-31L-30-53 4-44 34-60 72-42 110-17 119 11 84 29 8 36-65 27Z',
  'M-119 10L-99-20-67-30-42-53 1-49 31-61 69-45 112-24 126 7 96 29 24 37-54 29Z',
];

function buildings(index) {
  if (index === 0) return `
    <g transform="translate(-32 -48)">
      <path d="M-42 25V4l20-14 20 14v21 M6 25V-2l20-15L46-2v27" fill="#e8d5ab" stroke="#473e40" stroke-width="3"/>
      <path d="M-46 5l24-18L2 5 M2-1l24-20L50-1" fill="#c16b55" stroke="#473e40" stroke-width="3"/>
      <path d="M-29 8h7v8h-7zm13 0h7v8h-7zm33-6h8v9h-8zm14 0h8v9h-8z" fill="#ffd580"/>
      <path d="M-45 26h102" stroke="#a98770" stroke-width="3"/>
    </g>`;
  if (index === 2) return `
    <g transform="translate(5 -52)">
      <path d="M-11 18L-8-22H8l4 40Z" fill="#e9e0be" stroke="#38494c" stroke-width="3"/>
      <path d="M-12-23L0-32 12-23Z" fill="#c87b60"/><rect x="-4" y="-19" width="8" height="8" fill="#ffd67a"/>
      <path d="M-43 20l12-35L-19 20zm-25 3l11-29 11 29zm95 0l12-38 12 38z" fill="#284c4b" stroke="#75968a" stroke-width="2"/>
    </g>`;
  if (index === 3) return `
    <g transform="translate(-10 -45)">
      <path d="M-35 25V3l19-13 19 13v22M13 25V7l14-10L41 7v18" fill="#dfd2ac" stroke="#435352" stroke-width="3"/>
      <path d="M-39 4l23-17L7 4M10 8L27-5 44 8" fill="#bb715e" stroke="#435352" stroke-width="3"/>
      <path d="M-22 7h7v8h-7zm11 0h7v8h-7zm35 4h7v7h-7z" fill="#ffe093"/>
      <path d="M54 25l11-32 11 32z" fill="#294d4b"/>
    </g>`;
  return `
    <g transform="translate(-6 -43)">
      <path d="M-38 25V3l20-14L2 3v22M15 25V8l15-11L45 8v17" fill="#e7d7b0" stroke="#435352" stroke-width="3"/>
      <path d="M-42 4l24-18L6 4M11 8L30-6 49 8" fill="#bc705d" stroke="#435352" stroke-width="3"/>
      <path d="M-25 8h7v8h-7zm13 0h7v8h-7zm37 4h7v7h-7z" fill="#ffd77c"/>
      <path d="M-69 25l12-38 12 38zM53 25l11-32 11 32z" fill="#294d4b" stroke="#75968a" stroke-width="2"/>
    </g>`;
}

function island(index, state, shift) {
  const positions = [[155, 477], [318, 175], [574, 100], [774, 452]];
  const [x, y] = positions[index];
  const shape = islandShapes[index];
  const active = index > 0 && state.remaining[index] > 0;
  const lost = index > 0 && state.missed[index] > 0;
  return `<g transform="translate(${x} ${y})">
    <path d="${shape}" transform="translate(0 28)" fill="#101f32" opacity=".55"/>
    <path d="${shape}" transform="translate(0 17)" fill="#263b50" stroke="#91a8a1" stroke-width="2"/>
    <path d="M-112 16Q-90 35-61 36L-41 51 2 55 40 51 66 43 99 31 117 16"
      fill="none" stroke="#709292" stroke-width="2" opacity=".8"/>
    <path d="M-89 28l13 16m21-7 10 12m25-8 8 14m44-17 7 12m28-19 8 12" stroke="#1a303e" stroke-width="3"/>
    <path d="${shape}" fill="#7a9580" stroke="#d6d7b4" stroke-width="3"/>
    <path d="M-101 6Q-70-12-35-10T25-20T95-4M-84 16Q-46 4-22 10T38 3" fill="none" stroke="#b6c7a4" stroke-width="2" opacity=".8"/>
    <path d="M-75 4l12-5m-5 11 12-5m17 14 12-5m61-12 12-5m-5 12 12-5" stroke="#52766c" stroke-width="2"/>
    ${buildings(index)}
    ${index ? `<g transform="translate(72 -20)">
      <ellipse cy="3" rx="24" ry="9" fill="${active ? '#ffc77a' : '#87c6ab'}" opacity=".22"/>
      ${active ? '<path d="M-8 5Q-6-6 0-15Q1-6 6-9Q11-3 7 5Z" fill="#f48b57" stroke="#ffe09a" stroke-width="2"/>' :
        lost ? '<path d="M-6-6L6 6M6-6L-6 6" fill="none" stroke="#e5b4a3" stroke-width="3"/>' :
          '<path d="M-7 2l5 5 11-13" fill="none" stroke="#d2f3cc" stroke-width="3"/>'}
    </g>` : ''}
  </g>`;
}

function cutter() {
  return `<g transform="translate(0 -10)">
    <ellipse cy="19" rx="35" ry="9" fill="#0d2835" opacity=".65"/>
    <path d="M-38 1L38 1 27 17-23 17Z" fill="#d69b55" stroke="#ffe4a9" stroke-width="3"/>
    <path d="M-29 7h58" stroke="#744c37" stroke-width="3"/>
    <path d="M-20 0v-18h29l12 18Z" fill="#f4e4bd" stroke="#a87751" stroke-width="2"/>
    <path d="M-14-14h9v9h-9zm14 0h9v9H0z" fill="#ffcd70" stroke="#49635d"/>
    <path d="M-5-18v-14h4v14M-2-30h16l-6 5H-2" fill="#e89a70" stroke="#e9d5aa"/>
    <path d="M24-3v-12m-6 2h13" stroke="#f1d8a6" stroke-width="2"/>
    <circle cx="-25" cy="-3" r="5" fill="#f6eee0" stroke="#b7664d" stroke-width="2"/>
  </g>`;
}

function map(shift, state, travel, pickup) {
  const lines = links.map(([a, b]) => {
    const from = ports[a];
    const to = ports[b];
    const blocked = state.turn + 1 === shift.storm.turn &&
      ((shift.storm.edge[0] === a && shift.storm.edge[1] === b) ||
       (shift.storm.edge[0] === b && shift.storm.edge[1] === a));
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"
      class="dispatch-route ${blocked ? 'storm-route' : ''}"/>`;
  }).join('');
  const sailed = state.track.map(([a, b]) => `<line class="dispatch-track"
    x1="${ports[a].x}" y1="${ports[a].y}" x2="${ports[b].x}" y2="${ports[b].y}"/>`).join('');
  const nodes = ports.map((port, i) => {
    const ready = i !== state.pos && dispatchStatus(shift, state, i).allowed;
    const demand = state.remaining[i];
    const label = i === 0 ? 'UNLOAD' : demand ? `${demand} WAITING · BY ${shift.deadlines[i]}` :
      state.missed[i] ? `${state.missed[i]} MISSED` : 'CLEAR';
    const labels = [[150, 349], [340, 288], [575, 224], [775, 317]];
    const [lx, ly] = labels[i];
    const stranded = demand ? `<g transform="translate(${port.x + 34} ${port.y + 32})" aria-hidden="true">
      <path d="M-13 0h26l-5 7h-16Z" fill="#a87658" stroke="#ffe0ae" stroke-width="2"/>
      <path d="M0 0v-18h10l-3 5H0" fill="#ef8d65" stroke="#ffdbab" stroke-width="2"/>
    </g>` : '';
    return `${stranded}<g class="dispatch-node ${ready ? 'ready' : ''}" data-dispatch-node="${i}" role="button" tabindex="0"
      aria-label="${port.name}, ${label.toLowerCase()}${ready ? ', reachable' : ''}">
      <circle class="dispatch-hit" cx="${port.x}" cy="${port.y}" r="50"/>
      <circle class="dock-ring" cx="${port.x}" cy="${port.y}" r="13"/>
      <path d="M${port.x - 5} ${port.y}h10 M${port.x} ${port.y - 5}v10" stroke="#f7e9c8" stroke-width="2"/>
      <g transform="translate(${lx} ${ly})"><rect x="-75" y="-22" width="150" height="39" rx="6" fill="#112c3a" stroke="${demand ? '#efa875' : '#90baa8'}" stroke-width="2"/>
        <text y="-6" text-anchor="middle" class="port-name">${port.name.toUpperCase()}</text>
        <text y="9" text-anchor="middle" class="port-detail">${label}</text></g>
    </g>`;
  }).join('');
  const position = ports[state.pos];
  const previous = travel == null ? null : ports[travel];
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = previous && !reduced ? `<animateTransform attributeName="transform" type="translate"
    from="${previous.x} ${previous.y}" to="${position.x} ${position.y}" dur=".8s" fill="freeze"/>` : '';
  return `<svg class="dispatch-map" viewBox="0 0 960 600" role="group" aria-label="Stormwatch rescue chart">
    <defs><linearGradient id="dispatch-water" x2="0" y2="1"><stop stop-color="#526f83"/>
      <stop offset=".42" stop-color="#244a5d"/><stop offset="1" stop-color="#102c3d"/></linearGradient>
      <radialGradient id="dispatch-glow"><stop stop-color="#f9c777" stop-opacity=".5"/>
        <stop offset="1" stop-color="#f9c777" stop-opacity="0"/></radialGradient></defs>
    <rect width="960" height="600" fill="url(#dispatch-water)"/>
    <path d="M0 75Q210 5 410 75T960 30V0H0Z" fill="#d6c9a4" opacity=".16"/>
    <path d="M0 125Q210 60 390 120T960 95" fill="none" stroke="#c8d8c4" opacity=".22" stroke-width="3"/>
    <g fill="none" stroke="#a6d3c5" opacity=".35" stroke-width="2">
      <path d="M30 285q45-13 90 0m355-32q42-13 84 0m245-39q50-15 100 0"/>
      <path d="M32 555q70-20 140 0m190-75q60-18 120 0m254 59q70-20 140 0"/>
      <path d="M409 350q35-10 70 0m54 143q42-12 84 0m280-115q22-7 44 0"/>
    </g>
    ${lines}${sailed}
    ${ports.map((_, i) => island(i, state, shift)).join('')}
    <g fill="none" stroke="#decc9c" stroke-width="5" stroke-linecap="round">
      <path d="M155 441L150 390 M323 208L340 245 M575 143V180 M775 416V365"/>
    </g>
    ${nodes}
    ${previous ? `<line class="dispatch-wake" x1="${previous.x}" y1="${previous.y}" x2="${position.x}" y2="${position.y}"/>` : ''}
    <g transform="translate(${position.x} ${position.y})" class="dispatch-ship">${motion}
      <circle r="60" fill="url(#dispatch-glow)"/>${cutter()}
      ${pickup ? `<g class="boarding"><circle cx="-9" cy="-29" r="4" fill="#fff1cf"/>
        <circle cx="4" cy="-29" r="4" fill="#fff1cf"/><text x="14" y="-27" fill="#fff1cf" font-size="15">+${pickup}</text></g>` : ''}
    </g>
  </svg>`;
}

function forecast(shift, state) {
  const edge = shift.storm.edge.map(index => ports[index].name).join(' ↔ ');
  if (state.turn + 1 > shift.storm.turn) return 'Squall has passed. All channels open.';
  const when = state.turn + 1 === shift.storm.turn ? 'NOW' : `TURN ${shift.storm.turn}`;
  return `${when}: ${edge} closes for one turn.`;
}

export function dispatchPlay(model) {
  const shift = shifts[model.shiftIndex];
  const state = model.dispatch;
  return `<div class="dispatch-shell">
    <header class="dispatch-header"><div><span class="dispatch-kicker">TIDEGLASS / RESCUE SERVICE</span>
      <h1>Stormwatch <em>Dispatch</em></h1></div><button class="dispatch-quiet" data-action="dispatch-atlas">← Atlas</button></header>
    <div class="dispatch-layout"><section class="dispatch-board">${map(shift, state, model.dispatchTravel, model.dispatchPickup)}
      <div class="dispatch-mobile-docks" aria-label="Choose a destination">${ports.map((port, i) => {
        const status = dispatchStatus(shift, state, i);
        const detail = i === 0 ? 'Unload' : state.remaining[i]
          ? `${state.remaining[i]} waiting · by ${shift.deadlines[i]}`
          : state.missed[i] ? `${state.missed[i]} missed` : 'Clear';
        return `<button data-dispatch-node="${i}" ${i === state.pos ? 'disabled' : ''}>
          <strong>${port.name}</strong><span>${detail}${status.allowed ? '' : ' · not open'}</span></button>`;
      }).join('')}</div>
    </section>
      <aside class="dispatch-side">
        <div class="dispatch-heading"><span class="dispatch-kicker">SHIFT 0${model.shiftIndex + 1} / 03</span><h2>${shift.name}</h2><p>${shift.tagline}</p></div>
        <div class="dispatch-forecast"><span class="dispatch-kicker">☁ FORECAST</span><strong>${forecast(shift, state)}</strong></div>
        <div class="dispatch-meter"><div><span>TURN</span><strong>${state.turn}<small> / ${shift.budget}</small></strong></div>
          <div><span>ABOARD</span><strong>${state.aboard}<small> / ${shift.capacity}</small></strong></div>
          <div><span>SAFE</span><strong>${state.delivered}</strong></div></div>
        <p class="dispatch-brief">${model.dispatchMessage}</p>
        <div class="dispatch-actions"><button data-action="dispatch-wait">Wait / W</button>
          <button data-action="dispatch-undo" ${state.history.length ? '' : 'disabled'}>Undo / Z</button>
          <button data-action="dispatch-retry">Restart</button></div>
        <p class="dispatch-help">Select a connected dock. Pickup and unloading are automatic. Arrive by the marked turn; gold saves everyone in 6 turns or fewer.</p>
      </aside></div>
    <div class="dispatch-footer"><span>● Orange signal: people waiting</span><span>◇ Reachable dock</span>
      <span>Tab to a dock · Enter or Space to sail</span></div>
  </div>`;
}

export function dispatchDebrief(model) {
  const shift = shifts[model.shiftIndex];
  const state = model.dispatch;
  const { score, medal, total } = dispatchScore(shift, state);
  return `<div class="dispatch-shell debrief-shell"><header class="dispatch-header">
    <div><span class="dispatch-kicker">TIDEGLASS / RESCUE SERVICE</span><h1>Stormwatch <em>Dispatch</em></h1></div>
    <button class="dispatch-quiet" data-action="dispatch-atlas">← Atlas</button></header>
    <section class="debrief"><div class="debrief-art"><div class="medal-mark"><span>✦</span></div>
      <div class="debrief-rays"></div><div class="debrief-horizon">${cutterBadge()}</div></div>
      <div class="debrief-copy"><div class="dispatch-kicker">SHIFT REPORT / ${shift.name.toUpperCase()}</div>
        <h2 tabindex="-1">${state.delivered === total ? 'Every light<br>made it home.' : 'Calls went<br>unanswered.'}</h2>
        <p class="debrief-medal">${medal} service medal</p>
        <div class="debrief-stats"><div><strong>${state.delivered}<small> / ${total}</small></strong><span>LIVES SAVED</span></div>
          <div><strong>${state.turn}<small> / ${shift.budget}</small></strong><span>TURNS USED</span></div>
          <div><strong>${score}</strong><span>SHIFT SCORE</span></div></div>
        <p class="debrief-note">100 per life delivered${state.delivered === total ? ` + ${shift.budget - state.turn} spare turns × 10` : ' · return all survivors for the time bonus'}.
          Best: ${model.dispatchBest[model.shiftIndex] ?? score}.</p>
        <div class="debrief-buttons"><button class="dispatch-primary" data-action="dispatch-retry">Sail this shift again →</button>
          <button class="dispatch-outline" data-action="dispatch-undo">Undo last turn</button>
          <button class="dispatch-outline" data-action="dispatch-next">Next forecast →</button></div>
      </div></section></div>`;
}

function cutterBadge() {
  return `<svg viewBox="-70 -55 140 100" aria-hidden="true">${cutter()}</svg>`;
}
