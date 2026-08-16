const BASE_ID='appw8WNvdDuXUgYvN';
const CLOTHES_TABLE_ID='tblKdCi4MI4AH26y8';
const OUTFITS_TABLE_ID='tblhtL2UlsgCAh6E7';
const MAX_ATTACHMENT_BYTES=5_000_000;

const FIELDS={
  name:'fldaUBTQHssIqjYJ3',
  category:'fldFgbepFfRYzQiSf',
  colors:'fld9c3S0zKQ1AaMWL',
  styles:'fldzFgTZ5iiakQBcy',
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
    'vary':'Origin'
  };
}
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});}
function bearer(request){const value=request.headers.get('authorization')||'';return value.startsWith('Bearer ')?value.slice(7):'';}
function normalizeCategory(value){return value==='Swimware'?'Swimware ':value;}

function fieldsFromPayload(payload={}){
  return {
    [FIELDS.name]:String(payload.name||'').trim(),
    [FIELDS.category]:normalizeCategory(String(payload.category||'Accessorie')),
    [FIELDS.colors]:Array.isArray(payload.colors)?payload.colors:[],
    [FIELDS.styles]:Array.isArray(payload.styles)?payload.styles:[]
  };
}

function outfitFieldsFromPayload(payload={}){
  const outfitId=String(payload.outfitId||'').trim();
  if(!outfitId)throw new Error('Missing Outfit ID');
  return {
    [OUTFIT_FIELDS.name]:String(payload.name||'').trim()||'Outfit',
    [OUTFIT_FIELDS.items]:Array.isArray(payload.itemRecordIds)?payload.itemRecordIds:[],
    [OUTFIT_FIELDS.occasion]:String(payload.occasion||'Everyday'),
    [OUTFIT_FIELDS.season]:String(payload.season||'All'),
    [OUTFIT_FIELDS.note]:String(payload.note||''),
    [OUTFIT_FIELDS.favorite]:Boolean(payload.favorite),
    [OUTFIT_FIELDS.outfitId]:outfitId,
    [OUTFIT_FIELDS.createdAt]:String(payload.createdAt||''),
    [OUTFIT_FIELDS.updatedAt]:String(payload.updatedAt||new Date().toISOString())
  };
}

async function airtable(tableId,path,env,options={}){
  const response=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}${path}`,{
    ...options,
    headers:{'authorization':`Bearer ${env.AIRTABLE_PAT}`,'content-type':'application/json',...(options.headers||{})}
  });
  const text=await response.text();
  let body=null;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}
  if(!response.ok){const error=new Error(`Airtable ${response.status}: ${JSON.stringify(body)}`);error.status=response.status;throw error;}
  return body;
}

function parsePhoto(dataUrl){
  if(!dataUrl||!dataUrl.startsWith('data:image/'))return null;
  const match=dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if(!match)throw new Error('Invalid image data URL');
  const [,contentType,file]=match;
  const estimatedBytes=Math.floor(file.length*3/4);
  if(estimatedBytes>MAX_ATTACHMENT_BYTES)throw new Error('Attachment exceeds Airtable 5 MB upload limit');
  return {contentType,file,filename:`tran-closet-${Date.now()}.${contentType.includes('png')?'png':'jpg'}`};
}

async function uploadPhoto(recordId,dataUrl,env){
  const photo=parsePhoto(dataUrl);if(!photo)return;
  const response=await fetch(`https://content.airtable.com/v0/${BASE_ID}/${recordId}/${FIELDS.photo}/uploadAttachment`,{
    method:'POST',
    headers:{'authorization':`Bearer ${env.AIRTABLE_PAT}`,'content-type':'application/json'},
    body:JSON.stringify(photo)
  });
  const text=await response.text();
  if(!response.ok)throw new Error(`Airtable attachment ${response.status}: ${text}`);
}

