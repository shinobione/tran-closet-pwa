import {getAllItems} from './db.js';
import {LABELS,FR_LABELS} from './data.js';

const root=document.querySelector('#mainContent');
let currentQuery='';

export const normalizeClosetSearch=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .trim();

export function closetSearchText(item={}){
  const translated=(type,value)=>[
    value,
    LABELS[type]?.[value],
    FR_LABELS[type]?.[value]
  ].filter(Boolean).join(' ');
  return normalizeClosetSearch([
    item.name,
    translated('category',item.category),
    ...(item.colors||[]).map(value=>translated('color',value)),
    ...(item.styles||[]).map(value=>translated('style',value)),
    ...(item.tags||[]).map(value=>translated('tag',value))
  ].join(' '));
}

function emptyCopy(){
  return document.documentElement.lang==='fr'
    ? '<strong>Aucun résultat</strong><p>Essaie un nom, une catégorie, une couleur, un style ou un tag.</p>'
    : '<strong>Không có kết quả</strong><p>Hãy thử tên, loại, màu, phong cách hoặc nhãn khác.</p>';
}

async function applySearch(input){
  const query=normalizeClosetSearch(currentQuery);
  const items=await getAllItems();
  if(!input.isConnected)return;
  const byId=new Map(items.map(item=>[String(item.id),item]));
  let visible=0;
  document.querySelectorAll('.item-grid .item-card[data-open]').forEach(card=>{
    const item=byId.get(String(card.dataset.open));
    const show=!query||Boolean(item&&closetSearchText(item).includes(query));
    card.hidden=!show;
    if(show)visible++;
  });
  const counter=document.querySelector('.section-heading span');
  if(counter)counter.textContent=String(visible);
  const grid=document.querySelector('.item-grid');
  if(!grid)return;
  let empty=grid.querySelector('.closet-search-empty');
  if(!visible&&query){
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
    // app.js still owns the legacy re-rendering listener. Capture this event so
    // search stays in-place and the mobile keyboard/caret never gets destroyed.
    event.stopImmediatePropagation();
    currentQuery=event.currentTarget.value;
    applySearch(event.currentTarget).catch(error=>console.warn('Closet search filtering failed.',error));
  },true);
  if(currentQuery)applySearch(input).catch(error=>console.warn('Closet search restore failed.',error));
}

bindSearch();
if(root)new MutationObserver(bindSearch).observe(root,{childList:true});
