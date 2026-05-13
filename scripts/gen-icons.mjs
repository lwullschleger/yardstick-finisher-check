// Generates simple placeholder PNG icons using only Node built-ins.
// Dark navy background, emerald triangle "sail" centered. Saved into public/icons/.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'icons');

function crc32() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
}
const crc = crc32();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, drawPixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type: RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const rowSize = size * 3;
  const raw = Buffer.alloc((rowSize + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (rowSize + 1)] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = drawPixel(x, y);
      const off = y * (rowSize + 1) + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const idat = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const NAVY = [15, 23, 42];        // #0f172a
const EMERALD = [16, 185, 129];   // #10b981
const WHITE = [241, 245, 249];    // #f1f5f9

function drawIcon(size, mode) {
  // Per maskable: contenuto al 60% centrale, sfondo pieno fino ai bordi.
  // Per normale: contenuto a 75% centrale, sfondo arrotondato.
  const safe = mode === 'maskable' ? 0.6 : 0.78;
  const radius = mode === 'maskable' ? 0 : size * 0.18;
  const inset = (size - size * safe) / 2;
  const apexX = size / 2;
  const apexY = inset;
  const baseY = size - inset;
  const halfBase = (size * safe) / 2;
  const baseLeftX = apexX - halfBase * 0.85;
  const baseRightX = apexX + halfBase * 0.85;

  return (x, y) => {
    if (radius > 0) {
      // Rounded square mask: outside radius corners → background of page (just use navy still)
      // We just leave the bg as-is to avoid alpha (RGB only). It looks like a navy rounded square against any host bg.
      const inCorner =
        (x < radius && y < radius && Math.hypot(radius - x, radius - y) > radius) ||
        (x > size - radius && y < radius && Math.hypot(x - (size - radius), radius - y) > radius) ||
        (x < radius &&
          y > size - radius &&
          Math.hypot(radius - x, y - (size - radius)) > radius) ||
        (x > size - radius &&
          y > size - radius &&
          Math.hypot(x - (size - radius), y - (size - radius)) > radius);
      if (inCorner) return WHITE;
    }

    // Triangle (sail) test using barycentric sign
    const sign = (ax, ay, bx, by, cx, cy) =>
      (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    const d1 = sign(x, y, apexX, apexY, baseLeftX, baseY);
    const d2 = sign(x, y, baseLeftX, baseY, baseRightX, baseY);
    const d3 = sign(x, y, baseRightX, baseY, apexX, apexY);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    const inTri = !(hasNeg && hasPos);
    if (inTri) return EMERALD;

    return NAVY;
  };
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [size, name, mode] of [
  [192, 'icon-192.png', 'rounded'],
  [512, 'icon-512.png', 'rounded'],
  [512, 'icon-maskable-512.png', 'maskable'],
]) {
  const png = makePng(size, drawIcon(size, mode));
  const out = resolve(OUT_DIR, name);
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}
