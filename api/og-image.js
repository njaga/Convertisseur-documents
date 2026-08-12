import { deflateSync } from 'node:zlib';

const WIDTH = 1200;
const HEIGHT = 630;

const rgba = (hex) => {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    255,
  ];
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xFFFFFFFF;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const chunk = (type, data = Buffer.alloc(0)) => {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
};

const font = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
};

const buildPng = () => {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

  const fill = (color) => {
    const [r, g, b, a] = rgba(color);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = a;
    }
  };

  const rect = (x, y, width, height, color) => {
    const [r, g, b, a] = rgba(color);
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(WIDTH, Math.ceil(x + width));
    const endY = Math.min(HEIGHT, Math.ceil(y + height));
    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) {
        const offset = (py * WIDTH + px) * 4;
        pixels[offset] = r;
        pixels[offset + 1] = g;
        pixels[offset + 2] = b;
        pixels[offset + 3] = a;
      }
    }
  };

  const text = (value, x, y, scale, color) => {
    let cursor = x;
    for (const letter of value) {
      const glyph = font[letter];
      if (!glyph) {
        cursor += scale * 3;
        continue;
      }
      glyph.forEach((row, rowIndex) => {
        [...row].forEach((pixel, columnIndex) => {
          if (pixel === '1') rect(cursor + columnIndex * scale, y + rowIndex * scale, scale, scale, color);
        });
      });
      cursor += scale * 6;
    }
  };

  fill('#F7F8FA');
  rect(0, 0, 18, HEIGHT, '#2457E6');
  rect(72, 70, 88, 88, '#2457E6');
  rect(145, 58, 24, 24, '#F26B4A');

  // Pictogramme document dans le bloc de marque.
  rect(96, 92, 38, 46, '#FFFFFF');
  rect(124, 92, 10, 10, '#BDD0FF');
  rect(106, 118, 19, 4, '#2457E6');
  rect(106, 128, 14, 4, '#2457E6');

  text('DOXALI', 205, 88, 10, '#111827');

  // Composition graphique sobre, cohérente avec la page d’accueil.
  rect(72, 238, 720, 8, '#111827');
  rect(72, 278, 610, 32, '#2457E6');
  rect(72, 330, 810, 32, '#D9E3FF');
  rect(72, 382, 525, 32, '#E5E7EB');
  rect(72, 500, 238, 54, '#EAF0FF');
  rect(326, 500, 218, 54, '#FFF0EB');

  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const target = y * (WIDTH * 4 + 1);
    raw[target] = 0;
    pixels.copy(raw, target + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND'),
  ]);
};

export default function handler(_request, response) {
  const image = buildPng();
  response.setHeader('Content-Type', 'image/png');
  response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  response.status(200).send(image);
}
