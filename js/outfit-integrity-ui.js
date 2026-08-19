import {getAllItems,getAllOutfits} from './db.js';
import {outfitIntegrity,OUTFIT_MIN_ITEMS} from './outfit-integrity.mjs?v=0.5.16';

const root=document.querySelector('#mainContent');
const dialog=document.querySelector('#itemDialog');
const LANGUAGE_KEY='tran-closet-language';
let activeOutfitId=null;
let scheduled=false;

function copy(){
  const fr=localStorage.getItem(LANGUAGE_KEY)==='fr';
  return fr?{
    title:'Tenue incomplète',
    card:'Tenue incomplète',
    count:n=>`${n}/${OUTFIT_MIN_ITEMS} articles disponibles`,
    detail:n=>`Cette tenue ne contient plus que ${n} article${n===1?'':'s'} disponible${n===1?'':'s'}. Modifie-la pour ajouter au moins ${OUTFIT_MIN_ITEMS-n} article${OUTFIT_MIN_ITEMS-n===1?'':'s'}, ou supprime-la si elle n’est plus utile.`,
    share:'Répare la tenue avant de la partager.'
  }:{
    title:'Outfit chưa hoàn chỉnh',
    card:'Outfit chưa hoàn chỉnh',
    count:n=>`${n}/${OUTFIT_MIN_ITEMS} món còn sẵn`,
    detail:n=>`Outfit này chỉ còn ${n} món khả dụng. Hãy chỉnh sửa để thêm ít nhất ${OUTFIT_MIN_ITEMS-n} món nữa, hoặc xóa outfit nếu không còn cần.`,
    share:'Hãy sửa outfit trước khi chia sẻ.'
  };
}

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
  const text=copy();
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
    warning.innerHTML=`<strong>⚠ ${text.card}</strong><span>${text.count(integrity.itemCount)}</span>`;
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
  const text=copy();
  const body=detail.querySelector('.detail-body');
  if(!body)return;
  const warning=document.createElement('div');
  warning.className='outfit-integrity-warning';
  warning.setAttribute('role','status');
  warning.innerHTML=`<strong>⚠ ${text.title}</strong><p>${text.detail(integrity.itemCount)}</p><small>${text.share}</small>`;
  const items=body.querySelector('.outfit-detail-items');
  if(items)body.insertBefore(warning,items);else body.prepend(warning);
}

async function decorate(){
  scheduled=false;
  try{
    const data=await snapshot();
    await decorateCards(data);
    await decorateDialog(data);
  }catch(error){
    console.warn('Outfit integrity UI decoration failed',error);
  }
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(decorate);
}

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
