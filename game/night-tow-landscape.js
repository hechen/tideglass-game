import { passages } from './night-tow-sim.js';

// One deterministic 500 × 300 woodcut per passage; never rebuilt during a frame.
const cache = new Map();
const palettes = [
  { sea: [17, 57, 70], land: [71, 100, 87], cliff: [38, 62, 69] },
  { sea: [28, 40, 70], land: [65, 80, 81], cliff: [38, 48, 68] },
  { sea: [39, 43, 60], land: [82, 81, 71], cliff: [53, 48, 64] },
];

function hash(x, y, seed) {
  let v = Math.imul(x + seed * 101, 374761393) + Math.imul(y + seed * 307, 668265263);
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y, scale, seed) {
  const px = x / scale;
  const py = y / scale;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed) * (1 - sx) + hash(ix + 1, iy, seed) * sx;
  const b = hash(ix, iy + 1, seed) * (1 - sx) + hash(ix + 1, iy + 1, seed) * sx;
  return a * (1 - sy) + b * sy;
}

function shoreline(x, index) {
  return 42 + Math.sin(x * .031 + index) * 7 + Math.sin(x * .079 + .7) * 4 +
    noise(x, 20, 20, index + 2) * 10 + Math.max(0, 1 - x / 45) * 98;
}

