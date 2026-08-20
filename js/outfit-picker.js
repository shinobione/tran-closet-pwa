import {getAllItems} from './db.js';
import {LABELS,FR_LABELS} from './data.js';
import {currentLanguage,t} from './i18n-keyed.mjs?v=0.5.18';

const root=document.querySelector('#mainContent');
const categoryOrder=['Shirt','Pant','Skirt','Dress','Combo','Jumpsuit','Coat','Bag','Shoes','Headwear','Umbrella','Accessorie','Belt','Underwear','Socks','Swimware','Eye Lens'];

function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function normalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function displayLabel(type,value){
  const map=currentLanguage()==='fr'?FR_LABELS:LABELS;
  return map[type]?.[value]||LABELS[type]?.[value]||value;
}
function searchable(item){
  const translated=(type,value)=>[value,LABELS[type]?.[value],FR_LABELS[type]?.[value]].filter(Boolean).join(' ');
  return normalize([item.name,translated('category',item.category),...(item.colors||[]).map(v=>translated('color',v)),...(item.styles||[]).map(v=>translated('style',v)),...(item.tags||[]).map(v=>translated('tag',v))].join(' '));
}
function ensureStyles(){
  if(document.querySelector('#outfitPickerInlineStyle'))return;
  const style=document.createElement('style');style.id='outfitPickerInlineStyle';style.textContent=`
    .outfit-picker-shell{display:grid;gap:10px}.outfit-picker-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.outfit-picker-toolbar input{min-width:0;flex:1 1 220px}.outfit-picker-toolbar .picker-counts{margin-left:auto;font-size:.82rem;opacity:.72;white-space:nowrap}
    .outfit-picker-filters{display:flex;gap:7px;overflow:auto;padding:2px 0 4px;scrollbar-width:none}.outfit-picker-filters::-webkit-scrollbar{display:none}.outfit-picker-chip{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:inherit;border-radius:999px;padding:8px 11px;font:inherit;font-size:.78rem;white-space:nowrap}.outfit-picker-chip.is-active{border-color:rgba(239,155,189,.55);background:rgba(239,155,189,.16);color:#ffd9e8}
    .outfit-picker-selected{display:flex;gap:8px;overflow:auto;padding:1px 0;min-height:0;scrollbar-width:none}.outfit-picker-selected:empty{display:none}.outfit-picker-selected::-webkit-scrollbar{display:none}.outfit-picker-selected button{display:flex;align-items:center;gap:7px;max-width:180px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:inherit;border-radius:12px;padding:5px 8px;font:inherit}.outfit-picker-selected img,.outfit-picker-selected .picker-thumb{width:32px;height:32px;border-radius:8px;object-fit:cover;background:rgba(255,255,255,.08);display:grid;place-items:center;flex:0 0 auto}.outfit-picker-selected span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.76rem}.outfit-picker-selected b{opacity:.58}
    .item-picker.outfit-picker-grid{max-height:min(48vh,480px);overflow:auto;padding-right:2px}.item-picker .picker-item[hidden]{display:none!important}.outfit-picker-empty{grid-column:1/-1;padding:24px 8px;text-align:center;opacity:.7;font-size:.86rem}
    .outfit-form[data-enhanced-picker="true"] .dialog-actions{position:sticky;bottom:-1px;z-index:4;padding-top:12px;background:linear-gradient(to bottom,transparent 0,#171219 30%)}
    @media(max-width:640px){.outfit-picker-toolbar{display:grid;grid-template-columns:1fr auto}.outfit-picker-toolbar input{grid-column:1/-1;width:100%}.outfit-picker-toolbar .picker-counts{margin-left:0}.item-picker.outfit-picker-grid{max-height:42vh}}
  `;document.head.appendChild(style);
}
function selectedIds(form){return new Set([...form.querySelectorAll('input[name="itemIds"]:checked')].map(input=>input.value));}
function getState(form){return form._outfitPickerState||(form._outfitPickerState={query:'',category:'all',favorite:false,selected:false,items:[]});}
function findCard(form,id){return [...form.querySelectorAll('.picker-item')].find(card=>card.querySelector('input[name="itemIds"]')?.value===id);}

