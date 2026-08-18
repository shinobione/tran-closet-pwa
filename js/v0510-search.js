import {getAllItems} from './db.js';
import {LABELS,FR_LABELS} from './data.js';

const root=document.querySelector('#mainContent');
let currentQuery='';

const normalize=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .trim();

function searchText(item){
  const translated=(type,value)=>[
    value,
    LABELS[type]?.[value],
    FR_LABELS[type]?.[value]
  ].filter(Boolean).join(' ');
  return normalize([
    item.name,
    translated('category',item.category),
    ...(item.colors||[]).map(value=>translated('color',value)),
    ...(item.styles||[]).map(value=>translated('style',value)),
    ...(item.tags||[]).map(value=>translated('tag',value))
  ].join(' '));
}

async function applySearch(input){
  const query=normalize(currentQuery);
  const items=await getAllItems();
  if(!input.isConnected)return;
  const byId=new Map(items.map(item=>[String(item.id),item]));
  let visible=0;
  document.querySelectorAll('.item-grid .item-card[data-open]').forEach(card=>{
    const item=byId.get(String(card.dataset.open));
    const show=!query||Boolean(item&&searchText(item).includes(query));
    card.hidden=!show;
    if(show)visible++;
  });
  const counter=document.querySelector('.section-heading span');
  if(counter)counter.textContent=String(visible);
  const grid=document.querySelector('.item-grid');
  if(grid){
    let empty=grid.querySelector('.v0510-search-empty');
    if(!visible&&query){
      if(!empty){
        empty=document.createElement('div');
        empty.className='empty-state v0510-search-empty';
        empty.innerHTML='<strong>Aucun résultat</strong><p>Essaie un nom, une catégorie, une couleur, un style ou un tag.</p>';
        grid.appendChild(empty);
      }
    }else empty?.remove();
  }
}

function bindSearch(){
  const input=document.querySelector('#searchInput');
  if(!input||input.dataset.v0510SearchBound==='1')return;
  input.dataset.v0510SearchBound='1';
  if(currentQuery)input.value=currentQuery;

  input.addEventListener('input',event=>{
    // Stop app.js from destroying/recreating the whole closet on every key.
    event.stopImmediatePropagation();
    currentQuery=event.currentTarget.value;
    applySearch(event.currentTarget).catch(error=>console.warn('Search filtering failed.',error));
  },true);

  if(currentQuery)applySearch(input).catch(error=>console.warn('Search restore failed.',error));
}

bindSearch();
if(root)new MutationObserver(bindSearch).observe(root,{childList:true,subtree:true});
