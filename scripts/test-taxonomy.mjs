import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  TAXONOMY as CLIENT_TAXONOMY,
  LABELS,
  FR_LABELS,
  TAXONOMY_SCHEMA_VERSION,
  toAirtableCategory,
  fromAirtableCategory
} from '../js/taxonomy.generated.mjs';
import {TAXONOMY as WORKER_TAXONOMY} from '../worker/src/taxonomy.generated.mjs';

const source=JSON.parse(fs.readFileSync('shared/taxonomy.json','utf8'));
const version=fs.readFileSync('VERSION','utf8').trim();
assert.match(version,/^v\d+\.\d+\.\d+$/,'VERSION must be a semantic release');
const release=version.slice(1);

assert.equal(TAXONOMY_SCHEMA_VERSION,1);
assert.deepEqual(CLIENT_TAXONOMY.categories,source.categories);
assert.deepEqual(CLIENT_TAXONOMY.colors,source.colors);
assert.deepEqual(CLIENT_TAXONOMY.styles,source.styles);
assert.deepEqual(CLIENT_TAXONOMY.tags,source.tags);
assert.deepEqual(WORKER_TAXONOMY,CLIENT_TAXONOMY,'client and Worker generated taxonomy must be identical');

assert.equal(CLIENT_TAXONOMY.categories.length,17);
assert.equal(CLIENT_TAXONOMY.colors.length,24);
assert.equal(CLIENT_TAXONOMY.styles.length,6);
assert.equal(CLIENT_TAXONOMY.tags.length,22);
for(const required of ['Accessorie','Swimware','Eye Lens'])assert.ok(CLIENT_TAXONOMY.categories.includes(required),`legacy canonical category must stay stable: ${required}`);
for(const required of ['Navy','Light Blue','Turquoise','Teal','Camel','Beige','Cream','Olive','Khaki','Mint','Burgundy','Gold','Silver'])assert.ok(CLIENT_TAXONOMY.colors.includes(required),`fine color missing from canonical taxonomy: ${required}`);

for(const [group,values] of Object.entries({category:CLIENT_TAXONOMY.categories,color:CLIENT_TAXONOMY.colors,style:CLIENT_TAXONOMY.styles,tag:CLIENT_TAXONOMY.tags})){
  for(const value of values){
    assert.ok(LABELS[group]?.[value],`missing VI ${group} label: ${value}`);
    assert.ok(FR_LABELS[group]?.[value],`missing FR ${group} label: ${value}`);
  }
  assert.equal(Object.keys(LABELS[group]).length,values.length,`extra VI ${group} labels`);
  assert.equal(Object.keys(FR_LABELS[group]).length,values.length,`extra FR ${group} labels`);
}

assert.equal(toAirtableCategory('Swimware'),'Swimware ','legacy Airtable storage alias must remain explicit');
assert.equal(fromAirtableCategory('Swimware '),'Swimware');
assert.equal(fromAirtableCategory(' Swimware '),'Swimware');
assert.equal(toAirtableCategory('Bag'),'Bag');
assert.equal(fromAirtableCategory(' Bag '),'Bag');

const workerIndex=fs.readFileSync('worker/src/index.js','utf8');
const workerFine=fs.readFileSync('worker/src/v059.js','utf8');
const clientData=fs.readFileSync('js/data.js','utf8');
assert.ok(workerIndex.includes("from './taxonomy.generated.mjs'"),'base Worker must import generated taxonomy');
assert.ok(!workerIndex.includes("const TAXONOMY={"),'base Worker must not redefine taxonomy');
assert.ok(workerFine.includes("from './taxonomy.generated.mjs'"),'fine-color Worker must import generated taxonomy');
assert.ok(workerFine.includes('const COLORS=TAXONOMY.colors;'),'fine-color Worker must consume canonical colors');
assert.ok(!workerFine.includes("const COLORS=['Blue'"),'fine-color Worker must not redefine canonical colors');
assert.ok(clientData.includes(`from './taxonomy.generated.mjs?v=${release}'`),'client data module must import generated taxonomy for current VERSION');
assert.ok(!clientData.includes('export const TAXONOMY = {'),'client data module must not redefine taxonomy');

// Recommendation policy is allowed to define semantic subsets, but every
// taxonomy value it references must remain canonical rather than becoming a
// hidden second taxonomy source.
const assistant=fs.readFileSync('js/daily-assistant-core.mjs','utf8');
const quoted=block=>[...block.matchAll(/'([^']+)'/g)].map(match=>match[1]);
const between=(start,end)=>{
  const a=assistant.indexOf(start),b=assistant.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Daily Assistant block not found: ${start}`);
  return assistant.slice(a,b);
};
for(const value of quoted(between('const ROLES={','const EXCLUDED_CATEGORIES='))){
  assert.ok(CLIENT_TAXONOMY.categories.includes(value),`Daily Assistant role uses non-canonical category: ${value}`);
}
for(const value of quoted(between('const EXCLUDED_CATEGORIES=', 'const RAIN_CODES='))){
  assert.ok(CLIENT_TAXONOMY.categories.includes(value),`Daily Assistant exclusion uses non-canonical category: ${value}`);
}
for(const value of quoted(between('const NEUTRALS=', '// Legacy labels'))){
  assert.ok(CLIENT_TAXONOMY.colors.includes(value),`Daily Assistant neutral uses non-canonical color: ${value}`);
}
const occasionSignals=between('const OCCASION_SIGNALS={','const arr=');
for(const match of occasionSignals.matchAll(/styles:\[([^\]]*)\]/g)){
  for(const value of quoted(match[1]))assert.ok(CLIENT_TAXONOMY.styles.includes(value),`Daily Assistant occasion uses non-canonical style: ${value}`);
}
for(const match of occasionSignals.matchAll(/tags:\[([^\]]*)\]/g)){
  for(const value of quoted(match[1]))assert.ok(CLIENT_TAXONOMY.tags.includes(value),`Daily Assistant occasion uses non-canonical tag: ${value}`);
}
for(const value of ['Lightweight','Summer','Warm','Winter','Layering','Rain-ready']){
  assert.ok(CLIENT_TAXONOMY.tags.includes(value),`Daily Assistant weather policy uses non-canonical tag: ${value}`);
}
for(const value of ['Coat','Umbrella']){
  assert.ok(CLIENT_TAXONOMY.categories.includes(value),`Daily Assistant weather policy uses non-canonical category: ${value}`);
}

console.log(`Canonical taxonomy PASS (${CLIENT_TAXONOMY.categories.length} categories, ${CLIENT_TAXONOMY.colors.length} colors, ${CLIENT_TAXONOMY.styles.length} styles, ${CLIENT_TAXONOMY.tags.length} tags; Daily Assistant subsets canonical)`);
