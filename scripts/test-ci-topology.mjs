import assert from 'node:assert/strict';
import fs from 'node:fs';

const dir='.github/workflows';
const names=new Set(fs.readdirSync(dir));

const retired=[
  'pwa-isolation.yml',
  'validate-v058.yml',
  'validate-v059.yml',
  'validate-v0510.yml',
  'validate-v0512.yml',
  'validate-v0513.yml',
  'validate-v0514.yml',
  'validate-v0515.yml'
];
for(const name of retired)assert.equal(names.has(name),false,`retired workflow resurrected: ${name}`);

const validation=[
  'validate.yml',
  'validate-ui-profile-contracts.yml',
  'validate-sync-delete-contracts.yml',
  'validate-v0516-browser-smoke.yml',
  'validate-v0516-keyed-i18n.yml',
  'validate-v0516-outfit-integrity.yml',
  'validate-v0516-outfit-live-sync.yml',
  'validate-v0516-runtime-consolidation.yml',
  'validate-v0516-version-cache.yml'
];
for(const name of validation)assert.equal(names.has(name),true,`required validation workflow missing: ${name}`);

const actual=[...names].filter(name=>name==='validate.yml'||name.startsWith('validate-')).sort();
assert.deepEqual(actual,[...validation].sort(),`unexpected validation workflow topology: ${actual.join(', ')}`);

const isolation=fs.readFileSync('scripts/test-pwa-isolation.mjs','utf8');
const global=fs.readFileSync(`${dir}/validate.yml`,'utf8');
const cache=fs.readFileSync(`${dir}/validate-v0516-version-cache.yml`,'utf8');
assert.ok(global.includes('node scripts/test-pwa-isolation.mjs'),'global validation must keep PWA isolation coverage');
assert.ok(cache.includes('node scripts/test-pwa-isolation.mjs'),'version/cache gate must keep PWA isolation coverage');
assert.ok(isolation.includes("CACHE_PREFIX='tran-closet-'"),'isolation test must still protect cache namespace');

console.log(`CI topology PASS (${actual.length} PR validation workflows, ${retired.length} retired historical gates)`);
