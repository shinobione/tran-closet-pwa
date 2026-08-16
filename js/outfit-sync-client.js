import {getSyncConfig} from './sync-client.js?v=0.3.2';
import {
  getAllItems,
  getAllOutfits,
  getAllOutfitMutations,
  putOutfitMutation,
  deleteOutfitMutation,
  putOutfitCloudState,
  setMeta,
  getMeta
} from './db.js';

const TOMBSTONES_KEY='airtable-outfit-delete-tombstones';
let flushing=false;
let scheduled=null;

function payloadFromOutfit(outfit){
  return {
    name:String(outfit.name||'').trim(),
    itemIds:Array.isArray(outfit.itemIds)?outfit.itemIds.map(String):[],
    occasion:String(outfit.occasion||'Everyday'),
    season:String(outfit.season||'All'),
    note:String(outfit.note||'').trim(),
    favorite:Boolean(outfit.favorite),
    createdAt:outfit.createdAt||null,
    updatedAt:outfit.updatedAt||new Date().toISOString()
  };
}

export async function pendingOutfitMutationCount(){
  return (await getAllOutfitMutations()).length;
}

async function repairOrphanedOutfits(){
  const [outfits,mutations]=await Promise.all([getAllOutfits(),getAllOutfitMutations()]);
  const queued=new Set(mutations.map(m=>m.localOutfitId));
  let repaired=0;
  for(const outfit of outfits){
    if(outfit.airtableRecordId||queued.has(outfit.id))continue;
    await putOutfitMutation({
      id:crypto.randomUUID(),
      operation:'create',
      localOutfitId:outfit.id,
      airtableRecordId:null,
      createdAt:new Date().toISOString(),
      payload:payloadFromOutfit(outfit)
    });
    await putOutfitCloudState({...outfit,source:'local',syncState:'pending-create'});
    repaired++;
  }
  return repaired;
}

function resolvePayload(mutation,itemsById){
  if(mutation.operation==='delete')return {sendable:true,payload:null};
  const itemIds=Array.isArray(mutation.payload?.itemIds)?mutation.payload.itemIds:[];
  const itemRecordIds=[];
  const missing=[];
  for(const localId of itemIds){
    const item=itemsById.get(localId);
    if(!item?.airtableRecordId)missing.push(localId);
    else itemRecordIds.push(item.airtableRecordId);
  }
  if(missing.length)return {sendable:false,missing};
  return {
    sendable:true,
    payload:{
      ...mutation.payload,
      outfitId:mutation.localOutfitId,
      itemRecordIds
    }
  };
}

async function markDeleteTombstone(recordId){
  if(!recordId)return;
  const tombstones={...(await getMeta(TOMBSTONES_KEY)||{})};
  tombstones[recordId]=new Date().toISOString();
  await setMeta(TOMBSTONES_KEY,tombstones);
}

export async function flushOutfitQueue(){
  if(flushing)return {ok:false,busy:true,pending:await pendingOutfitMutationCount()};
  if(!navigator.onLine)return {ok:false,offline:true,pending:await pendingOutfitMutationCount()};
  flushing=true;
  try{
    const repaired=await repairOrphanedOutfits();
    let [mutations,items]=await Promise.all([getAllOutfitMutations(),getAllItems()]);
    mutations=mutations.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    if(!mutations.length)return {ok:true,pending:0,repaired};

    const config=await getSyncConfig();
    if(!config.endpoint||!config.token)return {ok:false,configured:false,pending:mutations.length,repaired};

    const itemsById=new Map(items.map(i=>[i.id,i]));
    const sendable=[];
    const blocked=[];
    for(const mutation of mutations){
      const resolved=resolvePayload(mutation,itemsById);
      if(!resolved.sendable){
        blocked.push({mutationId:mutation.id,localOutfitId:mutation.localOutfitId,missingItemIds:resolved.missing});
        continue;
      }
      sendable.push({...mutation,payload:resolved.payload});
    }
    if(!sendable.length)return {ok:false,blocked:true,pending:mutations.length,repaired,blockedMutations:blocked};

    let response;
    try{
      response=await fetch(`${config.endpoint.replace(/\/$/,'')}/v1/outfit-mutations`,{
        method:'POST',
        headers:{'content-type':'application/json','authorization':`Bearer ${config.token}`},
        body:JSON.stringify({mutations:sendable})
      });
    }catch(error){
      return {ok:false,networkError:String(error?.message||error),pending:mutations.length,repaired,blockedMutations:blocked};
    }
    if(!response.ok)return {ok:false,status:response.status,pending:mutations.length,repaired,blockedMutations:blocked};
    const body=await response.json();
    const byMutation=new Map(mutations.map(m=>[m.id,m]));
    const outfitsById=new Map((await getAllOutfits()).map(o=>[o.id,o]));
    const results=Array.isArray(body?.results)?body.results:[];

    for(const result of results){
      const mutation=byMutation.get(result.mutationId);
      if(!mutation||!result.ok)continue;
      if(mutation.operation==='delete'){
        await markDeleteTombstone(mutation.airtableRecordId||result.airtableRecordId);
        await deleteOutfitMutation(mutation.id);
        continue;
      }
      const outfit=outfitsById.get(mutation.localOutfitId);
      if(outfit){
        await putOutfitCloudState({
          ...outfit,
          airtableRecordId:result.airtableRecordId||mutation.airtableRecordId||outfit.airtableRecordId||null,
          source:'airtable',
          syncState:'awaiting-snapshot',
          cloudWriteAt:new Date().toISOString()
        });
      }
      await deleteOutfitMutation(mutation.id);
    }

    const pending=await pendingOutfitMutationCount();
    return {ok:results.every(r=>r.ok)&&pending===0&&blocked.length===0,pending,repaired,blockedMutations:blocked,results};
  }finally{
    flushing=false;
  }
}

function schedule(delay=120){
  clearTimeout(scheduled);
  scheduled=setTimeout(()=>flushOutfitQueue().catch(error=>console.warn('Outfit sync failed',error)),delay);
}

function decorateCloudCopy(){
  const hero=document.querySelector('.outfit-hero p:not(.hero-kicker)');
  if(hero&&hero.textContent.includes('Lưu cục bộ'))hero.textContent=hero.textContent.replace('Lưu cục bộ và dùng được ngoại tuyến.','Đồng bộ Airtable và dùng được ngoại tuyến.');
  const privacy=document.querySelector('.privacy-note');
  if(privacy&&privacy.textContent.includes('Outfits hiện được lưu cục bộ trên thiết bị.')){
    privacy.textContent=privacy.textContent.replace('Outfits hiện được lưu cục bộ trên thiết bị.','Outfits được đồng bộ an toàn qua Worker và lưu trong Airtable.');
  }
}

if(typeof window!=='undefined'){
  window.addEventListener('tran:outfit-sync-needed',()=>schedule(80));
  window.addEventListener('online',()=>schedule(120));
  document.addEventListener('click',event=>{if(event.target?.closest?.('#syncNow'))schedule(1800);},true);
  const root=document.querySelector('#mainContent');
  if(root)new MutationObserver(decorateCloudCopy).observe(root,{childList:true,subtree:true});
  decorateCloudCopy();
  setInterval(()=>{if(navigator.onLine)flushOutfitQueue().catch(()=>{});},30000);
  schedule(1200);
}
