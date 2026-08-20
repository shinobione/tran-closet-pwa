import {
  getAllItems,
  getAllOutfits,
  getAllOutfitMutations,
  putOutfitCloudState,
  deleteOutfitCloudState,
  getMeta,
  setMeta
} from './db.js';
import {getSyncConfig} from './sync-client.js?v=0.5.18';
import {canonicalOutfitSignature,planCanonicalOutfitReconciliation} from './live-outfit-sync-core.mjs?v=0.5.18';

const TOMBSTONES_KEY='airtable-outfit-delete-tombstones';
let running=false;
let lastWatchAt=0;
let intervalId=null;

function publishLiveChange(detail){
  if(typeof window==='undefined'||typeof CustomEvent==='undefined')return;
  window.dispatchEvent(new CustomEvent('tran:outfits-live-changed',{detail}));
}

export async function syncLiveCanonicalOutfits({refreshUiOnChange=false,reloadOnChange=false}={}){
  if(running)return {ok:false,busy:true};
  const {endpoint,token}=await getSyncConfig();
  if(!endpoint||!token)return {ok:false,configured:false};

  running=true;
  try{
    const response=await fetch(`${endpoint.replace(/\/$/,'')}/v1/outfits`,{
      headers:{'authorization':`Bearer ${token}`},
      cache:'no-store'
    });
    let body=null;try{body=await response.json();}catch{}
    if(!response.ok||!body?.ok){
      await setMeta('airtable-outfit-live-last-error',{at:new Date().toISOString(),status:response.status,error:body?.error||null});
      return {ok:false,status:response.status,error:body?.error||null};
    }

    const incoming=Array.isArray(body.outfits)?body.outfits:[];
    const [current,mutations,items,tombstones]=await Promise.all([
      getAllOutfits(),
      getAllOutfitMutations(),
      getAllItems(),
      getMeta(TOMBSTONES_KEY)
    ]);
    const itemLocalByRemote=new Map(items.filter(item=>item.airtableRecordId).map(item=>[item.airtableRecordId,item.id]));
    const before=canonicalOutfitSignature(current);
    const plan=planCanonicalOutfitReconciliation({
      current,
      incoming,
      mutations,
      itemLocalByRemote,
      tombstones:tombstones||{},
      syncedAt:body.syncedAt||new Date().toISOString()
    });

    for(const outfit of plan.upserts)await putOutfitCloudState(outfit);
    for(const localId of plan.deleteLocalIds)await deleteOutfitCloudState(localId);
    await setMeta(TOMBSTONES_KEY,plan.tombstones);
    await setMeta('airtable-outfit-live-last-sync',body.syncedAt||new Date().toISOString());
    await setMeta('airtable-outfit-live-record-count',incoming.length);
    await setMeta('airtable-outfit-live-last-error',null);

    const after=canonicalOutfitSignature(await getAllOutfits());
    const changed=before!==after;
    // `reloadOnChange` is retained only as a compatibility alias for the first
    // V0.5.16 implementation. Live sync now publishes a data-change signal;
    // the UI bridge refreshes app state without a full browser reload.
    if((refreshUiOnChange||reloadOnChange)&&changed&&document.visibilityState==='visible'){
      publishLiveChange({recordCount:incoming.length,syncedAt:body.syncedAt||null});
    }
    return {ok:true,changed,recordCount:incoming.length,syncedAt:body.syncedAt||null};
  }catch(error){
    await setMeta('airtable-outfit-live-last-error',{at:new Date().toISOString(),networkError:true,error:String(error?.message||error)});
    return {ok:false,networkError:true,error:String(error?.message||error)};
  }finally{
    running=false;
  }
}

export function startLiveOutfitSyncWatch(){
  const check=()=>{
    if(document.visibilityState!=='visible'||!navigator.onLine)return;
    const now=Date.now();
    if(now-lastWatchAt<15000)return;
    lastWatchAt=now;
    syncLiveCanonicalOutfits({refreshUiOnChange:true}).catch(error=>console.warn('Live Airtable Outfit sync failed',error));
  };

  window.addEventListener('online',check);
  window.addEventListener('focus',check);
  window.addEventListener('pageshow',check);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  if(intervalId)clearInterval(intervalId);
  intervalId=setInterval(check,30000);
  // iOS standalone/browser restore paths are not perfectly consistent about
  // firing visibilitychange; run one foreground check as soon as the watcher mounts.
  setTimeout(check,0);
}
