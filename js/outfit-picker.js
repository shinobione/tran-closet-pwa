import {getAllItems} from './db.js';
import {TAXONOMY,LABELS} from './data.js';

const normalize=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .trim();

const translated=(type,value)=>LABELS[type]?.[value]||value;

function searchText(item){
  return normalize([
    item.name,
    item.category,
    translated('category',item.category),
    ...(item.colors||[]),
    ...(item.colors||[]).map(v=>translated('color',v)),
    ...(item.styles||[]),
    ...(item.styles||[]).map(v=>translated('style',v)),
    ...(item.tags||[]),
    ...(item.tags||[]).map(v=>translated('tag',v))
  ].join(' '));
}

function mediaFor(input){
  const label=input.closest('.outfit-pick');
  const media=label?.querySelector('.outfit-pick-media');
  const image=media?.querySelector('img');
  const fallback=media?.querySelector('b');
  return image
    ? `<img src="${image.getAttribute('src')}" alt="">`
    : `<span>${fallback?.textContent||'◇'}</span>`;
}

async function enhance(form){
  if(!form||form.dataset.catalogPicker)return;
  form.dataset.catalogPicker='loading';

  const picker=form.querySelector('.outfit-item-picker');
  if(!picker)return;

  const items=await getAllItems();
  if(!form.isConnected)return;

  const byId=new Map(items.map(item=>[item.id,item]));
  const inputs=[...picker.querySelectorAll('input[name="itemIds"]')];
  const categories=TAXONOMY.categories.filter(category=>items.some(item=>item.category===category));

  const panel=document.createElement('div');
  panel.className='outfit-catalog-panel';
  panel.innerHTML=`
    <div class="outfit-picker-status">
      <strong id="outfitPickerSelected">0 đã chọn</strong>
      <span id="outfitPickerResults">${inputs.length}/${inputs.length} món</span>
    </div>
    <div class="outfit-selected-strip" id="outfitSelectedStrip" hidden></div>
    <div class="outfit-picker-search-row">
      <input id="outfitPickerSearch" type="search" autocomplete="off" placeholder="Tìm tên, loại, màu, phong cách, nhãn…" aria-label="Tìm món đồ">
      <button type="button" id="outfitPickerReset">Đặt lại</button>
    </div>
    <div class="outfit-picker-quick-row">
      <button type="button" data-picker-toggle="favorites" aria-pressed="false">♥ Yêu thích</button>
      <button type="button" data-picker-toggle="selected" aria-pressed="false">✓ Đã chọn</button>
    </div>
    <div class="outfit-picker-category-row" aria-label="Lọc theo loại">
      <button type="button" class="active" data-picker-category="All">Tất cả</button>
      ${categories.map(category=>`<button type="button" data-picker-category="${category}">${translated('category',category)}</button>`).join('')}
    </div>
    <div class="outfit-picker-empty" id="outfitPickerEmpty" hidden>Không tìm thấy món phù hợp.</div>`;

  picker.before(panel);
  picker.classList.add('catalog-mode');
  form.dataset.catalogPicker='ready';

  const state={query:'',category:'All',favorites:false,selected:false};
  const search=panel.querySelector('#outfitPickerSearch');
  const selectedStrip=panel.querySelector('#outfitSelectedStrip');
  const selectedCount=panel.querySelector('#outfitPickerSelected');
  const resultCount=panel.querySelector('#outfitPickerResults');
  const empty=panel.querySelector('#outfitPickerEmpty');

  function renderSelected(){
    const chosen=inputs.filter(input=>input.checked);
    selectedCount.textContent=`${chosen.length} đã chọn`;
    selectedStrip.hidden=chosen.length===0;
    selectedStrip.innerHTML=chosen.map(input=>{
      const item=byId.get(input.value);
      const name=item?.name||input.closest('.outfit-pick')?.querySelector('.outfit-pick-copy strong')?.textContent||'Món đồ';
      return `<button type="button" data-picker-remove="${input.value}" title="Bỏ ${name}">
        <span class="outfit-selected-media">${mediaFor(input)}</span>
        <span>${name}</span><b>×</b>
      </button>`;
    }).join('');
    selectedStrip.querySelectorAll('[data-picker-remove]').forEach(button=>{
      button.onclick=()=>{
        const input=inputs.find(candidate=>candidate.value===button.dataset.pickerRemove);
        if(!input)return;
        input.checked=false;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      };
    });
  }

  function apply(){
    let visible=0;
    for(const input of inputs){
      const item=byId.get(input.value)||{};
      const matchesQuery=!state.query||searchText(item).includes(state.query);
      const matchesCategory=state.category==='All'||item.category===state.category;
      const matchesFavorite=!state.favorites||Boolean(item.favorite);
      const matchesSelected=!state.selected||input.checked;
      const show=matchesQuery&&matchesCategory&&matchesFavorite&&matchesSelected;
      const label=input.closest('.outfit-pick');
      if(label)label.hidden=!show;
      if(show)visible++;
    }

    panel.querySelectorAll('[data-picker-category]').forEach(button=>{
      button.classList.toggle('active',button.dataset.pickerCategory===state.category);
    });
    panel.querySelectorAll('[data-picker-toggle]').forEach(button=>{
      const active=Boolean(state[button.dataset.pickerToggle]);
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });

    resultCount.textContent=`${visible}/${inputs.length} món`;
    empty.hidden=visible!==0;
    renderSelected();
  }

  search.addEventListener('input',()=>{
    state.query=normalize(search.value);
    apply();
  });

  panel.querySelectorAll('[data-picker-category]').forEach(button=>{
    button.onclick=()=>{
      state.category=button.dataset.pickerCategory;
      apply();
    };
  });

  panel.querySelectorAll('[data-picker-toggle]').forEach(button=>{
    button.onclick=()=>{
      const key=button.dataset.pickerToggle;
      state[key]=!state[key];
      apply();
    };
  });

  panel.querySelector('#outfitPickerReset').onclick=()=>{
    state.query='';
    state.category='All';
    state.favorites=false;
    state.selected=false;
    search.value='';
    apply();
  };

  inputs.forEach(input=>input.addEventListener('change',apply));
  apply();
}

function mount(){
  const form=document.querySelector('#outfitForm');
  if(form&&!form.dataset.catalogPicker)enhance(form).catch(error=>console.warn('Outfit picker enhancement failed.',error));
}

const dialog=document.querySelector('#itemDialog');
if(dialog)new MutationObserver(mount).observe(dialog,{childList:true,subtree:true});
mount();
