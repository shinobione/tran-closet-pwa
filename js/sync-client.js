import {getAllMutations,deleteMutation,putMutation,getMeta,setMeta,getAllItems,putItem} from './db.js';

const ENDPOINT_KEY='sync-endpoint';
const TOKEN_KEY='sync-device-key';

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

export async function queueMutation(operation,item){
  const mutation={
    id:crypto.randomUUID(),
    operation,
    localItemId:item.id,
    airtableRecordId:item.airtableRecordId||null,
    createdAt:new Date().toISOString(),
    payload:operation==='delete'?null:{
      name:item.name,
      category:item.category,
      colors:item.colors||[],
      styles:item.styles||[],
      photo:item.photo?.startsWith('data:image/')?item.photo:null
    }
  };
  await putMutation(mutation);
  return mutation;
}

export async function pendingMutationCount(){return (await getAllMutations()).length;}

export async function flushMutationQueue(){
  if(!navigator.onLine)return {ok:false,offline:true,pending:await pendingMutationCount()};
  const {endpoint,token}=await getSyncConfig();
  const mutations=await getAllMutations();
  if(!mutations.length)return {ok:true,pending:0};
  if(!endpoint||!token)return {ok:false,configured:false,pending:mutations.length};

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

  for(const result of results){
    if(!result?.ok)continue;
    const mutation=mutations.find(m=>m.id===result.mutationId);
    if(!mutation)continue;
    if(mutation.operation==='create'&&result.airtableRecordId){
      const item=byId.get(mutation.localItemId);
      if(item){
        await putItem({...item,airtableRecordId:result.airtableRecordId,source:'airtable',syncState:'synced'});
      }
    }else if(mutation.operation==='update'){
      const item=byId.get(mutation.localItemId);
      if(item)await putItem({...item,syncState:'synced'});
    }
    await deleteMutation(mutation.id);
  }
  await setMeta('airtable-last-write-sync',new Date().toISOString());
  return {ok:results.every(r=>r.ok),pending:await pendingMutationCount(),results};
}