async function applyMutation(mutation,env){
  const operation=mutation?.operation;
  if(operation==='create'){
    if(!mutation?.id)throw new Error('Missing mutation id for create');
    const fields={...fieldsFromPayload(mutation.payload),[FIELDS.syncMutationId]:mutation.id};
    const body=await airtable(CLOTHES_TABLE_ID,'',env,{method:'PATCH',body:JSON.stringify({
      performUpsert:{fieldsToMergeOn:[FIELDS.syncMutationId]},
      records:[{fields}],
      typecast:false
    })});
    const recordId=body?.records?.[0]?.id;
    if(!recordId)throw new Error('Airtable upsert returned no record id');
    if(mutation.payload?.photo){
      try{await uploadPhoto(recordId,mutation.payload.photo,env);}
      catch(error){return {mutationId:mutation.id,ok:false,partial:true,airtableRecordId:recordId,retryOperation:'photo',error:String(error?.message||error)};}
    }
    return {mutationId:mutation.id,ok:true,airtableRecordId:recordId};
  }
  if(operation==='update'){
    if(!mutation.airtableRecordId)throw new Error('Missing Airtable record id for update');
    await airtable(CLOTHES_TABLE_ID,`/${mutation.airtableRecordId}`,env,{method:'PATCH',body:JSON.stringify({fields:fieldsFromPayload(mutation.payload),typecast:false})});
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  if(operation==='photo'){
    if(!mutation.airtableRecordId)throw new Error('Missing Airtable record id for photo upload');
    await uploadPhoto(mutation.airtableRecordId,mutation.payload?.photo,env);
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  if(operation==='delete'){
    if(!mutation.airtableRecordId)return {mutationId:mutation.id,ok:true,skipped:true};
    try{await airtable(CLOTHES_TABLE_ID,`/${mutation.airtableRecordId}`,env,{method:'DELETE'});}
    catch(error){if(error?.status!==404)throw error;}
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  throw new Error(`Unsupported operation: ${operation}`);
}

async function applyOutfitMutation(mutation,env){
  const operation=mutation?.operation;
  if(operation==='create'){
    const fields=outfitFieldsFromPayload(mutation.payload);
    const body=await airtable(OUTFITS_TABLE_ID,'',env,{method:'PATCH',body:JSON.stringify({
      performUpsert:{fieldsToMergeOn:[OUTFIT_FIELDS.outfitId]},
      records:[{fields}],
      typecast:false
    })});
    const recordId=body?.records?.[0]?.id;
    if(!recordId)throw new Error('Airtable outfit upsert returned no record id');
    return {mutationId:mutation.id,ok:true,airtableRecordId:recordId};
  }
  if(operation==='update'){
    if(!mutation.airtableRecordId)throw new Error('Missing Airtable outfit record id for update');
    await airtable(OUTFITS_TABLE_ID,`/${mutation.airtableRecordId}`,env,{method:'PATCH',body:JSON.stringify({fields:outfitFieldsFromPayload(mutation.payload),typecast:false})});
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  if(operation==='delete'){
    if(!mutation.airtableRecordId)return {mutationId:mutation.id,ok:true,skipped:true};
    try{await airtable(OUTFITS_TABLE_ID,`/${mutation.airtableRecordId}`,env,{method:'DELETE'});}
    catch(error){if(error?.status!==404)throw error;}
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  throw new Error(`Unsupported outfit operation: ${operation}`);
}

async function runMutations(mutations,apply,env){
  const results=[];
  for(const mutation of mutations){
    try{results.push(await apply(mutation,env));}
    catch(error){results.push({mutationId:mutation?.id||null,ok:false,error:String(error?.message||error)});}
  }
  return results;
}

export default {
  async fetch(request,env){
    const origin=request.headers.get('origin')||'';
    const headers=cors(origin,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const url=new URL(request.url);
    if(!env.CLOSET_SYNC_KEY||!env.AIRTABLE_PAT)return json({error:'Worker secrets not configured'},503,headers);
    if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,headers);
    if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,service:'tran-closet-sync'},200,headers);
    if(request.method!=='POST'||!['/v1/mutations','/v1/outfit-mutations'].includes(url.pathname))return json({error:'Not found'},404,headers);
    let payload;try{payload=await request.json();}catch{return json({error:'Invalid JSON'},400,headers);}
    const mutations=Array.isArray(payload?.mutations)?payload.mutations.slice(0,25):[];
    const apply=url.pathname==='/v1/outfit-mutations'?applyOutfitMutation:applyMutation;
    const results=await runMutations(mutations,apply,env);
    return json({ok:results.every(r=>r.ok),results},200,headers);
  }
};
