import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const relativeOutput = relative(root, output);
const relativeRoot = relative(output, root);
if (output === root || (!relativeOutput.startsWith('..') && !isAbsolute(relativeOutput)) ||
    (!relativeRoot.startsWith('..') && !isAbsolute(relativeRoot))) {
  throw new Error('MAKEFUN_OUTPUT_DIR must be outside the source checkout.');
}
// A failed validation must not leave an old dossier looking like a fresh build.
mkdirSync(output, { recursive: true });
rmSync(join(output, 'dossier.json'), { force: true });

const required = [
  'index.html', 'style.css', 'charts.js', 'rules.js', 'render.js', 'game.js',
  'dispatch-rules.js', 'dispatch-render.js',
];
for (const name of required) {
  if (!existsSync(join(root, 'game', name))) throw new Error(`Missing game/${name}`);
}

// Read image headers directly; packaging does not depend on a graphics utility.
function dimensions(data: Buffer): [number, number] {
  if (data.length >= 24 && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    if (data.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Invalid PNG header');
    return [data.readUInt32BE(16), data.readUInt32BE(20)];
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= data.length) {
      if (data[offset++] !== 0xff) throw new Error('Invalid JPEG marker');
      let marker = data[offset++];
      while (marker === 0xff && offset < data.length) marker = data[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = data.readUInt16BE(offset);
      if (length < 2 || offset + length > data.length) throw new Error('Invalid JPEG segment');
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 7) throw new Error('Invalid JPEG dimensions');
        return [data.readUInt16BE(offset + 5), data.readUInt16BE(offset + 3)];
      }
      offset += length;
    }
  }
  throw new Error('Screenshot must be a valid PNG or JPEG with dimensions');
}

const screenshotDir = join(root, 'screenshots');
const shots = existsSync(screenshotDir) ? readdirSync(screenshotDir).sort() : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error('Provide three or four screenshots; the first by name is the cover.');
}
for (const name of shots) {
  const path = join(screenshotDir, name);
  if (!statSync(path).isFile() || !['.png', '.jpg', '.jpeg'].includes(extname(name).toLowerCase())) {
    throw new Error(`Unexpected screenshot asset: ${name}`);
  }
  const data = readFileSync(path);
  if (data.length > 262144) throw new Error(`${name} exceeds 256 KiB`);
  const [width, height] = dimensions(data);
  if (Math.max(width, height) > 1280 || Math.min(width, height) < 480) {
    throw new Error(`${name} dimensions ${width}×${height} are outside the intake limits`);
  }
}

// Remove only generated assets, never the entire user-specified output directory.
for (const name of ['game', 'screenshots', 'dossier.json']) {
  rmSync(join(output, name), { recursive: true, force: true });
}
cpSync(join(root, 'game'), join(output, 'game'), { recursive: true });
cpSync(screenshotDir, join(output, 'screenshots'), { recursive: true });
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
