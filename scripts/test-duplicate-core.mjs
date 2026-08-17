import assert from 'node:assert/strict';
import {normalizeText,jaccard,nameSimilarity,hammingDistance,visualSimilarity,metadataSimilarity,duplicateAssessment,duplicateReasons} from '../js/duplicate-core.mjs';

assert.equal(normalizeText(' Túi  Melody! '),'tui melody');
assert.equal(jaccard(['Red','White'],['White','Red']),1);
assert.equal(nameSimilarity('Melody Bag','melody bag'),1);
assert.equal(hammingDistance('0101','0111'),1);
assert.equal(visualSimilarity(0),1);
assert.ok(visualSimilarity(8)>.9);

const exactMeta=metadataSimilarity(
  {name:'Melody Bag',category:'Bag',colors:['Pink'],styles:['Cartoon']},
  {name:'Melody Bag',category:'Bag',colors:['Pink'],styles:['Cartoon']}
);
assert.equal(exactMeta.category,1);
assert.equal(exactMeta.colors,1);
assert.equal(exactMeta.styles,1);
assert.equal(exactMeta.name,1);

const exactImage=duplicateAssessment({distance:2,metadata:exactMeta});
assert.equal(exactImage.level,'high');
assert.ok(exactImage.score>.9);
assert.ok(duplicateReasons(exactImage).includes('Ảnh gần như trùng'));

const visuallyClose=duplicateAssessment({
  distance:10,
  metadata:metadataSimilarity(
    {name:'DC Shoes',category:'Shoes',colors:['Brown','White'],styles:['Casual']},
    {name:'Shoes',category:'Shoes',colors:['Brown'],styles:['Casual']}
  )
});
assert.ok(['high','medium'].includes(visuallyClose.level));

const metadataOnlyExact=duplicateAssessment({distance:null,metadata:exactMeta});
assert.equal(metadataOnlyExact.level,'high');

const unrelated=duplicateAssessment({
  distance:30,
  metadata:metadataSimilarity(
    {name:'White shirt',category:'Shirt',colors:['White'],styles:['Casual']},
    {name:'Pink bag',category:'Bag',colors:['Pink'],styles:['Cartoon']}
  )
});
assert.equal(unrelated.level,'none');
assert.ok(unrelated.score<.5);

console.log('duplicate-core: all assertions passed');
