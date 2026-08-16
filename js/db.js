const DB_NAME='tran-closet', DB_VERSION=4, STORE_ITEMS='items', STORE_META='meta', STORE_MUTATIONS='mutations', STORE_OUTFITS='outfits', STORE_OUTFIT_MUTATIONS='outfitMutations';

function openDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,DB_VERSION);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(STORE_ITEMS)){
        const s=db.createObjectStore(STORE_ITEMS,{keyPath:'id'});
        s.createIndex('category','category');
        s.createIndex('updatedAt','updatedAt');
      }
      if(!db.objectStoreNames.contains(STORE_META))db.createObjectStore(STORE_META,{keyPath:'key'});
      if(!db.objectStoreNames.contains(STORE_MUTATIONS)){
        const m=db.createObjectStore(STORE_MUTATIONS,{keyPath:'id'});
        m.createIndex('createdAt','createdAt');
        m.createIndex('localItemId','localItemId');
      }
      if(!db.objectStoreNames.contains(STORE_OUTFITS)){
        const o=db.createObjectStore(STORE_OUTFITS,{keyPath:'id'});
        o.createIndex('updatedAt','updatedAt');
        o.createIndex('favorite','favorite');
      }
      if(!db.objectStoreNames.contains(STORE_OUTFIT_MUTATIONS)){
        const om=db.createObjectStore(STORE_OUTFIT_MUTATIONS,{keyPath:'id'});
        om.createIndex('createdAt','createdAt');
        om.createIndex('localOutfitId','localOutfitId');
      }
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}

async function request(storeName,mode,action){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,mode),req=action(tx.objectStore(storeName));
    if(req){
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    }else{
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    }
  });
}

function notifyOutfitSync(){
  if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('tran:outfit-sync-needed'));
}

export const getAllItems=()=>request(STORE_ITEMS,'readonly',s=>s.getAll());
export const putItem=item=>request(STORE_ITEMS,'readwrite',s=>s.put(item));
export const deleteItem=id=>request(STORE_ITEMS,'readwrite',s=>s.delete(id));
export const clearItems=()=>request(STORE_ITEMS,'readwrite',s=>s.clear());

export async function bulkPutItems(items){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_ITEMS,'readwrite'),s=tx.objectStore(STORE_ITEMS);
    items.forEach(i=>s.put(i));
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}

export async function getMeta(key){
  const v=await request(STORE_META,'readonly',s=>s.get(key));
  return v?.value??null;
}
export const setMeta=(key,value)=>request(STORE_META,'readwrite',s=>s.put({key,value}));

export const getAllMutations=()=>request(STORE_MUTATIONS,'readonly',s=>s.getAll());
export const putMutation=mutation=>request(STORE_MUTATIONS,'readwrite',s=>s.put(mutation));
export const deleteMutation=id=>request(STORE_MUTATIONS,'readwrite',s=>s.delete(id));
export const clearMutations=()=>request(STORE_MUTATIONS,'readwrite',s=>s.clear());

const getOutfit=id=>request(STORE_OUTFITS,'readonly',s=>s.get(id));
const putOutfitRaw=outfit=>request(STORE_OUTFITS,'readwrite',s=>s.put(outfit));
const deleteOutfitRaw=id=>request(STORE_OUTFITS,'readwrite',s=>s.delete(id));

export const getAllOutfits=()=>request(STORE_OUTFITS,'readonly',s=>s.getAll());
export const getAllOutfitMutations=()=>request(STORE_OUTFIT_MUTATIONS,'readonly',s=>s.getAll());
export const putOutfitMutation=mutation=>request(STORE_OUTFIT_MUTATIONS,'readwrite',s=>s.put(mutation));
export const deleteOutfitMutation=id=>request(STORE_OUTFIT_MUTATIONS,'readwrite',s=>s.delete(id));
export const clearOutfitMutations=()=>request(STORE_OUTFIT_MUTATIONS,'readwrite',s=>s.clear());
export const putOutfitCloudState=putOutfitRaw;
export const deleteOutfitCloudState=deleteOutfitRaw;

function outfitPayload(outfit){
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

async function replaceOutfitMutations(localOutfitId,keepId=null){
  const mutations=await getAllOutfitMutations();
  await Promise.all(mutations.filter(m=>m.localOutfitId===localOutfitId&&m.id!==keepId).map(m=>deleteOutfitMutation(m.id)));
}

export async function putOutfit(outfit){
  const previous=await getOutfit(outfit.id);
  const airtableRecordId=outfit.airtableRecordId||previous?.airtableRecordId||null;
  const existingMutations=(await getAllOutfitMutations()).filter(m=>m.localOutfitId===outfit.id);
  const pendingCreate=existingMutations.find(m=>m.operation==='create');
  const stored={
    ...outfit,
    airtableRecordId,
    source:airtableRecordId?'airtable':'local',
    syncState:airtableRecordId?'pending-update':'pending-create',
    cloudWriteAt:outfit.cloudWriteAt??previous?.cloudWriteAt??null
  };
  await putOutfitRaw(stored);
  if(pendingCreate){
    await putOutfitMutation({...pendingCreate,payload:outfitPayload(stored),airtableRecordId:null});
    await replaceOutfitMutations(outfit.id,pendingCreate.id);
  }else{
    await replaceOutfitMutations(outfit.id);
    await putOutfitMutation({
      id:crypto.randomUUID(),
      operation:airtableRecordId?'update':'create',
      localOutfitId:outfit.id,
      airtableRecordId,
      createdAt:new Date().toISOString(),
      payload:outfitPayload(stored)
    });
  }
  notifyOutfitSync();
  return stored;
}

export async function deleteOutfit(id){
  const existing=await getOutfit(id);
  if(!existing)return;
  await replaceOutfitMutations(id);
  if(existing.airtableRecordId){
    await putOutfitMutation({
      id:crypto.randomUUID(),
      operation:'delete',
      localOutfitId:id,
      airtableRecordId:existing.airtableRecordId,
      createdAt:new Date().toISOString(),
      payload:null
    });
  }
  await deleteOutfitRaw(id);
  notifyOutfitSync();
}

export async function clearOutfits(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE_OUTFITS,STORE_OUTFIT_MUTATIONS],'readwrite');
    tx.objectStore(STORE_OUTFITS).clear();
    tx.objectStore(STORE_OUTFIT_MUTATIONS).clear();
    tx.oncomplete=()=>{notifyOutfitSync();resolve();};
    tx.onerror=()=>reject(tx.error);
  });
}

export async function bulkPutOutfits(outfits){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_OUTFITS,'readwrite'),s=tx.objectStore(STORE_OUTFITS);
    outfits.forEach(o=>s.put(o));
    tx.oncomplete=()=>{notifyOutfitSync();resolve();};
    tx.onerror=()=>reject(tx.error);
  });
}
