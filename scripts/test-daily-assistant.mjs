import assert from 'node:assert/strict';
import {recommendLooks,weatherProfile,weatherSummary,isWearableLook} from '../js/daily-assistant-core.mjs';

const items=[
  {id:'top',name:'White Tee',category:'Shirt',colors:['White'],styles:['Casual'],tags:['Lightweight','Summer'],favorite:true},
  {id:'bottom',name:'Black Pants',category:'Pant',colors:['Black'],styles:['Casual'],tags:['Neutral']},
  {id:'dress',name:'Classy Dress',category:'Dress',colors:['Red'],styles:['Classy'],tags:['Statement']},
  {id:'shoes',name:'Sneakers',category:'Shoes',colors:['White'],styles:['Sport','Casual'],tags:['Lightweight']},
  {id:'bag',name:'Travel Bag',category:'Bag',colors:['Black'],styles:['Casual'],tags:['Travel-friendly','Compact']},
  {id:'umbrella',name:'Umbrella',category:'Umbrella',colors:['Blue'],styles:[],tags:['Rain-ready','Compact']},
  {id:'underwear',name:'Boxer',category:'Underwear',colors:['Green'],styles:[],tags:['Fitted']}
];
const outfits=[{id:'saved',name:'Work look',itemIds:['top','bottom','shoes'],occasion:'Work',season:'All',favorite:true}];

const rainy=weatherProfile({temperature:29,apparentTemperature:31,dailyMax:32,dailyMin:26,precipitationProbability:80,weatherCode:61,windSpeed:12});
assert.equal(rainy.rainy,true);
assert.equal(rainy.hot,true);
assert.equal(rainy.season,'Rainy');
assert.match(weatherSummary(rainy),/mưa/);

assert.equal(isWearableLook([items[0],items[1]]),true,'top + bottom should be wearable');
assert.equal(isWearableLook([items[2]]),true,'one-piece garment should be wearable');
assert.equal(isWearableLook([items[4],items[5]]),false,'accessories alone must not be a wearable look');
assert.equal(isWearableLook([items[6],items[4]]),false,'underwear + accessory must not be a wearable look');

const result=recommendLooks({items,outfits,weather:{temperature:29,apparentTemperature:31,dailyMax:32,dailyMin:26,precipitationProbability:80,weatherCode:61,windSpeed:12},occasion:'Everyday',limit:3});
assert.ok(result.suggestions.length>=1&&result.suggestions.length<=3);
const generated=result.suggestions.find(s=>s.source==='generated');
assert.ok(generated,'expected a generated look');
assert.ok(generated.itemIds.includes('top'));
assert.ok(generated.itemIds.includes('bottom'));
assert.ok(generated.itemIds.includes('umbrella'),'rainy generated look should include umbrella when available');
assert.ok(!generated.itemIds.includes('underwear'),'underwear must never be selected as an outfit core/support item');
assert.ok(generated.reasons.some(reason=>reason.includes('mưa')));

const work=recommendLooks({items,outfits,weather:{temperature:23,apparentTemperature:23,dailyMax:25,dailyMin:19,precipitationProbability:0,weatherCode:1,windSpeed:8},occasion:'Work',limit:1});
assert.equal(work.suggestions[0].source,'saved');
assert.equal(work.suggestions[0].outfitId,'saved');

const accessoriesOnly=recommendLooks({items:items.filter(item=>['Bag','Headwear','Umbrella','Accessorie'].includes(item.category)),outfits:[],weather:{temperature:31,apparentTemperature:34,dailyMax:35,dailyMin:27,precipitationProbability:10,weatherCode:1},occasion:'Everyday',limit:3});
assert.equal(accessoriesOnly.suggestions[0]?.complete,false);
assert.equal(accessoriesOnly.suggestions[0]?.source,'partial');

// Regression from real production QA: the saved "Lookbook Test" contains only
// Neck Poca (Accessorie) + Melody Bag (Bag). It is a valid saved collection,
// but must never be ranked as a complete "what should I wear" recommendation.
// The current real closet also contains one usable top (Hazard shirt) but no
// bottom yet, so the partial fallback must surface that top instead of hiding it.
const realQaItems=[
  {id:'hazard',name:'Maillot Hazard Real Madrid',category:'Shirt',colors:['White'],styles:['Sport'],tags:['Text']},
  {id:'neck',name:'Neck Poca',category:'Accessorie',colors:['Blue'],styles:['Casual'],tags:[]},
  {id:'melody',name:'Melody Bag',category:'Bag',colors:['Pink'],styles:['Cartoon'],tags:[]},
  {id:'cap',name:'VietCap',category:'Headwear',colors:['Green','Red'],styles:['Casual'],tags:['Graphic','Logo']},
  {id:'umbrella-real',name:'Parapluie James',category:'Umbrella',colors:['Blue','Red'],styles:['Cartoon'],tags:['Patterned','Colorful']},
  {id:'panty',name:"Jerry's Panty",category:'Underwear',colors:['Green'],styles:[],tags:['Graphic','Text']}
];
const realQaOutfits=[{id:'lookbook',name:'Lookbook Test',itemIds:['neck','melody'],occasion:'Everyday',season:'All',favorite:false}];
const realQa=recommendLooks({items:realQaItems,outfits:realQaOutfits,weather:{temperature:31,apparentTemperature:34,dailyMax:35,dailyMin:27,precipitationProbability:10,weatherCode:1},occasion:'Everyday',limit:3});
assert.ok(!realQa.suggestions.some(s=>s.source==='saved'),'accessory-only saved outfit must be rejected');
assert.equal(realQa.suggestions[0]?.source,'partial','assistant should fall back to an incomplete but useful look');
assert.equal(realQa.suggestions[0]?.complete,false);
assert.ok(realQa.suggestions[0]?.itemIds.includes('hazard'),'available top must be surfaced in an incomplete look');
assert.ok(!realQa.suggestions[0]?.itemIds.includes('panty'),'underwear remains excluded from partial suggestions');
assert.ok(realQa.suggestions[0]?.reasons.some(reason=>reason.includes('thiếu quần/váy')),'partial reason should explain the missing bottom');

const bottomOnly=recommendLooks({
  items:[
    {id:'skirt-only',name:'Black Skirt',category:'Skirt',colors:['Black'],styles:['Casual'],tags:[]},
    {id:'bag-only',name:'Bag',category:'Bag',colors:['Brown'],styles:['Casual'],tags:[]}
  ],
  outfits:[],weather:{temperature:27,apparentTemperature:27,dailyMax:29,dailyMin:23,weatherCode:1},occasion:'Everyday',limit:1
});
assert.ok(bottomOnly.suggestions[0]?.itemIds.includes('skirt-only'),'available bottom must be surfaced when top is missing');
assert.ok(bottomOnly.suggestions[0]?.reasons.some(reason=>reason.includes('thiếu áo')),'partial reason should explain the missing top');

console.log('daily assistant core: PASS');
