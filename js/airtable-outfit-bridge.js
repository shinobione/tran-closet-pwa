import {AIRTABLE_OUTFIT_SNAPSHOT} from './airtable-outfit-snapshot.js';
import {
  getAllItems,
  getAllOutfits,
  getAllOutfitMutations,
  bulkPutOutfits,
  deleteOutfitCloudState,
  setMeta,
  getMeta
} from './db.js';

const DELETE_TOMBSTONES_KEY='airtable-outfit-delete-tombstones';

export async function syncOutfitSnapshotToLocalDB(){
  const rawIncoming=Array.isArray(AIRTABLE_OUTFIT_SNAPSHOT?.outfits)?AIRTABLE_OUTFIT_SNAPSHOT.outfits:[];
  if(!rawIncoming.length&&!AIRTABLE_OUTFIT_SNAPSHOT?.syncedAt)return;

  const [current,mutations,items]=await Promise.all([getAllOutfits(),getAllOutfitMutations(),getAllItems()]);
  const tombstones={...(await getMeta(DELETE_TOMBSTONES_KEY)||{})};
  const snapshotTime=Date.parse(AIRTABLE_OUTFIT_SNAPSHOT?.syncedAt||0)||0;
  const pendingDeleteRemoteIds=new Set(mutations.filter(m=>m.operation==='delete'&&m.airtableRecordId).map(m=>m.airtableRecordId));
  const incoming=rawIncoming.filter(outfit=>{
    if(pendingDeleteRemoteIds.has(outfit.airtableRecordId))return false;
    const tombstoneAt=Date.parse(tombstones[outfit.airtableRecordId]||0)||0;
    return !(tombstoneAt&&tombstoneAt>=snapshotTime);
  });

  const byId=new Map(current.map(outfit=>[outfit.id,outfit]));
  const byRemote=new Map(current.filter(outfit=>outfit.airtableRecordId).map(outfit=>[outfit.airtableRecordId,outfit]));
  const itemLocalByRemote=new Map(items.filter(item=>item.airtableRecordId).map(item=>[item.airtableRecordId,item.id]));
  const pendingLocalIds=new Set(mutations.map(m=>m.localOutfitId));
  const incomingRemoteIds=new Set(incoming.map(outfit=>outfit.airtableRecordId).filter(Boolean));
  const authoritative=Boolean(AIRTABLE_OUTFIT_SNAPSHOT?.syncedAt);

  const merged=incoming.map(outfit=>{
    const previous=byId.get(outfit.id)||byRemote.get(outfit.airtableRecordId);
    const cloudWriteAt=Date.parse(previous?.cloudWriteAt||0)||0;
    const preserveLocal=Boolean(previous&&(pendingLocalIds.has(previous.id)||cloudWriteAt>=snapshotTime));
    if(preserveLocal){
      return {...previous,airtableRecordId:outfit.airtableRecordId,source:'airtable'};
    }
    const itemIds=(outfit.itemRecordIds||[]).map(recordId=>itemLocalByRemote.get(recordId)||`airtable-${recordId}`);
    return {
      id:outfit.id,
      airtableRecordId:outfit.airtableRecordId,
      name:outfit.name,
      itemIds,
      occasion:outfit.occasion||'Everyday',
      season:outfit.season||'All',
      note:outfit.note||'',
      favorite:Boolean(outfit.favorite),
      source:'airtable',
      syncState:'synced',
      cloudWriteAt:null,
      createdAt:outfit.createdAt||previous?.createdAt||AIRTABLE_OUTFIT_SNAPSHOT.syncedAt,
      updatedAt:outfit.updatedAt||outfit.createdAt||previous?.updatedAt||AIRTABLE_OUTFIT_SNAPSHOT.syncedAt
    };
  });

  if(authoritative){
    for(const stale of current.filter(outfit=>outfit.airtableRecordId&&!incomingRemoteIds.has(outfit.airtableRecordId))){
      const cloudWriteAt=Date.parse(stale.cloudWriteAt||0)||0;
      const protectedLocal=pendingLocalIds.has(stale.id)||cloudWriteAt>=snapshotTime||pendingDeleteRemoteIds.has(stale.airtableRecordId);
      if(!protectedLocal)await deleteOutfitCloudState(stale.id);
    }
    for(const [recordId,time] of Object.entries(tombstones)){
      if(snapshotTime>(Date.parse(time)||0)&&!rawIncoming.some(outfit=>outfit.airtableRecordId===recordId))delete tombstones[recordId];
    }
    await setMeta(DELETE_TOMBSTONES_KEY,tombstones);
  }

  await bulkPutOutfits(merged);
  await setMeta('airtable-outfit-last-sync',AIRTABLE_OUTFIT_SNAPSHOT?.syncedAt||null);
  await setMeta('airtable-outfit-record-count',rawIncoming.length);
}
