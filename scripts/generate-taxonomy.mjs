import fs from 'node:fs';

const SOURCE='shared/taxonomy.json';
const TARGETS=['js/taxonomy.generated.mjs','worker/src/taxonomy.generated.mjs'];
const write=process.argv.includes('--write');

const source=JSON.parse(fs.readFileSync(SOURCE,'utf8'));
const groups={
  category:source.categories,
  color:source.colors,
  style:source.styles,
  tag:source.tags
};

function assert(condition,message){if(!condition)throw new Error(message);}
assert(source.schemaVersion===1,'taxonomy schemaVersion must be 1');
for(const [name,values] of Object.entries(groups)){
  assert(Array.isArray(values)&&values.length>0,`${name} taxonomy must be a non-empty array`);
  assert(values.every(value=>typeof value==='string'&&value.trim()===value&&value.length),`${name} values must be non-empty trimmed strings`);
  assert(new Set(values).size===values.length,`${name} taxonomy contains duplicates`);
}
for(const language of ['vi','fr']){
  const labels=source.labels?.[language];
  assert(labels&&typeof labels==='object',`missing ${language} labels`);
  for(const [group,values] of Object.entries(groups)){
    const table=labels[group];
    assert(table&&typeof table==='object',`missing ${language}.${group} labels`);
    const expected=[...values].sort();
    const actual=Object.keys(table).sort();
    assert(JSON.stringify(actual)===JSON.stringify(expected),`${language}.${group} label keys do not exactly match canonical taxonomy`);
    assert(Object.values(table).every(value=>typeof value==='string'&&value.trim().length),`${language}.${group} contains empty labels`);
  }
}
const writeAliases=source.storage?.airtable?.categoryWriteAliases||{};
for(const [canonical,stored] of Object.entries(writeAliases)){
  assert(source.categories.includes(canonical),`Airtable category alias has unknown canonical value: ${canonical}`);
  assert(typeof stored==='string'&&stored.length,`Airtable category alias for ${canonical} is empty`);
  assert(stored.trim()===canonical,`Airtable category alias ${JSON.stringify(stored)} must trim back to ${canonical}`);
}

const data={
  schemaVersion:source.schemaVersion,
  taxonomy:{
    categories:source.categories,
    colors:source.colors,
    styles:source.styles,
    tags:source.tags
  },
  labels:source.labels,
  airtableCategoryWriteAliases:writeAliases
};
const serialized=JSON.stringify(data,null,2);
const generated=`// GENERATED FILE — source: ${SOURCE}\n// Run: node scripts/generate-taxonomy.mjs --write\nconst DATA=${serialized};\n\nexport const TAXONOMY=DATA.taxonomy;\nexport const LABELS=DATA.labels.vi;\nexport const FR_LABELS=DATA.labels.fr;\nexport const TAXONOMY_SCHEMA_VERSION=DATA.schemaVersion;\nexport const AIRTABLE_CATEGORY_WRITE_ALIASES=DATA.airtableCategoryWriteAliases;\n\nexport function toAirtableCategory(value){\n  const canonical=String(value??'').trim();\n  return AIRTABLE_CATEGORY_WRITE_ALIASES[canonical]??canonical;\n}\n\nexport function fromAirtableCategory(value){\n  const raw=String(value??'');\n  const trimmed=raw.trim();\n  for(const [canonical,stored] of Object.entries(AIRTABLE_CATEGORY_WRITE_ALIASES)){\n    if(raw===stored||trimmed===String(stored).trim())return canonical;\n  }\n  return trimmed;\n}\n`;

let drift=false;
for(const target of TARGETS){
  const current=fs.existsSync(target)?fs.readFileSync(target,'utf8'):null;
  if(current===generated)continue;
  drift=true;
  if(write){
    fs.mkdirSync(target.split('/').slice(0,-1).join('/'),{recursive:true});
    fs.writeFileSync(target,generated);
    console.log(`Generated ${target}`);
  }else{
    console.error(`Generated taxonomy drift: ${target}`);
  }
}
if(drift&&!write){
  console.error('Run: node scripts/generate-taxonomy.mjs --write');
  process.exit(1);
}
console.log(`${write?'Generated':'Checked'} canonical taxonomy: ${source.categories.length} categories, ${source.colors.length} colors, ${source.styles.length} styles, ${source.tags.length} tags`);
