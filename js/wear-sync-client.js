import {getAllItems,getAllWearEvents,getMeta,setMeta,putWearEvent} from './db.js';
import {getSyncConfig} from './sync-client.js?v=0.5.17';

const QUEUE_KEY='wear-mutation-queue';
const TOMBSTONES_KEY='airtable-wear-delete-tombstones';
let flushing=false;
let scheduled=null;
let queueChain=Promise.resolve();

const arr=value=>Array.isArray(value)?value:[];
const unique=value=>[...new Set(arr(value).map(String).map(v=>v.trim()).filter(Boolean))];

function withQueueLock(task){
  const next=queueChain.then(task,task);
  queueChain=next.catch(()=>{});
  return next;
}

export async function getWearMutationQueue(){
  const value=await getMeta(QUEUE_KEY);
  return Array.isArray(value)?value:[];
}

async function setWearMutationQueue(queue){
  await setMeta(QUEUE_KEY,Array.isArray(queue)?queue:[]);
}

function eventPayload(event){
  return {
    schemaVersion:Number(event?.schemaVersion||1),
    outfitId:String(event?.outfitId||'').trim(),
    outfitNameSnapshot:String(event?.outfitNameSnapshot||'').trim(),
    itemIds:unique(event?.itemIds),
    itemRecordIds:unique(event?.itemRecordIds),
    wornAt:String(event?.wornAt||''),
    wornDate:String(event?.wornDate||''),
    createdAt:String(event?.createdAt||event?.wornAt||''),
    updatedAt:String(event?.updatedAt||event?.createdAt||event?.wornAt||'')
  };
}

function schedule(delay=100){
  if(typeof window==='undefined')return;
  clearTimeout(scheduled);
  scheduled=setTimeout(()=>flushWearQueue().catch(error=>console.warn('Wear-history sync failed',error)),delay);
}

export async function queueWearEventCreate(event){
  if(!event?.id)throw new Error('Wear create requires event id');
  await withQueueLock(async()=>{
    const queue=await getWearMutationQueue();
    const same=queue.filter(mutation=>mutation.eventId===event.id);
    const existingCreate=same.find(mutation=>mutation.operation==='create');
    const existingDelete=same.find(mutation=>mutation.operation==='delete');
    const mutation={
      id:existingCreate?.id||crypto.randomUUID(),
      operation:'create',
      eventId:event.id,
      airtableRecordId:event.airtableRecordId||existingDelete?.airtableRecordId||null,
      createdAt:existingCreate?.createdAt||new Date().toISOString(),
      payload:eventPayload(event)
    };
    await setWearMutationQueue([...queue.filter(item=>item.eventId!==event.id),mutation]);
  });
  schedule(80);
}

export async function queueWearEventDelete(event){
  if(!event?.id)throw new Error('Wear delete requires event id');
  await withQueueLock(async()=>{
    const queue=await getWearMutationQueue();
    const same=queue.filter(mutation=>mutation.eventId===event.id);
    const pendingCreate=same.find(mutation=>mutation.operation==='create');
    const recordId=event.airtableRecordId||pendingCreate?.airtableRecordId||null;
    const next=queue.filter(item=>item.eventId!==event.id);

    // Always persist an explicit delete intent, even when we do not yet know the
    // Airtable record id. A prior idempotent create may have committed while its
    // response was lost; the Worker resolves the stable Wear Event ID before
    // deleting so Undo cannot leave a ghost cloud event.
    next.push({
      id:crypto.randomUUID(),
      operation:'delete',
      eventId:event.id,
      airtableRecordId:recordId,
      createdAt:new Date().toISOString(),
      payload:null
    });
    await setWearMutationQueue(next);
    const tombstones={...(await getMeta(TOMBSTONES_KEY)||{})};
    tombstones[event.id]=new Date().toISOString();
    await setMeta(TOMBSTONES_KEY,tombstones);
  });
  schedule(80);
}

export async function pendingWearMutationCount(){
  return (await getWearMutationQueue()).length;
}

async function repairOrphanedWearEvents(){
  return withQueueLock(async()=>{
    const [events,queue]=await Promise.all([getAllWearEvents(),getWearMutationQueue()]);
    const queued=new Set(queue.map(mutation=>mutation.eventId));
    const additions=[];
    for(const event of events){
      if(event?.airtableRecordId||queued.has(event?.id)||!event?.id)continue;
      additions.push({
        id:crypto.randomUUID(),
        operation:'create',
        eventId:event.id,
        airtableRecordId:null,
        createdAt:new Date().toISOString(),
        payload:eventPayload(event)
      });
    }
    if(additions.length)await setWearMutationQueue([...queue,...additions]);
    return additions.length;
  });
}

