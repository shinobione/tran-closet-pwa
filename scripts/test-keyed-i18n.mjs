import assert from 'node:assert/strict';
import {t,translationKeys,hasTranslation,normalizeLanguage} from '../js/i18n-keyed.mjs';
import {recommendLooks,weatherSummaryParts} from '../js/daily-assistant-core.mjs';

assert.equal(normalizeLanguage('fr'),'fr');
assert.equal(normalizeLanguage('xx'),'vi');
for(const key of translationKeys()){
  assert.equal(hasTranslation(key,'vi'),true,`missing VI key ${key}`);
  assert.equal(hasTranslation(key,'fr'),true,`missing FR key ${key}`);
}
assert.equal(t('photo.take',{},'vi'),'Chụp ảnh');
assert.equal(t('photo.take',{},'fr'),'Prendre une photo');
assert.equal(t('sync.pending',{count:1},'fr'),'1 modification encore en attente');
assert.equal(t('sync.pending',{count:2},'fr'),'2 modifications encore en attente');
assert.match(t('outfit.incomplete.detail',{count:1,minimum:2},'fr'),/1 article disponible/);
assert.equal(t('outfit.picker.selected',{count:1},'fr'),'1 sélectionné');
assert.equal(t('outfit.picker.selected',{count:2},'fr'),'2 sélectionnés');
assert.equal(t('outfit.picker.results',{visible:7,total:11},'vi'),'7/11 món');
assert.equal(t('outfit.picker.remove',{name:'Melody Bag'},'fr'),'Retirer Melody Bag');
assert.equal(t('app.edit.eyebrow',{},'fr'),'MODIFIER');
assert.equal(t('app.delete.offline',{},'vi'),'Đã xóa · sẽ đồng bộ khi có mạng');
assert.match(t('app.install.iosHtml',{},'fr'),/Safari/);
assert.match(t('app.privacy',{},'fr'),/flux de synchronisation canonique/);
assert.equal(t('occasion.Work',{},'fr'),'Travail');
assert.equal(t('weather.rain',{},'fr'),'Pluie');

const top={id:'top',name:'Top',category:'Shirt',colors:['White'],styles:['Casual'],tags:['Lightweight']};
const bottom={id:'bottom',name:'Bottom',category:'Pant',colors:['Black'],styles:['Casual'],tags:[]};
const result=recommendLooks({items:[top,bottom],outfits:[],weather:{temperature:31,apparentTemperature:33,dailyMax:34},occasion:'Everyday',limit:1});
assert.ok(result.suggestions.length);
assert.ok(result.suggestions[0].reasons.every(reason=>reason&&typeof reason.key==='string'),'Daily Assistant reasons must be keyed descriptors');
for(const reason of result.suggestions[0].reasons){
  const params={...(reason.params||{})};
  if(params.occasion)params.occasion=t(`occasion.${params.occasion}`,{},'fr');
  assert.notEqual(t(reason.key,params,'fr'),reason.key,`missing French reason ${reason.key}`);
}
const weatherParts=weatherSummaryParts(result.profile);
assert.ok(weatherParts.length);
assert.ok(weatherParts.every(part=>part.key.startsWith('weather.summary.')));

console.log(`Keyed i18n contract: PASS (${translationKeys().length} keys)`);