function paintPixels(ctx, index) {
  const palette = palettes[index];
  const image = ctx.createImageData(500, 300);
  const data = image.data;
  const reefs = passages[index].reefs;
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 500; x++) {
      const coast = shoreline(x, index);
      const broad = noise(x, y, 34, index + 1);
      const grain = noise(x, y, 5, index + 8);
      const fleck = hash(x, y, index + 13);
      let color;
      let light;
      if (y < coast) {
        const cliff = y > coast - 14;
        color = cliff ? palette.cliff : palette.land;
        const strata = Math.sin(y * .64 + noise(x, y, 13, index) * 5 + x * .035);
        light = (broad - .5) * 22 + (grain - .5) * 18 + (cliff ? strata * 10 : 0);
      } else {
        color = palette.sea;
        const depth = Math.min(1, y / 300);
        light = (1 - depth) * 12 + (broad - .5) * 15 + (grain - .5) * 8;
        for (const reef of reefs) {
          const dx = x * 2 - reef.x;
          const dy = y * 2 - reef.y;
          const d = Math.hypot(dx, dy);
          const wave = reef.r + 22 + noise(x, y, 13, index + 17) * 35;
          if (d < wave + 20 && d > reef.r * .65) {
            light += 9 + Math.max(0, 1 - Math.abs(d - wave) / 22) * 12;
            if (fleck > .94 && d > reef.r + 10) light += 30;
          }
        }
        if (fleck > .994 && grain > .53) light += 42;
      }
      const offset = (y * 500 + x) * 4;
      for (let c = 0; c < 3; c++) data[offset + c] = Math.max(0, Math.min(255, color[c] + light));
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function seedRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function tree(ctx, x, y, size, hue) {
  ctx.fillStyle = '#293e3a';
  ctx.fillRect(x - 1, y - size * .25, 3, size * .38);
  ctx.fillStyle = hue;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * .25, y - size * .48);
  ctx.lineTo(x - size * .18, y - size * .48);
  ctx.lineTo(x - size * .36, y - size * .12);
  ctx.lineTo(x + size * .34, y - size * .12);
  ctx.lineTo(x + size * .15, y - size * .48);
  ctx.lineTo(x + size * .23, y - size * .48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#93ac93';
  ctx.lineWidth = .7;
  ctx.beginPath();
  ctx.moveTo(x - size * .22, y - size * .18);
  ctx.lineTo(x - size * .04, y - size * .75);
  ctx.stroke();
}

function house(ctx, x, y, size, variant) {
  ctx.fillStyle = '#283d43';
  ctx.fillRect(x + size * .7, y - size * .62, size * .25, size * .7);
  ctx.fillStyle = variant ? '#c0b797' : '#d6c6a2';
  ctx.fillRect(x, y - size * .62, size * .72, size * .7);
  ctx.fillStyle = variant ? '#8e6357' : '#b7715d';
  ctx.beginPath();
  ctx.moveTo(x - 3, y - size * .6);
  ctx.lineTo(x + size * .33, y - size);
  ctx.lineTo(x + size * .85, y - size * .6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e0c6a0';
  ctx.lineWidth = .8;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - size * .6);
  ctx.lineTo(x + size * .33, y - size);
  ctx.lineTo(x + size * .85, y - size * .6);
  ctx.stroke();
  ctx.fillStyle = '#ffdb83';
  ctx.fillRect(x + size * .12, y - size * .4, Math.max(2, size * .11), Math.max(2, size * .13));
  ctx.fillRect(x + size * .43, y - size * .4, Math.max(2, size * .11), Math.max(2, size * .13));
}

function detail(ctx, index) {
  const random = seedRandom(0x7a61 + index * 33);
  ctx.save();
  ctx.scale(.5, .5);
  // The clear reach, misty narrows and copper-lit storm each have their own sky wash.
  const atmosphere = ctx.createLinearGradient(0, 0, 0, 230);
  atmosphere.addColorStop(0, ['#9ab9a016', '#afbdda2c', '#e4a9892c'][index]);
  atmosphere.addColorStop(1, '#ffffff00');
  ctx.fillStyle = atmosphere;
  ctx.fillRect(0, 0, 1000, 230);
  if (index === 2) {
    ctx.strokeStyle = '#d7c6b52a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = random() * 1000;
      const y = 90 + random() * 470;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 7 - random() * 9, y + 11 + random() * 10);
      ctx.stroke();
    }
  }
  // Irregular contour cuts and dispersed moonlit ripples, rather than a grid.
  for (let i = 0; i < 430; i++) {
    const x = random() * 1000;
    const y = random() * 580 + 10;
    const coast = shoreline(x / 2, index) * 2;
    const land = y < coast;
    if (land && y < coast - 38) continue;
    const length = (land ? 8 : 12) + random() * (land ? 24 : 32);
    ctx.strokeStyle = land ? '#d8d4ac40' : '#b1dace35';
    ctx.lineWidth = land ? 1 : (random() > .8 ? 2 : 1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + length * .45, y - 2 - random() * 5, x + length, y - random() * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 55; i++) {
    const x = 145 + random() * 830;
    const base = shoreline(x / 2, index) * 2 - 20 - random() * 22;
    tree(ctx, x, base, 13 + random() * 17, i % 3 ? '#274c46' : '#385e51');
  }
  for (const [x, y, size, v] of [[175, 80, 26, 0], [203, 74, 23, 1], [232, 84, 22, 0],
    [733, 79, 25, 1], [761, 83, 19, 0], [790, 74, 23, 1], [817, 83, 20, 0]]) {
    house(ctx, x, y, size, v);
  }
  // Steps cut into the cliff descend to a timber landing beside the actual harbor.
  ctx.strokeStyle = '#d5c8a2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(102, 105);
  ctx.lineTo(75, 135);
  ctx.lineTo(99, 160);
  ctx.lineTo(61, 195);
  ctx.lineTo(73, 225);
  ctx.lineTo(39, 267);
  ctx.stroke();
  for (let i = 0; i < 20; i++) {
    const y = 120 + i * 7;
    const x = y < 160 ? 80 + (y - 120) * .3 : y < 205 ? 95 - (y - 160) * .75 : 64 - (y - 205) * .3;
    ctx.strokeStyle = i % 2 ? '#dfd0aa' : '#56726b';
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x + 7, y + 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#402f33';
  ctx.fillRect(5, 302, 66, 78);
  ctx.fillStyle = '#8d6852';
  ctx.fillRect(5, 298, 62, 70);
  for (let y = 303; y < 368; y += 6) {
    ctx.strokeStyle = y % 12 ? '#e4ba843f' : '#352e30a0';
    ctx.beginPath();
    ctx.moveTo(6, y);
    ctx.lineTo(66, y + 1);
    ctx.stroke();
  }
  for (const [x, y] of [[12, 306], [61, 306], [12, 360], [61, 360]]) {
    ctx.fillStyle = '#342c31';
    ctx.fillRect(x - 3, y - 8, 7, 17);
    ctx.fillStyle = '#e8c896';
    ctx.fillRect(x - 2, y - 9, 5, 3);
  }
  house(ctx, 11, 303, 27, 0);
  // Reflections are broken and irregular, located inside the harbor's actual ring.
  const [hx, hy] = passages[index].harbor;
  for (let i = 0; i < 34; i++) {
    const x = hx - 40 + random() * 80;
    const y = hy - 20 + random() * 78;
    ctx.strokeStyle = i % 3 ? '#f6d69855' : '#fff0b599';
    ctx.lineWidth = 1 + random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3 + random() * 13, y + random() * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function landscape(index) {
  if (cache.has(index)) return cache.get(index);
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  paintPixels(ctx, index);
  detail(ctx, index);
  cache.set(index, canvas);
  return canvas;
}
