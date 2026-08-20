import {getAllItems,getAllWearEvents,bulkPutWearEvents,deleteWearEvent,getMeta,setMeta} from './db.js';
import {getSyncConfig} from './sync-client.js?v=0.5.18';
import {getWearMutationQueue} from './wear-sync-client.js?v=0.5.18';
import {canonicalWearSignature,planCanonicalWearReconciliation} from './live-wear-sync-core.mjs?v=0.5.18';

const TOMBSTONES_KEY='airtable-wear-delete-tombstones';
let running=false;
let lastWatchAt=0;
let intervalId=null;

function publishLiveChange(detail){
  if(typeof window==='undefined'||typeof CustomEvent==='undefined')return;
  window.dispatchEvent(new CustomEvent('tran:wear-history-live-changed',{detail}));
  window.dispatchEvent(new CustomEvent('tran:wear-history-changed',{detail:{...detail,operation:'live'}}));
}

export async function syncLiveCanonicalWearEvents({refreshUiOnChange=false}={}){
  if(running)return {ok:false,busy:true};
  const {endpoint,token}=await getSyncConfig();
  if(!endpoint||!token)return {ok:false,configured:false};

  running=true;
  try{
    const response=await fetch(`${endpoint.replace(/\/$/,'')}/v1/wear-events`,{
      headers:{'authorization':`Bearer ${token}`},
      cache:'no-store'
    });
    let body=null;try{body=await response.json();}catch{}
    if(!response.ok||!body?.ok){
      await setMeta('airtable-wear-live-last-error',{at:new Date().toISOString(),status:response.status,error:body?.error||null});
      return {ok:false,status:response.status,error:body?.error||null};
    }

    const incoming=Array.isArray(body.events)?body.events:[];
    const syncedAt=body.syncedAt||new Date().toISOString();
    const [current,items,mutations,storedTombstones]=await Promise.all([
      getAllWearEvents(),
      getAllItems(),
      getWearMutationQueue(),
      getMeta(TOMBSTONES_KEY)
    ]);
    const itemLocalByRemote=new Map(
      items.filter(item=>item?.airtableRecordId).map(item=>[String(item.airtableRecordId),String(item.id)])
    );
    const before=canonicalWearSignature(current);
    const plan=planCanonicalWearReconciliation({
      current,
      incoming,
      mutations,
      itemLocalByRemote,
      tombstones:storedTombstones||{},
      syncedAt
    });

    await bulkPutWearEvents(plan.upserts);
    for(const id of plan.deleteLocalIds)await deleteWearEvent(id);
    await setMeta(TOMBSTONES_KEY,plan.tombstones);
    await setMeta('airtable-wear-live-last-sync',syncedAt);
    await setMeta('airtable-wear-live-record-count',plan.recordCount);
    await setMeta('airtable-wear-live-last-error',null);

    const after=canonicalWearSignature(await getAllWearEvents());
    const changed=before!==after||plan.deleteLocalIds.length>0;
    if(refreshUiOnChange&&changed&&document.visibilityState==='visible'){
      publishLiveChange({recordCount:plan.recordCount,syncedAt});
    }
    return {ok:true,changed,recordCount:plan.recordCount,syncedAt};
  }catch(error){
    const message=String(error?.message||error);
    await setMeta('airtable-wear-live-last-error',{at:new Date().toISOString(),networkError:true,error:message});
    return {ok:false,networkError:true,error:message};
  }finally{
    running=false;
  }
}

export function startLiveWearSyncWatch(){
  const check=()=>{
    if(document.visibilityState!=='visible'||!navigator.onLine)return;
    const now=Date.now();
    if(now-lastWatchAt<15000)return;
    lastWatchAt=now;
    syncLiveCanonicalWearEvents({refreshUiOnChange:true}).catch(error=>console.warn('Live Airtable wear-history sync failed',error));
  };
  window.addEventListener('online',check);
  window.addEventListener('focus',check);
  window.addEventListener('pageshow',check);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  if(intervalId)clearInterval(intervalId);
  intervalId=setInterval(check,30000);
  setTimeout(check,0);
}
