import { passages } from './night-tow-sim.js';
import { landscape } from './night-tow-landscape.js';

function path(ctx, points, fill, stroke, width = 2) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const point of points.slice(1)) ctx.lineTo(point[0], point[1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function glow(ctx, x, y, radius, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,211,130,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function lighthouse(ctx, x, y, time, reduced) {
  const angle = reduced ? .25 : Math.sin(time * .22) * .62 + .12;
  ctx.save();
  ctx.translate(x, y - 39);
  ctx.rotate(angle);
  const beam = ctx.createLinearGradient(0, 0, 610, 0);
  beam.addColorStop(0, '#ffdb8b70');
  beam.addColorStop(1, '#ffdb8b00');
  path(ctx, [[0, -9], [610, -190], [610, 190], [0, 9]], beam);
  ctx.restore();
  glow(ctx, x, y - 39, 70, '#ffdb8799');
  path(ctx, [[x - 16, y + 27], [x - 10, y - 30], [x + 10, y - 30], [x + 16, y + 27]], '#f4e4c3', '#9eafa0', 2);
  path(ctx, [[x - 14, y + 12], [x + 13, y], [x + 14, y + 10], [x - 15, y + 22]], '#c8735b');
  path(ctx, [[x - 11, y - 13], [x + 10, y - 22], [x + 11, y - 12], [x - 12, y - 3]], '#c8735b');
  ctx.fillStyle = '#ffde87';
  ctx.fillRect(x - 8, y - 42, 16, 11);
  path(ctx, [[x - 13, y - 43], [x, y - 53], [x + 13, y - 43]], '#bc715b', '#f0d9aa');
}

function reefs(ctx, passage, time, reduced) {
  for (const reef of passage.reefs) {
    glow(ctx, reef.x, reef.y, reef.r * 1.7, '#9cd5c625');
    ctx.strokeStyle = '#b1dfc8';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = reduced ? 0 : -time * 8;
    ctx.beginPath();
    ctx.ellipse(reef.x, reef.y, reef.r + 18, reef.r + 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    path(ctx, [[reef.x - reef.r, reef.y], [reef.x - reef.r * .65, reef.y - reef.r * .42],
      [reef.x - 5, reef.y - reef.r * .32], [reef.x + reef.r * .35, reef.y - reef.r * .6],
      [reef.x + reef.r, reef.y], [reef.x + reef.r * .55, reef.y + reef.r * .37],
      [reef.x - reef.r * .55, reef.y + reef.r * .38]], '#263c49', '#8ab0a4', 2);
    ctx.strokeStyle = '#5d7d78';
    ctx.beginPath();
    ctx.moveTo(reef.x - reef.r * .6, reef.y + 3);
    ctx.lineTo(reef.x - 10, reef.y - 9);
    ctx.lineTo(reef.x + reef.r * .45, reef.y + 5);
    ctx.stroke();
  }
  for (const patch of passage.rough) {
    ctx.strokeStyle = '#a1cfc1aa';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    ctx.ellipse(patch.x, patch.y, patch.r, patch.r * .6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#d5e7ce';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROUGH WATER', patch.x, patch.y);
  }
}

function harbor(ctx, passage, time, reduced) {
  const [x, y] = passage.harbor;
  glow(ctx, x, y, 145, '#ffdb7c4c');
  ctx.strokeStyle = '#ffdc91';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 9]);
  ctx.lineDashOffset = reduced ? 0 : -time * 5;
  ctx.beginPath();
  ctx.arc(x, y, 68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const [bx, by] of [[x - 57, y - 39], [x + 57, y + 37]]) {
    glow(ctx, bx, by, 25, '#ffd98099');
    ctx.fillStyle = '#ffe3a2';
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff0cf';
  ctx.fillText('SAFE HARBOR', x, y + 98);
}

function lifeboat(ctx, state, time, reduced) {
  const boat = state.boat;
  glow(ctx, boat.x, boat.y, 100, '#ff985c5c');
  ctx.save();
  ctx.translate(boat.x, boat.y);
  if (!state.attached) {
    ctx.strokeStyle = '#ffd7a2aa';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  path(ctx, [[-28, -12], [28, -12], [22, 12], [-20, 12]], '#d48253', '#ffdfab', 3);
  path(ctx, [[-20, -5], [20, -5], [16, 7], [-15, 7]], '#643f3d', '#f4bf81', 2);
  for (const x of [-10, 3, 14]) {
    ctx.fillStyle = '#f6ddb1';
    ctx.beginPath();
    ctx.arc(x, -1, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const flare = reduced ? 12 : 12 + Math.sin(time * 2) * 2;
  glow(ctx, 18, -25, 32, '#ff9d65aa');
  ctx.strokeStyle = '#ffe09c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(18, -8);
  ctx.lineTo(18, -27);
  ctx.stroke();
  ctx.fillStyle = '#ffb26e';
  ctx.beginPath();
  ctx.arc(18, -28, flare / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe2b0';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${passages[state.index].lives} ABOARD`, boat.x, boat.y + 34);
}

function cutter(ctx, state, time, reduced) {
  const boat = state.cutter;
  ctx.save();
  ctx.translate(boat.x, boat.y);
  ctx.rotate(boat.heading);
  path(ctx, [[-34, -17], [20, -17], [38, 0], [20, 17], [-34, 17], [-40, 0]], '#d5a060', '#ffe0a8', 3);
  path(ctx, [[-25, -12], [9, -12], [19, 0], [9, 12], [-25, 12]], '#f2e3bf', '#91694e', 2);
  path(ctx, [[-8, -10], [8, -10], [15, 0], [8, 10], [-8, 10]], '#3c6363', '#f5d394', 2);
  ctx.fillStyle = '#ffda85';
  ctx.fillRect(-6, -7, 12, 5);
  ctx.fillRect(-6, 2, 12, 5);
  ctx.fillStyle = '#d77d5c';
  ctx.fillRect(-27, -9, 6, 18);
  ctx.strokeStyle = '#ffead0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-25, 0, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function wake(ctx, state, reduced) {
  if (reduced) return;
  for (const point of state.wake) {
    const age = state.elapsed - point.time;
    const alpha = Math.max(0, 1 - age / 3) * .65;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(point.heading);
    ctx.strokeStyle = `rgba(199, 238, 218, ${alpha})`;
    ctx.lineWidth = 2 + age * .6;
    ctx.beginPath();
    ctx.moveTo(-28, -6 - age * 3);
    ctx.quadraticCurveTo(-38, 0, -28, 6 + age * 3);
    ctx.stroke();
    ctx.restore();
  }
}

function towRope(ctx, state) {
  const cutter = state.cutter;
  const boat = state.boat;
  const dx = cutter.x - boat.x;
  const dy = cutter.y - boat.y;
  const length = Math.hypot(dx, dy) || 1;
  // Cutter coordinates are rotated by heading; the stern is its -x end.
  const start = { x: cutter.x - 35 * Math.cos(cutter.heading),
    y: cutter.y - 35 * Math.sin(cutter.heading) };
  // The open boat is drawn horizontally; choose the hull edge facing the cutter.
  const scale = 1 / Math.max(Math.abs(dx / length) / 25, Math.abs(dy / length) / 11, .001);
  const end = { x: boat.x + dx / length * scale, y: boat.y + dy / length * scale };
  const sag = 15 * (1 - state.tension);
  ctx.lineCap = 'round';
  const ropeColor = state.tension > .7 ? '#ffac85' : '#ffe0a0';
  for (const [color, width] of [['#0a2530', 9], [ropeColor, 5], ['#d58b4e', 1.5]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo((start.x + end.x) / 2, (start.y + end.y) / 2 + sag, end.x, end.y);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

export function drawNightTow(ctx, state, reduced = false) {
  const passage = passages[state.index];
  const time = state.elapsed;
  ctx.clearRect(0, 0, 1000, 600);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(landscape(state.index), 0, 0, 1000, 600);
  ctx.imageSmoothingEnabled = true;
  lighthouse(ctx, 105, 80, time, reduced);
  harbor(ctx, passage, time, reduced);
  reefs(ctx, passage, time, reduced);
  wake(ctx, state, reduced);
  if (state.attached) towRope(ctx, state);
  lifeboat(ctx, state, time, reduced);
  cutter(ctx, state, time, reduced);
}
