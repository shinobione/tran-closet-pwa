const BASE_ID='appw8WNvdDuXUgYvN';
const CLOTHES_TABLE_ID='tblKdCi4MI4AH26y8';
const OUTFITS_TABLE_ID='tblhtL2UlsgCAh6E7';
const MAX_ATTACHMENT_BYTES=5_000_000;
const MAX_AI_IMAGE_BYTES=2_500_000;
const VISION_MODEL='@cf/llava-hf/llava-1.5-7b-hf';
const AI_MODEL='@cf/meta/llama-4-scout-17b-16e-instruct';

const TAXONOMY={
  categories:['Shirt','Pant','Skirt','Dress','Combo','Coat','Bag','Shoes','Accessorie','Belt','Swimware','Eye Lens','Socks','Jumpsuit','Underwear','Headwear','Umbrella'],
  colors:['Blue','Pink','Yellow','Black','Brown','Green','Purple','White','Grey','Orange','Red'],
  styles:['Hip-Hop','Sport','Casual','Classy','Cartoon','Old']
};

const AI_SCHEMA={
  type:'object',
  properties:{
    recognized:{type:'boolean'},
    category:{type:'string',enum:TAXONOMY.categories},
    colors:{type:'array',items:{type:'string',enum:TAXONOMY.colors},maxItems:3},
    styles:{type:'array',items:{type:'string',enum:TAXONOMY.styles},maxItems:2},
    confidence:{type:'number',minimum:0,maximum:1},
    reason:{type:'string',maxLength:180}
  },
  required:['recognized','category','colors','styles','confidence','reason'],
  additionalProperties:false
};

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

function parsePhoto(dataUrl,maxBytes=MAX_ATTACHMENT_BYTES){
  if(!dataUrl||!dataUrl.startsWith('data:image/'))return null;
  const match=dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if(!match)throw new Error('Invalid image data URL');
  const [,contentType,file]=match;
  const estimatedBytes=Math.floor(file.length*3/4);
  if(estimatedBytes>maxBytes)throw new Error(`Image exceeds ${Math.round(maxBytes/1_000_000*10)/10} MB limit`);
  return {contentType,file,dataUrl,estimatedBytes,filename:`tran-closet-${Date.now()}.${contentType.includes('png')?'png':'jpg'}`};
}

function base64ToByteArray(value){
  const binary=atob(value);
  const bytes=new Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}

async function uploadPhoto(recordId,dataUrl,env){
  const photo=parsePhoto(dataUrl);if(!photo)return;
  const response=await fetch(`https://content.airtable.com/v0/${BASE_ID}/${recordId}/${FIELDS.photo}/uploadAttachment`,{
    method:'POST',
    headers:{'authorization':`Bearer ${env.AIRTABLE_PAT}`,'content-type':'application/json'},
    body:JSON.stringify({contentType:photo.contentType,file:photo.file,filename:photo.filename})
  });
  const text=await response.text();
  if(!response.ok)throw new Error(`Airtable attachment ${response.status}: ${text}`);
}

