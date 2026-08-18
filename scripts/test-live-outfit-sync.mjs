import assert from 'node:assert/strict';
import {planCanonicalOutfitReconciliation} from '../js/live-outfit-sync-core.mjs';

const itemMap=new Map([['recTop','local-top'],['recBag','local-bag']]);
const cloud=(overrides={})=>({
  id:'outfit-1',
  airtableRecordId:'recOutfit1',
  name:'Canonical look',
  itemRecordIds:['recTop','recBag'],
  occasion:'Everyday',
  season:'All',
  note:'cloud',
  favorite:false,
  createdAt:'2026-08-18T10:00:00.000Z',
  updatedAt:'2026-08-18T11:00:00.000Z',
  ...overrides
});
const local=(overrides={})=>({
  id:'outfit-1',
  airtableRecordId:'recOutfit1',
  name:'Old local look',
  itemIds:['local-top'],
  occasion:'Work',
  season:'Winter',
  note:'local',
  favorite:true,
  source:'airtable',
  syncState:'synced',
  createdAt:'2026-08-18T10:00:00.000Z',
  updatedAt:'2026-08-18T10:30:00.000Z',
  ...overrides
});

{
  const plan=planCanonicalOutfitReconciliation({current:[],incoming:[cloud()],itemLocalByRemote:itemMap,syncedAt:'2026-08-19T00:00:00Z'});
  assert.equal(plan.upserts.length,1);
  assert.deepEqual(plan.upserts[0].itemIds,['local-top','local-bag']);
  assert.equal(plan.upserts[0].syncState,'synced');
  assert.deepEqual(plan.deleteLocalIds,[]);
}

{
  const plan=planCanonicalOutfitReconciliation({current:[local()],incoming:[cloud()],itemLocalByRemote:itemMap,syncedAt:'2026-08-19T00:00:00Z'});
  assert.equal(plan.upserts[0].name,'Canonical look');
  assert.equal(plan.upserts[0].occasion,'Everyday');
  assert.equal(plan.upserts[0].favorite,false);
}

{
  const plan=planCanonicalOutfitReconciliation({current:[local()],incoming:[],itemLocalByRemote:itemMap,syncedAt:'2026-08-19T00:00:00Z'});
  assert.deepEqual(plan.deleteLocalIds,['outfit-1']);
}

{
  const pending={id:'mut-1',operation:'update',localOutfitId:'outfit-1',airtableRecordId:'recOutfit1'};
  const protectedLocal=local({name:'Pending local edit',syncState:'pending-update'});
  const plan=planCanonicalOutfitReconciliation({current:[protectedLocal],incoming:[cloud()],mutations:[pending],itemLocalByRemote:itemMap,syncedAt:'2026-08-19T00:00:00Z'});
  assert.equal(plan.upserts[0].name,'Pending local edit');
  assert.equal(plan.upserts[0].syncState,'pending-update');
  assert.deepEqual(plan.deleteLocalIds,[]);
}

{
  const pendingDelete={id:'mut-del',operation:'delete',localOutfitId:'outfit-1',airtableRecordId:'recOutfit1'};
  const plan=planCanonicalOutfitReconciliation({current:[],incoming:[cloud()],mutations:[pendingDelete],itemLocalByRemote:itemMap,syncedAt:'2026-08-19T00:00:00Z'});
  assert.equal(plan.upserts.length,0,'pending delete must not resurrect an incoming remote outfit');
}

{
  const plan=planCanonicalOutfitReconciliation({
    current:[],incoming:[cloud()],itemLocalByRemote:itemMap,
    tombstones:{recOutfit1:'2026-08-18T23:59:00Z'},syncedAt:'2026-08-19T00:00:00Z'
  });
  assert.equal(plan.upserts.length,0,'delete tombstone must block read-lag resurrection');
  assert.ok(plan.tombstones.recOutfit1,'tombstone remains until remote absence is confirmed');
}

{
  const plan=planCanonicalOutfitReconciliation({
    current:[],incoming:[],itemLocalByRemote:itemMap,
    tombstones:{recOutfit1:'2026-08-18T23:59:00Z'},syncedAt:'2026-08-19T00:00:00Z'
  });
  assert.equal(plan.tombstones.recOutfit1,undefined,'canonical absence clears completed delete tombstone');
}

{
  const unsynced={id:'local-only',airtableRecordId:null,name:'Offline draft',itemIds:['local-top'],syncState:'pending-create'};
  const plan=planCanonicalOutfitReconciliation({current:[unsynced],incoming:[],mutations:[{id:'m',operation:'create',localOutfitId:'local-only'}],itemLocalByRemote:itemMap,syncedAt:'2026-08-19T00:00:00Z'});
  assert.deepEqual(plan.deleteLocalIds,[],'local-only pending outfits are never removed by canonical reads');
}

console.log('live outfit sync reconciliation: PASS');
