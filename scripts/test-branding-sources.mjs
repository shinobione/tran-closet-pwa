import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const strict=process.argv.includes('--strict');

const CANONICAL={
  'branding/favicon-user-v058.b64':'2b6d26bab7839f54e5882acb3c00f3743b15fb0c',
  'branding/header-lockup-v057.png':'cad3ea8bf361e89a1eabdaeddb2bd368b6822d83',
  'branding/logo-mark-v057.png':'53dfe2512f360913a6c6989078e76df3a96c1cc1',
  'branding/splash-1242x2688.png':'8b1c40cf06804ddc1f518848367fddba8be9b08b'
};

const RETIRED=[
  'branding/logo-lockup-centered.png',
  'branding/logo-mark-256.png',
  'branding/logo-mark.png',
  'branding/logo-source-round.b64.part1'
];

const expectedAudit=new Set([...Object.keys(CANONICAL),...RETIRED].map(file=>path.basename(file)));
const expectedStrict=new Set(Object.keys(CANONICAL).map(file=>path.basename(file)));
const allowedReferenceDocs=new Set([
  'scripts/test-branding-sources.mjs',
  'docs/BRANDING-SOURCES.md'
]);

function fail(message){
  console.error(`BRANDING SOURCE GUARD FAIL: ${message}`);
  process.exitCode=1;
}

function read(file){return fs.readFileSync(path.join(root,file));}
function text(file){return read(file).toString('utf8');}

for(const [file,expectedBlob] of Object.entries(CANONICAL)){
  if(!fs.existsSync(path.join(root,file))){
    fail(`missing canonical master ${file}`);
    continue;
  }
  const actual=execFileSync('git',['hash-object',file],{cwd:root,encoding:'utf8'}).trim();
  if(actual!==expectedBlob)fail(`${file} bytes changed (${actual} != ${expectedBlob})`);
}

const brandingFiles=fs.readdirSync(path.join(root,'branding')).sort();
const expected=strict?expectedStrict:expectedAudit;
for(const file of brandingFiles){
  if(!expected.has(file))fail(`unexpected branding source ${file}`);
}
for(const file of expected){
  if(!brandingFiles.includes(file))fail(`expected branding source missing: ${file}`);
}

const tracked=execFileSync('git',['ls-files','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
for(const retired of RETIRED){
  const offenders=[];
  const needle=Buffer.from(retired);
  for(const file of tracked){
    if(file===retired||allowedReferenceDocs.has(file))continue;
    const full=path.join(root,file);
    if(!fs.existsSync(full)||!fs.statSync(full).isFile())continue;
    try{
      if(fs.readFileSync(full).includes(needle))offenders.push(file);
    }catch{}
  }
  if(offenders.length)fail(`${retired} is still referenced by: ${offenders.join(', ')}`);
  if(strict&&fs.existsSync(path.join(root,retired)))fail(`retired branding source still exists: ${retired}`);
}

const wiring=[
  ['index.html','./branding/header-lockup-v057.png'],
  ['index.html','./branding/splash-1242x2688.png'],
  ['css/branding.css',"../branding/logo-mark-v057.png"],
  ['sw.js','./branding/header-lockup-v057.png'],
  ['sw.js','./branding/logo-mark-v057.png'],
  ['sw.js','./branding/splash-1242x2688.png'],
  ['.github/workflows/generate-brand-assets.yml','branding/favicon-user-v058.b64'],
  ['.github/workflows/generate-brand-assets.yml','branding/header-lockup-v057.png'],
  ['.github/workflows/generate-brand-assets.yml','branding/logo-mark-v057.png'],
  ['.github/workflows/generate-brand-assets.yml','branding/splash-1242x2688.png']
];
for(const [file,needle] of wiring){
  if(!text(file).includes(needle))fail(`${file} no longer wires canonical branding ${needle}`);
}

const generator=text('scripts/generate-brand-assets.py');
if(!generator.includes("BRANDING = ROOT / 'branding'")||!generator.includes("SOURCE_TEXT = BRANDING / 'favicon-user-v058.b64'")){
  fail('favicon generator no longer resolves canonical branding/favicon-user-v058.b64');
}
if(!generator.includes("EXPECTED_SHA256 = 'b0a52f01ae3679515abc10caf1db3a331a49ab57d85928ed3a007696a1f8eb3d'")){
  fail('favicon decoded-source SHA-256 lock changed or disappeared');
}

if(process.exitCode)process.exit(process.exitCode);
console.log(`Branding source ${strict?'STRICT':'AUDIT'} PASS: 4 canonical masters byte-locked; ${strict?'retired sources absent':'retired candidates unreferenced'}.`);