function parseAiResponse(response){
  if(response&&typeof response==='object'&&!Array.isArray(response))return response;
  const text=String(response||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  return JSON.parse(text);
}

function cleanAiResult(value={}){
  const category=TAXONOMY.categories.includes(value.category)?value.category:null;
  const colors=[...new Set(Array.isArray(value.colors)?value.colors:[])].filter(v=>TAXONOMY.colors.includes(v)).slice(0,3);
  const styles=[...new Set(Array.isArray(value.styles)?value.styles:[])].filter(v=>TAXONOMY.styles.includes(v)).slice(0,2);
  const confidence=Math.max(0,Math.min(1,Number(value.confidence)||0));
  const reason=String(value.reason||'').trim().slice(0,180);
  return {recognized:Boolean(value.recognized)&&Boolean(category),category,colors,styles,confidence,reason};
}

function reliabilityFor(analysis,{retryUsed=false}={}){
  if(!analysis?.recognized)return 'low';
  if(analysis.confidence<0.78)return 'low';
  if(retryUsed||analysis.confidence<0.9)return 'medium';
  return 'high';
}

function needsRetry(analysis){
  return !analysis?.recognized || !analysis.category || analysis.confidence<0.78 || analysis.colors.length===0;
}

async function describeWardrobePhoto(photo,env,mode='primary'){
  const modePrompt=mode==='crosscheck'
    ? [
        'Independently inspect the entire frame again. Do not trust any previous guess.',
        'Wardrobe items include shoes or sneakers even when shown as a pair, underwear or boxer briefs, hats/caps/beanies, umbrellas, bags, belts, glasses, socks, neck pillows and normal clothing.',
        'A pair of shoes counts as one wardrobe item. An unusual position or partial framing does not make an item invalid.',
        'State the most likely object type, then only the dominant colors on that object itself.'
      ]
    : mode==='rescue'
      ? [
          'This is a rescue inspection because earlier passes were uncertain.',
          'Search the full image carefully from top to bottom and side to side for ANY closet item or wearable accessory.',
          'Explicitly consider: shoes/sneakers/boots/sandals, underwear/boxers/bras, hats/caps/beanies, umbrellas, bags, belts, eyewear, socks, swimsuits, jumpsuits, shirts, pants, skirts, dresses and coats.',
          'Treat a matching pair, such as two shoes, as one wardrobe item.',
          'Do not answer that there is no clothing merely because the object is an accessory.'
        ]
      : [
          'Describe the single main wardrobe item visible in this image for another classifier.',
          'A wardrobe item can be clothing OR a wearable/closet accessory such as shoes, underwear, headwear, umbrella, bag, belt, eyewear, socks or a neck pillow.',
          'If two matching pieces form one item type, such as a pair of shoes, treat them as one wardrobe item.'
        ];

  const vision=await env.AI.run(VISION_MODEL,{
    image:base64ToByteArray(photo.file),
    prompt:[
      ...modePrompt,
      'Describe shape and identifying features such as handles, straps, sleeves, legs, waistband, brim, canopy, laces or neckline.',
      'For colors, report ONLY dominant colors covering the main item. Ignore floor, furniture, walls, hangers, skin, shadows, reflections and tiny logos/trim.',
      'Distinguish black, dark grey, brown/tan/camel and dark green. Use brown when the object is visibly chocolate, tan, camel or earthy brown rather than forcing it to black, grey or green.',
      'Mention visible style cues only when clear: cartoon/character print, sports jersey/performance design, skate/streetwear cues, formal/elegant cues, or retro/vintage cues.',
      'Ignore brand names and background text. Do not invent unseen details. If genuinely no wardrobe item is visible, say so explicitly.'
    ].join(' '),
    max_tokens:260
  });
  const description=String(vision?.description??vision?.response??vision??'').trim();
  if(!description)throw new Error('Vision model returned no description');
  return description.slice(0,1400);
}

async function classifyDescriptions(descriptions,env){
  const numbered=descriptions.map((text,index)=>`VISION PASS ${index+1}:\n${text}`).join('\n\n');
  const prompt=[
    'You classify ONE private wardrobe item using ONLY the independent visual descriptions below.',
    'The descriptions may disagree. Prefer specific object evidence over a vague/no-item pass; lower confidence when there is a genuine conflict.',
    `Allowed category values: ${TAXONOMY.categories.join(', ')}.`,
    'Category rules:',
    '- Underwear = boxer briefs, briefs, panties, bras, lingerie or similar undergarments. Do NOT map underwear to Pant.',
    '- Headwear = caps, hats, beanies and similar headwear.',
    '- Umbrella = umbrellas or parasols.',
    '- Shoes = shoes, sneakers, boots, sandals or similar footwear; a pair still maps to Shoes.',
    '- Accessorie = wardrobe accessories without a more specific category, including neck pillows or jewelry-like items.',
    '- Pant is for trousers/shorts/pants, not underwear.',
    `Allowed color values: ${TAXONOMY.colors.join(', ')}. Choose up to 3 DOMINANT colors of the item only. Brown includes tan, camel, chocolate and earthy brown. Ignore background, floor, furniture, hanger, skin, shadows and tiny accents.`,
    `Allowed style values: ${TAXONOMY.styles.join(', ')}. Choose up to 2 only when visibly justified; an empty styles array is allowed.`,
    'Style rules: Cartoon for visible cartoon/character/novelty prints; Sport for jerseys, athletic/performance wear or clearly athletic footwear; Hip-Hop for clear streetwear/skate/urban cues; Classy for formal/elegant design; Old only for genuinely vintage/retro cues; Casual for relaxed everyday design and it may be combined with Cartoon, Sport or Hip-Hop when both are justified.',
    'Set recognized=false only when the descriptions genuinely fail to identify any wardrobe item.',
    'confidence is confidence in the final classification from 0 to 1. Do not use 1.0 when the vision passes conflict materially.',
    'reason must be one short Vietnamese sentence grounded only in the descriptions.',
    '',
    numbered
  ].join('\n');

  const result=await env.AI.run(AI_MODEL,{
    messages:[
      {role:'system',content:'Return only the requested structured wardrobe classification.'},
      {role:'user',content:prompt}
    ],
    guided_json:AI_SCHEMA,
    max_tokens:280,
    temperature:0.05
  });
  return cleanAiResult(parseAiResponse(result?.response??result));
}

async function analyzeItem(payload,env){
  if(!env.AI)throw new Error('Workers AI binding is not configured');
  const photo=parsePhoto(payload?.image,MAX_AI_IMAGE_BYTES);
  if(!photo)throw new Error('Missing image');

  const descriptions=await Promise.all([
    describeWardrobePhoto(photo,env,'primary'),
    describeWardrobePhoto(photo,env,'crosscheck')
  ]);
  let analysis=await classifyDescriptions(descriptions,env);
  let retryUsed=false;

  if(needsRetry(analysis)){
    retryUsed=true;
    descriptions.push(await describeWardrobePhoto(photo,env,'rescue'));
    analysis=await classifyDescriptions(descriptions,env);
  }

  const reliability=reliabilityFor(analysis,{retryUsed});
  return {
    analysis,
    descriptions,
    visionDescription:descriptions.join('\n---\n'),
    retryUsed,
    attempts:descriptions.length,
    reliability
  };
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
    if(!env.CLOSET_SYNC_KEY)return json({error:'Worker sync key not configured'},503,headers);
    if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,headers);
    if(url.pathname==='/health'&&request.method==='GET'){
      if(!env.AIRTABLE_PAT)return json({error:'Worker Airtable secret not configured'},503,headers);
      return json({ok:true,service:'tran-closet-sync',features:{ai:Boolean(env.AI)}},200,headers);
    }
    if(url.pathname==='/v1/analyze-item'&&request.method==='POST'){
      let payload;try{payload=await request.json();}catch{return json({error:'Invalid JSON'},400,headers);}
      try{
        const result=await analyzeItem(payload,env);
        return json({
          ok:true,
          analysis:result.analysis,
          reliability:result.reliability,
          retryUsed:result.retryUsed,
          attempts:result.attempts,
          model:AI_MODEL,
          visionModel:VISION_MODEL,
          visionSummary:result.visionDescription
        },200,headers);
      }catch(error){return json({ok:false,error:String(error?.message||error)},502,headers);}
    }
    if(!env.AIRTABLE_PAT)return json({error:'Worker Airtable secret not configured'},503,headers);
    if(request.method!=='POST'||!['/v1/mutations','/v1/outfit-mutations'].includes(url.pathname))return json({error:'Not found'},404,headers);
    let payload;try{payload=await request.json();}catch{return json({error:'Invalid JSON'},400,headers);}
    const mutations=Array.isArray(payload?.mutations)?payload.mutations.slice(0,25):[];
    const apply=url.pathname==='/v1/outfit-mutations'?applyOutfitMutation:applyMutation;
    const results=await runMutations(mutations,apply,env);
    return json({ok:results.every(r=>r.ok),results},200,headers);
  }
};
