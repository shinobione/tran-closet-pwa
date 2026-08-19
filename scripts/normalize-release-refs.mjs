import fs from 'node:fs';
import path from 'node:path';

const VERSION=fs.readFileSync('VERSION','utf8').trim();
if(!/^v\d+\.\d+\.\d+$/.test(VERSION))throw new Error(`Invalid VERSION: ${VERSION}`);
const RELEASE=VERSION.slice(1);
const write=process.argv.includes('--write');

const runtimeFiles=['index.html','manifest.webmanifest','sw.js'];
for(const dir of ['js','css']){
  for(const name of fs.readdirSync(dir)){
    if((dir==='js'&&/\.(?:js|mjs)$/.test(name))||(dir==='css'&&name.endsWith('.css')))runtimeFiles.push(path.join(dir,name));
  }
}

function normalizeKnownVersionLiterals(file,source){
  if(file==='sw.js')source=source.replace(/const SOURCE_VERSION='v\d+\.\d+\.\d+';/,`const SOURCE_VERSION='${VERSION}';`);
  if(file==='js/build-version.js')source=source.replace(/const FALLBACK=\{version:'v\d+\.\d+\.\d+'/,`const FALLBACK={version:'${VERSION}'`);
  if(file==='js/sync-diagnostics.js')source=source.replace(/const FALLBACK_VERSION='v\d+\.\d+\.\d+';/,`const FALLBACK_VERSION='${VERSION}';`);
  return source;
}

const drift=[];
for(const file of runtimeFiles.sort()){
  const before=fs.readFileSync(file,'utf8');
  let after=before.replace(/\?v=\d+\.\d+\.\d+/g,`?v=${RELEASE}`);
  after=normalizeKnownVersionLiterals(file,after);
  if(after===before)continue;
  const oldRefs=[...before.matchAll(/\?v=(\d+\.\d+\.\d+)/g)].map(match=>match[1]).filter(value=>value!==RELEASE);
  const details=[...new Set(oldRefs)];
  if(file==='sw.js'&&!before.includes(`const SOURCE_VERSION='${VERSION}';`))details.push('SOURCE_VERSION');
  if(file==='js/build-version.js'&&!before.includes(`const FALLBACK={version:'${VERSION}'`))details.push('build fallback');
  if(file==='js/sync-diagnostics.js'&&!before.includes(`const FALLBACK_VERSION='${VERSION}';`))details.push('diagnostics fallback');
  drift.push({file,old:details});
  if(write)fs.writeFileSync(file,after);
}

if(drift.length&&!write){
  console.error(`Release reference drift detected. VERSION=${VERSION}`);
  for(const entry of drift)console.error(`- ${entry.file}: ${entry.old.join(', ')||'version literal drift'}`);
  console.error('Run: node scripts/normalize-release-refs.mjs --write');
  process.exit(1);
}

console.log(`${write?'Normalized':'Checked'} runtime release refs for ${VERSION}${drift.length?` (${drift.length} files changed)`:''}`);
