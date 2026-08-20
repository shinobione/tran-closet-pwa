import {currentLanguage,normalizeLanguage} from './i18n-keyed.mjs?v=0.5.16';

const MESSAGES={
  vi:{
    'wear.eyebrow':'LỊCH SỬ MẶC',
    'wear.action':'✓ Đã mặc hôm nay',
    'wear.today':'Đã ghi nhận hôm nay',
    'wear.undo':'Hoàn tác hôm nay',
    'wear.incomplete':'Sửa outfit trước khi ghi nhận đã mặc.',
    'wear.never':'Chưa ghi nhận lần mặc nào',
    'wear.count':({count})=>`${count} lần đã mặc`,
    'wear.last':({date})=>`Lần gần nhất: ${date}`,
    'wear.saved':'Đã ghi nhận hôm nay ✓',
    'wear.undone':'Đã hoàn tác lần mặc hôm nay',
    'wear.local':'B.1 lưu cục bộ/offline · đồng bộ cloud sẽ đến ở B.2.'
  },
  fr:{
    'wear.eyebrow':'HISTORIQUE DE PORT',
    'wear.action':'✓ Porté aujourd’hui',
    'wear.today':'Déjà noté comme porté aujourd’hui',
    'wear.undo':'Annuler aujourd’hui',
    'wear.incomplete':'Répare la tenue avant de la noter comme portée.',
    'wear.never':'Aucun port enregistré',
    'wear.count':({count})=>`${count} fois portée${Number(count)===1?'':'s'}`,
    'wear.last':({date})=>`Dernière fois : ${date}`,
    'wear.saved':'Port d’aujourd’hui enregistré ✓',
    'wear.undone':'Port d’aujourd’hui annulé',
    'wear.local':'B.1 reste local/offline · la synchronisation cloud arrive en B.2.'
  }
};

export function wearT(key,params={},language=currentLanguage()){
  const lang=normalizeLanguage(language);
  const candidate=MESSAGES[lang]?.[key]??MESSAGES.vi[key];
  if(candidate==null){
    if(typeof console!=='undefined')console.warn(`Missing wear i18n key: ${key}`);
    return key;
  }
  return typeof candidate==='function'?candidate(params):String(candidate);
}

export function wearTranslationKeys(){return Object.keys(MESSAGES.vi);}
export function hasWearTranslation(key,language){return MESSAGES[normalizeLanguage(language)]?.[key]!=null;}
