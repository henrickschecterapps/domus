import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(size) {
  // Color palette:
  // BG: #0F172A (15, 23, 42)
  // Circle BG: #1E293B (30, 41, 59)
  // House / Roof: #38BDF8 (56, 189, 248)
  // Badge: #10B981 (16, 185, 129)
  // White: #FFFFFF (255, 255, 255)

  const rawBytes = Buffer.alloc(size * (1 + size * 4));
  let offset = 0;

  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    rawBytes[offset++] = 0; // Filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: dark rounded container
      let r = 15, g = 23, b = 42, a = 255;

      // Circle
      if (dist <= radius) {
        r = 30; g = 41; b = 59;
      }

      // Border circle
      if (Math.abs(dist - radius) <= size * 0.015) {
        r = 56; g = 189; b = 248;
      }

      // House shape normalized coordinates (-1 to 1)
      const nx = (x - center) / (size * 0.5);
      const ny = (y - center) / (size * 0.5);

      // Roof triangle: from top (0, -0.55) to (-0.5, -0.05) and (0.5, -0.05)
      const inRoof = ny >= -0.55 && ny <= -0.05 && Math.abs(nx) <= (ny + 0.55);

      // House body: from (-0.35, -0.05) to (0.35, 0.45)
      const inBody = Math.abs(nx) <= 0.35 && ny >= -0.05 && ny <= 0.45;

      // Door cutout: from (-0.12, 0.15) to (0.12, 0.45)
      const inDoor = Math.abs(nx) <= 0.12 && ny >= 0.15 && ny <= 0.45;

      if ((inRoof || inBody) && !inDoor) {
        r = 56; g = 189; b = 248;
      }

      // Small Badge at top right of house: (0.32, -0.28)
      const bdx = nx - 0.32;
      const bdy = ny - (-0.28);
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bdist <= 0.14) {
        r = 16; g = 185; b = 129;
      }

      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawBytes, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve('c:/Users/henri/Downloads/Gerencia Casa/public');

const p192 = generatePng(192);
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), p192);
console.log('Generated pwa-192x192.png, size:', p192.length, 'bytes');

const p512 = generatePng(512);
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), p512);
console.log('Generated pwa-512x512.png, size:', p512.length, 'bytes');

const appleTouch = generatePng(180);
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), appleTouch);
console.log('Generated apple-touch-icon.png, size:', appleTouch.length, 'bytes');

console.log('PWA icons successfully created!');
