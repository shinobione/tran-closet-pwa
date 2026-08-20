import v059 from './v059.js';

const BASE_ID='appw8WNvdDuXUgYvN';
const WEAR_TABLE_ID='tblnkYdIz1dVZZhEF';
const WEAR_FIELDS={
  eventId:'fldPhcFI4VLVmOCdp',
  schemaVersion:'fldRjJIWHjRrCKQC0',
  outfitId:'fldpFwy41wzB3fAKt',
  outfitNameSnapshot:'fld0YJPEPEPXcveyn',
  itemRecordIds:'fldAkT4KcuSDooDmz',
  wornAt:'fldQGt73RL3iFhggz',
  wornDate:'fldCh9v3JTjrmgPri',
  createdAt:'fldTltl9005fWtdHE',
  updatedAt:'fldU2p6onWMXsllaS'
};

const arr=value=>Array.isArray(value)?value:[];
const unique=value=>[...new Set(arr(value).map(String).map(v=>v.trim()).filter(Boolean))];

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
function parseItemRecordIds(value){
  if(Array.isArray(value))return unique(value);
  const text=String(value||'').trim();
  if(!text)return [];
  try{return unique(JSON.parse(text));}catch{return unique(text.split(','));}
}

async function airtableRead(env){
  if(!env.AIRTABLE_READ_PAT)throw new Error('Worker Airtable read secret not configured');
  const records=[];
  let offset='';
  do{
    const params=new URLSearchParams({pageSize:'100',returnFieldsByFieldId:'true'});
    if(offset)params.set('offset',offset);
    const response=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${WEAR_TABLE_ID}?${params}`,{
      headers:{'authorization':`Bearer ${env.AIRTABLE_READ_PAT}`,'content-type':'application/json'}
    });
    const text=await response.text();
    let body=null;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}
    if(!response.ok)throw new Error(`Airtable wear read ${response.status}: ${JSON.stringify(body)}`);
    records.push(...arr(body?.records));
    offset=String(body?.offset||'');
  }while(offset);
  return records;
}

async function airtableWrite(path,env,options={}){
  if(!env.AIRTABLE_PAT)throw new Error('Worker Airtable write secret not configured');
  const response=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${WEAR_TABLE_ID}${path}`,{
    ...options,
    headers:{'authorization':`Bearer ${env.AIRTABLE_PAT}`,'content-type':'application/json',...(options.headers||{})}
  });
  const text=await response.text();
  let body=null;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}
  if(!response.ok){
    const error=new Error(`Airtable wear ${response.status}: ${JSON.stringify(body)}`);
    error.status=response.status;
    throw error;
  }
  return body;
}

function wearFieldsFromPayload(payload={}){
  const eventId=String(payload.eventId||'').trim();
  const outfitId=String(payload.outfitId||'').trim();
  const wornAt=String(payload.wornAt||'').trim();
  const wornDate=String(payload.wornDate||'').trim();
  const itemRecordIds=unique(payload.itemRecordIds);
  if(!eventId)throw new Error('Missing Wear Event ID');
  if(!outfitId)throw new Error('Missing Outfit ID');
  if(!wornAt)throw new Error('Missing wornAt');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(wornDate))throw new Error('Invalid wornDate');
  if(itemRecordIds.length<2)throw new Error('Wear event requires at least two canonical item record IDs');
  return {
    [WEAR_FIELDS.eventId]:eventId,
    [WEAR_FIELDS.schemaVersion]:Number(payload.schemaVersion||1),
    [WEAR_FIELDS.outfitId]:outfitId,
    [WEAR_FIELDS.outfitNameSnapshot]:String(payload.outfitNameSnapshot||'').trim(),
    [WEAR_FIELDS.itemRecordIds]:JSON.stringify(itemRecordIds),
    [WEAR_FIELDS.wornAt]:wornAt,
    [WEAR_FIELDS.wornDate]:wornDate,
    [WEAR_FIELDS.createdAt]:String(payload.createdAt||wornAt),
    [WEAR_FIELDS.updatedAt]:String(payload.updatedAt||payload.createdAt||wornAt)
  };
}

