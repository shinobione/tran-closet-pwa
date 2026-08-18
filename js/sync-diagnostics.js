import {getSyncConfig,testSyncConnection,flushMutationQueue,pendingMutationCount} from './sync-client.js?v=0.5.16';
import {flushOutfitQueue,pendingOutfitMutationCount} from './outfit-sync-client.js?v=0.5.1';
import {syncLiveCanonicalOutfits} from './live-airtable-outfit-sync.js?v=0.5.16';
import {getAllItems,getAllMutations,getAllOutfits,getAllOutfitMutations,getMeta} from './db.js';

// Legacy CI marker only: const VERSION='v0.5.1'
const FALLBACK_VERSION='v0.5.16';
let running=false;

function fr(){return document.documentElement.lang==='fr';}
function buildInfo(){
  const info=window.TranClosetBuildInfo;
  return info&&info.version?info:{version:FALLBACK_VERSION,sha:null,shortSha:'local',builtAt:null,source:'fallback'};
}

function versionLabel(){
  const info=buildInfo();
  return info.shortSha&&info.shortSha!=='local'?`${info.version} · ${info.shortSha}`:info.version;
}

function summaryLabel(){return `${fr()?'Diagnostic de synchronisation':'Chẩn đoán đồng bộ'} · ${versionLabel()}`;}
function copy(key){
  const text={
    intro:fr()?'Aucune clé secrète n’est affichée. Le bouton lance la synchronisation des vêtements et des tenues puis affiche les erreurs réelles.':'Không hiển thị khóa bí mật. Nút bên dưới chạy cả đồng bộ quần áo và outfit, rồi hiển thị lỗi thật.',
    run:fr()?'Lancer diagnostic + synchronisation':'Chạy chẩn đoán + đồng bộ',
    running:fr()?'Diagnostic en cours…':'Đang chẩn đoán…',
    ready:fr()?'Prêt.':'Sẵn sàng.'
  };
  return text[key];
}

function orphanCount(items,mutations,idKey='localItemId'){
  const queued=new Set(mutations.map(m=>m[idKey]));
  return items.filter(i=>!i.airtableRecordId&&!queued.has(i.id)).length;
}

function safeResult(value){
  if(value instanceof Error)return value.message;
  if(Array.isArray(value))return value.map(safeResult);
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(/token|authorization|key/i.test(k))continue;
      out[k]=safeResult(v);
    }
    return out;
  }
  return value;
}

async function snapshot(){
  const [
    cfg,items,mutations,outfits,outfitMutations,health,
    outfitLiveLastSync,outfitLiveRecordCount,outfitLiveLastError
  ]=await Promise.all([
    getSyncConfig(),getAllItems(),getAllMutations(),getAllOutfits(),getAllOutfitMutations(),testSyncConnection(),
    getMeta('airtable-outfit-live-last-sync'),getMeta('airtable-outfit-live-record-count'),getMeta('airtable-outfit-live-last-error')
  ]);
  const build=buildInfo();
  return {
    version:build.version,
    build:{sha:build.sha||null,shortSha:build.shortSha||null,builtAt:build.builtAt||null,source:build.source||null},
    online:navigator.onLine,
    endpoint:cfg.endpoint,
    syncKeyPresent:Boolean(cfg.token),
    health:safeResult(health),
    itemCount:items.length,
    outfitCount:outfits.length,
    liveOutfits:{
      lastSync:outfitLiveLastSync||null,
      recordCount:Number.isFinite(Number(outfitLiveRecordCount))?Number(outfitLiveRecordCount):null,
      lastError:safeResult(outfitLiveLastError)
    },
    taggedItemCount:items.filter(item=>Array.isArray(item.tags)&&item.tags.length).length,
    pendingMutations:mutations.length,
    pendingOutfitMutations:outfitMutations.length,
    orphanedLocalCreates:orphanCount(items,mutations),
    orphanedLocalOutfits:orphanCount(outfits,outfitMutations,'localOutfitId'),
    mutationOps:mutations.map(m=>m.operation),
    outfitMutationOps:outfitMutations.map(m=>m.operation),
    mutationStates:mutations.map(m=>({
      id:m.id,
      operation:m.operation,
      localItemId:m.localItemId||null,
      airtableRecordId:m.airtableRecordId||null,
      createdAt:m.createdAt||null
    })),
    outfitMutationStates:outfitMutations.map(m=>({
      id:m.id,
      operation:m.operation,
      localOutfitId:m.localOutfitId||null,
      airtableRecordId:m.airtableRecordId||null,
      createdAt:m.createdAt||null
    })),
    itemStates:items.map(i=>({
      name:i.name,
      airtableRecordId:i.airtableRecordId||null,
      tagCount:Array.isArray(i.tags)?i.tags.length:0,
      source:i.source||null,
      syncState:i.syncState||null,
      cloudWriteAt:i.cloudWriteAt||null
    })),
    outfitStates:outfits.map(o=>({
      name:o.name,
      id:o.id,
      airtableRecordId:o.airtableRecordId||null,
      itemCount:Array.isArray(o.itemIds)?o.itemIds.length:0,
      source:o.source||null,
      syncState:o.syncState||null,
      cloudWriteAt:o.cloudWriteAt||null
    }))
  };
}

