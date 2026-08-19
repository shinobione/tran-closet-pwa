import fs from 'node:fs';
import assert from 'node:assert/strict';

function read(path){return fs.readFileSync(path,'utf8');}
function write(path,value){fs.writeFileSync(path,value);}
function replaceOnce(path,from,to){
  const source=read(path);
  const count=source.split(from).length-1;
  assert.equal(count,1,`${path}: expected exactly one occurrence of ${JSON.stringify(from)}, found ${count}`);
  write(path,source.replace(from,to));
}

// Client: data.js becomes a compatibility export + seed-data module.
{
  const path='js/data.js';
  const source=read(path);
  assert.ok(source.startsWith('export const TAXONOMY = {'),'js/data.js no longer has the expected legacy taxonomy prefix');
  const marker='export const SEED_ITEMS = [';
  const index=source.indexOf(marker);
  assert.ok(index>0,'js/data.js seed marker not found');
  const next=`import {TAXONOMY,LABELS,FR_LABELS} from './taxonomy.generated.mjs?v=0.5.16';\nexport {TAXONOMY,LABELS,FR_LABELS};\n\n${source.slice(index)}`;
  write(path,next);
}

// Base Worker: consume generated taxonomy and explicit Airtable category alias.
{
  const path='worker/src/index.js';
  let source=read(path);
  assert.ok(source.startsWith("const BASE_ID='appw8WNvdDuXUgYvN';"),'Worker index prefix changed');
  source="import {TAXONOMY,toAirtableCategory} from './taxonomy.generated.mjs';\n\n"+source;
  const start=source.indexOf('const TAXONOMY={');
  const endMarker='\n\nconst AI_SCHEMA={';
  const end=source.indexOf(endMarker,start);
  assert.ok(start>0&&end>start,'Worker local TAXONOMY block not found');
  source=source.slice(0,start)+source.slice(end+2);
  const old="function normalizeCategory(value){return value==='Swimware'?'Swimware ':value;}";
  assert.equal(source.split(old).length-1,1,'Worker normalizeCategory contract changed');
  source=source.replace(old,"function normalizeCategory(value){return toAirtableCategory(value);}");
  write(path,source);
}

// Live canonical reads normalize Airtable storage aliases through the same generated contract.
replaceOnce('worker/src/v058.js',
  "import legacyWorker from './index.js';",
  "import legacyWorker from './index.js';\nimport {fromAirtableCategory} from './taxonomy.generated.mjs';");
replaceOnce('worker/src/v058.js',
  "function normalizeCategory(value){\n  const clean=String(value||'').trim();\n  return clean==='Swimware'?'Swimware':clean;\n}",
  "function normalizeCategory(value){return fromAirtableCategory(value);}");

// Fine-color pass consumes canonical colors and exposes canonical schema provenance.
replaceOnce('worker/src/v059.js',
  "import v058 from './v058.js';",
  "import v058 from './v058.js';\nimport {TAXONOMY,TAXONOMY_SCHEMA_VERSION} from './taxonomy.generated.mjs';");
replaceOnce('worker/src/v059.js',
  "const COLORS=['Blue','Navy','Light Blue','Turquoise','Teal','Pink','Yellow','Black','Brown','Camel','Beige','Cream','Green','Olive','Khaki','Mint','Purple','White','Grey','Orange','Red','Burgundy','Gold','Silver'];",
  "const COLORS=TAXONOMY.colors;");
replaceOnce('worker/src/v059.js',
  "body.colorTaxonomy='v0.5.9';",
  "body.colorTaxonomy=`canonical-v${TAXONOMY_SCHEMA_VERSION}`;");

// Snapshot generation validates canonical Airtable values before writing a checked-in fallback.
replaceOnce('scripts/sync-airtable.mjs',
  "import process from 'node:process';",
  "import process from 'node:process';\nimport {TAXONOMY,fromAirtableCategory} from '../js/taxonomy.generated.mjs';");
replaceOnce('scripts/sync-airtable.mjs',
  "const cleanSelect = value => typeof value === 'string' ? value.trim() : '';\nconst cleanMulti = value => Array.isArray(value) ? value.map(cleanSelect).filter(Boolean) : [];",
  "const cleanSelect = value => typeof value === 'string' ? value.trim() : '';\nconst cleanCategory = value => {\n  const canonical=fromAirtableCategory(value)||'Accessorie';\n  if(!TAXONOMY.categories.includes(canonical))throw new Error(`Unknown Airtable category outside canonical taxonomy: ${canonical}`);\n  return canonical;\n};\nconst cleanMulti = (group,value) => Array.isArray(value) ? value.map(cleanSelect).filter(Boolean).map(entry=>{\n  if(!TAXONOMY[group].includes(entry))throw new Error(`Unknown Airtable ${group} value outside canonical taxonomy: ${entry}`);\n  return entry;\n}) : [];");
replaceOnce('scripts/sync-airtable.mjs',
  "category: cleanSelect(fields[FIELDS.category]) || 'Accessorie',\n    colors: cleanMulti(fields[FIELDS.colors]),\n    styles: cleanMulti(fields[FIELDS.styles]),\n    tags: cleanMulti(fields[FIELDS.tags]),",
  "category: cleanCategory(fields[FIELDS.category]),\n    colors: cleanMulti('colors',fields[FIELDS.colors]),\n    styles: cleanMulti('styles',fields[FIELDS.styles]),\n    tags: cleanMulti('tags',fields[FIELDS.tags]),");

// The generated client module must be available in the offline shell.
replaceOnce('sw.js',
  "'./js/data.js','./js/sync-client.js?v=0.5.16'",
  "'./js/data.js','./js/taxonomy.generated.mjs?v=0.5.16','./js/sync-client.js?v=0.5.16'");

// Worker deploy must validate taxonomy parity before deployment and react to canonical-source changes.
replaceOnce('.github/workflows/deploy-worker.yml',
  "      - 'worker/**'\n      - '.github/workflows/deploy-worker.yml'",
  "      - 'worker/**'\n      - 'shared/taxonomy.json'\n      - 'scripts/generate-taxonomy.mjs'\n      - 'scripts/test-taxonomy.mjs'\n      - '.github/workflows/deploy-worker.yml'");
replaceOnce('.github/workflows/deploy-worker.yml',
  "      - name: Deploy Worker and Worker secrets",
  "      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n\n      - name: Verify canonical taxonomy parity\n        run: |\n          node scripts/generate-taxonomy.mjs\n          node scripts/test-taxonomy.mjs\n\n      - name: Deploy Worker and Worker secrets");

console.log('Taxonomy consumer migration: PASS');
