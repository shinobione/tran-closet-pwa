import fs from 'node:fs/promises';
import process from 'node:process';

const TOKEN=process.env.AIRTABLE_PAT;
const BASE_ID='appw8WNvdDuXUgYvN';
const TABLE_ID='tblhtL2UlsgCAh6E7';
const API=`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
const FIELDS={
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

if(!TOKEN){
  console.log('AIRTABLE_PAT is not configured; keeping the checked-in outfit snapshot unchanged.');
  process.exit(0);
}

const headers={Authorization:`Bearer ${TOKEN}`};

async function listAllRecords(){
  const records=[];
  let offset=null;
  do{
    const url=new URL(API);
    url.searchParams.set('pageSize','100');
    url.searchParams.set('returnFieldsByFieldId','true');
    if(offset)url.searchParams.set('offset',offset);
    const response=await fetch(url,{headers});
    if(!response.ok)throw new Error(`Airtable outfit list failed: ${response.status} ${await response.text()}`);
    const body=await response.json();
    records.push(...(body.records||[]));
    offset=body.offset||null;
  }while(offset);
  return records;
}

const clean=value=>typeof value==='string'?value.trim():'';
const records=await listAllRecords();
const syncTime=new Date().toISOString();
const outfits=records.map(record=>{
  const fields=record.fields||{};
  const outfitId=clean(fields[FIELDS.outfitId])||`airtable-outfit-${record.id}`;
  return {
    id:outfitId,
    airtableRecordId:record.id,
    name:clean(fields[FIELDS.name])||'Outfit',
    itemRecordIds:Array.isArray(fields[FIELDS.items])?fields[FIELDS.items].map(String):[],
    occasion:clean(fields[FIELDS.occasion])||'Everyday',
    season:clean(fields[FIELDS.season])||'All',
    note:String(fields[FIELDS.note]||''),
    favorite:Boolean(fields[FIELDS.favorite]),
    source:'airtable',
    syncState:'synced',
    createdAt:clean(fields[FIELDS.createdAt])||record.createdTime||syncTime,
    updatedAt:clean(fields[FIELDS.updatedAt])||record.createdTime||syncTime
  };
});

const snapshot={
  syncedAt:syncTime,
  source:'airtable',
  baseId:BASE_ID,
  tableId:TABLE_ID,
  recordCount:outfits.length,
  outfits
};

await fs.writeFile('js/airtable-outfit-snapshot.js',`export const AIRTABLE_OUTFIT_SNAPSHOT = ${JSON.stringify(snapshot,null,2)};\n`);
console.log(`Synced ${outfits.length} Airtable outfit record(s) at ${syncTime}.`);
