import {AIRTABLE_SNAPSHOT} from './airtable-snapshot.js';
import {getAllItems,getAllMutations,bulkPutItems,deleteItem,setMeta,getMeta} from './db.js';

const DELETE_TOMBSTONES_KEY='airtable-delete-tombstones';

export async function syncSnapshotToLocalDB(){
  const rawIncoming=Array.isArray(AIRTABLE_SNAPSHOT?.items)?AIRTABLE_SNAPSHOT.items:[];
  if(!rawIncoming.length&&!AIRTABLE_SNAPSHOT?.syncedAt)return;

  const current=await getAllItems();
  const mutations=await getAllMutations();
  const tombstones={...(await getMeta(DELETE_TOMBSTONES_KEY)||{})};
  const snapshotTime=Date.parse(AIRTABLE_SNAPSHOT?.syncedAt||0)||0;
  const pendingDeleteRemoteIds=new Set(mutations.filter(m=>m.operation==='delete'&&m.airtableRecordId).map(m=>m.airtableRecordId));
  const incoming=rawIncoming.filter(item=>{
    if(pendingDeleteRemoteIds.has(item.airtableRecordId))return false;
    const tombstoneAt=Date.parse(tombstones[item.airtableRecordId]||0)||0;
    return !(tombstoneAt&&tombstoneAt>=snapshotTime);
  });

  const byRemote=new Map(current.filter(item=>item.airtableRecordId).map(item=>[item.airtableRecordId,item]));
  const pendingLocalIds=new Set(mutations.map(m=>m.localItemId));
  const incomingIds=new Set(incoming.map(item=>item.airtableRecordId).filter(Boolean));
  const authoritative=Boolean(AIRTABLE_SNAPSHOT?.syncedAt);

  const merged=incoming.map(item=>{
    const previous=byRemote.get(item.airtableRecordId);
    const cloudWriteAt=Date.parse(previous?.cloudWriteAt||0)||0;
    const preserveLocal=Boolean(previous&&(pendingLocalIds.has(previous.id)||cloudWriteAt>=snapshotTime));
    if(preserveLocal){
      return {...previous,airtableRecordId:item.airtableRecordId,source:'airtable'};
    }
    return {
      ...item,
      id:previous?.id||item.id,
      favorite:previous?.favorite??item.favorite??false,
      photo:authoritative?(item.photo??null):(item.photo||previous?.photo||null),
      source:'airtable',
      syncState:'synced',
      cloudWriteAt:null,
      updatedAt:item.updatedAt||item.createdAt||previous?.updatedAt
    };
  });

  if(authoritative){
    for(const stale of current.filter(item=>item.airtableRecordId&&!incomingIds.has(item.airtableRecordId))){
      const cloudWriteAt=Date.parse(stale.cloudWriteAt||0)||0;
      const protectedLocal=pendingLocalIds.has(stale.id)||cloudWriteAt>=snapshotTime||pendingDeleteRemoteIds.has(stale.airtableRecordId);
      if(!protectedLocal)await deleteItem(stale.id);
    }
    for(const [recordId,time] of Object.entries(tombstones)){
      if(snapshotTime>(Date.parse(time)||0)&&!rawIncoming.some(item=>item.airtableRecordId===recordId))delete tombstones[recordId];
    }
    await setMeta(DELETE_TOMBSTONES_KEY,tombstones);
  }

  await bulkPutItems(merged);
  await setMeta('seeded-v1',true);
  await setMeta('airtable-last-sync',AIRTABLE_SNAPSHOT?.syncedAt||null);
  await setMeta('airtable-record-count',rawIncoming.length);
}
