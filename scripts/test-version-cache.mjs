import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const VERSION=fs.readFileSync('VERSION','utf8').trim();
assert.match(VERSION,/^v\d+\.\d+\.\d+$/);
const RELEASE=VERSION.slice(1);
const sw=fs.readFileSync('sw.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('js/app.js','utf8');

assert.ok(sw.includes("const CACHE_PREFIX='tran-closet-';"),'SW cache prefix missing');
assert.ok(sw.includes("build-info.json"),'SW must resolve deployed build metadata');
assert.ok(sw.includes('shortSha'),'SW cache identity must include deployed SHA');
assert.ok(sw.includes("fetch('./VERSION'"),'SW must retain VERSION fallback');
assert.ok(!sw.includes("const CACHE = 'tran-closet-v0.5.1'"),'historical static cache namespace must be retired');
assert.ok(app.includes("updateViaCache:'none'"),'service worker registration must bypass HTTP cache');

const shellMatch=sw.match(/const APP_SHELL = \[(.*?)\];/s);
assert.ok(shellMatch,'APP_SHELL not found');
const shell=new Set([...shellMatch[1].matchAll(/'([^']+)'/g)].map(match=>match[1]));
assert.ok(shell.has('./VERSION'),'VERSION must be available in offline app shell');
assert.ok(shell.has(`./css/assistant-select-hotfix.css?v=${RELEASE}`),'assistant select CSS missing from app shell');

const htmlAssets=[...index.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)].map(match=>match[1]);
for(const asset of htmlAssets){
  assert.ok(shell.has(asset),`HTML asset missing from APP_SHELL: ${asset}`);
}

const bootstrap=fs.readFileSync('js/bootstrap.js','utf8');
const bootstrapSpecs=[
  ...bootstrap.matchAll(/from\s+'(\.\/[^']+)'/g),
  ...bootstrap.matchAll(/import\('(\.\/[^']+)'\)/g),
].map(match=>match[1]);
for(const spec of bootstrapSpecs){
  const shellPath=`./js/${spec.replace(/^\.\//,'')}`;
  assert.ok(shell.has(shellPath),`bootstrap dependency missing from APP_SHELL: ${shellPath}`);
}

const runtimeFiles=['index.html','sw.js'];
for(const name of fs.readdirSync('js'))if(/\.(?:js|mjs)$/.test(name))runtimeFiles.push(path.join('js',name));
let refCount=0;
for(const file of runtimeFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/\?v=(\d+\.\d+\.\d+)/g)){
    refCount++;
    assert.equal(match[1],RELEASE,`${file} has stale release ref ?v=${match[1]}`);
  }
}
assert.ok(refCount>=20,`Expected substantial release-ref coverage, got ${refCount}`);

console.log(`Version/cache contract: PASS (${VERSION}, ${refCount} release refs, ${shell.size} shell entries)`);
