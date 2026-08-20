import {outfitIntegrity} from './outfit-integrity.mjs?v=0.5.18';

const ROLES={
  top:new Set(['Shirt','Coat']),bottom:new Set(['Pant','Skirt']),one:new Set(['Dress','Combo','Jumpsuit']),
  shoes:new Set(['Shoes']),bag:new Set(['Bag']),head:new Set(['Headwear']),umbrella:new Set(['Umbrella']),extra:new Set(['Accessorie','Belt'])
};
const EXCLUDED_CATEGORIES=new Set(['Underwear','Swimware','Eye Lens','Socks']);
const RAIN_CODES=new Set([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99]);
const NEUTRALS=new Set(['Black','White','Grey','Brown']);

// Legacy labels remain exported for compatibility with older callers/tests. New
// UI rendering uses keyed `occasion.<value>` translations.
export const OCCASION_LABELS={Everyday:'Hằng ngày',Work:'Đi làm',Date:'Hẹn hò',Party:'Tiệc',Travel:'Du lịch',Sport:'Thể thao',Formal:'Trang trọng',Other:'Khác'};
export const OCCASIONS=Object.keys(OCCASION_LABELS);

const OCCASION_SIGNALS={
  Everyday:{styles:['Casual'],tags:['Relaxed','Cozy','Minimal']},Work:{styles:['Classy'],tags:['Minimal','Neutral','Fitted']},
  Date:{styles:['Classy','Casual'],tags:['Statement','Fitted','Minimal']},Party:{styles:['Classy','Hip-Hop'],tags:['Statement','Graphic','Colorful']},
  Travel:{styles:['Casual','Sport'],tags:['Travel-friendly','Compact','Lightweight','Relaxed']},Sport:{styles:['Sport'],tags:['Lightweight','Relaxed','Fitted']},
  Formal:{styles:['Classy'],tags:['Minimal','Neutral','Fitted']},Other:{styles:[],tags:[]}
};
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const unique=values=>[...new Set(values.filter(Boolean))];
const reason=(key,params={})=>({key,params});