function resolveCreatePayload(mutation,itemsById){
  const payload=mutation?.payload||{};
  const itemIds=unique(payload.itemIds);
  const resolved=[];
  const missing=[];
  for(const localId of itemIds){
    const item=itemsById.get(localId);
    if(!item?.airtableRecordId)missing.push(localId);
    else resolved.push(String(item.airtableRecordId));
  }
  const fallback=unique(payload.itemRecordIds);
  const itemRecordIds=resolved.length===itemIds.length&&resolved.length?resolved:fallback;
  if(itemRecordIds.length<2){
    return {sendable:false,missing:missing.length?missing:itemIds};
  }
  return {
    sendable:true,
    payload:{
      schemaVersion:Number(payload.schemaVersion||1),
      eventId:mutation.eventId,
      outfitId:String(payload.outfitId||''),
      outfitNameSnapshot:String(payload.outfitNameSnapshot||''),
      itemRecordIds,
      wornAt:String(payload.wornAt||''),
      wornDate:String(payload.wornDate||''),
      createdAt:String(payload.createdAt||payload.wornAt||''),
      updatedAt:String(payload.updatedAt||payload.createdAt||payload.wornAt||'')
    }
  };
}

export async function flushWearQueue(){
  if(flushing)return {ok:false,busy:true,pending:await pendingWearMutationCount()};
  if(typeof navigator!=='undefined'&&!navigator.onLine)return {ok:false,offline:true,pending:await pendingWearMutationCount()};
  flushing=true;
  try{
    const repaired=await repairOrphanedWearEvents();
    let [queue,items,events]=await Promise.all([getWearMutationQueue(),getAllItems(),getAllWearEvents()]);
    queue=queue.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    if(!queue.length)return {ok:true,pending:0,repaired};

    const config=await getSyncConfig();
    if(!config.endpoint||!config.token)return {ok:false,configured:false,pending:queue.length,repaired};

    const itemsById=new Map(items.map(item=>[String(item.id),item]));
    const sendable=[];
    const blocked=[];
    const payloadByMutation=new Map();
    for(const mutation of queue){
      if(mutation.operation==='delete'){
        sendable.push(mutation);
        continue;
      }
      const resolved=resolveCreatePayload(mutation,itemsById);
      if(!resolved.sendable){
        blocked.push({mutationId:mutation.id,eventId:mutation.eventId,missingItemIds:resolved.missing});
        continue;
      }
      payloadByMutation.set(mutation.id,resolved.payload);
      sendable.push({...mutation,payload:resolved.payload});
    }
    if(!sendable.length)return {ok:false,blocked:true,pending:queue.length,repaired,blockedMutations:blocked};

    let response;
    try{
      response=await fetch(`${config.endpoint.replace(/\/$/,'')}/v1/wear-mutations`,{
        method:'POST',
        headers:{'content-type':'application/json','authorization':`Bearer ${config.token}`},
        body:JSON.stringify({mutations:sendable})
      });
    }catch(error){
      return {ok:false,networkError:String(error?.message||error),pending:queue.length,repaired,blockedMutations:blocked};
    }
    if(!response.ok)return {ok:false,status:response.status,pending:queue.length,repaired,blockedMutations:blocked};

    const body=await response.json();
    const results=Array.isArray(body?.results)?body.results:[];
    const queueById=new Map(queue.map(mutation=>[mutation.id,mutation]));
    const eventsById=new Map(events.map(event=>[event.id,event]));
    const successfulIds=new Set();

    for(const result of results){
      const mutation=queueById.get(result.mutationId);
      if(!mutation||!result.ok)continue;
      successfulIds.add(mutation.id);
      if(mutation.operation==='delete')continue;
      const event=eventsById.get(mutation.eventId);
      const sent=payloadByMutation.get(mutation.id);
      if(event){
        await putWearEvent({
          ...event,
          schemaVersion:Number(sent?.schemaVersion||event.schemaVersion||1),
          itemRecordIds:unique(sent?.itemRecordIds),
          airtableRecordId:result.airtableRecordId||mutation.airtableRecordId||event.airtableRecordId||null,
          source:'airtable',
          syncState:'synced',
          cloudWriteAt:new Date().toISOString()
        });
      }
    }

    if(successfulIds.size){
      await withQueueLock(async()=>{
        const latest=await getWearMutationQueue();
        await setWearMutationQueue(latest.filter(mutation=>!successfulIds.has(mutation.id)));
      });
    }

    const pending=await pendingWearMutationCount();
    return {ok:results.every(result=>result.ok)&&pending===0&&blocked.length===0,pending,repaired,blockedMutations:blocked,results};
  }finally{
    flushing=false;
  }
}

if(typeof window!=='undefined'){
  window.addEventListener('tran:wear-sync-needed',()=>schedule(80));
  window.addEventListener('online',()=>schedule(120));
  document.addEventListener('click',event=>{if(event.target?.closest?.('#syncNow'))schedule(1800);},true);
  setInterval(()=>{if(navigator.onLine)flushWearQueue().catch(()=>{});},30000);
  schedule(1200);
}
