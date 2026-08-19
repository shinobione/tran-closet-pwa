import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const WORKFLOW_DIR='.github/workflows';
const files=fs.readdirSync(WORKFLOW_DIR).filter(name=>/\.ya?ml$/.test(name)).sort();
const read=name=>fs.readFileSync(path.join(WORKFLOW_DIR,name),'utf8');

const generatedWriters=new Set(['sync-airtable.yml','generate-brand-assets.yml']);
const contentWriters=[];
for(const name of files){
  const source=read(name);
  if(/permissions:\s*[\s\S]*?contents:\s*write/.test(source))contentWriters.push(name);

  assert.ok(!/git\s+push[^\n]*(?:--force|-f\b)/.test(source),`${name}: workflows must never force-push`);
  assert.ok(!/git\s+(?:add|rm)[^\n]*\.github\/workflows/.test(source),`${name}: workflows must not self-mutate workflow files`);
  assert.ok(!/rm\s+\.github\/workflows\//.test(source),`${name}: workflows must not delete workflow files at runtime`);
}
assert.deepEqual(contentWriters.sort(),[...generatedWriters].sort(),'contents:write workflow allowlist changed');

for(const name of generatedWriters){
  const source=read(name);
  assert.ok(source.includes('group: generated-main-writes'),`${name}: generated-main-writes concurrency missing`);
  assert.ok(source.includes('cancel-in-progress: false'),`${name}: generated writes must serialize, not cancel each other`);
  assert.ok(source.includes('bash scripts/commit-generated-artifacts.sh'),`${name}: collision-safe writer helper missing`);
  assert.ok(!source.includes('git push origin HEAD:main'),`${name}: direct main push bypasses the governance helper`);
}

const writer=fs.readFileSync('scripts/commit-generated-artifacts.sh','utf8');
for(const required of [
  'git fetch --no-tags origin "$TARGET_BRANCH"',
  'git reset --hard "origin/$TARGET_BRANCH"',
  'bash -lc "$GENERATE_COMMAND"',
  'git push origin "HEAD:$TARGET_BRANCH"',
  'regenerating from latest main',
  'Generated writers must never mutate workflow files.'
])assert.ok(writer.includes(required),`generated writer helper missing contract: ${required}`);
assert.ok(!writer.includes('--force'),'generated writer helper must never force-push');
assert.ok(!writer.includes('push -f'),'generated writer helper must never force-push');

const governance=fs.readFileSync('docs/REPOSITORY-GOVERNANCE.md','utf8');
for(const phrase of [
  'main is authoritative',
  'Engineering changes use pull requests',
  'Generated-main-write exceptions',
  'MERGED',
  'PAGES DEPLOYED',
  'WORKER DEPLOYED',
  'VERIFIED PROD',
  'Self-mutating workflows are forbidden',
  'Branch lifecycle'
])assert.ok(governance.includes(phrase),`governance doc missing: ${phrase}`);

console.log(`Repository governance PASS (${files.length} workflows; content writers: ${contentWriters.join(', ')})`);