export function weatherProfile(weather={}){
  const apparent=num(weather.apparentTemperature??weather.temperature),max=num(weather.dailyMax??weather.temperature),min=num(weather.dailyMin??weather.temperature);
  const precipProbability=num(weather.precipitationProbability),precipitation=num(weather.precipitation)+num(weather.rain)+num(weather.showers),weatherCode=num(weather.weatherCode),wind=num(weather.windSpeed);
  const rainy=precipitation>0.1||precipProbability>=45||RAIN_CODES.has(weatherCode),veryHot=apparent>=33||max>=34,hot=veryHot||apparent>=28||max>=30,cool=!hot&&(apparent<=22||max<=24||min<=18),windy=wind>=25;
  return {apparent,max,min,precipProbability,precipitation,weatherCode,wind,rainy,veryHot,hot,cool,windy,season:rainy?'Rainy':hot?'Hot':cool?'Cool':'All'};
}
function roleOf(category){for(const [role,set] of Object.entries(ROLES))if(set.has(category))return role;return null;}
export function isWearableLook(items=[]){const roles=new Set(items.filter(item=>item&&!EXCLUDED_CATEGORIES.has(item.category)).map(item=>roleOf(item.category)).filter(Boolean));return roles.has('one')||(roles.has('top')&&roles.has('bottom'));}
function occasionScore(item,occasion){const signal=OCCASION_SIGNALS[occasion]||OCCASION_SIGNALS.Other,styles=new Set(arr(item.styles)),tags=new Set(arr(item.tags));let score=0;for(const style of signal.styles)if(styles.has(style))score+=7;for(const tag of signal.tags)if(tags.has(tag))score+=4;return score;}
export function itemWeatherScore(item,profile,occasion='Everyday'){
  const tags=new Set(arr(item.tags)),styles=new Set(arr(item.styles)),role=roleOf(item.category);let score=occasionScore(item,occasion)+(item.favorite?3:0);
  if(profile.hot){if(tags.has('Lightweight')||tags.has('Summer'))score+=9;if(tags.has('Warm')||tags.has('Winter'))score-=12;if(item.category==='Coat')score-=16;if(role==='head')score+=3;}
  if(profile.veryHot&&tags.has('Lightweight'))score+=4;
  if(profile.cool){if(tags.has('Warm')||tags.has('Winter')||tags.has('Layering'))score+=9;if(tags.has('Summer'))score-=5;}
  if(profile.rainy){if(tags.has('Rain-ready'))score+=14;if(role==='umbrella')score+=24;if(tags.has('Lightweight'))score+=2;}else if(role==='umbrella')score-=14;
  if(profile.windy&&tags.has('Lightweight'))score-=2;if(occasion==='Sport'&&styles.has('Sport'))score+=6;if(occasion==='Formal'&&styles.has('Hip-Hop'))score-=4;return score;
}
function colorHarmony(items){const colors=unique(items.flatMap(item=>arr(item.colors)));if(colors.length<=1)return 5;const nonNeutral=colors.filter(color=>!NEUTRALS.has(color));if(nonNeutral.length<=2&&colors.length<=4)return 4;if(nonNeutral.length>=4)return -4;return 0;}
function addOptional(base,groups,profile,occasion){
  const items=[...base],used=new Set(items.map(i=>i.id));const best=group=>group.filter(i=>!used.has(i.id)).sort((a,b)=>itemWeatherScore(b,profile,occasion)-itemWeatherScore(a,profile,occasion))[0];
  const shoes=best(groups.shoes);if(shoes){items.push(shoes);used.add(shoes.id);}if(profile.rainy){const umbrella=best(groups.umbrella);if(umbrella){items.push(umbrella);used.add(umbrella.id);}}
  const bag=best(groups.bag);if(bag){items.push(bag);used.add(bag.id);}if(items.length<5&&(profile.hot||occasion==='Everyday'||occasion==='Travel')){const head=best(groups.head);if(head){items.push(head);used.add(head.id);}}
  if(items.length<5){const extra=best(groups.extra);if(extra)items.push(extra);}return items;
}
function candidateReasons(items,profile,occasion,source){
  const tags=new Set(items.flatMap(item=>arr(item.tags))),styles=new Set(items.flatMap(item=>arr(item.styles))),reasons=[];
  if(source==='saved')reasons.push(reason('daily.reason.saved'));
  if(profile.rainy){if(items.some(item=>item.category==='Umbrella')||tags.has('Rain-ready'))reasons.push(reason('daily.reason.rainReady',{chance:profile.precipProbability?Math.round(profile.precipProbability):0}));else reasons.push(reason('daily.reason.rainReminder'));}
  if(profile.hot&&(tags.has('Lightweight')||tags.has('Summer')))reasons.push(reason('daily.reason.hotLight'));
  if(profile.cool&&(tags.has('Warm')||tags.has('Layering')||tags.has('Winter')))reasons.push(reason('daily.reason.coolWarm'));
  const signal=OCCASION_SIGNALS[occasion]||OCCASION_SIGNALS.Other;if(signal.styles.some(style=>styles.has(style)))reasons.push(reason('daily.reason.occasion',{occasion}));
  if(!reasons.length)reasons.push(reason('daily.reason.balanced',{occasion}));return reasons.slice(0,3);
}
function groupsFor(items){const groups={top:[],bottom:[],one:[],shoes:[],bag:[],head:[],umbrella:[],extra:[]};for(const item of items){if(EXCLUDED_CATEGORIES.has(item.category))continue;const role=roleOf(item.category);if(role&&groups[role])groups[role].push(item);}return groups;}
function scoreGenerated(items,profile,occasion){return items.reduce((sum,item)=>sum+itemWeatherScore(item,profile,occasion),0)+colorHarmony(items)+items.length*2;}
function sameItemSet(a,b){const aa=[...a].map(String).sort(),bb=[...b].map(String).sort();return aa.length===bb.length&&aa.every((value,index)=>value===bb[index]);}
function bestItem(group,profile,occasion){return [...group].sort((a,b)=>itemWeatherScore(b,profile,occasion)-itemWeatherScore(a,profile,occasion))[0]||null;}
function partialReasons(groups){
  if(groups.top.length&&!groups.bottom.length)return [reason('daily.reason.missingBottom'),reason('daily.reason.availableBest')];
  if(groups.bottom.length&&!groups.top.length)return [reason('daily.reason.missingTop'),reason('daily.reason.availableBest')];
  return [reason('daily.reason.missingCore'),reason('daily.reason.availableBest')];
}

