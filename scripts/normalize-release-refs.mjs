import fs from 'node:fs';
import path from 'node:path';

const VERSION=fs.readFileSync('VERSION','utf8').trim();
if(!/^v\d+\.\d+\.\d+$/.test(VERSION))throw new Error(`Invalid VERSION: ${VERSION}`);
const RELEASE=VERSION.slice(1);
const write=process.argv.includes('--write');

const runtimeFiles=['index.html','sw.js'];
for(const name of fs.readdirSync('js')){
  if(/\.(?:js|mjs)$/.test(name))runtimeFiles.push(path.join('js',name));
}

const drift=[];
for(const file of runtimeFiles.sort()){
  const before=fs.readFileSync(file,'utf8');
  const after=before.replace(/\?v=\d+\.\d+\.\d+/g,`?v=${RELEASE}`);
  if(after===before)continue;
  const old=[...before.matchAll(/\?v=(\d+\.\d+\.\d+)/g)].map(match=>match[1]).filter(value=>value!==RELEASE);
  drift.push({file,old:[...new Set(old)]});
  if(write)fs.writeFileSync(file,after);
}

if(drift.length&&!write){
  console.error(`Release reference drift detected. VERSION=${VERSION}`);
  for(const entry of drift)console.error(`- ${entry.file}: ${entry.old.join(', ')}`);
  console.error('Run: node scripts/normalize-release-refs.mjs --write');
  process.exit(1);
}

console.log(`${write?'Normalized':'Checked'} runtime release refs for ${VERSION}${drift.length?` (${drift.length} files changed)`:''}`);
