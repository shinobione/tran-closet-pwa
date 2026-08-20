const CACHE_PREFIX='tran-closet-';
const SOURCE_VERSION='v0.5.17';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./VERSION','./css/app.css','./css/branding.css?v=0.5.17','./css/outfits.css?v=0.5.17','./css/outfit-picker.css?v=0.5.17','./css/outfit-presentation.css?v=0.5.17','./css/item-ai-assistant.css?v=0.5.17','./css/duplicate-guard.css?v=0.5.17','./css/daily-assistant.css?v=0.5.17','./css/i18n.css?v=0.5.17','./css/assistant-select-hotfix.css?v=0.5.17','./css/v059-ux.css?v=0.5.17','./css/v0510-ux.css?v=0.5.17','./js/bootstrap.js?v=0.5.17','./js/airtable-bridge.js','./js/airtable-snapshot.js','./js/airtable-outfit-bridge.js','./js/airtable-outfit-snapshot.js','./js/live-airtable-sync.js?v=0.5.17','./js/live-outfit-sync-core.mjs?v=0.5.17','./js/live-airtable-outfit-sync.js?v=0.5.17','./js/live-wear-sync-core.mjs?v=0.5.17','./js/live-airtable-wear-sync.js?v=0.5.17','./js/app.js?v=0.5.17','./js/app-refresh.js?v=0.5.17','./js/i18n-keyed.mjs?v=0.5.17','./js/closet-search-core.mjs?v=0.5.17','./js/closet-search.js?v=0.5.17','./js/photo-picker.js?v=0.5.17','./js/outfit-picker.js?v=0.5.17','./js/outfit-sync-client.js?v=0.5.17','./js/wear-sync-client.js?v=0.5.17','./js/manual-sync.js?v=0.5.17','./js/outfit-presentation.js?v=0.5.17','./js/outfit-integrity.mjs?v=0.5.17','./js/outfit-integrity-ui.js?v=0.5.17','./js/wear-history-core.mjs?v=0.5.17','./js/wear-history-i18n.mjs?v=0.5.17','./js/wear-history.js?v=0.5.17','./js/item-ai-assistant.js?v=0.5.17','./js/duplicate-core.mjs?v=0.5.17','./js/duplicate-guard.js?v=0.5.17','./js/daily-assistant-core.mjs?v=0.5.17','./js/daily-assistant.js?v=0.5.17','./js/i18n.js?v=0.5.17','./js/build-version.js?v=0.5.17','./js/db.js','./js/data.js','./js/taxonomy.generated.mjs?v=0.5.17','./js/sync-client.js?v=0.5.17','./js/delete-reconciliation.mjs?v=0.5.17','./js/sync-diagnostics.js?v=0.5.17','./favicon.ico?v=0.5.17','./icons/favicon-16.png?v=0.5.17','./icons/favicon-32.png?v=0.5.17','./icons/favicon-48.png?v=0.5.17','./icons/icon-192.png?v=0.5.17','./icons/icon-512.png?v=0.5.17','./icons/maskable-512.png?v=0.5.17','./icons/apple-touch-icon.png?v=0.5.17','./branding/header-lockup-v057.png','./branding/logo-mark-v057.png','./branding/splash-1242x2688.png'];

let cacheNamePromise=null;
function validVersion(value){return /^v\d+\.\d+\.\d+$/.test(String(value||'').trim());}
function validShortSha(value){return /^[0-9a-f]{7}$/i.test(String(value||'').trim());}
async function existingReleaseCache(){
  const keys=await caches.keys();
  return keys.find(key=>key.startsWith(CACHE_PREFIX))||null;
}
async function resolveCacheName(){
  try{
    const response=await fetch('./build-info.json',{cache:'no-store'});
    if(response.ok){
      const info=await response.json();
      const version=String(info?.version||'').trim();
      const shortSha=String(info?.shortSha||info?.sha||'').trim().slice(0,7);
      if(validVersion(version)&&validShortSha(shortSha))return `${CACHE_PREFIX}${version}-${shortSha}`;
    }
  }catch{}
  try{
    const response=await fetch('./VERSION',{cache:'no-store'});
    const version=response.ok?String(await response.text()).trim():'';
    if(validVersion(version))return `${CACHE_PREFIX}${version}-source`;
  }catch{}
  return await existingReleaseCache()||`${CACHE_PREFIX}${SOURCE_VERSION}-source`;
}
function currentCacheName(){
  if(!cacheNamePromise)cacheNamePromise=resolveCacheName();
  return cacheNamePromise;
}
async function currentCache(){return caches.open(await currentCacheName());}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await currentCache();
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const current=await currentCacheName();
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==current).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await currentCache();
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    const cached=await cache.match(request);
    if(cached)return cached;
    if(request.mode==='navigate')return await cache.match('./index.html')||Response.error();
    return Response.error();
  }
}

async function cacheFirst(request){
  const cache=await currentCache();
  const cached=await cache.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    if(request.mode==='navigate')return await cache.match('./index.html')||Response.error();
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const appCode=event.request.mode==='navigate'||['script','style'].includes(event.request.destination)||url.pathname.endsWith('/manifest.webmanifest')||url.pathname.endsWith('/build-info.json')||url.pathname.endsWith('/VERSION')||url.pathname.endsWith('/js/airtable-snapshot.js')||url.pathname.endsWith('/js/airtable-outfit-snapshot.js')||url.pathname.includes('/assets/items/');
  event.respondWith(appCode?networkFirst(event.request):cacheFirst(event.request));
});
