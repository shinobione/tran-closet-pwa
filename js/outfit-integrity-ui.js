import {getAllItems,getAllOutfits} from './db.js';
import {outfitIntegrity,OUTFIT_MIN_ITEMS} from './outfit-integrity.mjs?v=0.5.16';
import {t} from './i18n-keyed.mjs?v=0.5.16';

const root=document.querySelector('#mainContent');
const dialog=document.querySelector('#itemDialog');
let activeOutfitId=null;
let scheduled=false;

function ensureStyle(){
  if(document.querySelector('#outfitIntegrityStyle'))return;
  const style=document.createElement('style');
  style.id='outfitIntegrityStyle';
  style.textContent=`
    .outfit-card.is-incomplete{outline:1px solid rgba(245,168,76,.45);outline-offset:-1px}
    .outfit-integrity-card{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:8px 10px;border-radius:12px;background:rgba(245,168,76,.12);border:1px solid rgba(245,168,76,.28);font-size:12px;line-height:1.3}
    .outfit-integrity-card strong{font-size:12px;color:#ffd39b}.outfit-integrity-card span{opacity:.76;white-space:nowrap}
    .outfit-integrity-warning{margin:14px 0;padding:14px 15px;border-radius:16px;background:rgba(245,168,76,.12);border:1px solid rgba(245,168,76,.32)}
    .outfit-integrity-warning strong{display:block;margin-bottom:5px;color:#ffd39b}.outfit-integrity-warning p{margin:0;line-height:1.45}.outfit-integrity-warning small{display:block;margin-top:8px;opacity:.72}
    .outfit-detail.outfit-integrity-incomplete .outfit-presentation-actions{display:none!important}
  `;
  document.head.appendChild(style);
}

async function snapshot(){
  const [items,outfits]=await Promise.all([getAllItems(),getAllOutfits()]);
  return {items,outfits,byOutfit:new Map(outfits.map(outfit=>[String(outfit.id),outfit]))};
}

async function decorateCards(data=null){
  if(!root)return;
  const state=data||await snapshot();
  root.querySelectorAll('[data-outfit-open]').forEach(card=>{
    const outfit=state.byOutfit.get(String(card.dataset.outfitOpen));
    if(!outfit)return;
    const integrity=outfitIntegrity(outfit,state.items);
    card.classList.toggle('is-incomplete',integrity.incomplete);
    card.dataset.outfitIntegrity=integrity.state;
    card.querySelector('.outfit-integrity-card')?.remove();
    if(!integrity.incomplete)return;
    const body=card.querySelector('.outfit-card-body')||card;
    const warning=document.createElement('div');
    warning.className='outfit-integrity-card';
    warning.innerHTML=`<strong>⚠ ${t('outfit.incomplete.card')}</strong><span>${t('outfit.incomplete.count',{count:integrity.itemCount,minimum:OUTFIT_MIN_ITEMS})}</span>`;
    body.prepend(warning);
  });
}

async function decorateDialog(data=null){
  if(!dialog||!activeOutfitId)return;
  const detail=dialog.querySelector('.outfit-detail');
  if(!detail)return;
  const state=data||await snapshot();
  const outfit=state.byOutfit.get(String(activeOutfitId));
  if(!outfit)return;
  const integrity=outfitIntegrity(outfit,state.items);
  detail.classList.toggle('outfit-integrity-incomplete',integrity.incomplete);
  detail.dataset.outfitIntegrity=integrity.state;
  detail.querySelector('.outfit-integrity-warning')?.remove();
  if(!integrity.incomplete)return;
  const body=detail.querySelector('.detail-body');
  if(!body)return;
  const warning=document.createElement('div');
  warning.className='outfit-integrity-warning';
  warning.setAttribute('role','status');
  warning.innerHTML=`<strong>⚠ ${t('outfit.incomplete.title')}</strong><p>${t('outfit.incomplete.detail',{count:integrity.itemCount,minimum:OUTFIT_MIN_ITEMS})}</p><small>${t('outfit.incomplete.share')}</small>`;
  const items=body.querySelector('.outfit-detail-items');
  if(items)body.insertBefore(warning,items);else body.prepend(warning);
}

async function decorate(){
  scheduled=false;
  try{
    const data=await snapshot();
    await decorateCards(data);
    await decorateDialog(data);
  }catch(error){console.warn('Outfit integrity UI decoration failed',error);}
}

function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(decorate);}

document.addEventListener('click',event=>{
  const card=event.target?.closest?.('[data-outfit-open]');
  if(card){activeOutfitId=card.dataset.outfitOpen;schedule();}
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Enter')return;
  const card=event.target?.closest?.('[data-outfit-open]');
  if(card){activeOutfitId=card.dataset.outfitOpen;schedule();}
});

ensureStyle();
if(root)new MutationObserver(schedule).observe(root,{childList:true});
if(dialog)new MutationObserver(schedule).observe(dialog,{childList:true});
schedule();
