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
assert.ok(!workerFine.includes("const COLORS=['Blue'"),'fine-color Worker must not redefine canonical colors');
assert.ok(clientData.includes("from './taxonomy.generated.mjs?v=0.5.16'"),'client data module must import generated taxonomy');
assert.ok(!clientData.includes('export const TAXONOMY = {'),'client data module must not redefine taxonomy');

console.log(`Canonical taxonomy PASS (${CLIENT_TAXONOMY.categories.length} categories, ${CLIENT_TAXONOMY.colors.length} colors, ${CLIENT_TAXONOMY.styles.length} styles, ${CLIENT_TAXONOMY.tags.length} tags)`);
