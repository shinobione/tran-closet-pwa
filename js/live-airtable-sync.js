import {getAllItems,getAllMutations,bulkPutItems,deleteItem,getMeta,setMeta} from './db.js';
import {getSyncConfig} from './sync-client.js';

const TOMBSTONES_KEY='airtable-delete-tombstones';
let running=false;
let lastWatchAt=0;
let intervalId=null;

const stableLocalPhoto=value=>typeof value==='string'&&(
  value.startsWith('./assets/items/')||
  value.startsWith('/tran-closet-pwa/assets/items/')||
  value.startsWith('data:image/')
);

function canonicalSignature(items){
  return items
    .map(item=>[
      item.airtableRecordId||'',item.name||'',item.category||'',
      ...(item.colors||[]),...(item.styles||[]),...(item.tags||[]),
      item.photoAttachmentId||''
    ].join('|'))
    .sort()
    .join('\n');
}

function publishLiveChange(detail){
  if(typeof window==='undefined'||typeof CustomEvent==='undefined')return;
  window.dispatchEvent(new CustomEvent('tran:items-live-changed',{detail}));
}

export async function syncLiveCanonicalItems({refreshUiOnChange=false,reloadOnChange=false}={}){
  if(running)return {ok:false,busy:true};
  const {endpoint,token}=await getSyncConfig();
  if(!endpoint||!token)return {ok:false,configured:false};

  running=true;
  try{
    const response=await fetch(`${endpoint.replace(/\/$/,'')}/v1/items`,{
      headers:{'authorization':`Bearer ${token}`},
      cache:'no-store'
    });
    let body=null;try{body=await response.json();}catch{}
    if(!response.ok||!body?.ok){
      await setMeta('airtable-live-last-error',{at:new Date().toISOString(),status:response.status,error:body?.error||null});
      return {ok:false,status:response.status,error:body?.error||null};
    }

    const rawIncoming=Array.isArray(body.items)?body.items:[];
    const syncedAt=body.syncedAt||new Date().toISOString();
    const [current,mutations,storedTombstones]=await Promise.all([
      getAllItems(),
      getAllMutations(),
      getMeta(TOMBSTONES_KEY)
    ]);
    const tombstones={...(storedTombstones||{})};
    const byRemote=new Map(current.filter(item=>item.airtableRecordId).map(item=>[item.airtableRecordId,item]));
    const pendingLocalIds=new Set(mutations.map(mutation=>mutation.localItemId));
    const pendingDeleteRemoteIds=new Set(
      mutations.filter(mutation=>mutation.operation==='delete'&&mutation.airtableRecordId).map(mutation=>mutation.airtableRecordId)
    );
    const rawIncomingRemoteIds=new Set(rawIncoming.map(item=>item.airtableRecordId).filter(Boolean));
    const incoming=rawIncoming.filter(item=>{
      if(!item?.airtableRecordId)return false;
      if(pendingDeleteRemoteIds.has(item.airtableRecordId))return false;
      if(tombstones[item.airtableRecordId])return false;
      return true;
    });
    const incomingRemoteIds=new Set(incoming.map(item=>item.airtableRecordId));
    const before=canonicalSignature(current);

    const merged=incoming.map(item=>{
      const previous=byRemote.get(item.airtableRecordId);
      if(previous&&pendingLocalIds.has(previous.id))return previous;
      const photo=previous&&stableLocalPhoto(previous.photo)
        ? previous.photo
        : item.photo||previous?.photo||null;
      return {
        ...item,
        id:previous?.id||item.id,
        favorite:previous?.favorite??false,
        photo,
        source:'airtable',
        syncState:'synced',
        cloudWriteAt:null,
        updatedAt:previous?.updatedAt||item.updatedAt||item.createdAt
      };
    });

    await bulkPutItems(merged);

    // Live Airtable is authoritative for already-cloud-backed records.
    // Preserve anything with a local mutation still pending; remove only truly stale cloud rows.
    for(const stale of current.filter(item=>item.airtableRecordId&&!incomingRemoteIds.has(item.airtableRecordId))){
      if(!pendingLocalIds.has(stale.id))await deleteItem(stale.id);
    }

    // A delete tombstone blocks resurrection until a canonical read proves the
    // record is absent. Once absent, the tombstone has served its purpose.
    for(const recordId of Object.keys(tombstones)){
      if(!rawIncomingRemoteIds.has(recordId))delete tombstones[recordId];
    }
    await setMeta(TOMBSTONES_KEY,tombstones);
    await setMeta('airtable-live-last-sync',syncedAt);
    await setMeta('airtable-live-record-count',rawIncoming.length);
    await setMeta('airtable-live-last-error',null);

    const after=canonicalSignature(await getAllItems());
    const changed=before!==after;
    // `reloadOnChange` remains a compatibility alias only. Live clothing sync
    // now mirrors Outfits and refreshes app state without a browser reload.
    if((refreshUiOnChange||reloadOnChange)&&changed&&document.visibilityState==='visible'){
      publishLiveChange({recordCount:rawIncoming.length,syncedAt});
    }
    return {ok:true,changed,recordCount:rawIncoming.length,syncedAt};
  }catch(error){
    const message=String(error?.message||error);
    await setMeta('airtable-live-last-error',{at:new Date().toISOString(),networkError:true,error:message});
    return {ok:false,networkError:true,error:message};
  }finally{
    running=false;
  }
}

export function startLiveSyncWatch(){
  const check=()=>{
    if(document.visibilityState!=='visible'||!navigator.onLine)return;
    const now=Date.now();
    if(now-lastWatchAt<15000)return;
    lastWatchAt=now;
    syncLiveCanonicalItems({refreshUiOnChange:true}).catch(error=>console.warn('Live Airtable clothing sync failed',error));
  };

  window.addEventListener('online',check);
  window.addEventListener('focus',check);
  window.addEventListener('pageshow',check);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  if(intervalId)clearInterval(intervalId);
  intervalId=setInterval(check,30000);
  // Retry immediately after app mount too. This gives transient bootstrap
  // read failures a second foreground attempt and covers PWA restore paths.
  setTimeout(check,0);
}