export function recommendLooks({items=[],outfits=[],weather={},occasion='Everyday',limit=3}={}){
  const profile=weatherProfile(weather),groups=groupsFor(items),candidates=[];
  for(const outfit of outfits){
    const integrity=outfitIntegrity(outfit,items);if(integrity.incomplete)continue;
    const outfitItems=integrity.items.filter(item=>!EXCLUDED_CATEGORIES.has(item.category));if(!isWearableLook(outfitItems))continue;
    let score=outfitItems.reduce((sum,item)=>sum+itemWeatherScore(item,profile,occasion),0)+colorHarmony(outfitItems);
    if(outfit.occasion===occasion)score+=38;else if(outfit.occasion==='Everyday')score+=8;if(outfit.season===profile.season)score+=18;else if(outfit.season==='All')score+=10;if(outfit.favorite)score+=5;
    candidates.push({id:`saved:${outfit.id}`,source:'saved',outfitId:outfit.id,name:outfit.name,itemIds:outfitItems.map(item=>item.id),items:outfitItems,score,complete:true,season:profile.season,reasons:candidateReasons(outfitItems,profile,occasion,'saved')});
  }
  const sortedTops=[...groups.top].sort((a,b)=>itemWeatherScore(b,profile,occasion)-itemWeatherScore(a,profile,occasion)).slice(0,6),sortedBottoms=[...groups.bottom].sort((a,b)=>itemWeatherScore(b,profile,occasion)-itemWeatherScore(a,profile,occasion)).slice(0,6),sortedOnes=[...groups.one].sort((a,b)=>itemWeatherScore(b,profile,occasion)-itemWeatherScore(a,profile,occasion)).slice(0,6);
  let generatedIndex=0;
  for(const one of sortedOnes){const index=++generatedIndex,look=addOptional([one],groups,profile,occasion);candidates.push({id:`generated:${index-1}`,source:'generated',nameKey:'daily.generatedCandidate',nameParams:{index},itemIds:look.map(i=>i.id),items:look,score:scoreGenerated(look,profile,occasion)+16,complete:true,season:profile.season,reasons:candidateReasons(look,profile,occasion,'generated')});}
  for(const top of sortedTops){for(const bottom of sortedBottoms){const index=++generatedIndex,look=addOptional([top,bottom],groups,profile,occasion);candidates.push({id:`generated:${index-1}`,source:'generated',nameKey:'daily.generatedCandidate',nameParams:{index},itemIds:look.map(i=>i.id),items:look,score:scoreGenerated(look,profile,occasion)+20,complete:true,season:profile.season,reasons:candidateReasons(look,profile,occasion,'generated')});}}
  if(!candidates.some(candidate=>candidate.source==='generated')){
    const partialBase=[],top=bestItem(groups.top,profile,occasion),bottom=bestItem(groups.bottom,profile,occasion);if(top&&!bottom)partialBase.push(top);else if(bottom&&!top)partialBase.push(bottom);
    const support=addOptional(partialBase,groups,profile,occasion).slice(0,4);if(support.length)candidates.push({id:'partial:closet',source:'partial',nameKey:'daily.partialCandidate',itemIds:support.map(i=>i.id),items:support,score:scoreGenerated(support,profile,occasion),complete:false,season:profile.season,reasons:partialReasons(groups)});
  }
  const deduped=[];for(const candidate of candidates.sort((a,b)=>b.score-a.score)){if(deduped.some(existing=>sameItemSet(existing.itemIds,candidate.itemIds)))continue;deduped.push(candidate);}
  const selected=[],pool=[...deduped];while(selected.length<limit&&pool.length){let bestIndex=0,bestAdjusted=-Infinity;for(let index=0;index<pool.length;index++){const overlap=selected.reduce((sum,chosen)=>sum+pool[index].itemIds.filter(id=>chosen.itemIds.includes(id)).length,0),adjusted=pool[index].score-overlap*7;if(adjusted>bestAdjusted){bestAdjusted=adjusted;bestIndex=index;}}selected.push(pool.splice(bestIndex,1)[0]);}
  return {profile,suggestions:selected};
}

export function weatherSummaryParts(profile={}){
  const parts=[];if(profile.hot)parts.push(reason(profile.veryHot?'weather.summary.veryHot':'weather.summary.hot'));else if(profile.cool)parts.push(reason('weather.summary.cool'));else parts.push(reason('weather.summary.pleasant'));
  if(profile.rainy)parts.push(reason('weather.summary.rain',{chance:profile.precipProbability?Math.round(profile.precipProbability):0}));if(profile.windy)parts.push(reason('weather.summary.windy'));return parts;
}

// Kept for non-UI compatibility; new UI renders `weatherSummaryParts` through keyed i18n.
export function weatherSummary(profile){
  const vi={'weather.summary.veryHot':'rất nóng','weather.summary.hot':'nóng','weather.summary.cool':'mát','weather.summary.pleasant':'dễ chịu','weather.summary.windy':'có gió'};
  return weatherSummaryParts(profile).map(part=>part.key==='weather.summary.rain'?`có mưa${part.params.chance?` ${part.params.chance}%`:''}`:vi[part.key]||part.key).join(' · ');
}
