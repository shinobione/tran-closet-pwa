import assert from 'node:assert/strict';
import {recommendLooks,weatherProfile,weatherSummary} from '../js/daily-assistant-core.mjs';

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

console.log('daily assistant core: PASS');
