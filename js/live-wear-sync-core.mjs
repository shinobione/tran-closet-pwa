const arr=value=>Array.isArray(value)?value:[];
const unique=value=>[...new Set(arr(value).map(String).map(v=>v.trim()).filter(Boolean))];

export function canonicalWearSignature(events=[]){
  return arr(events)
    .filter(event=>event?.airtableRecordId)
    .map(event=>[
      event.airtableRecordId||'',
      event.id||'',
      event.outfitId||'',
      event.wornAt||'',
      event.wornDate||'',
      ...unique(event.itemRecordIds)
    ].join('|'))
    .sort()
    .join('\n');
}

export function planCanonicalWearReconciliation({
  current=[],
  incoming=[],
  mutations=[],
  itemLocalByRemote=new Map(),
  tombstones={},
  syncedAt=null
}={}){
  const local=arr(current);
  const remote=arr(incoming);
  const pending=arr(mutations);
  const byId=new Map(local.map(event=>[String(event.id||''),event]));
  const pendingEventIds=new Set(pending.map(mutation=>String(mutation.eventId||'')).filter(Boolean));
  const pendingDeleteEventIds=new Set(
    pending.filter(mutation=>mutation.operation==='delete').map(mutation=>String(mutation.eventId||'')).filter(Boolean)
  );
  const rawIncomingIds=new Set(remote.map(event=>String(event.id||'')).filter(Boolean));
  const nextTombstones={...(tombstones||{})};

  const acceptedIncoming=remote.filter(event=>{
    const id=String(event?.id||'');
    if(!id)return false;
    if(pendingDeleteEventIds.has(id))return false;
    if(nextTombstones[id])return false;
    return true;
  });

  for(const eventId of Object.keys(nextTombstones)){
    if(!rawIncomingIds.has(eventId))delete nextTombstones[eventId];
  }

  const acceptedIds=new Set(acceptedIncoming.map(event=>String(event.id)));
  const upserts=acceptedIncoming.map(event=>{
    const id=String(event.id);
    const previous=byId.get(id);
    if(previous&&pendingEventIds.has(id))return previous;
    const itemRecordIds=unique(event.itemRecordIds);
    const itemIds=itemRecordIds.map(recordId=>itemLocalByRemote.get(recordId)).filter(Boolean);
    return {
      ...event,
      id,
      schemaVersion:Number(event.schemaVersion||1),
      itemRecordIds,
      itemIds,
      airtableRecordId:event.airtableRecordId||previous?.airtableRecordId||null,
      source:'airtable',
      syncState:'synced',
      cloudWriteAt:null,
      createdAt:event.createdAt||previous?.createdAt||syncedAt||event.wornAt||null,
      updatedAt:event.updatedAt||event.createdAt||previous?.updatedAt||syncedAt||event.wornAt||null
    };
  });

  const deleteLocalIds=[];
  for(const event of local){
    if(!event?.airtableRecordId)continue;
    const id=String(event.id||'');
    if(!id||acceptedIds.has(id)||pendingEventIds.has(id))continue;
    deleteLocalIds.push(id);
  }

  const upsertIds=new Set(upserts.map(event=>event.id));
  return {
    upserts,
    deleteLocalIds:deleteLocalIds.filter(id=>!upsertIds.has(id)),
    tombstones:nextTombstones,
    recordCount:remote.length,
    acceptedRecordCount:acceptedIncoming.length,
    syncedAt
  };
}
