import {getAllItems,getAllOutfits,getAllWearEvents,getWearEvent,putWearEvent,deleteWearEvent} from './db.js';
import {outfitIntegrity} from './outfit-integrity.mjs?v=0.5.18';
import {createWearEvent,deriveWearStats,eventForOutfitDate,localDateKey,wearEventId} from './wear-history-core.mjs?v=0.5.18';
import {queueWearEventCreate,queueWearEventDelete} from './wear-sync-client.js?v=0.5.18';
import {currentLanguage} from './i18n-keyed.mjs?v=0.5.18';
import {wearT} from './wear-history-i18n.mjs?v=0.5.18';

const dialog=document.querySelector('#itemDialog');
let activeOutfitId=null;
let activeItemId=null;
let scheduled=false;

function ensureStyle(){
  if(document.querySelector('#wearHistoryStyle'))return;
  const style=document.createElement('style');
  style.id='wearHistoryStyle';
  style.textContent=`
    .wear-history-panel{margin:16px 0;padding:14px;border-radius:16px;background:rgba(239,155,189,.08);border:1px solid rgba(239,155,189,.2)}
    .wear-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
    .wear-history-head p{margin:0;color:#ef9bbd;font-size:11px;font-weight:800;letter-spacing:.08em}.wear-history-head strong{display:block;margin-top:4px;font-size:14px}
    .wear-history-meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}.wear-history-meta span{padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.06);font-size:11px}
    .wear-history-actions{display:flex;gap:8px;flex-wrap:wrap}.wear-history-actions button{flex:1;min-width:150px}
    .wear-history-panel small{display:block;margin-top:9px;opacity:.62;line-height:1.35}
    .wear-history-panel.is-incomplete{background:rgba(245,168,76,.08);border-color:rgba(245,168,76,.24)}
    .wear-history-panel.is-incomplete .wear-history-head p{color:#ffd39b}
    .wear-history-panel.is-item .wear-history-meta{margin-bottom:0}
  `;
  document.head.appendChild(style);
}

function formatDate(value){
  if(!value)return '';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  const locale=currentLanguage()==='fr'?'fr-FR':'vi-VN';
  return new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric'}).format(date);
}

async function snapshot(){
  const [items,outfits,events]=await Promise.all([getAllItems(),getAllOutfits(),getAllWearEvents()]);
  return {
    items,outfits,events,
    byOutfit:new Map(outfits.map(outfit=>[String(outfit.id),outfit])),
    byItem:new Map(items.map(item=>[String(item.id),item]))
  };
}

function statMarkup(stat){
  const count=Number(stat?.count||0);
  return `<div class="wear-history-meta"><span>${wearT('wear.count',{count})}</span>${stat?.lastWorn?`<span>${wearT('wear.last',{date:formatDate(stat.lastWorn)})}</span>`:''}</div>`;
}

function outfitPanelMarkup({integrity,stat,todayEvent}){
  const last=stat?.lastWorn?wearT('wear.last',{date:formatDate(stat.lastWorn)}):wearT('wear.never');
  const status=todayEvent?wearT('wear.today'):last;
  const incomplete=integrity.incomplete;
  return `<section class="wear-history-panel ${incomplete?'is-incomplete':''}" data-wear-history>
    <div class="wear-history-head"><div><p>${wearT('wear.eyebrow')}</p><strong>${status}</strong></div></div>
    ${statMarkup(stat)}
    <div class="wear-history-actions">
      ${incomplete
        ? `<button type="button" class="secondary-button" disabled>${wearT('wear.incomplete')}</button>`
        : todayEvent
          ? `<button type="button" class="secondary-button" data-wear-undo>${wearT('wear.undo')}</button>`
          : `<button type="button" class="primary-button" data-wear-today>${wearT('wear.action')}</button>`}
    </div>
    <small>${wearT('wear.local')}</small>
  </section>`;
}

function itemPanelMarkup(stat){
  const last=stat?.lastWorn?wearT('wear.last',{date:formatDate(stat.lastWorn)}):wearT('wear.never');
  return `<section class="wear-history-panel is-item" data-wear-history-item>
    <div class="wear-history-head"><div><p>${wearT('wear.eyebrow')}</p><strong>${last}</strong></div></div>
    ${statMarkup(stat)}
  </section>`;
}

