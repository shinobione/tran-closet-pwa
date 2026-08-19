import assert from 'node:assert/strict';
import {normalizeClosetSearch,closetSearchText,closetSearchMatches} from '../js/closet-search-core.mjs';

const item={
  id:'demo',name:'Sac Élégant',category:'Bag',colors:['Navy','Pink'],styles:['Casual'],tags:['Travel-friendly']
};

assert.equal(normalizeClosetSearch('  ÉlÉGANT  '),'elegant');
assert.ok(closetSearchText(item).includes('sac elegant'));
assert.equal(closetSearchMatches(item,'élégant'),true);
assert.equal(closetSearchMatches(item,'Túi'),true,'Vietnamese category label should match');
assert.equal(closetSearchMatches(item,'Sac'),true,'French category label should match');
assert.equal(closetSearchMatches(item,'bleu marine'),true,'French fine-color label should match');
assert.equal(closetSearchMatches(item,'travel-friendly'),true);
assert.equal(closetSearchMatches(item,'parapluie'),false);

console.log('Runtime consolidation search contract: PASS');
