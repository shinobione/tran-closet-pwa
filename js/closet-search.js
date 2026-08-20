import {getAllItems} from './db.js';
import {closetSearchMatches} from './closet-search-core.mjs?v=0.5.17';
import {t} from './i18n-keyed.mjs?v=0.5.17';

const root=document.querySelector('#mainContent');
let currentQuery='';

function emptyCopy(){return `<strong>${t('search.empty.title')}</strong><p>${t('search.empty.body')}</p>`;}

async function applySearch(input){
  const items=await getAllItems();
  if(!input.isConnected)return;
  const byId=new Map(items.map(item=>[String(item.id),item]));
  let visible=0;
  document.querySelectorAll('.item-grid .item-card[data-open]').forEach(card=>{
    const item=byId.get(String(card.dataset.open));
    const show=Boolean(item&&closetSearchMatches(item,currentQuery));
    card.hidden=!show;
    if(show)visible++;
  });
  const counter=document.querySelector('.section-heading span');
  if(counter)counter.textContent=String(visible);
  const grid=document.querySelector('.item-grid');
  if(!grid)return;
  let empty=grid.querySelector('.closet-search-empty');
  if(!visible&&currentQuery.trim()){
    if(!empty){
      empty=document.createElement('div');
      empty.className='empty-state closet-search-empty';
      empty.innerHTML=emptyCopy();
      grid.appendChild(empty);
    }
  }else empty?.remove();
}

function bindSearch(){
  const input=document.querySelector('#searchInput');
  if(!input||input.dataset.closetSearchBound==='1')return;
  input.dataset.closetSearchBound='1';
  if(currentQuery)input.value=currentQuery;
  input.addEventListener('input',event=>{
    event.stopImmediatePropagation();
    currentQuery=event.currentTarget.value;
    applySearch(event.currentTarget).catch(error=>console.warn('Closet search filtering failed.',error));
  },true);
  if(currentQuery)applySearch(input).catch(error=>console.warn('Closet search restore failed.',error));
}

bindSearch();
if(root)new MutationObserver(bindSearch).observe(root,{childList:true});
