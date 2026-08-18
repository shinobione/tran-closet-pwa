export function canonicalOutfitSignature(outfits=[]){
  return outfits
    .filter(outfit=>outfit?.airtableRecordId)
    .map(outfit=>[
      outfit.airtableRecordId||'',
      outfit.id||'',
      outfit.name||'',
      ...(outfit.itemIds||[]),
      outfit.occasion||'',
      outfit.season||'',
      outfit.note||'',
      outfit.favorite?'1':'0',
      outfit.updatedAt||''
    ].join('|'))
    .sort()
    .join('\n');
}

function isoTime(value){
  return Date.parse(value||0)||0;
}

export function planCanonicalOutfitReconciliation({
  current=[],
  incoming=[],
  mutations=[],
  itemLocalByRemote=new Map(),
  tombstones={},
  syncedAt=null
}={}){
  const rawIncoming=Array.isArray(incoming)?incoming:[];
  const currentOutfits=Array.isArray(current)?current:[];
  const pending=Array.isArray(mutations)?mutations:[];
  const byId=new Map(currentOutfits.map(outfit=>[outfit.id,outfit]));
  const byRemote=new Map(currentOutfits.filter(outfit=>outfit.airtableRecordId).map(outfit=>[outfit.airtableRecordId,outfit]));
  const pendingLocalIds=new Set(pending.map(mutation=>mutation.localOutfitId).filter(Boolean));
  const pendingDeleteRemoteIds=new Set(
    pending.filter(mutation=>mutation.operation==='delete'&&mutation.airtableRecordId)
      .map(mutation=>mutation.airtableRecordId)
  );
  const rawIncomingRemoteIds=new Set(rawIncoming.map(outfit=>outfit.airtableRecordId).filter(Boolean));
  const nextTombstones={...(tombstones||{})};

  // A local delete tombstone remains authoritative until a canonical read proves
  // that the remote row is absent. This prevents short-lived read lag from
  // resurrecting an Outfit the user just deleted.
  const acceptedIncoming=rawIncoming.filter(outfit=>{
    const remoteId=outfit?.airtableRecordId;
    if(!remoteId)return false;
    if(pendingDeleteRemoteIds.has(remoteId))return false;
    if(nextTombstones[remoteId])return false;
    return true;
  });

  // Once a canonical read confirms absence, the tombstone has done its job.
  for(const remoteId of Object.keys(nextTombstones)){
    if(!rawIncomingRemoteIds.has(remoteId))delete nextTombstones[remoteId];
  }

  const acceptedRemoteIds=new Set(acceptedIncoming.map(outfit=>outfit.airtableRecordId));
  const upserts=acceptedIncoming.map(outfit=>{
    const previous=byId.get(outfit.id)||byRemote.get(outfit.airtableRecordId);
    const mappedItemIds=(outfit.itemRecordIds||[]).map(recordId=>itemLocalByRemote.get(recordId)||`airtable-${recordId}`);

    if(previous&&pendingLocalIds.has(previous.id)){
      return {
        ...previous,
        airtableRecordId:outfit.airtableRecordId||previous.airtableRecordId||null,
        source:previous.source||'airtable'
      };
    }

    return {
      id:outfit.id,
      airtableRecordId:outfit.airtableRecordId,
      name:outfit.name||'Outfit',
      itemIds:mappedItemIds,
      occasion:outfit.occasion||'Everyday',
      season:outfit.season||'All',
      note:outfit.note||'',
      favorite:Boolean(outfit.favorite),
      source:'airtable',
      syncState:'synced',
      cloudWriteAt:null,
      createdAt:outfit.createdAt||previous?.createdAt||syncedAt||null,
      updatedAt:outfit.updatedAt||outfit.createdAt||previous?.updatedAt||syncedAt||null
    };
  });

  const deleteLocalIds=[];
  for(const stale of currentOutfits.filter(outfit=>outfit.airtableRecordId&&!acceptedRemoteIds.has(outfit.airtableRecordId))){
    const protectedLocal=pendingLocalIds.has(stale.id)||pendingDeleteRemoteIds.has(stale.airtableRecordId);
    if(!protectedLocal)deleteLocalIds.push(stale.id);
  }

  // If an accepted incoming record matched a pending local edit by stable Outfit
  // ID but not by remote ID, do not let the stale-removal pass delete that same
  // protected local record.
  const upsertIds=new Set(upserts.map(outfit=>outfit.id));
  const safeDeleteLocalIds=deleteLocalIds.filter(id=>!upsertIds.has(id));

  return {
    upserts,
    deleteLocalIds:safeDeleteLocalIds,
    tombstones:nextTombstones,
    recordCount:rawIncoming.length,
    acceptedRecordCount:acceptedIncoming.length,
    syncedAt,
    syncEpoch:isoTime(syncedAt)
  };
}
