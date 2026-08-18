import legacyWorker from './index.js';

const BASE_ID='appw8WNvdDuXUgYvN';
const CLOTHES_TABLE_ID='tblKdCi4MI4AH26y8';
const OUTFITS_TABLE_ID='tblhtL2UlsgCAh6E7';
const FIELDS={
  name:'fldaUBTQHssIqjYJ3',
  category:'fldFgbepFfRYzQiSf',
  colors:'fld9c3S0zKQ1AaMWL',
  styles:'fldzFgTZ5iiakQBcy',
  tags:'fld9hV9qirpfVfJmM',
  photo:'fldgISbij3vO9IvjM',
  syncMutationId:'flduWxlbNrsksgjNa'
};
const OUTFIT_FIELDS={
  name:'fld8cozGXyHe1WxfF',
  items:'fldhPBvZmXqpbxZxV',
  occasion:'fldGN3lR9FhgZEf8G',
  season:'fldBfddYsS8EdFWfq',
  note:'fldXR2R6TCR5ugXzi',
  favorite:'fldiAG6eouQ8fhB7d',
  outfitId:'fld0mNaoxnTIckVXI',
  createdAt:'fld1BX75icHbk0s24',
  updatedAt:'fld91MiD4MayOVZk8'
};

function cors(origin,env){
  const allowed=env.ALLOWED_ORIGIN||'https://shinobione.github.io';
  return {
    'access-control-allow-origin':origin===allowed?origin:allowed,
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'authorization,content-type',
    'vary':'Origin',
    'cache-control':'no-store'
  };
}
function json(body,status=200,headers={}){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});
}
function bearer(request){
  const value=request.headers.get('authorization')||'';
  return value.startsWith('Bearer ')?value.slice(7):'';
}
function normalizeCategory(value){
  const clean=String(value||'').trim();
  return clean==='Swimware'?'Swimware':clean;
}
function arr(value){return Array.isArray(value)?value:[];}

async function readTableRecords(tableId,env){
  if(!env.AIRTABLE_READ_PAT)throw new Error('Worker Airtable read secret not configured');
  const records=[];
  let offset='';
  do{
    const params=new URLSearchParams({pageSize:'100',returnFieldsByFieldId:'true'});
    if(offset)params.set('offset',offset);
    const response=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`,{
      headers:{'authorization':`Bearer ${env.AIRTABLE_READ_PAT}`,'content-type':'application/json'}
    });
    const text=await response.text();
    let body=null;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}
    if(!response.ok)throw new Error(`Airtable read ${response.status}: ${JSON.stringify(body)}`);
    records.push(...arr(body?.records));
    offset=String(body?.offset||'');
  }while(offset);
  return records;
}

async function readCanonicalItems(env){
  const records=await readTableRecords(CLOTHES_TABLE_ID,env);
  return records.map(record=>{
    const fields=record?.fields||{};
    const attachment=arr(fields[FIELDS.photo])[0]||null;
    return {
      id:`airtable-${record.id}`,
      airtableRecordId:record.id,
      name:String(fields[FIELDS.name]||'').trim()||'Untitled',
      category:normalizeCategory(fields[FIELDS.category]||'Accessorie'),
      colors:arr(fields[FIELDS.colors]),
      styles:arr(fields[FIELDS.styles]),
      tags:arr(fields[FIELDS.tags]),
      photo:attachment?.url||null,
      photoAttachmentId:attachment?.id||null,
      favorite:false,
      source:'airtable',
      syncState:'synced',
      createdAt:record.createdTime||null,
      updatedAt:record.createdTime||null
    };
  });
}

async function readCanonicalOutfits(env){
  const records=await readTableRecords(OUTFITS_TABLE_ID,env);
  return records.map(record=>{
    const fields=record?.fields||{};
    const outfitId=String(fields[OUTFIT_FIELDS.outfitId]||'').trim();
    if(!outfitId)throw new Error(`Airtable outfit ${record.id} is missing Outfit ID`);
    return {
      id:outfitId,
      airtableRecordId:record.id,
      name:String(fields[OUTFIT_FIELDS.name]||'').trim()||'Outfit',
      itemRecordIds:arr(fields[OUTFIT_FIELDS.items]).map(String),
      occasion:String(fields[OUTFIT_FIELDS.occasion]||'Everyday'),
      season:String(fields[OUTFIT_FIELDS.season]||'All'),
      note:String(fields[OUTFIT_FIELDS.note]||''),
      favorite:Boolean(fields[OUTFIT_FIELDS.favorite]),
      source:'airtable',
      syncState:'synced',
      createdAt:String(fields[OUTFIT_FIELDS.createdAt]||record.createdTime||''),
      updatedAt:String(fields[OUTFIT_FIELDS.updatedAt]||fields[OUTFIT_FIELDS.createdAt]||record.createdTime||'')
    };
  });
}

async function retryLegacyAi(request,env){
  let lastResponse=null;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await legacyWorker.fetch(request.clone(),env);
      lastResponse=response;
      if(![502,503,504].includes(response.status))return response;
    }catch(error){
      if(attempt===3)throw error;
    }
    if(attempt<3)await new Promise(resolve=>setTimeout(resolve,250*attempt));
  }
  return lastResponse||json({ok:false,error:'AI temporarily unavailable'},502);
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const origin=request.headers.get('origin')||'';
    const headers=cors(origin,env);

    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});

    if(url.pathname==='/v1/items'&&request.method==='GET'){
      if(!env.CLOSET_SYNC_KEY)return json({error:'Worker sync key not configured'},503,headers);
      if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,headers);
      try{
        const items=await readCanonicalItems(env);
        return json({ok:true,syncedAt:new Date().toISOString(),recordCount:items.length,items},200,headers);
      }catch(error){
        return json({ok:false,error:String(error?.message||error)},502,headers);
      }
    }

    if(url.pathname==='/v1/outfits'&&request.method==='GET'){
      if(!env.CLOSET_SYNC_KEY)return json({error:'Worker sync key not configured'},503,headers);
      if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,headers);
      try{
        const outfits=await readCanonicalOutfits(env);
        return json({ok:true,syncedAt:new Date().toISOString(),recordCount:outfits.length,outfits},200,headers);
      }catch(error){
        return json({ok:false,error:String(error?.message||error)},502,headers);
      }
    }

    if(url.pathname==='/v1/analyze-item'&&request.method==='POST'){
      return retryLegacyAi(request,env);
    }

    return legacyWorker.fetch(request,env);
  }
};
