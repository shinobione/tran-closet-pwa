import {getAllItems} from './db.js';
import {closetSearchMatches} from './closet-search-core.mjs?v=0.5.16';

const root=document.querySelector('#mainContent');
let currentQuery='';

function emptyCopy(){
  return document.documentElement.lang==='fr'
    ? '<strong>Aucun résultat</strong><p>Essaie un nom, une catégorie, une couleur, un style ou un tag.</p>'
    : '<strong>Không có kết quả</strong><p>Hãy thử tên, loại, màu, phong cách hoặc nhãn khác.</p>';
}

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