function refreshSummary(){
  const summary=document.querySelector('#syncDiagnostics summary');
  if(!summary)return;
  const next=summaryLabel();
  if(summary.textContent!==next)summary.textContent=next;
}

function mount(){
  const card=document.querySelector('.sync-card');
  if(!card)return;
  const existing=card.querySelector('#syncDiagnostics');
  if(existing){refreshSummary();return;}

  const box=document.createElement('details');
  box.id='syncDiagnostics';
  box.style.marginTop='14px';
  box.style.padding='12px';
  box.style.border='1px solid rgba(255,255,255,.12)';
  box.style.borderRadius='14px';
  box.innerHTML=`<summary style="cursor:pointer;font-weight:700">${summaryLabel()}</summary>
    <p style="opacity:.72;font-size:.84rem;margin:10px 0">${copy('intro')}</p>
    <button type="button" id="runSyncDiagnostics" class="secondary-button">${copy('run')}</button>
    <pre id="syncDiagnosticsOutput" style="white-space:pre-wrap;word-break:break-word;font-size:.72rem;line-height:1.45;max-height:420px;overflow:auto;margin-top:10px;padding:10px;border-radius:10px;background:rgba(0,0,0,.24)">${copy('ready')}</pre>`;
  card.appendChild(box);
  box.querySelector('#runSyncDiagnostics').onclick=async()=>{
    if(running)return;
    running=true;
    const btn=box.querySelector('#runSyncDiagnostics');
    const out=box.querySelector('#syncDiagnosticsOutput');
    btn.disabled=true;btn.textContent=copy('running');
    try{
      const before=await snapshot();
      const clothingFlush=await flushMutationQueue();
      const outfitFlush=await flushOutfitQueue();
      const outfitLive=await syncLiveCanonicalOutfits();
      const after=await snapshot();
      const pending={clothing:await pendingMutationCount(),outfits:await pendingOutfitMutationCount()};
      out.textContent=JSON.stringify({before,flush:{clothing:safeResult(clothingFlush),outfits:safeResult(outfitFlush)},live:{outfits:safeResult(outfitLive)},after,pending},null,2);
    }catch(error){
      out.textContent=JSON.stringify({version:buildInfo().version,build:buildInfo(),error:String(error?.message||error)},null,2);
    }finally{
      running=false;btn.disabled=false;btn.textContent=copy('run');
    }
  };
}

window.addEventListener('tran:build-info',refreshSummary);
const main=document.querySelector('#mainContent');
// Only direct route renders are observed. Internal Profile DOM changes must never
// recursively remount diagnostics.
if(main)new MutationObserver(mount).observe(main,{childList:true});
mount();
