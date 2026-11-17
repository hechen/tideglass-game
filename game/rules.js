import { phases } from './charts.js';

export function newVoyage(chart) {
  return { pos: chart.start, turn: 0, collected: [], history: [],
    track: [], key: chart.tideKey ? 'available' : null };
}

export function edgeStatus(chart, voyage, destination) {
  const edge = chart.edges.find(([a, b]) =>
    (a === voyage.pos && b === destination) || (b === voyage.pos && a === destination));
  if (!edge) return { allowed: false, reason: 'Choose a buoy connected to your tender.' };
  const [, , tide, direction] = edge;
  if (direction && direction[0] !== voyage.pos) {
    return { allowed: false, reason: 'The current flows the other way. Follow its arrow.' };
  }
  if (tide != null && tide !== voyage.turn % 3) {
    if (voyage.key === 'armed') return { allowed: true, usesKey: true };
    return { allowed: false, reason: `That channel opens at ${phases[tide]}. Wait for the tide.` };
  }
  return { allowed: true };
}

export function takeTurn(chart, voyage, destination) {
  let status;
  if (destination !== null) {
    status = edgeStatus(chart, voyage, destination);
    if (!status.allowed) return { ...status, voyage };
  }
  const history = [...voyage.history, {
    pos: voyage.pos, turn: voyage.turn, collected: [...voyage.collected],
    track: [...voyage.track], key: voyage.key,
  }];
  const collected = [...voyage.collected];
  const isNewLight = chart.lights.includes(destination) && !collected.includes(destination);
  if (isNewLight) collected.push(destination);
  const next = {
    pos: destination ?? voyage.pos,
    turn: voyage.turn + 1,
    collected,
    history,
    track: destination === null ? voyage.track : [...voyage.track, [voyage.pos, destination]],
    key: status?.usesKey ? 'spent' : voyage.key,
  };
  const won = next.pos === chart.goal && collected.length === chart.lights.length;
  const lost = !won && next.turn >= chart.budget;
  let message = destination === null ? 'You hold position. The tide turns.' : 'The tide turns as you sail.';
  if (isNewLight) message = 'Lantern lit and aboard. Its light is safe with you.';
  if (status?.usesKey) message = 'Tide key spent. The closed channel opens for this crossing.';
  if (next.pos === chart.goal && !won) {
    message = 'The harbor is ahead, but lanterns remain. Sail out to collect them.';
  }
  return { allowed: true, voyage: next, won, lost, message };
}

export function undo(voyage) {
  if (!voyage.history.length) return voyage;
  return { ...voyage.history.at(-1), history: voyage.history.slice(0, -1) };
}
