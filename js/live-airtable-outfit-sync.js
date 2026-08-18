import {
  getAllItems,
  getAllOutfits,
  getAllOutfitMutations,
  putOutfitCloudState,
  deleteOutfitCloudState,
  getMeta,
  setMeta
} from './db.js';
import {getSyncConfig} from './sync-client.js?v=0.5.16';
import {canonicalOutfitSignature,planCanonicalOutfitReconciliation} from './live-outfit-sync-core.mjs?v=0.5.16';

const TOMBSTONES_KEY='airtable-outfit-delete-tombstones';
let running=false;
let lastWatchAt=0;
let intervalId=null;

export async function syncLiveCanonicalOutfits({reloadOnChange=false}={}){
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
    if(reloadOnChange&&changed&&document.visibilityState==='visible')location.reload();
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
    syncLiveCanonicalOutfits({reloadOnChange:true}).catch(error=>console.warn('Live Airtable Outfit sync failed',error));
  };

  window.addEventListener('online',check);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  if(intervalId)clearInterval(intervalId);
  intervalId=setInterval(check,30000);
}
