import {getAllItems,getAllMutations,bulkPutItems,setMeta} from './db.js';
import {getSyncConfig} from './sync-client.js';

let running=false;
let lastWatchAt=0;

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

export async function syncLiveCanonicalItems({reloadOnChange=false}={}){
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

    const incoming=Array.isArray(body.items)?body.items:[];
    const [current,mutations]=await Promise.all([getAllItems(),getAllMutations()]);
    const byRemote=new Map(current.filter(item=>item.airtableRecordId).map(item=>[item.airtableRecordId,item]));
    const pendingLocalIds=new Set(mutations.map(mutation=>mutation.localItemId));
    const before=canonicalSignature(current.filter(item=>item.airtableRecordId));

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
    await setMeta('airtable-live-last-sync',body.syncedAt||new Date().toISOString());
    await setMeta('airtable-live-record-count',incoming.length);
    await setMeta('airtable-live-last-error',null);

    const after=canonicalSignature(merged);
    const changed=before!==after;
    if(reloadOnChange&&changed&&document.visibilityState==='visible'){
      location.reload();
    }
    return {ok:true,changed,recordCount:incoming.length,syncedAt:body.syncedAt||null};
  }catch(error){
    await setMeta('airtable-live-last-error',{at:new Date().toISOString(),networkError:true,error:String(error?.message||error)});
    return {ok:false,networkError:true,error};
  }finally{
    running=false;
  }
}

export function startLiveSyncWatch(){
  const check=()=>{
    const now=Date.now();
    if(now-lastWatchAt<15000)return;
    lastWatchAt=now;
    syncLiveCanonicalItems({reloadOnChange:true});
  };
  window.addEventListener('online',check);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
}
