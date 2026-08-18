const FALLBACK={version:'v0.5.11',sha:null,shortSha:'local',builtAt:null,runId:null,source:'fallback'};
let info=FALLBACK;

function isValid(value){
  return value&&/^v\d+\.\d+\.\d+$/.test(String(value.version||''))&&/^[0-9a-f]{40}$/i.test(String(value.sha||''));
}

function language(){return document.documentElement.lang==='fr'?'fr':'vi';}
function dateLabel(value){
  if(!value)return null;
  try{return new Intl.DateTimeFormat(language()==='fr'?'fr-FR':'vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}
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

  const fr=language()==='fr';
  const reliable=info.source==='deployment';
  const signature=[fr?'fr':'vi',info.version,info.sha||'',info.shortSha||'',info.builtAt||'',info.source||''].join('|');
  if(card.dataset.buildSignature===signature)return;
  card.dataset.buildSignature=signature;

  card.innerHTML=`<div class="build-version-head"><div><p class="eyebrow">${fr?'VERSION DÉPLOYÉE':'PHIÊN BẢN TRIỂN KHAI'}</p><h3>${info.version} <code>${info.shortSha}</code></h3></div><span class="build-version-dot ${reliable?'is-live':''}" title="${reliable?'Build stamp GitHub Pages':'Fallback local'}"></span></div>
    <p>${reliable?(fr?'Correspond exactement au commit servi par GitHub Pages.':'Khớp chính xác với commit đang được GitHub Pages phục vụ.'):(fr?'Build stamp indisponible · valeur locale de secours.':'Không đọc được build stamp · đang dùng giá trị dự phòng cục bộ.')}</p>
    ${info.builtAt?`<small>${fr?'Déployé':'Triển khai'} · ${dateLabel(info.builtAt)}</small>`:''}
    <button type="button" class="secondary-button build-version-copy">${fr?'Copier les infos de version':'Sao chép thông tin phiên bản'}</button>`;
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
if(main)new MutationObserver(mount).observe(main,{childList:true,subtree:true});
await load();
