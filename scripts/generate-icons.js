// Generates app icons (PNG) with no external dependencies.
// Draws a blue→cyan gradient rounded square with white "flow" waves.
// Run: node scripts/generate-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function lerp(a, b, t) { return a + (b - a) * t; }

function buildIcon(size) {
  const data = Buffer.alloc(size * size * 4); // RGBA

  // Brand gradient (top → bottom): #2563eb → #06b6d4
  const top = [37, 99, 235];
  const bot = [6, 182, 212];

  // Rounded-corner radius (subtle; iOS applies its own mask anyway)
  const radius = size * 0.18;

  function cornerAlpha(x, y) {
    // Distance into the nearest corner for anti-aliased rounding
    const cx = Math.min(x, size - 1 - x);
    const cy = Math.min(y, size - 1 - y);
    if (cx >= radius || cy >= radius) return 1;
    const dx = radius - cx;
    const dy = radius - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, Math.min(1, radius - d + 0.5));
  }

  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const baseR = Math.round(lerp(top[0], bot[0], t));
    const baseG = Math.round(lerp(top[1], bot[1], t));
    const baseB = Math.round(lerp(top[2], bot[2], t));

    for (let x = 0; x < size; x++) {
      let r = baseR, g = baseG, b = baseB;

      // Three flowing white waves (translucent), evoking "HabitFlow"
      const nx = x / size;
      const waves = [
        { cy: 0.46, amp: 0.060, freq: 6.0, thick: 0.020, op: 0.95 },
        { cy: 0.58, amp: 0.075, freq: 5.0, thick: 0.022, op: 0.55 },
        { cy: 0.70, amp: 0.090, freq: 4.2, thick: 0.024, op: 0.30 },
      ];
      for (const w of waves) {
        const wy = w.cy + w.amp * Math.sin(nx * w.freq * Math.PI + w.cy * 10);
        const dist = Math.abs(t - wy);
        if (dist < w.thick) {
          const edge = 1 - dist / w.thick; // soft edge
          const a = w.op * edge;
          r = Math.round(lerp(r, 255, a));
          g = Math.round(lerp(g, 255, a));
          b = Math.round(lerp(b, 255, a));
        }
      }

      const idx = (y * size + x) * 4;
      const alpha = Math.round(255 * cornerAlpha(x, y));
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = alpha;
    }
  }
  return encodePNG(size, size, data);
}

function encodePNG(width, height, rgba) {
  // Build raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.join(__dirname, '..', 'public');
for (const size of [192, 512]) {
  const png = buildIcon(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png (${png.length} bytes)`);
}
// Apple touch icon (180x180 is the iOS standard)
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), buildIcon(180));
console.log('✓ apple-touch-icon.png');
