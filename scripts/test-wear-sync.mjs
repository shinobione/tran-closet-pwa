import assert from 'node:assert/strict';
import {canonicalWearSignature,planCanonicalWearReconciliation} from '../js/live-wear-sync-core.mjs';

const remoteEvent={
  id:'wear:outfit-1:2026-08-20',
  airtableRecordId:'recWear0000000001',
  schemaVersion:1,
  outfitId:'outfit-1',
  outfitNameSnapshot:'Friday Look',
  itemRecordIds:['recItem0000000001','recItem0000000002'],
  wornAt:'2026-08-20T08:30:00.000Z',
  wornDate:'2026-08-20',
  createdAt:'2026-08-20T08:30:00.000Z',
  updatedAt:'2026-08-20T08:30:00.000Z'
};
const itemLocalByRemote=new Map([
  ['recItem0000000001','shirt-local'],
  ['recItem0000000002','pant-local']
]);

{
  const plan=planCanonicalWearReconciliation({incoming:[remoteEvent],itemLocalByRemote,syncedAt:'2026-08-20T09:00:00.000Z'});
  assert.equal(plan.recordCount,1);
  assert.equal(plan.upserts.length,1);
  assert.deepEqual(plan.upserts[0].itemIds,['shirt-local','pant-local']);
  assert.deepEqual(plan.upserts[0].itemRecordIds,['recItem0000000001','recItem0000000002']);
  assert.equal(plan.upserts[0].syncState,'synced');
}

{
  const current=[{...remoteEvent,itemIds:['old-shirt','old-pant'],source:'airtable',syncState:'synced'}];
  const incoming=[{...remoteEvent,outfitNameSnapshot:'Renamed Look',updatedAt:'2026-08-20T10:00:00.000Z'}];
  const plan=planCanonicalWearReconciliation({current,incoming,itemLocalByRemote});
  assert.equal(plan.upserts[0].outfitNameSnapshot,'Renamed Look','canonical remote update should win without a local mutation');
  assert.deepEqual(plan.upserts[0].itemIds,['shirt-local','pant-local']);
}

{
  const localPending={...remoteEvent,itemIds:['shirt-local','pant-local'],outfitNameSnapshot:'Local pending',syncState:'pending-create'};
  const mutations=[{id:'m-create',eventId:remoteEvent.id,operation:'create'}];
  const plan=planCanonicalWearReconciliation({current:[localPending],incoming:[remoteEvent],mutations,itemLocalByRemote});
  assert.equal(plan.upserts[0].outfitNameSnapshot,'Local pending','pending local create must stay authoritative');
  assert.equal(plan.upserts[0].syncState,'pending-create');
}

{
  const current=[{...remoteEvent,itemIds:['shirt-local','pant-local']}];
  const mutations=[{id:'m-delete',eventId:remoteEvent.id,operation:'delete',airtableRecordId:remoteEvent.airtableRecordId}];
  const plan=planCanonicalWearReconciliation({current,incoming:[remoteEvent],mutations,itemLocalByRemote,tombstones:{[remoteEvent.id]:'2026-08-20T09:30:00.000Z'}});
  assert.equal(plan.upserts.length,0,'pending delete/tombstone must block resurrection');
  assert.equal(plan.deleteLocalIds.length,0,'local pending-delete state must not be destroyed by reread');
  assert.ok(plan.tombstones[remoteEvent.id]);
}

{
  const current=[{...remoteEvent,itemIds:['shirt-local','pant-local']}];
  const plan=planCanonicalWearReconciliation({current,incoming:[],itemLocalByRemote,tombstones:{[remoteEvent.id]:'2026-08-20T09:30:00.000Z'}});
  assert.deepEqual(plan.deleteLocalIds,[remoteEvent.id],'canonical absence should remove stale cloud-backed event');
  assert.deepEqual(plan.tombstones,{},'canonical absence should clear completed tombstone');
}

{
  const current=[{...remoteEvent,itemIds:['shirt-local','pant-local']}];
  const mutations=[{id:'m-create',eventId:remoteEvent.id,operation:'create'}];
  const plan=planCanonicalWearReconciliation({current,incoming:[],mutations,itemLocalByRemote});
  assert.deepEqual(plan.deleteLocalIds,[],'remote absence must not delete a locally pending wear event');
}

assert.equal(canonicalWearSignature([remoteEvent]),canonicalWearSignature([remoteEvent, {...remoteEvent}]),'signature should be deterministic for equivalent canonical rows');

console.log('Wear-history live reconciliation: PASS');
