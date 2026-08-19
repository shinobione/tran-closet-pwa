import v058 from './v058.js';
import {TAXONOMY,TAXONOMY_SCHEMA_VERSION} from './taxonomy.generated.mjs';

const VISION_MODEL='@cf/llava-hf/llava-1.5-7b-hf';
const COLORS=TAXONOMY.colors;
const COLOR_LOOKUP=new Map(COLORS.map(value=>[value.toLowerCase(),value]));

function base64ToByteArray(value){
  const binary=atob(value);
  const bytes=new Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}

function imageBytes(dataUrl){
  const match=String(dataUrl||'').match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/s);
  if(!match)return null;
  return base64ToByteArray(match[1]);
}

function pushUnique(target,value){
  if(value&&!target.includes(value)&&target.length<3)target.push(value);
}

function parseColorAnswer(value){
  const raw=String(value||'').trim();
  if(!raw)return [];
  const found=[];

  for(const token of raw.split(/[,;\n|]+/).map(part=>part.trim().replace(/^[\-*\d. )]+|[.!]+$/g,'')).filter(Boolean)){
    const exact=COLOR_LOOKUP.get(token.toLowerCase());
    if(exact)pushUnique(found,exact);
  }
  if(found.length)return found;

  let text=` ${raw.toLowerCase()} `;
  const nuanced=[
    ['Navy',/\b(navy(?: blue)?|dark blue|deep blue)\b/g],
    ['Light Blue',/\b(light blue|sky blue|pale blue)\b/g],
    ['Turquoise',/\b(turquoise|aqua blue|aqua)\b/g],
    ['Teal',/\b(teal|blue[- ]green)\b/g],
    ['Burgundy',/\b(burgundy|maroon|wine red|wine[- ]colored)\b/g],
    ['Olive',/\b(olive(?: green)?)\b/g],
    ['Khaki',/\bkhaki\b/g],
    ['Mint',/\b(mint(?: green)?)\b/g],
    ['Camel',/\b(camel|tan)\b/g],
    ['Beige',/\b(beige|sand(?:y)?)\b/g],
    ['Cream',/\b(cream|off[- ]white|ivory)\b/g],
    ['Gold',/\b(gold|golden|metallic gold)\b/g],
    ['Silver',/\b(silver|metallic silver)\b/g]
  ];
  for(const [name,pattern] of nuanced){
    if(pattern.test(text)){
      pushUnique(found,name);
      text=text.replace(pattern,' ');
    }
  }

  const generic=[
    ['Blue',/\bblue\b/],['Pink',/\bpink\b/],['Yellow',/\byellow\b/],['Black',/\bblack\b/],
    ['Brown',/\b(brown|chocolate)\b/],['Green',/\bgreen\b/],['Purple',/\b(purple|violet)\b/],
    ['White',/\bwhite\b/],['Grey',/\b(gr[ae]y)\b/],['Orange',/\borange\b/],['Red',/\bred\b/]
  ];
  for(const [name,pattern] of generic)if(pattern.test(text))pushUnique(found,name);
  return found.slice(0,3);
}

async function detectFineColors(image,env){
  if(!env.AI)return [];
  const bytes=imageBytes(image);
  if(!bytes)return [];
  const prompt=[
    'Inspect ONLY the main wardrobe item in the image and identify its 1 to 3 dominant colors.',
    `Reply ONLY with comma-separated exact labels chosen from: ${COLORS.join(', ')}.`,
    'Ignore floor, walls, furniture, hanger, skin, shadows, reflections, tiny logos and tiny trim.',
    'Use Navy for very dark blue; Light Blue for pale/sky blue; Turquoise for bright blue-green/cyan; Teal for darker blue-green.',
    'Distinguish Green, Olive, Khaki and Mint. Distinguish Burgundy from Red.',
    'Distinguish Beige, Cream and White; distinguish Camel from Brown.',
    'Use Gold or Silver only when the item itself is visibly metallic/gold/silver, not because of warm or cool lighting.',
    'Do not invent a color that is not clearly on the item.'
  ].join(' ');
  const result=await env.AI.run(VISION_MODEL,{image:bytes,prompt,max_tokens:80});
  const answer=String(result?.description??result?.response??result??'').trim();
  return parseColorAnswer(answer);
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=='/v1/analyze-item'||request.method!=='POST')return v058.fetch(request,env);

    let payload=null;
    try{payload=await request.clone().json();}catch{}
    const legacyResponse=await v058.fetch(request.clone(),env);
    if(!legacyResponse.ok)return legacyResponse;

    let body=null;
    try{body=await legacyResponse.clone().json();}catch{return legacyResponse;}
    if(!body?.ok||!body?.analysis||!payload?.image)return legacyResponse;

    try{
      const fineColors=await detectFineColors(payload.image,env);
      if(fineColors.length)body.analysis.colors=fineColors;
      body.colorTaxonomy=`canonical-v${TAXONOMY_SCHEMA_VERSION}`;
      body.colorVisionModel=VISION_MODEL;
      const headers=new Headers(legacyResponse.headers);
      headers.set('content-type','application/json; charset=utf-8');
      return new Response(JSON.stringify(body),{status:legacyResponse.status,headers});
    }catch(error){
      console.warn('V0.5.9 fine color pass failed; keeping V0.5.8 analysis.',error);
      return legacyResponse;
    }
  }
};
