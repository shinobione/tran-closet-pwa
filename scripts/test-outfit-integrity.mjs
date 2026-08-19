import assert from 'node:assert/strict';
import {outfitIntegrity,completeOutfits,OUTFIT_MIN_ITEMS} from '../js/outfit-integrity.mjs';
import {recommendLooks} from '../js/daily-assistant-core.mjs';

const top={id:'top-1',name:'Top',category:'Shirt',colors:['White'],styles:['Casual'],tags:[]};
const bottom={id:'bottom-1',name:'Bottom',category:'Pant',colors:['Black'],styles:['Casual'],tags:[]};
const dress={id:'dress-1',name:'Dress',category:'Dress',colors:['Black'],styles:['Classy'],tags:[]};
const bag={id:'bag-1',name:'Bag',category:'Bag',colors:['Pink'],styles:['Casual'],tags:[]};
const items=[top,bottom,dress,bag];

const onePieceOnly={id:'outfit-one',name:'One piece only',itemIds:['dress-1'],occasion:'Everyday',season:'All'};
const complete={id:'outfit-complete',name:'Complete',itemIds:['top-1','bottom-1'],occasion:'Everyday',season:'All'};
const missingLink={id:'outfit-missing',name:'Missing link',itemIds:['top-1','deleted-item'],occasion:'Everyday',season:'All'};

assert.equal(OUTFIT_MIN_ITEMS,2);
assert.deepEqual(outfitIntegrity(onePieceOnly,items),{
  state:'incomplete',incomplete:true,complete:false,itemCount:1,minimumItemCount:2,
  requestedItemIds:['dress-1'],resolvedItemIds:['dress-1'],missingItemIds:[],items:[dress]
});
assert.equal(outfitIntegrity(complete,items).state,'complete');
assert.equal(outfitIntegrity(missingLink,items).state,'incomplete');
assert.deepEqual(outfitIntegrity(missingLink,items).missingItemIds,['deleted-item']);
assert.deepEqual(completeOutfits([onePieceOnly,complete,missingLink],items).map(o=>o.id),['outfit-complete']);

const result=recommendLooks({
  items,
  outfits:[onePieceOnly,complete,missingLink],
  weather:{temperature:26,apparentTemperature:26,dailyMax:29,dailyMin:22},
  occasion:'Everyday',
  limit:10
});

const ids=result.suggestions.map(s=>s.id);
assert.ok(ids.includes('saved:outfit-complete'),'complete saved Outfit should stay eligible');
assert.ok(!ids.includes('saved:outfit-one'),'single-item saved Outfit must not be ranked as complete');
assert.ok(!ids.includes('saved:outfit-missing'),'Outfit with only one resolved item must not be ranked as complete');

console.log('Outfit integrity contract: PASS');
