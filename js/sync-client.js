import {getAllMutations,deleteMutation,putMutation,getMeta,setMeta,getAllItems,putItem} from './db.js';
import {reconcileDeleteResults} from './delete-reconciliation.mjs?v=0.5.15';

const DEFAULT_ENDPOINT='https://tran-closet-sync.jerryquinet.workers.dev';
const ENDPOINT_KEY='sync-endpoint';
const TOKEN_KEY='sync-device-key';
const DELETE_TOMBSTONES_KEY='airtable-delete-tombstones';
let flushing=false;

export async function getSyncConfig(){
  return {
    endpoint:String(await getMeta(ENDPOINT_KEY)||DEFAULT_ENDPOINT).replace(/\/+$/,''),
    token:String(await getMeta(TOKEN_KEY)||'')
  };
}

export async function saveSyncConfig(endpoint,token){
  await setMeta(ENDPOINT_KEY,String(endpoint||DEFAULT_ENDPOINT).trim().replace(/\/+$/,''));
  await setMeta(TOKEN_KEY,String(token||'').trim());
}

function payloadFromItem(item){
  return {
    name:item.name,
    category:item.category,
    colors:item.colors||[],
    styles:item.styles||[],
    tags:item.tags||[],
    photo:item.photo?.startsWith('data:image/')?item.photo:null
  };
}

export async function queueMutation(operation,item){
  const all=await getAllMutations();
  const same=all.filter(m=>m.localItemId===item.id);
  const pendingCreate=same.find(m=>m.operation==='create');

  if(operation==='update'&&pendingCreate){
    await putMutation({...pendingCreate,payload:payloadFromItem(item),createdAt:new Date().toISOString()});
    for(const mutation of same.filter(m=>m.id!==pendingCreate.id))await deleteMutation(mutation.id);
    return pendingCreate;
  }

  if(operation==='delete'&&pendingCreate&&!item.airtableRecordId){
    for(const mutation of same)await deleteMutation(mutation.id);
    return null;
  }

  for(const mutation of same){
    if(operation==='update'&&mutation.operation==='update')await deleteMutation(mutation.id);
    if(operation==='delete')await deleteMutation(mutation.id);
  }

  const mutation={
    id:crypto.randomUUID(),
    operation,
    localItemId:item.id,
    airtableRecordId:item.airtableRecordId||null,
    createdAt:new Date().toISOString(),
    payload:operation==='delete'?null:payloadFromItem(item)
  };
  await putMutation(mutation);
  return mutation;
}

async function repairOrphanedLocalCreates(){
  const [items,mutations]=await Promise.all([getAllItems(),getAllMutations()]);
  const queuedIds=new Set(mutations.map(m=>m.localItemId));
  let repaired=0;
  for(const item of items){
    if(item.airtableRecordId||queuedIds.has(item.id))continue;
    await putMutation({
      id:crypto.randomUUID(),
      operation:'create',
      localItemId:item.id,
      airtableRecordId:null,
      createdAt:new Date().toISOString(),
      payload:payloadFromItem(item)
    });
    await putItem({...item,source:'local',syncState:'pending-create'});
    repaired++;
  }
  return repaired;
}

async function reconcileFailedDeletes(endpoint,token,mutations,results){
  const hasFailedDelete=mutations.some(mutation=>
    mutation.operation==='delete'&&
    mutation.airtableRecordId&&
    results.some(result=>result?.mutationId===mutation.id&&!result?.ok)
  );
  if(!hasFailedDelete)return results;

  try{
    const response=await fetch(`${endpoint}/v1/items`,{
      headers:{'authorization':`Bearer ${token}`},
      cache:'no-store'
    });
    if(!response.ok)return results;
    const body=await response.json();
    if(!body?.ok||!Array.isArray(body.items))return results;
    const canonicalIds=new Set(body.items.map(item=>item?.airtableRecordId).filter(Boolean));
    return reconcileDeleteResults(mutations,results,canonicalIds);
  }catch(error){
    console.warn('Delete reconciliation reread failed; keeping mutation pending.',error);
    return results;
  }
}

