import {currentLanguage,t} from './i18n-keyed.mjs?v=0.5.16';

const FALLBACK={version:'v0.5.16',sha:null,shortSha:'local',builtAt:null,runId:null,source:'fallback'};
let info=FALLBACK;

function isValid(value){
  return value&&/^v\d+\.\d+\.\d+$/.test(String(value.version||''))&&/^[0-9a-f]{40}$/i.test(String(value.sha||''));
}

function dateLabel(value){
  if(!value)return null;
  try{return new Intl.DateTimeFormat(currentLanguage()==='fr'?'fr-FR':'vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}
  catch{return value;}
}

function copyText(){
  const value=`${info.version} · ${info.shortSha}${info.builtAt?` · ${info.builtAt}`:''}`;
  navigator.clipboard?.writeText(value).catch(()=>{});
}

function mount(){
  const settings=document.querySelector('.settings-list');
  if(!settings)return;
  let card=document.querySelector('#buildVersionCard');
  if(!card){
    card=document.createElement('section');
    card.id='buildVersionCard';
    card.className='build-version-card';
    settings.after(card);
  }

  const language=currentLanguage();
  const reliable=info.source==='deployment';
  const signature=[language,info.version,info.sha||'',info.shortSha||'',info.builtAt||'',info.source||''].join('|');
  if(card.dataset.buildSignature===signature)return;
  card.dataset.buildSignature=signature;

  card.innerHTML=`<div class="build-version-head"><div><p class="eyebrow">${t('build.eyebrow')}</p><h3>${info.version} <code>${info.shortSha}</code></h3></div><span class="build-version-dot ${reliable?'is-live':''}" title="${t(reliable?'build.liveTitle':'build.fallbackTitle')}"></span></div>
    <p>${t(reliable?'build.exact':'build.fallback')}</p>
    ${info.builtAt?`<small>${t('build.deployed')} · ${dateLabel(info.builtAt)}</small>`:''}
    <button type="button" class="secondary-button build-version-copy">${t('build.copy')}</button>`;
  card.querySelector('.build-version-copy')?.addEventListener('click',copyText);
}

async function load(){
  try{
    const response=await fetch(`./build-info.json?t=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw new Error(`BUILD_INFO_${response.status}`);
    const body=await response.json();
    if(!isValid(body))throw new Error('INVALID_BUILD_INFO');
    info={...body,shortSha:body.shortSha||String(body.sha).slice(0,7),source:'deployment'};
  }catch(error){
    console.warn('Deployment build info unavailable.',error);
    info=FALLBACK;
  }
  window.TranClosetBuildInfo=info;
  window.dispatchEvent(new CustomEvent('tran:build-info',{detail:info}));
  mount();
}

window.addEventListener('tran:build-info',mount);
const main=document.querySelector('#mainContent');
if(main)new MutationObserver(mount).observe(main,{childList:true});
await load();
