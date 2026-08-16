const DB_NAME='tran-closet', DB_VERSION=3, STORE_ITEMS='items', STORE_META='meta', STORE_MUTATIONS='mutations', STORE_OUTFITS='outfits';

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

export const getAllOutfits=()=>request(STORE_OUTFITS,'readonly',s=>s.getAll());
export const putOutfit=outfit=>request(STORE_OUTFITS,'readwrite',s=>s.put(outfit));
export const deleteOutfit=id=>request(STORE_OUTFITS,'readwrite',s=>s.delete(id));
export const clearOutfits=()=>request(STORE_OUTFITS,'readwrite',s=>s.clear());

export async function bulkPutOutfits(outfits){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_OUTFITS,'readwrite'),s=tx.objectStore(STORE_OUTFITS);
    outfits.forEach(o=>s.put(o));
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}
