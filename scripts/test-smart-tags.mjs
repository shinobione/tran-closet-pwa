import assert from 'node:assert/strict';
import {TAXONOMY,LABELS} from '../js/data.js';

assert.equal(TAXONOMY.tags.length,22);
assert.equal(new Set(TAXONOMY.tags).size,TAXONOMY.tags.length);
assert.equal(LABELS.tag.Character,'Nhân vật');
assert.equal(LABELS.tag.Patterned,'Họa tiết');
assert.equal(LABELS.tag['Rain-ready'],'Đi mưa');
assert.equal(LABELS.tag['Travel-friendly'],'Du lịch');
assert.ok(TAXONOMY.tags.includes('Compact'));
assert.ok(TAXONOMY.tags.includes('Cozy'));

console.log('smart-tags: taxonomy assertions passed');