function renderSelectedStrip(form){
  const strip=form.querySelector('[data-picker-selected-strip]');if(!strip)return;
  const ids=selectedIds(form),state=getState(form),byId=new Map(state.items.map(item=>[item.id,item]));
  strip.innerHTML=[...ids].map(id=>{const item=byId.get(id);if(!item)return '';return `<button type="button" data-picker-remove="${esc(id)}" title="${esc(t('outfit.picker.remove',{name:item.name}))}">${item.photo?`<img src="${item.photo}" alt="">`:`<span class="picker-thumb">◇</span>`}<span>${esc(item.name)}</span><b>×</b></button>`;}).join('');
  strip.querySelectorAll('[data-picker-remove]').forEach(button=>button.addEventListener('click',()=>{const card=findCard(form,button.dataset.pickerRemove);const input=card?.querySelector('input[name="itemIds"]');if(input){input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}}));
}
function updateCounts(form,visible){
  const counts=form.querySelector('[data-picker-counts]');if(!counts)return;
  const selected=selectedIds(form).size,total=getState(form).items.length;
  counts.textContent=`${t('outfit.picker.selected',{count:selected})} · ${t('outfit.picker.results',{visible,total})}`;
}
function applyFilters(form){
  const state=getState(form),query=normalize(state.query),ids=selectedIds(form);let visible=0;
  form.querySelectorAll('.picker-item').forEach(card=>{const id=card.querySelector('input[name="itemIds"]')?.value,item=state.items.find(candidate=>candidate.id===id);let show=Boolean(item);if(show&&query&&!searchable(item).includes(query))show=false;if(show&&state.category!=='all'&&item.category!==state.category)show=false;if(show&&state.favorite&&!item.favorite)show=false;if(show&&state.selected&&!ids.has(item.id))show=false;card.hidden=!show;if(show)visible++;});
  let empty=form.querySelector('.outfit-picker-empty');if(!visible){if(!empty){empty=document.createElement('div');empty.className='outfit-picker-empty';empty.textContent=t('outfit.picker.empty');form.querySelector('.item-picker')?.appendChild(empty);}}else empty?.remove();
  form.querySelectorAll('[data-picker-category]').forEach(button=>button.classList.toggle('is-active',button.dataset.pickerCategory===state.category));form.querySelector('[data-picker-favorite]')?.classList.toggle('is-active',state.favorite);form.querySelector('[data-picker-selected]')?.classList.toggle('is-active',state.selected);renderSelectedStrip(form);updateCounts(form,visible);
}
function toolbarMarkup(items){
  const existing=[...new Set(items.map(item=>item.category).filter(Boolean))],categories=categoryOrder.filter(category=>existing.includes(category));
  return `<div class="outfit-picker-shell" data-outfit-picker-shell><div class="outfit-picker-toolbar"><input type="search" data-picker-search placeholder="${esc(t('outfit.picker.searchPlaceholder'))}" aria-label="${esc(t('outfit.picker.searchLabel'))}"><button type="button" class="outfit-picker-chip" data-picker-reset>${t('outfit.picker.reset')}</button><span class="picker-counts" data-picker-counts></span></div><div class="outfit-picker-filters" aria-label="${esc(t('outfit.picker.filterCategory'))}"><button type="button" class="outfit-picker-chip is-active" data-picker-category="all">${t('outfit.picker.all')}</button>${categories.map(category=>`<button type="button" class="outfit-picker-chip" data-picker-category="${esc(category)}">${esc(displayLabel('category',category))}</button>`).join('')}<button type="button" class="outfit-picker-chip" data-picker-favorite>${t('outfit.picker.favorites')}</button><button type="button" class="outfit-picker-chip" data-picker-selected>${t('outfit.picker.selectedOnly')}</button></div><div class="outfit-picker-selected" data-picker-selected-strip></div></div>`;
}
function bind(form){
  const state=getState(form),search=form.querySelector('[data-picker-search]');
  search?.addEventListener('input',event=>{state.query=event.currentTarget.value;applyFilters(form);});
  form.querySelectorAll('[data-picker-category]').forEach(button=>button.addEventListener('click',()=>{state.category=button.dataset.pickerCategory;applyFilters(form);}));
  form.querySelector('[data-picker-favorite]')?.addEventListener('click',()=>{state.favorite=!state.favorite;applyFilters(form);});
  form.querySelector('[data-picker-selected]')?.addEventListener('click',()=>{state.selected=!state.selected;applyFilters(form);});
  form.querySelector('[data-picker-reset]')?.addEventListener('click',()=>{state.query='';state.category='all';state.favorite=false;state.selected=false;if(search)search.value='';applyFilters(form);});
  form.querySelectorAll('input[name="itemIds"]').forEach(input=>input.addEventListener('change',()=>applyFilters(form)));
}
async function enhance(){
  const form=root?.querySelector('.outfit-form');if(!form||form.dataset.enhancedPicker==='true')return;
  const grid=form.querySelector('.item-picker');if(!grid)return;
  form.dataset.enhancedPicker='true';grid.classList.add('outfit-picker-grid');
  const items=await getAllItems();if(!form.isConnected)return;
  getState(form).items=items;grid.insertAdjacentHTML('beforebegin',toolbarMarkup(items));bind(form);applyFilters(form);
}
ensureStyles();
if(root)new MutationObserver(()=>{enhance().catch(error=>console.warn('Outfit picker enhancement failed',error));}).observe(root,{childList:true});
enhance().catch(error=>console.warn('Outfit picker enhancement failed',error));