async function enhanceOutfit(detail,data){
  const outfit=data.byOutfit.get(String(activeOutfitId));
  if(!outfit)return;
  const integrity=outfitIntegrity(outfit,data.items);
  const stats=deriveWearStats(data.events);
  const stat=stats.byOutfit[String(outfit.id)]||null;
  const todayEvent=eventForOutfitDate(data.events,outfit.id,new Date());
  detail.querySelector('[data-wear-history]')?.remove();
  const body=detail.querySelector('.detail-body');
  const actions=body?.querySelector('.detail-actions');
  if(!body)return;
  const holder=document.createElement('div');
  holder.innerHTML=outfitPanelMarkup({integrity,stat,todayEvent});
  const panel=holder.firstElementChild;
  if(actions)body.insertBefore(panel,actions);else body.appendChild(panel);

  panel.querySelector('[data-wear-today]')?.addEventListener('click',async event=>{
    const button=event.currentTarget;
    button.disabled=true;
    try{
      const now=new Date();
      const eventId=wearEventId(outfit.id,localDateKey(now));
      const existing=await getWearEvent(eventId);
      const wearEvent=createWearEvent({outfit,itemIds:integrity.resolvedItemIds,now,existing});
      if(!existing){
        await putWearEvent({...wearEvent,syncState:'pending-create'});
        await queueWearEventCreate(wearEvent);
      }
      window.dispatchEvent(new CustomEvent('tran:wear-history-changed',{detail:{outfitId:outfit.id,eventId:wearEvent.id,operation:existing?'noop':'create'}}));
      button.textContent=wearT('wear.saved');
      await enhance();
    }catch(error){
      console.warn('Wear event creation failed',error);
      button.disabled=false;
    }
  });

  panel.querySelector('[data-wear-undo]')?.addEventListener('click',async event=>{
    const button=event.currentTarget;
    button.disabled=true;
    try{
      await queueWearEventDelete(todayEvent);
      await deleteWearEvent(todayEvent.id);
      window.dispatchEvent(new CustomEvent('tran:wear-history-changed',{detail:{outfitId:outfit.id,eventId:todayEvent.id,operation:'delete'}}));
      button.textContent=wearT('wear.undone');
      await enhance();
    }catch(error){
      console.warn('Wear event delete failed',error);
      button.disabled=false;
    }
  });
}

function enhanceItem(data){
  if(!activeItemId)return;
  const sheet=dialog.querySelector('.sheet-content:not(.outfit-detail):not(.edit-sheet)');
  const body=sheet?.querySelector('.detail-body');
  if(!body||!data.byItem.has(String(activeItemId)))return;
  body.querySelector('[data-wear-history-item]')?.remove();
  const stats=deriveWearStats(data.events);
  const stat=stats.byItem[String(activeItemId)]||null;
  const actions=body.querySelector('.detail-actions');
  const holder=document.createElement('div');
  holder.innerHTML=itemPanelMarkup(stat);
  const panel=holder.firstElementChild;
  if(actions)body.insertBefore(panel,actions);else body.appendChild(panel);
}

async function enhance(){
  scheduled=false;
  if(!dialog)return;
  try{
    const data=await snapshot();
    const outfitDetail=dialog.querySelector('.outfit-detail');
    if(outfitDetail&&activeOutfitId){await enhanceOutfit(outfitDetail,data);return;}
    enhanceItem(data);
  }catch(error){console.warn('Wear history UI failed',error);}
}

function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(enhance);}

document.addEventListener('click',event=>{
  const outfitCard=event.target?.closest?.('[data-outfit-open]');
  if(outfitCard){activeOutfitId=outfitCard.dataset.outfitOpen;activeItemId=null;schedule();return;}
  const outfitItem=event.target?.closest?.('[data-outfit-item]');
  if(outfitItem){activeItemId=outfitItem.dataset.outfitItem;activeOutfitId=null;schedule();return;}
  const itemCard=event.target?.closest?.('[data-open]');
  if(itemCard&&!event.target?.closest?.('[data-fav]')){activeItemId=itemCard.dataset.open;activeOutfitId=null;schedule();}
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Enter')return;
  const outfitCard=event.target?.closest?.('[data-outfit-open]');
  if(outfitCard){activeOutfitId=outfitCard.dataset.outfitOpen;activeItemId=null;schedule();return;}
  const itemCard=event.target?.closest?.('[data-open]');
  if(itemCard){activeItemId=itemCard.dataset.open;activeOutfitId=null;schedule();}
});
window.addEventListener('tran:wear-history-changed',schedule);
window.addEventListener('tran:wear-history-live-changed',schedule);
window.addEventListener('tran:outfits-live-changed',schedule);
window.addEventListener('tran:items-live-changed',schedule);

ensureStyle();
if(dialog)new MutationObserver(schedule).observe(dialog,{childList:true});
