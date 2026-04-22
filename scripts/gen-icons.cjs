// Generiert einfache Platzhalter-PNGs für das PWA-Manifest.
// Dunkler Hintergrund + helles "GD" Rechteck in der Mitte. Einmalig laufen lassen:
//   node scripts/gen-icons.cjs
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(filePath, width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      const px = rowOffset + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
  console.log(`wrote ${filePath} (${png.length} bytes)`);
}

// Zeichne einen dunklen Hintergrund mit einem hell-orangefarbenen abgerundeten Block in der Mitte
// plus zwei helle "Hantel-Scheiben" links/rechts. Rein dekorativer Platzhalter.
function makePixelFn(size, safeFactor = 1) {
  const bg = [17, 20, 24];
  const fg = [244, 162, 97]; // warm-orange, gut sichtbar
  const cx = size / 2;
  const cy = size / 2;
  const innerR = (size * 0.32) * safeFactor;
  const barW = size * 0.54 * safeFactor;
  const barH = size * 0.14 * safeFactor;
  const discR = size * 0.18 * safeFactor;
  const leftCX = cx - barW / 2;
  const rightCX = cx + barW / 2;

  return (x, y) => {
    // Bar (Rechteck) in der Mitte
    if (Math.abs(x - cx) < barW / 2 && Math.abs(y - cy) < barH / 2) return fg;
    // Linke Scheibe
    const dl = Math.hypot(x - leftCX, y - cy);
    if (dl < discR) return fg;
    // Rechte Scheibe
    const dr = Math.hypot(x - rightCX, y - cy);
    if (dr < discR) return fg;
    // Dezentraler Ring (macht es zum PWA-Icon)
    const dc = Math.hypot(x - cx, y - cy);
    if (dc < innerR && dc > innerR - 2) return fg;
    return bg;
  };
}

const outDir = path.join(__dirname, '..', 'public', 'icons');

writePng(path.join(outDir, 'icon-192.png'), 192, 192, makePixelFn(192));
writePng(path.join(outDir, 'icon-512.png'), 512, 512, makePixelFn(512));
// Maskable: mehr Safe-Area (Inhalt kleiner, damit Android-Rundmasken nichts abschneiden)
writePng(path.join(outDir, 'icon-maskable.png'), 512, 512, makePixelFn(512, 0.7));

console.log('Icons erzeugt.');
