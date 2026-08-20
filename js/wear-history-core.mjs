export const WEAR_EVENT_SCHEMA_VERSION=1;
export const WEAR_MIN_ITEMS=2;

const arr=value=>Array.isArray(value)?value:[];
const uniqueIds=value=>[...new Set(arr(value).map(String).map(v=>v.trim()).filter(Boolean))];

function asDate(value){
  const date=value instanceof Date?new Date(value.getTime()):new Date(value??Date.now());
  if(Number.isNaN(date.getTime()))throw new Error('Invalid wear-event date');
  return date;
}

export function localDateKey(value=new Date()){
  const date=asDate(value);
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

export function wearEventId(outfitId,wornDate){
  const id=String(outfitId||'').trim();
  const date=String(wornDate||'').trim();
  if(!id)throw new Error('Wear event requires outfitId');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Wear event requires YYYY-MM-DD wornDate');
  return `wear:${encodeURIComponent(id)}:${date}`;
}

export function createWearEvent({outfit,itemIds,now=new Date(),existing=null}={}){
  const outfitId=String(outfit?.id||'').trim();
  if(!outfitId)throw new Error('Wear event requires a saved Outfit');
  const resolvedItemIds=uniqueIds(itemIds);
  if(resolvedItemIds.length<WEAR_MIN_ITEMS)throw new Error(`Wear event requires at least ${WEAR_MIN_ITEMS} resolved items`);
  const date=asDate(now);
  const wornDate=localDateKey(date);
  const id=wearEventId(outfitId,wornDate);
  if(existing&&String(existing.id)===id)return existing;
  const iso=date.toISOString();
  return {
    id,
    schemaVersion:WEAR_EVENT_SCHEMA_VERSION,
    outfitId,
    outfitNameSnapshot:String(outfit.name||'').trim(),
    itemIds:resolvedItemIds,
    wornAt:iso,
    wornDate,
    createdAt:iso,
    updatedAt:iso,
    source:'local'
  };
}

export function eventForOutfitDate(events,outfitId,date=new Date()){
  const id=wearEventId(outfitId,localDateKey(date));
  return arr(events).find(event=>String(event?.id||'')===id)||null;
}

function newerIso(a,b){
  if(!a)return b||null;
  if(!b)return a;
  return String(a).localeCompare(String(b))>=0?a:b;
}

function bump(bucket,key,event){
  if(!key)return;
  const current=bucket[key]||{count:0,lastWorn:null,lastWornDate:null};
  current.count+=1;
  current.lastWorn=newerIso(current.lastWorn,event.wornAt);
  current.lastWornDate=current.lastWorn?localDateKey(current.lastWorn):null;
  bucket[key]=current;
}

export function deriveWearStats(events=[]){
  const unique=[...new Map(arr(events).filter(Boolean).map(event=>[String(event.id||''),event])).values()]
    .filter(event=>event.id&&event.outfitId&&event.wornAt)
    .sort((a,b)=>String(a.wornAt).localeCompare(String(b.wornAt)));
  const byOutfit={};
  const byItem={};
  for(const event of unique){
    bump(byOutfit,String(event.outfitId),event);
    for(const itemId of uniqueIds(event.itemIds))bump(byItem,itemId,event);
  }
  return {eventCount:unique.length,byOutfit,byItem};
}
