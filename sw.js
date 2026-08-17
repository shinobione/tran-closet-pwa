const CACHE = 'tran-closet-v0.5.0';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./css/app.css','./css/outfits.css?v=0.5.0','./css/outfit-picker.css?v=0.5.0','./css/outfit-presentation.css?v=0.5.0','./css/item-ai-assistant.css?v=0.5.0','./css/duplicate-guard.css?v=0.5.0','./css/daily-assistant.css?v=0.5.0','./js/bootstrap.js?v=0.5.0','./js/airtable-bridge.js','./js/airtable-snapshot.js','./js/airtable-outfit-bridge.js','./js/airtable-outfit-snapshot.js','./js/app.js?v=0.5.0','./js/outfit-picker.js?v=0.5.0','./js/outfit-sync-client.js?v=0.5.0','./js/outfit-presentation.js?v=0.5.0','./js/item-ai-assistant.js?v=0.5.0','./js/duplicate-core.mjs?v=0.5.0','./js/duplicate-guard.js?v=0.5.0','./js/daily-assistant-core.mjs?v=0.5.0','./js/daily-assistant.js?v=0.5.0','./js/db.js','./js/data.js','./js/sync-client.js?v=0.5.0','./js/sync-diagnostics.js?v=0.5.0','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tran-closet-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

async function networkFirst(request) {
  try {
    const response = await fetch(request,{cache:'no-store'});
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  } catch {
    return request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  const appCode = e.request.mode === 'navigate' ||
    ['script','style'].includes(e.request.destination) ||
    url.pathname.endsWith('/manifest.webmanifest') ||
    url.pathname.endsWith('/js/airtable-snapshot.js') ||
    url.pathname.endsWith('/js/airtable-outfit-snapshot.js') ||
    url.pathname.includes('/assets/items/');

  e.respondWith(appCode ? networkFirst(e.request) : cacheFirst(e.request));
});
