const BASE_ID='appw8WNvdDuXUgYvN';
const TABLE_ID='tblKdCi4MI4AH26y8';
const FIELDS={
  name:'fldaUBTQHssIqjYJ3',
  category:'fldFgbepFfRYzQiSf',
  colors:'fld9c3S0zKQ1AaMWL',
  styles:'fldzFgTZ5iiakQBcy',
  photo:'fldgISbij3vO9IvjM'
};

function cors(origin,env){
  const allowed=env.ALLOWED_ORIGIN||'https://shinobione.github.io';
  return {
    'access-control-allow-origin':origin===allowed?origin:allowed,
    'access-control-allow-methods':'POST,OPTIONS',
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
async function airtable(path,env,options={}){
  const response=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}${path}`,{
    ...options,
    headers:{'authorization':`Bearer ${env.AIRTABLE_PAT}`,'content-type':'application/json',...(options.headers||{})}
  });
  const text=await response.text();
  let body=null;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}
  if(!response.ok)throw new Error(`Airtable ${response.status}: ${JSON.stringify(body)}`);
  return body;
}
async function uploadPhoto(recordId,dataUrl,env){
  if(!dataUrl||!dataUrl.startsWith('data:image/'))return;
  const match=dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if(!match)throw new Error('Invalid image data URL');
  const [,contentType,file]=match;
  const ext=contentType.includes('png')?'png':'jpg';
  const response=await fetch(`https://content.airtable.com/v0/${BASE_ID}/${recordId}/${FIELDS.photo}/uploadAttachment`,{
    method:'POST',
    headers:{'authorization':`Bearer ${env.AIRTABLE_PAT}`,'content-type':'application/json'},
    body:JSON.stringify({contentType,file,filename:`tran-closet-${Date.now()}.${ext}`})
  });
  const text=await response.text();
  if(!response.ok)throw new Error(`Airtable attachment ${response.status}: ${text}`);
}
async function applyMutation(mutation,env){
  const operation=mutation?.operation;
  if(operation==='create'){
    const body=await airtable('',env,{method:'POST',body:JSON.stringify({records:[{fields:fieldsFromPayload(mutation.payload)}],typecast:false})});
    const recordId=body?.records?.[0]?.id;
    if(!recordId)throw new Error('Airtable create returned no record id');
    if(mutation.payload?.photo)await uploadPhoto(recordId,mutation.payload.photo,env);
    return {mutationId:mutation.id,ok:true,airtableRecordId:recordId};
  }
  if(operation==='update'){
    if(!mutation.airtableRecordId)throw new Error('Missing Airtable record id for update');
    await airtable(`/${mutation.airtableRecordId}`,env,{method:'PATCH',body:JSON.stringify({fields:fieldsFromPayload(mutation.payload),typecast:false})});
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  if(operation==='delete'){
    if(!mutation.airtableRecordId)return {mutationId:mutation.id,ok:true,skipped:true};
    await airtable(`/${mutation.airtableRecordId}`,env,{method:'DELETE'});
    return {mutationId:mutation.id,ok:true,airtableRecordId:mutation.airtableRecordId};
  }
  throw new Error(`Unsupported operation: ${operation}`);
}

export default {
  async fetch(request,env){
    const origin=request.headers.get('origin')||'';
    const headers=cors(origin,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const url=new URL(request.url);
    if(url.pathname==='/health')return json({ok:true,service:'tran-closet-sync'},200,headers);
    if(url.pathname!=='/v1/mutations'||request.method!=='POST')return json({error:'Not found'},404,headers);
    if(!env.CLOSET_SYNC_KEY||!env.AIRTABLE_PAT)return json({error:'Worker secrets not configured'},503,headers);
    if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,headers);
    let payload;try{payload=await request.json();}catch{return json({error:'Invalid JSON'},400,headers);}
    const mutations=Array.isArray(payload?.mutations)?payload.mutations.slice(0,25):[];
    const results=[];
    for(const mutation of mutations){
      try{results.push(await applyMutation(mutation,env));}
      catch(error){results.push({mutationId:mutation?.id||null,ok:false,error:String(error?.message||error)});}
    }
    return json({ok:results.every(r=>r.ok),results},200,headers);
  }
};
