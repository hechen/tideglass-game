// A shift is deterministic: the squall closes one channel at departure for one turn.
export const ports = [
  { name: 'Hearth Harbor', x: 150, y: 390 },
  { name: 'Sable Cove', x: 340, y: 245 },
  { name: 'Pinewatch', x: 575, y: 180 },
  { name: 'Gull Rock', x: 775, y: 365 },
];

export const links = [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3]];

export const shifts = [
  {
    name: 'First Watch', tagline: 'A clear call before the squall',
    demand: [0, 2, 1, 2], deadlines: [0, 3, 5, 8],
    storm: { turn: 3, edge: [0, 2] }, budget: 10, capacity: 3,
    briefing: 'Sable needs you first. Pick up at a dock, then return to Hearth to unload.',
  },
  {
    name: 'The Eastern Call', tagline: 'Gull Rock is running out of time',
    demand: [0, 1, 2, 2], deadlines: [0, 7, 6, 3],
    storm: { turn: 4, edge: [0, 3] }, budget: 10, capacity: 3,
    briefing: 'Gull Rock expires first. Watch the harbor channel on turn 4.',
  },
  {
    name: 'Pinewatch Gale', tagline: 'The northern light is fading',
    demand: [0, 2, 2, 1], deadlines: [0, 7, 3, 8],
    storm: { turn: 3, edge: [0, 2] }, budget: 10, capacity: 3,
    briefing: 'Pinewatch expires first. Plan your return before the squall.',
  },
];

function sameEdge(a, b, edge) {
  return (edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a);
}

export function newShift(shift) {
  return {
    pos: 0, turn: 0, aboard: 0, delivered: 0, lost: 0,
    remaining: [...shift.demand], missed: [0, 0, 0, 0], history: [], track: [],
  };
}

export function dispatchStatus(shift, state, destination) {
  if (!links.some(edge => sameEdge(state.pos, destination, edge))) {
    return { allowed: false, message: 'Choose a port joined to your cutter.' };
  }
  if (state.turn + 1 === shift.storm.turn && sameEdge(state.pos, destination, shift.storm.edge)) {
    return { allowed: false, message: 'Squall blocks that channel this turn. Choose another or wait.' };
  }
  return { allowed: true };
}

// Arrival before or on a deadline is safe. Pickup and unloading are automatic.
export function dispatchTurn(shift, state, destination) {
  if (destination !== null) {
    const status = dispatchStatus(shift, state, destination);
    if (!status.allowed) return { ...status, state };
  }
  const snapshot = {
    pos: state.pos, turn: state.turn, aboard: state.aboard, delivered: state.delivered,
    lost: state.lost, remaining: [...state.remaining], missed: [...state.missed], track: [...state.track],
  };
  const next = {
    ...snapshot, remaining: [...state.remaining], missed: [...state.missed], track: [...state.track],
    history: [...state.history, snapshot], turn: state.turn + 1,
  };
  let message = 'Holding position. The forecast advances.';
  let pickup = 0;
  if (destination !== null) {
    next.pos = destination;
    next.track.push([state.pos, destination]);
    if (destination === 0) {
      next.delivered += next.aboard;
      message = next.aboard ? `${next.aboard} survivors delivered safely.` : 'The harbor is ready to receive survivors.';
      next.aboard = 0;
    } else {
      pickup = Math.min(next.remaining[destination], shift.capacity - next.aboard);
      next.remaining[destination] -= pickup;
      next.aboard += pickup;
      message = pickup ? `${pickup} aboard at ${ports[destination].name}.` :
        next.remaining[destination] ? 'Cutter is full. Return to harbor to unload.' : 'No one remains at this dock.';
    }
  }
  for (let i = 1; i < ports.length; i++) {
    if (next.remaining[i] && next.turn >= shift.deadlines[i]) {
      next.lost += next.remaining[i];
      next.missed[i] += next.remaining[i];
      message += ` The call at ${ports[i].name} has expired.`;
      next.remaining[i] = 0;
    }
  }
  const finished = next.turn >= shift.budget ||
    (next.remaining.every(value => value === 0) && next.aboard === 0);
  if (finished && next.aboard) {
    next.lost += next.aboard;
    next.aboard = 0;
    message += ' The shift ended before the cutter returned.';
  }
  if (finished) {
    for (let i = 1; i < ports.length; i++) {
      next.lost += next.remaining[i];
      next.missed[i] += next.remaining[i];
      next.remaining[i] = 0;
    }
  }
  return { allowed: true, state: next, finished, pickup, message };
}

export function undoDispatch(state) {
  return state.history.length ? { ...state.history.at(-1), history: state.history.slice(0, -1) } : state;
}

export function dispatchScore(shift, state) {
  const total = shift.demand.reduce((sum, n) => sum + n, 0);
  const score = state.delivered * 100 + (state.delivered === total ? (shift.budget - state.turn) * 10 : 0);
  const medal = state.delivered === total ? (state.turn <= 6 ? 'Gold' : 'Silver')
    : state.delivered > 0 ? 'Bronze' : 'No';
  return { score, medal, total };
}
