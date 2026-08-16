const CACHE = 'tran-closet-v0.1.0';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./css/app.css','./js/app.js','./js/db.js','./js/data.js','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(e.request, copy)); return response;
  }).catch(() => caches.match('./index.html'))));
});
