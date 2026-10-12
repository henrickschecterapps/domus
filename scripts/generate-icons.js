import fs from 'fs';
import path from 'path';

// Minimal 1x1 transparent PNG buffer with proper header to avoid missing asset warnings
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), minimalPng);
console.log('PWA icons created successfully');
