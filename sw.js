const CACHE = 'tran-closet-v0.5.1';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./css/app.css','./css/branding.css?v=0.5.7','./css/outfits.css?v=0.5.1','./css/outfit-picker.css?v=0.5.1','./css/outfit-presentation.css?v=0.5.1','./css/item-ai-assistant.css?v=0.5.1','./css/duplicate-guard.css?v=0.5.1','./css/daily-assistant.css?v=0.5.1','./css/i18n.css?v=0.5.1','./css/v059-ux.css?v=0.5.9','./css/v0510-ux.css?v=0.5.10','./js/bootstrap.js?v=0.5.1','./js/airtable-bridge.js','./js/airtable-snapshot.js','./js/airtable-outfit-bridge.js','./js/airtable-outfit-snapshot.js','./js/live-airtable-sync.js?v=0.5.8','./js/live-outfit-sync-core.mjs?v=0.5.16','./js/live-airtable-outfit-sync.js?v=0.5.16','./js/live-outfit-ui-bridge.js?v=0.5.16','./js/outfit-integrity.mjs?v=0.5.16','./js/outfit-integrity-ui.js?v=0.5.16','./js/photo-picker-mobile.js?v=0.5.10','./js/app.js?v=0.5.1','./js/v0512-sync-hotfix.js?v=0.5.12','./js/v059-ux-fixes.js?v=0.5.9','./js/v0510-search.js?v=0.5.10','./js/outfit-picker.js?v=0.5.1','./js/outfit-sync-client.js?v=0.5.1','./js/outfit-presentation.js?v=0.5.1','./js/item-ai-assistant.js?v=0.5.1','./js/duplicate-core.mjs?v=0.5.1','./js/duplicate-guard.js?v=0.5.1','./js/daily-assistant-core.mjs?v=0.5.1','./js/daily-assistant.js?v=0.5.1','./js/i18n.js?v=0.5.1','./js/i18n-v059-hotfix.js?v=0.5.9','./js/i18n-v0510-profile.js?v=0.5.16','./js/i18n-v0513-ai.js?v=0.5.16','./js/build-version.js?v=0.5.16','./js/db.js','./js/data.js','./js/sync-client.js?v=0.5.16','./js/delete-reconciliation.mjs?v=0.5.16','./js/sync-diagnostics.js?v=0.5.16','./favicon.ico?v=0.5.8','./icons/favicon-16.png?v=0.5.8','./icons/favicon-32.png?v=0.5.8','./icons/favicon-48.png?v=0.5.8','./icons/icon-192.png?v=0.5.8','./icons/icon-512.png?v=0.5.8','./icons/maskable-512.png?v=0.5.8','./icons/apple-touch-icon.png?v=0.5.8','./branding/header-lockup-v057.png','./branding/logo-mark-v057.png','./branding/splash-1242x2688.png'];

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
    const response = await fetch(request,{cache:'no-store'});
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
    url.pathname.endsWith('/build-info.json') ||
    url.pathname.endsWith('/js/airtable-snapshot.js') ||
    url.pathname.endsWith('/js/airtable-outfit-snapshot.js') ||
    url.pathname.includes('/assets/items/');

  e.respondWith(appCode ? networkFirst(e.request) : cacheFirst(e.request));
});
