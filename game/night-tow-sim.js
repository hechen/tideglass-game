// World units are independent of the canvas size. All steering paths use this simulation.
export const passages = [
  { name: 'Lantern Reach', description: 'A sheltered first crossing', time: 90,
    harbor: [150, 390], cutter: [240, 390], boat: [680, 390], lives: 2,
    current: [2, 0.5], reefs: [{ x: 500, y: 245, r: 55 }], rough: [] },
  { name: 'The Black Narrows', description: 'Cross-current around the reef', time: 90,
    harbor: [145, 395], cutter: [230, 395], boat: [760, 270], lives: 3,
    current: [2, 3], reefs: [{ x: 490, y: 365, r: 65 }, { x: 680, y: 475, r: 45 }],
    rough: [{ x: 550, y: 200, r: 70 }] },
  { name: 'Stormglass Point', description: 'A longer pull through rising seas', time: 95,
    harbor: [145, 405], cutter: [230, 405], boat: [790, 350], lives: 4,
    current: [-2, 3], reefs: [{ x: 450, y: 330, r: 58 }, { x: 620, y: 430, r: 60 }],
    rough: [{ x: 650, y: 205, r: 80 }, { x: 385, y: 465, r: 65 }] },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function newPassage(index, score = 0, rescued = 0) {
  const passage = passages[index];
  return {
    index, score, rescued, time: passage.time, elapsed: 0,
    cutter: { x: passage.cutter[0], y: passage.cutter[1], vx: 0, vy: 0, heading: 0 },
    boat: { x: passage.boat[0], y: passage.boat[1], vx: 0, vy: 0 },
    attached: false, hull: 3, towHealth: 3, tension: 0, grace: 0,
    clean: true, status: 'running', message: 'Steer toward the orange flare.',
    wake: [], wakeClock: 0,
    event: '', eventId: 0,
  };
}

function emit(state, type, message) {
  state.event = type;
  state.eventId++;
  state.message = message;
}

export function toggleLine(state) {
  if (state.status !== 'running') return false;
  if (state.attached) {
    state.attached = false;
    state.tension = 0;
    emit(state, 'drop', 'Line released. Come alongside to reattach.');
    return true;
  }
  const dx = state.boat.x - state.cutter.x;
  const dy = state.boat.y - state.cutter.y;
  const length = Math.hypot(dx, dy);
  const facing = (Math.cos(state.cutter.heading) * dx + Math.sin(state.cutter.heading) * dy) / (length || 1);
  if (length > 100 || facing < -0.15) {
    emit(state, 'miss', 'Come within the dotted ring and point toward the lifeboat.');
    return false;
  }
  state.attached = true;
  emit(state, 'hook', 'Line secured! Ease back to the glowing harbor.');
  return true;
}

function impact(state, body, reef, isTow) {
  const dx = body.x - reef.x;
  const dy = body.y - reef.y;
  const d = Math.hypot(dx, dy) || 1;
  const limit = reef.r + (isTow ? 15 : 18);
  if (d >= limit) return;
  body.x = reef.x + dx / d * limit;
  body.y = reef.y + dy / d * limit;
  body.vx = dx / d * 25;
  body.vy = dy / d * 25;
  if (state.grace > 0) return;
  state.grace = 2.2;
  state.clean = false;
  if (isTow) {
    state.towHealth--;
    emit(state, 'hit', 'Lifeboat hit a reef. Tow integrity reduced.');
  } else {
    state.hull--;
    emit(state, 'hit', 'Reef strike. The hull has taken damage.');
  }
}

export function stepPassage(state, input, dt) {
  if (state.status !== 'running') return state;
  // Clamp a paused/background frame to avoid tunneling and unpredictable jumps.
  dt = clamp(dt, 0, 1 / 30);
  const passage = passages[state.index];
  state.elapsed += dt;
  state.time = Math.max(0, state.time - dt);
  state.grace = Math.max(0, state.grace - dt);
  const cutter = state.cutter;
  const boat = state.boat;
  let x = clamp(input.x || 0, -1, 1);
  let y = clamp(input.y || 0, -1, 1);
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) { x /= magnitude; y /= magnitude; }
  if (magnitude > .05) cutter.heading = Math.atan2(y, x);
  const acceleration = state.attached ? 93 : 132;
  cutter.vx += (x * acceleration + passage.current[0]) * dt;
  cutter.vy += (y * acceleration + passage.current[1]) * dt;
  const drag = Math.exp(-1.65 * dt);
  cutter.vx *= drag;
  cutter.vy *= drag;
  const currentPulse = Math.sin(state.elapsed * .55) * 1.6;
  boat.vx += (passage.current[0] * .65 + currentPulse) * dt;
  boat.vy += passage.current[1] * .65 * dt;
  let dx = cutter.x - boat.x;
  let dy = cutter.y - boat.y;
  let length = Math.hypot(dx, dy) || 1;
  if (state.attached) {
    // Harbor hands shorten the line as the cutter enters the ring, so stopping at
    // the harbor center still brings the trailing boat safely inside.
    const harborDistance = distance(cutter, { x: passage.harbor[0], y: passage.harbor[1] });
    const restLength = 55 + 70 * clamp((harborDistance - 45) / 80, 0, 1);
    const stretch = Math.max(0, length - restLength);
    const relative = ((cutter.vx - boat.vx) * dx + (cutter.vy - boat.vy) * dy) / length;
    const pull = Math.max(0, stretch * 3.7 + relative * 1.2);
    boat.vx += dx / length * pull * dt;
    boat.vy += dy / length * pull * dt;
    cutter.vx -= dx / length * pull * .16 * dt;
    cutter.vy -= dy / length * pull * .16 * dt;
    state.tension = clamp(stretch / 90, 0, 1);
    if (length > 230) {
      state.attached = false;
      state.clean = false;
      state.tension = 0;
      emit(state, 'snap', 'The line snapped. Slow down and reattach.');
    }
  }
  const boatDrag = Math.exp(-1.05 * dt);
  boat.vx *= boatDrag;
  boat.vy *= boatDrag;
  for (const body of [cutter, boat]) {
    body.x = clamp(body.x + body.vx * dt, 38, 962);
    body.y = clamp(body.y + body.vy * dt, 95, 555);
  }
  state.wakeClock += dt;
  if (state.wakeClock >= .13) {
    state.wakeClock = 0;
    if (Math.hypot(cutter.vx, cutter.vy) > 8) {
      state.wake.push({ x: cutter.x, y: cutter.y, heading: cutter.heading, time: state.elapsed });
    }
  }
  while (state.wake.length && state.elapsed - state.wake[0].time > 3) state.wake.shift();
  for (const reef of passage.reefs) {
    impact(state, cutter, reef, false);
    impact(state, boat, reef, true);
  }
  for (const patch of passage.rough) {
    if (distance(cutter, patch) < patch.r || distance(boat, patch) < patch.r) {
      cutter.vx += Math.sin(state.elapsed * 2.7) * 13 * dt;
      cutter.vy += Math.cos(state.elapsed * 2.1) * 13 * dt;
      if (state.attached) state.tension = clamp(state.tension + .15, 0, 1);
    }
  }
  if (state.hull <= 0 || state.towHealth <= 0 || state.time <= 0) {
    state.status = 'failed';
    emit(state, 'fail', state.time <= 0 ? 'The weather closed in.' : 'The rescue was forced to turn back.');
  } else if (state.attached && distance(boat, { x: passage.harbor[0], y: passage.harbor[1] }) < 68 &&
      distance(cutter, { x: passage.harbor[0], y: passage.harbor[1] }) < 230) {
    const award = passage.lives * 100 + (state.clean ? 150 : 0) + Math.floor(state.time) * 2;
    state.score += award;
    state.rescued += passage.lives;
    state.award = award;
    state.status = 'rescued';
    emit(state, 'home', `${passage.lives} lives safely home!`);
  }
  return state;
}
