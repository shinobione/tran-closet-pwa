import {getAllMutations,deleteMutation,putMutation,getMeta,setMeta,getAllItems,putItem} from './db.js';

const ENDPOINT_KEY='sync-endpoint';
const TOKEN_KEY='sync-device-key';
const DELETE_TOMBSTONES_KEY='airtable-delete-tombstones';
let flushing=false;

export async function getSyncConfig(){
  return {
    endpoint:String(await getMeta(ENDPOINT_KEY)||'').replace(/\/+$/,''),
    token:String(await getMeta(TOKEN_KEY)||'')
  };
}

export async function saveSyncConfig(endpoint,token){
  await setMeta(ENDPOINT_KEY,String(endpoint||'').trim().replace(/\/+$/,''));
  await setMeta(TOKEN_KEY,String(token||'').trim());
}

function payloadFromItem(item){
  return {
    name:item.name,
    category:item.category,
    colors:item.colors||[],
    styles:item.styles||[],
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

export async function pendingMutationCount(){return (await getAllMutations()).length;}

export async function flushMutationQueue(){
  if(flushing)return {ok:false,busy:true,pending:await pendingMutationCount()};
  if(!navigator.onLine)return {ok:false,offline:true,pending:await pendingMutationCount()};
  const {endpoint,token}=await getSyncConfig();
  const mutations=(await getAllMutations()).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
  if(!mutations.length)return {ok:true,pending:0};
  if(!endpoint||!token)return {ok:false,configured:false,pending:mutations.length};

  flushing=true;
  try{
    let response;
    try{
      response=await fetch(`${endpoint}/v1/mutations`,{
        method:'POST',
        headers:{'content-type':'application/json','authorization':`Bearer ${token}`},
        body:JSON.stringify({mutations})
      });
    }catch(error){return {ok:false,networkError:true,error,pending:mutations.length};}

    if(!response.ok)return {ok:false,status:response.status,pending:mutations.length};
    const body=await response.json();
    const results=Array.isArray(body.results)?body.results:[];
    const items=await getAllItems();
    const byId=new Map(items.map(item=>[item.id,item]));
    const tombstones={...(await getMeta(DELETE_TOMBSTONES_KEY)||{})};
    const writeTime=new Date().toISOString();

    for(const result of results){
      if(!result?.ok)continue;
      const mutation=mutations.find(m=>m.id===result.mutationId);
      if(!mutation)continue;
      if(mutation.operation==='create'&&result.airtableRecordId){
        const item=byId.get(mutation.localItemId);
        if(item){
          const updated={...item,airtableRecordId:result.airtableRecordId,source:'airtable',syncState:'awaiting-snapshot',cloudWriteAt:writeTime};
          await putItem(updated);byId.set(updated.id,updated);
        }
      }else if(mutation.operation==='update'){
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
    return {ok:results.every(r=>r.ok),pending:await pendingMutationCount(),results};
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