async function readCanonicalWearEvents(env){
  const records=await airtableRead(env);
  return records.map(record=>{
    const fields=record?.fields||{};
    const eventId=String(fields[WEAR_FIELDS.eventId]||'').trim();
    if(!eventId)throw new Error(`Airtable wear event ${record.id} is missing Wear Event ID`);
    return {
      id:eventId,
      airtableRecordId:record.id,
      schemaVersion:Number(fields[WEAR_FIELDS.schemaVersion]||1),
      outfitId:String(fields[WEAR_FIELDS.outfitId]||'').trim(),
      outfitNameSnapshot:String(fields[WEAR_FIELDS.outfitNameSnapshot]||''),
      itemRecordIds:parseItemRecordIds(fields[WEAR_FIELDS.itemRecordIds]),
      wornAt:String(fields[WEAR_FIELDS.wornAt]||''),
      wornDate:String(fields[WEAR_FIELDS.wornDate]||''),
      createdAt:String(fields[WEAR_FIELDS.createdAt]||record.createdTime||''),
      updatedAt:String(fields[WEAR_FIELDS.updatedAt]||fields[WEAR_FIELDS.createdAt]||record.createdTime||''),
      source:'airtable',
      syncState:'synced'
    };
  });
}

async function applyWearMutation(mutation,env){
  const operation=mutation?.operation;
  if(operation==='create'){
    const fields=wearFieldsFromPayload({...mutation.payload,eventId:mutation.eventId||mutation.payload?.eventId});
    const body=await airtableWrite('',env,{method:'PATCH',body:JSON.stringify({
      performUpsert:{fieldsToMergeOn:[WEAR_FIELDS.eventId]},
      records:[{fields}],
      typecast:false
    })});
    const recordId=body?.records?.[0]?.id;
    if(!recordId)throw new Error('Airtable wear upsert returned no record id');
    return {mutationId:mutation.id,ok:true,airtableRecordId:recordId};
  }
  if(operation==='delete'){
    if(!mutation.airtableRecordId)return {mutationId:mutation.id,ok:true,skipped:true};
    try{await airtableWrite(`/${mutation.airtableRecordId}`,env,{method:'DELETE'});}
    catch(error){if(error?.status!==404)throw error;}
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  throw new Error(`Unsupported wear operation: ${operation}`);
}

async function runWearMutations(mutations,env){
  const results=[];
  for(const mutation of mutations){
    try{results.push(await applyWearMutation(mutation,env));}
    catch(error){results.push({mutationId:mutation?.id||null,ok:false,error:String(error?.message||error)});}
  }
  return results;
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const wearRoute=url.pathname==='/v1/wear-events'||url.pathname==='/v1/wear-mutations';
    if(!wearRoute&&url.pathname!=='/health')return v059.fetch(request,env);

    if(url.pathname==='/health'&&request.method==='GET'){
      const legacyResponse=await v059.fetch(request,env);
      if(!legacyResponse.ok)return legacyResponse;
      let body=null;try{body=await legacyResponse.clone().json();}catch{return legacyResponse;}
      const headers=new Headers(legacyResponse.headers);
      headers.set('content-type','application/json; charset=utf-8');
      return new Response(JSON.stringify({...body,workerRevision:'v060',wearHistory:'canonical-v1'}),{status:legacyResponse.status,headers});
    }

    const origin=request.headers.get('origin')||'';
    const headers=cors(origin,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(!env.CLOSET_SYNC_KEY)return json({error:'Worker sync key not configured'},503,headers);
    if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,headers);

    if(url.pathname==='/v1/wear-events'&&request.method==='GET'){
      try{
        const events=await readCanonicalWearEvents(env);
        return json({ok:true,syncedAt:new Date().toISOString(),recordCount:events.length,events},200,headers);
      }catch(error){
        return json({ok:false,error:String(error?.message||error)},502,headers);
      }
    }

    if(url.pathname==='/v1/wear-mutations'&&request.method==='POST'){
      let payload=null;try{payload=await request.json();}catch{return json({error:'Invalid JSON'},400,headers);}
      const mutations=arr(payload?.mutations).slice(0,25);
      const results=await runWearMutations(mutations,env);
      return json({ok:results.every(result=>result.ok),results},200,headers);
    }

    return json({error:'Not found'},404,headers);
  }
};
