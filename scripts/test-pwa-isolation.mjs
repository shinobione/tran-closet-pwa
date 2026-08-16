import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const sw = fs.readFileSync('sw.js', 'utf8');

const expectedPath = '/tran-closet-pwa/';

for (const field of ['id', 'start_url', 'scope']) {
  if (manifest[field] !== expectedPath) {
    throw new Error(`manifest ${field} must be ${expectedPath}, got ${manifest[field]}`);
  }
}

if (!/const CACHE = ['"]tran-closet-/.test(sw)) {
  throw new Error('service worker cache must stay in the tran-closet-* namespace');
}

if (!sw.includes("k.startsWith('tran-closet-') && k !== CACHE")) {
  throw new Error('service worker activation must delete only obsolete tran-closet-* caches');
}

if (sw.includes('keys.filter(k => k !== CACHE)')) {
  throw new Error('service worker must never delete every foreign cache on the shared origin');
}

console.log('Trân Closet PWA identity/cache isolation PASS');
