import {AIRTABLE_SNAPSHOT} from './airtable-snapshot.js';
import {getAllItems,bulkPutItems,deleteItem,setMeta} from './db.js';

export async function syncSnapshotToLocalDB(){
  const incoming=Array.isArray(AIRTABLE_SNAPSHOT?.items)?AIRTABLE_SNAPSHOT.items:[];
  if(!incoming.length)return;

  const current=await getAllItems();
  const byRemote=new Map(current.filter(item=>item.airtableRecordId).map(item=>[item.airtableRecordId,item]));
  const incomingIds=new Set(incoming.map(item=>item.airtableRecordId).filter(Boolean));
  const authoritative=Boolean(AIRTABLE_SNAPSHOT?.syncedAt);

  const merged=incoming.map(item=>{
    const previous=byRemote.get(item.airtableRecordId);
    return {
      ...item,
      id:previous?.id||item.id,
      favorite:previous?.favorite??item.favorite??false,
      photo:authoritative?(item.photo??null):(item.photo||previous?.photo||null),
      source:'airtable',
      syncState:'synced',
      updatedAt:previous?.updatedAt||item.updatedAt||item.createdAt
    };
  });

  if(authoritative){
    for(const stale of current.filter(item=>item.airtableRecordId&&!incomingIds.has(item.airtableRecordId))){
      await deleteItem(stale.id);
    }
  }

  await bulkPutItems(merged);
  await setMeta('seeded-v1',true);
  await setMeta('airtable-last-sync',AIRTABLE_SNAPSHOT?.syncedAt||null);
  await setMeta('airtable-record-count',incoming.length);
}
