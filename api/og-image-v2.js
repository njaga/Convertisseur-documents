import { deflateSync } from 'node:zlib';

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  white: [255, 255, 255, 255],
  paper: [247, 248, 251, 255],
  blue: [36, 87, 230, 255],
  dark: [15, 23, 42, 255],
  muted: [71, 85, 105, 255],
  orange: [242, 107, 74, 255],
  line: [226, 232, 240, 255],
};

const FONT = {
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','11011','10001'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '.':['00000','00000','00000','00000','00000','00110','00110'],
  ' ':['00000','00000','00000','00000','00000','00000','00000'],
};

function makeImage() {
  return Buffer.alloc(WIDTH * HEIGHT * 4, 255);
}

function setPixel(buf, x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const index = (y * WIDTH + x) * 4;
  buf[index] = color[0];
  buf[index + 1] = color[1];
  buf[index + 2] = color[2];
  buf[index + 3] = color[3];
}

function fillRect(buf, x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy++) {
    for (let xx = x; xx < x + width; xx++) setPixel(buf, xx, yy, color);
  }
}

function strokeRect(buf, x, y, width, height, thickness, color) {
  fillRect(buf, x, y, width, thickness, color);
  fillRect(buf, x, y + height - thickness, width, thickness, color);
  fillRect(buf, x, y, thickness, height, color);
  fillRect(buf, x + width - thickness, y, thickness, height, color);
}

function drawText(buf, text, x, y, scale, color, spacing = 1) {
  let cursor = x;
  for (const rawChar of text.toUpperCase()) {
    const glyph = FONT[rawChar] ?? FONT[' '];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === '1') fillRect(buf, cursor + col * scale, y + row * scale, scale, scale, color);
      }
    }
    cursor += (5 + spacing) * scale;
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(rgba) {
  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    const target = y * (WIDTH * 4 + 1);
    raw[target] = 0;
    rgba.copy(raw, target + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
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
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderOgImage() {
  const buf = makeImage();
  fillRect(buf, 0, 0, WIDTH, HEIGHT, COLORS.white);
  fillRect(buf, 0, 0, 28, HEIGHT, COLORS.blue);

  fillRect(buf, 78, 68, 82, 82, COLORS.blue);
  fillRect(buf, 101, 91, 36, 42, COLORS.white);
  fillRect(buf, 110, 109, 23, 8, COLORS.orange);
  fillRect(buf, 128, 104, 7, 18, COLORS.orange);

  drawText(buf, 'DOXALI', 184, 88, 6, COLORS.dark);
  fillRect(buf, 369, 105, 12, 12, COLORS.orange);

  drawText(buf, 'VOS DOCUMENTS', 78, 220, 8, COLORS.dark);
  drawText(buf, 'ENFIN SIMPLES', 78, 302, 8, COLORS.blue);
  drawText(buf, 'SANS COMPTE', 82, 418, 4, COLORS.muted);
  drawText(buf, 'OPEN SOURCE  APACHE-2.0', 82, 465, 3, COLORS.dark);

  fillRect(buf, 760, 70, 370, 490, COLORS.paper);
  strokeRect(buf, 760, 70, 370, 490, 2, COLORS.line);

  const items = [
    ['PDF', 'FUSIONNER  MODIFIER'],
    ['OCR', 'TEXTE DES SCANS'],
    ['CONVERTIR', 'IMAGES  AUDIO  VIDEO'],
    ['LOCAL', 'CONFIDENTIALITE'],
  ];
  let y = 110;
  for (const [title, subtitle] of items) {
    fillRect(buf, 802, y, 286, 88, COLORS.white);
    strokeRect(buf, 802, y, 286, 88, 2, COLORS.line);
    drawText(buf, title, 826, y + 16, 3, COLORS.blue);
    drawText(buf, subtitle, 826, y + 52, 2, COLORS.muted);
    y += 105;
  }
  fillRect(buf, 1058, 520, 32, 32, COLORS.orange);

  return encodePng(buf);
}

export default function handler(req, res) {
  const image = renderOgImage();
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', String(image.length));
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'HEAD') return res.status(200).end();
  return res.status(200).send(image);
}

export { renderOgImage };
