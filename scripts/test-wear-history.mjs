import assert from 'node:assert/strict';
import {createWearEvent,deriveWearStats,eventForOutfitDate,localDateKey,wearEventId,WEAR_MIN_ITEMS} from '../js/wear-history-core.mjs';

const outfit={id:'outfit-1',name:'Friday Look'};
const dayOne=new Date('2026-08-19T08:30:00+02:00');
const dayOneLater=new Date('2026-08-19T21:00:00+02:00');
const dayTwo=new Date('2026-08-20T09:15:00+02:00');

assert.equal(WEAR_MIN_ITEMS,2);
assert.equal(localDateKey(dayOne),'2026-08-19');
assert.equal(wearEventId(outfit.id,'2026-08-19'),'wear:outfit-1:2026-08-19');

const first=createWearEvent({outfit,itemIds:['shirt-1','pant-1','shirt-1'],now:dayOne});
assert.equal(first.id,'wear:outfit-1:2026-08-19');
assert.deepEqual(first.itemIds,['shirt-1','pant-1']);
assert.equal(first.outfitNameSnapshot,'Friday Look');
assert.equal(first.source,'local');

const duplicate=createWearEvent({outfit,itemIds:['shirt-1','pant-1'],now:dayOneLater,existing:first});
assert.deepEqual(duplicate,first,'same outfit/day must be idempotent when an event already exists');

assert.throws(()=>createWearEvent({outfit,itemIds:['shirt-1'],now:dayOne}),/at least 2 resolved items/);
assert.throws(()=>createWearEvent({outfit:{name:'No id'},itemIds:['a','b'],now:dayOne}),/saved Outfit/);

const second=createWearEvent({outfit,itemIds:['shirt-1','skirt-1'],now:dayTwo});
const other=createWearEvent({outfit:{id:'outfit-2',name:'Work'},itemIds:['shirt-1','bag-1'],now:dayTwo});

assert.equal(eventForOutfitDate([first,second],outfit.id,dayOne)?.id,first.id);
assert.equal(eventForOutfitDate([first,second],outfit.id,dayTwo)?.id,second.id);

const stats=deriveWearStats([first,first,second,other]);
assert.equal(stats.eventCount,3,'duplicate IDs must not inflate stats');
assert.equal(stats.byOutfit['outfit-1'].count,2);
assert.equal(stats.byOutfit['outfit-1'].lastWorn,second.wornAt);
assert.equal(stats.byItem['shirt-1'].count,3);
assert.equal(stats.byItem['pant-1'].count,1);
assert.equal(stats.byItem['skirt-1'].count,1);

const afterDelete=deriveWearStats([first,other]);
assert.equal(afterDelete.byOutfit['outfit-1'].count,1);
assert.equal(afterDelete.byOutfit['outfit-1'].lastWorn,first.wornAt);
assert.equal(afterDelete.byItem['skirt-1'],undefined,'deleting an event must recompute derived item usage');
assert.equal(afterDelete.byItem['shirt-1'].count,2);

console.log('Wear-history event model: PASS');