export async function pendingMutationCount(){return (await getAllMutations()).length;}

export async function flushMutationQueue(){
  if(flushing)return {ok:false,busy:true,pending:await pendingMutationCount()};
  if(!navigator.onLine)return {ok:false,offline:true,pending:await pendingMutationCount()};
  const {endpoint,token}=await getSyncConfig();
  const repaired=await repairOrphanedLocalCreates();
  const mutations=(await getAllMutations()).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
  if(!mutations.length)return {ok:true,pending:0,repaired};
  if(!endpoint||!token)return {ok:false,configured:false,pending:mutations.length,repaired};

  flushing=true;
  try{
    let response;
    try{
      response=await fetch(`${endpoint}/v1/mutations`,{
        method:'POST',
        headers:{'content-type':'application/json','authorization':`Bearer ${token}`},
        body:JSON.stringify({mutations})
      });
    }catch(error){return {ok:false,networkError:true,error,pending:mutations.length,repaired};}

    if(!response.ok)return {ok:false,status:response.status,pending:mutations.length,repaired};
    const body=await response.json();
    let results=Array.isArray(body.results)?body.results:[];
    results=await reconcileFailedDeletes(endpoint,token,mutations,results);
    const items=await getAllItems();
    const byId=new Map(items.map(item=>[item.id,item]));
    const tombstones={...(await getMeta(DELETE_TOMBSTONES_KEY)||{})};
    const writeTime=new Date().toISOString();

    for(const result of results){
      const mutation=mutations.find(m=>m.id===result?.mutationId);
      if(!mutation)continue;

      if(result.partial&&mutation.operation==='create'&&result.airtableRecordId){
        const item=byId.get(mutation.localItemId);
        if(item){
          const updated={...item,airtableRecordId:result.airtableRecordId,source:'airtable',syncState:'pending-photo',cloudWriteAt:writeTime};
          await putItem(updated);byId.set(updated.id,updated);
        }
        await deleteMutation(mutation.id);
        if(mutation.payload?.photo){
          await putMutation({id:crypto.randomUUID(),operation:'photo',localItemId:mutation.localItemId,airtableRecordId:result.airtableRecordId,createdAt:new Date().toISOString(),payload:{photo:mutation.payload.photo}});
        }
        continue;
      }

      if(!result?.ok)continue;
      if(mutation.operation==='create'&&result.airtableRecordId){
        const item=byId.get(mutation.localItemId);
        if(item){
          const updated={...item,airtableRecordId:result.airtableRecordId,source:'airtable',syncState:'awaiting-snapshot',cloudWriteAt:writeTime};
          await putItem(updated);byId.set(updated.id,updated);
        }
      }else if(mutation.operation==='update'||mutation.operation==='photo'){
        const item=byId.get(mutation.localItemId);
        if(item){
          const updated={...item,syncState:'awaiting-snapshot',cloudWriteAt:writeTime};
          await putItem(updated);byId.set(updated.id,updated);
        }
      }else if(mutation.operation==='delete'&&mutation.airtableRecordId){
        tombstones[mutation.airtableRecordId]=writeTime;
      }
      await deleteMutation(mutation.id);
    }
    await setMeta(DELETE_TOMBSTONES_KEY,tombstones);
    await setMeta('airtable-last-write-sync',writeTime);
    const pending=await pendingMutationCount();
    return {ok:results.every(r=>r.ok)&&pending===0,pending,results,repaired};
  }finally{flushing=false;}
}

export async function testSyncConnection(){
  const {endpoint,token}=await getSyncConfig();
  if(!endpoint||!token)return {ok:false,configured:false};
  try{
    const response=await fetch(`${endpoint}/health`,{headers:{'authorization':`Bearer ${token}`}});
    if(!response.ok)return {ok:false,status:response.status};
    return await response.json();
  }catch(error){return {ok:false,networkError:true,error};}
}
