import {TAXONOMY,LABELS,SEED_ITEMS} from './data.js';
import {t} from './i18n-keyed.mjs?v=0.5.18';
import {getAllItems,putItem,deleteItem,bulkPutItems,getMeta,setMeta,clearItems,clearMutations,getAllOutfits,putOutfit,deleteOutfit,clearOutfits,bulkPutOutfits,getAllWearEvents,clearWearEvents,bulkPutWearEvents} from './db.js';
import {queueMutation,flushMutationQueue,pendingMutationCount,getSyncConfig,saveSyncConfig,testSyncConnection} from './sync-client.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const main=$('#mainContent'),title=$('#pageTitle'),itemDialog=$('#itemDialog'),installDialog=$('#installDialog'),toast=$('#toast');
const state={route:'closet',items:[],outfits:[],query:'',category:'All',installPrompt:null,pending:0,syncConfigured:false,syncing:false};
const emoji={Shirt:'👚',Pant:'👖',Skirt:'👗',Dress:'👗',Combo:'🧥',Coat:'🧥',Bag:'👜',Shoes:'👠',Accessorie:'💍',Belt:'➰',Swimware:'👙','Eye Lens':'◉',Socks:'🧦',Jumpsuit:'🩱',Underwear:'🩲',Headwear:'🧢',Umbrella:'☂️'};
const OUTFIT_LABELS={
  occasion:{Everyday:'Hằng ngày',Work:'Đi làm',Date:'Hẹn hò',Party:'Tiệc',Travel:'Du lịch',Sport:'Thể thao',Formal:'Trang trọng',Other:'Khác'},
  season:{All:'Mọi mùa',Hot:'Nắng nóng',Rainy:'Mùa mưa',Cool:'Mát mẻ'}
};
const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>ESC[c]);
const label=(type,v)=>LABELS[type]?.[v]||v;
const outfitLabel=(type,v)=>OUTFIT_LABELS[type]?.[v]||v;

function say(msg){const localized=window.TranClosetI18n?.t?.(msg)||msg;toast.textContent=localized;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),2400);}
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}

async function seed(){
  if(!(await getMeta('seeded-v1'))){
    await bulkPutItems(SEED_ITEMS);
    await setMeta('seeded-v1',true);
  }
}

async function refresh(){
  const [items,outfits]=await Promise.all([getAllItems(),getAllOutfits()]);
  state.items=items.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  state.outfits=outfits.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  state.pending=await pendingMutationCount();
  const cfg=await getSyncConfig();
  state.syncConfigured=Boolean(cfg.endpoint&&cfg.token);
}

function setRoute(route){
  state.route=route;
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.route===route));
  render();
}

function filtered(favs=false){
  const q=state.query.trim().toLowerCase();
  return state.items.filter(i=>
    (!favs||i.favorite) &&
    (state.category==='All'||i.category===state.category) &&
    (!q||[
      i.name,i.category,label('category',i.category),
      ...(i.colors||[]),...(i.colors||[]).map(v=>label('color',v)),
      ...(i.styles||[]),...(i.styles||[]).map(v=>label('style',v)),
      ...(i.tags||[]),...(i.tags||[]).map(v=>label('tag',v))
    ].join(' ').toLowerCase().includes(q))
  );
}

function syncText(i){
  if(i.syncState==='pending-create')return 'Chờ tạo';
  if(i.syncState==='pending-update')return 'Chờ cập nhật';
  if(i.syncState==='pending-photo')return 'Chờ ảnh';
  if(i.syncState==='awaiting-snapshot')return 'Đã gửi';
  return '';
}

function card(i){
  const media=i.photo
    ? `<img src="${i.photo}" alt="${esc(i.name)}" loading="lazy">`
    : `<div class="placeholder-art"><span>${emoji[i.category]||'◇'}</span><small>${esc(label('category',i.category))}</small></div>`;
  const sync=syncText(i);
  return `<article class="item-card" data-open="${esc(i.id)}" tabindex="0">
    <div class="item-media">${media}<button class="heart-button ${i.favorite?'is-favorite':''}" data-fav="${esc(i.id)}">${i.favorite?'♥':'♡'}</button></div>
    <div class="item-info"><h3>${esc(i.name)}</h3><p>${esc(label('category',i.category))}${sync?` · <span class="sync-mini">${esc(sync)}</span>`:''}</p>
    <div class="chips">${(i.colors||[]).slice(0,2).map(c=>`<span>${esc(label('color',c))}</span>`).join('')}</div></div>
  </article>`;
}

function closet(favs=false){
  title.textContent=favs?'Yêu thích':'Tủ đồ của tôi';
  const list=filtered(favs);
  return `<section class="hero-card"><div><p class="hero-kicker">${favs?'NHỮNG MÓN TRÂN THÍCH':'TỦ ĐỒ CỦA TRÂN'}</p>
    <h2>${favs?`${list.length} món yêu thích`:`${state.items.length} món trong tủ`}</h2>
    <p>${favs?'Những món đánh dấu để tìm lại thật nhanh.':state.pending?`${state.pending} thay đổi đang chờ đồng bộ. Tủ đồ vẫn dùng được ngoại tuyến.`:'Chọn nhanh, lọc theo loại và luôn mang tủ đồ theo bên mình.'}</p></div>
    <div class="hero-orb">${favs?'♥':state.pending?'↻':'✦'}</div></section>
    ${favs?'':`<div class="search-wrap"><input id="searchInput" type="search" value="${esc(state.query)}" placeholder="Tìm tên, loại, màu, phong cách, nhãn…"></div>
    <div class="filter-row">${['All',...TAXONOMY.categories].map(c=>`<button class="filter-chip ${state.category===c?'active':''}" data-cat="${esc(c)}">${c==='All'?'Tất cả':esc(label('category',c))}</button>`).join('')}</div>`}
    <div class="section-heading"><h2>${favs?'Danh sách':'Bộ sưu tập'}</h2><span>${list.length}</span></div>
    <section class="item-grid">${list.length?list.map(card).join(''):`<div class="empty-state"><strong>Chưa có gì ở đây</strong><p>Thêm một món mới để bắt đầu.</p></div>`}</section>`;
}

function itemFields(i={}){
  return `<label>Tên món đồ<input name="name" required maxlength="80" value="${esc(i.name||'')}" placeholder="Ví dụ: Túi Melody"></label>
    <label>Loại<select name="category">${TAXONOMY.categories.map(v=>`<option value="${v}" ${i.category===v?'selected':''}>${esc(label('category',v))}</option>`).join('')}</select></label>
    <fieldset><legend>Màu sắc</legend><div class="choice-grid">${TAXONOMY.colors.map(v=>`<label class="choice"><input type="checkbox" name="colors" value="${v}" ${(i.colors||[]).includes(v)?'checked':''}><span>${esc(label('color',v))}</span></label>`).join('')}</div></fieldset>
    <fieldset><legend>Phong cách</legend><div class="choice-grid">${TAXONOMY.styles.map(v=>`<label class="choice"><input type="checkbox" name="styles" value="${v}" ${(i.styles||[]).includes(v)?'checked':''}><span>${esc(label('style',v))}</span></label>`).join('')}</div></fieldset>
    <fieldset class="smart-tags-fieldset"><legend>Nhãn thông minh <span class="legend-note">AI có thể gợi ý</span></legend><div class="choice-grid tag-choice-grid">${TAXONOMY.tags.map(v=>`<label class="choice"><input type="checkbox" name="tags" value="${v}" ${(i.tags||[]).includes(v)?'checked':''}><span>${esc(label('tag',v))}</span></label>`).join('')}</div></fieldset>`;
}

function addView(){
  title.textContent='Thêm món mới';
  return `<section class="form-card"><div class="photo-picker" id="photoPreview"><div><span>＋</span><strong>Thêm ảnh</strong><small>Chụp hoặc chọn từ thư viện</small></div></div>
    <form id="itemForm" class="item-form">${itemFields()}<input id="photoInput" type="file" accept="image/*" capture="environment" hidden>
    <button class="primary-button" type="submit">Lưu vào tủ đồ</button></form></section>`;
}

function outfitItems(outfit){
  const byId=new Map(state.items.map(i=>[i.id,i]));
  return (outfit.itemIds||[]).map(id=>byId.get(id)).filter(Boolean);
}

function outfitCover(outfit,detail=false){
  const items=outfitItems(outfit).slice(0,detail?4:3);
  const slots=Math.max(detail?4:3,items.length);
  return `<div class="outfit-cover ${detail?'detail':''}">${Array.from({length:slots},(_,idx)=>{
    const item=items[idx];
    if(!item)return `<div class="outfit-cover-slot empty">◇</div>`;
    return item.photo
      ? `<div class="outfit-cover-slot"><img src="${item.photo}" alt="${esc(item.name)}" loading="lazy"></div>`
      : `<div class="outfit-cover-slot placeholder"><span>${emoji[item.category]||'◇'}</span></div>`;
  }).join('')}</div>`;
}

function outfitCard(outfit){
  const items=outfitItems(outfit);
  return `<article class="outfit-card" data-outfit-open="${esc(outfit.id)}" tabindex="0">
    ${outfitCover(outfit)}
    <div class="outfit-card-body">
      <div class="outfit-title-row"><div><p class="eyebrow">${esc(outfitLabel('occasion',outfit.occasion||'Everyday'))}</p><h3>${esc(outfit.name)}</h3></div><span class="outfit-heart">${outfit.favorite?'♥':'♡'}</span></div>
      <p>${items.length} món · ${esc(outfitLabel('season',outfit.season||'All'))}</p>
      ${outfit.note?`<small>${esc(outfit.note)}</small>`:''}
    </div>
  </article>`;
}

function outfits(){
  title.textContent='Phối đồ';
  const favs=state.outfits.filter(o=>o.favorite).length;
  return `<section class="hero-card outfit-hero"><div><p class="hero-kicker">PHỐI ĐỒ CỦA TRÂN</p>
    <h2>${state.outfits.length?`${state.outfits.length} outfit đã lưu`:'Tạo outfit đầu tiên'}</h2>
    <p>${state.outfits.length?`${favs} outfit yêu thích · Lưu cục bộ và dùng được ngoại tuyến.`:'Ghép các món trong tủ thành những bộ đồ riêng cho từng dịp.'}</p></div>
    <div class="hero-orb">◇</div></section>
    <button class="primary-button outfit-create-button" id="createOutfit">＋ Tạo outfit mới</button>
    <div class="section-heading"><h2>Bộ sưu tập outfit</h2><span>${state.outfits.length}</span></div>
    <section class="outfit-list">${state.outfits.length?state.outfits.map(outfitCard).join(''):`<div class="empty-state"><strong>Chưa có outfit nào</strong><p>Chọn ít nhất 2 món để tạo một bộ đồ.</p></div>`}</section>`;
}

function outfitPicker(outfit={}){
  const selected=new Set(outfit.itemIds||[]);
  return `<div class="outfit-item-picker">${state.items.map(i=>`<label class="outfit-pick">
    <input type="checkbox" name="itemIds" value="${esc(i.id)}" ${selected.has(i.id)?'checked':''}>
    <span class="outfit-pick-shell">
      <span class="outfit-pick-media">${i.photo?`<img src="${i.photo}" alt="${esc(i.name)}">`:`<b>${emoji[i.category]||'◇'}</b>`}</span>
      <span class="outfit-pick-copy"><strong>${esc(i.name)}</strong><small>${esc(label('category',i.category))}</small></span>
      <span class="outfit-pick-check">✓</span>
    </span>
  </label>`).join('')}</div>`;
}

function outfitFormFields(outfit={}){
  return `<label>Tên outfit<input name="name" required maxlength="80" value="${esc(outfit.name||'')}" placeholder="Ví dụ: Đi ăn tối"></label>
    <div class="outfit-form-grid">
      <label>Dịp<select name="occasion">${Object.keys(OUTFIT_LABELS.occasion).map(v=>`<option value="${v}" ${(outfit.occasion||'Everyday')===v?'selected':''}>${esc(outfitLabel('occasion',v))}</option>`).join('')}</select></label>
      <label>Mùa<select name="season">${Object.keys(OUTFIT_LABELS.season).map(v=>`<option value="${v}" ${(outfit.season||'All')===v?'selected':''}>${esc(outfitLabel('season',v))}</option>`).join('')}</select></label>
    </div>
    <label>Ghi chú<textarea name="note" maxlength="220" placeholder="Một chi tiết để nhớ outfit này…">${esc(outfit.note||'')}</textarea></label>
    <fieldset><legend>Chọn món đồ <span class="legend-note">ít nhất 2</span></legend>${outfitPicker(outfit)}</fieldset>`;
}

function openOutfitForm(id=null){
  const existing=id?state.outfits.find(o=>o.id===id):null;
  itemDialog.innerHTML=`<div class="sheet-content edit-sheet"><button class="sheet-close" data-close>×</button>
    <div class="detail-body"><p class="eyebrow">${existing?'CHỈNH SỬA OUTFIT':'OUTFIT MỚI'}</p><h2>${existing?esc(existing.name):'Tạo một bộ đồ'}</h2>
    <form id="outfitForm" class="item-form outfit-form">${outfitFormFields(existing||{})}
      <button class="primary-button" type="submit">${existing?'Lưu thay đổi':'Lưu outfit'}</button>
    </form></div></div>`;
  window.TranClosetI18n?.apply?.(itemDialog);
  if(!itemDialog.open)itemDialog.showModal();
  itemDialog.querySelector('[data-close]').onclick=()=>itemDialog.close();
  itemDialog.querySelector('#outfitForm').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const itemIds=f.getAll('itemIds').map(String);
    if(itemIds.length<2)return say('Chọn ít nhất 2 món cho outfit');
    const now=new Date().toISOString();
    const outfit={
      id:existing?.id||crypto.randomUUID(),
      name:String(f.get('name')||'').trim(),
      occasion:String(f.get('occasion')||'Everyday'),
      season:String(f.get('season')||'All'),
      note:String(f.get('note')||'').trim(),
      itemIds,
      favorite:existing?.favorite||false,
      createdAt:existing?.createdAt||now,
      updatedAt:now
    };
    await putOutfit(outfit);
    itemDialog.close();
    await refresh();
    say(existing?'Đã cập nhật outfit ✓':'Đã lưu outfit ✦');
    setRoute('outfits');
  };
}

function openOutfit(id){
  const outfit=state.outfits.find(o=>o.id===id);
  if(!outfit)return;
  const items=outfitItems(outfit);
  itemDialog.innerHTML=`<div class="sheet-content outfit-detail"><button class="sheet-close" data-close>×</button>
    ${outfitCover(outfit,true)}
    <div class="detail-body"><p class="eyebrow">${esc(outfitLabel('occasion',outfit.occasion||'Everyday'))}</p><h2>${esc(outfit.name)}</h2>
    <div class="detail-chips"><span>${esc(outfitLabel('season',outfit.season||'All'))}</span><span>${items.length} món</span></div>
    ${outfit.note?`<p class="outfit-note">${esc(outfit.note)}</p>`:''}
    <div class="outfit-detail-items">${items.map(i=>`<button type="button" data-outfit-item="${esc(i.id)}">
      <span>${i.photo?`<img src="${i.photo}" alt="${esc(i.name)}">`:`<b>${emoji[i.category]||'◇'}</b>`}</span>
      <div><strong>${esc(i.name)}</strong><small>${esc(label('category',i.category))}</small></div><b>›</b>
    </button>`).join('')}</div>
    <div class="detail-actions three"><button id="outfitFav" class="secondary-button">${outfit.favorite?'♥':'♡'}</button><button id="outfitEdit" class="secondary-button">Sửa</button><button id="outfitDelete" class="danger-button">Xóa</button></div>
    </div></div>`;
  window.TranClosetI18n?.apply?.(itemDialog);
  itemDialog.showModal();
  itemDialog.querySelector('[data-close]').onclick=()=>itemDialog.close();
  itemDialog.querySelectorAll('[data-outfit-item]').forEach(b=>b.onclick=()=>{itemDialog.close();openItem(b.dataset.outfitItem);});
  itemDialog.querySelector('#outfitFav').onclick=async()=>{
    await putOutfit({...outfit,favorite:!outfit.favorite,updatedAt:new Date().toISOString()});
    itemDialog.close();await refresh();render();say(outfit.favorite?'Đã bỏ yêu thích':'Đã thêm vào yêu thích ♥');
  };
  itemDialog.querySelector('#outfitEdit').onclick=()=>openOutfitForm(outfit.id);
  itemDialog.querySelector('#outfitDelete').onclick=async()=>{
    if(!confirm(`Xóa outfit “${outfit.name}”?`))return;
    await deleteOutfit(outfit.id);
    itemDialog.close();await refresh();render();say('Đã xóa outfit');
  };
}

function profile(){
  title.textContent='Hồ sơ';
  return `<section class="profile-card"><div class="avatar">T</div><h2>Trân</h2><p>Tủ đồ cá nhân • ${state.items.length} món • ${state.outfits.length} outfit</p></section>
    <section class="sync-card"><div class="sync-head"><div><p class="eyebrow">AIRTABLE</p><h2>${state.syncConfigured?'Đồng bộ đã cấu hình':'Kết nối đồng bộ'}</h2></div><span class="sync-dot ${state.syncConfigured?'online':''}"></span></div>
    <p class="sync-copy">${state.pending?`${state.pending} thay đổi đang chờ gửi.`:'Không có thay đổi đang chờ.'}</p>
    <form id="syncConfigForm" class="sync-form"><label>Địa chỉ Worker<input name="endpoint" type="url" placeholder="https://tran-closet-sync…workers.dev"></label>
    <label>Khóa đồng bộ<input name="token" type="password" autocomplete="off" placeholder="Khóa riêng của Trân"></label>
    <div class="sync-actions"><button class="secondary-button" type="button" id="testSync">Kiểm tra</button><button class="primary-button" type="submit">Lưu kết nối</button></div></form>
    <button class="secondary-button sync-now" id="syncNow" ${state.syncing?'disabled':''}>${state.syncing?'Đang đồng bộ…':`Đồng bộ ngay${state.pending?` (${state.pending})`:''}`}</button></section>
    <section class="settings-list"><button id="profileInstall"><span>⌄</span><div><strong>Cài trên iPhone</strong><small>${standalone()?'Ứng dụng đã được cài':'Thêm vào màn hình chính'}</small></div><b>›</b></button>
    <button id="exportBackup"><span>⇩</span><div><strong>Sao lưu dữ liệu</strong><small>Xuất JSON cục bộ · gồm outfits</small></div><b>›</b></button>
    <button id="importBackup"><span>⇧</span><div><strong>Khôi phục dữ liệu</strong><small>Nhập file JSON</small></div><b>›</b></button>
    <button id="resetDemo" class="danger-row"><span>↺</span><div><strong>Tải lại dữ liệu cục bộ</strong><small>Xóa bản cục bộ rồi nạp lại dữ liệu chuẩn</small></div><b>›</b></button>
    <input id="backupInput" type="file" accept="application/json" hidden></section>
    <p class="privacy-note">${t('app.privacy')}</p>`;
}

function render(){
  main.innerHTML=state.route==='closet'?closet():state.route==='favorites'?closet(true):state.route==='add'?addView():state.route==='outfits'?outfits():profile();
  bind();
  window.TranClosetI18n?.apply?.(main);
  window.TranClosetI18n?.apply?.(title);
}

async function bindSyncForm(){
  const form=$('#syncConfigForm');
  if(!form)return;
  const cfg=await getSyncConfig();
  form.elements.endpoint.value=cfg.endpoint||'';
  form.elements.token.value=cfg.token||'';
  form.onsubmit=async e=>{
    e.preventDefault();
    await saveSyncConfig(form.elements.endpoint.value,form.elements.token.value);
    await refresh();say('Đã lưu kết nối đồng bộ');render();
  };
  $('#testSync')?.addEventListener('click',async()=>{
    await saveSyncConfig(form.elements.endpoint.value,form.elements.token.value);
    const result=await testSyncConnection();
    say(result.ok?'Kết nối Worker thành công ✓':result.status===401?'Khóa đồng bộ không đúng':'Không kết nối được Worker');
    await refresh();render();
  });
  $('#syncNow')?.addEventListener('click',()=>syncNow(false));
}

function bind(){
  $('#searchInput')?.addEventListener('input',e=>{state.query=e.target.value;render();});
  $$('[data-cat]').forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;render();});
  $$('[data-open]').forEach(c=>{
    c.onclick=e=>{if(!e.target.closest('[data-fav]'))openItem(c.dataset.open);};
    c.onkeydown=e=>{if(e.key==='Enter')openItem(c.dataset.open);};
  });
  $$('[data-fav]').forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    const i=state.items.find(x=>x.id===b.dataset.fav);
    if(i){await putItem({...i,favorite:!i.favorite});await refresh();render();}
  });
  $$('[data-outfit-open]').forEach(c=>{
    c.onclick=()=>openOutfit(c.dataset.outfitOpen);
    c.onkeydown=e=>{if(e.key==='Enter')openOutfit(c.dataset.outfitOpen);};
  });
  $('#createOutfit')?.addEventListener('click',()=>openOutfitForm());
  const pp=$('#photoPreview'),pi=$('#photoInput');
  if(pp&&pi){
    pp.onclick=()=>pi.click();
    pi.onchange=async()=>{
      const f=pi.files?.[0];
      if(!f)return;
      pi.dataset.photo=await compress(f);
      pp.innerHTML=`<img src="${pi.dataset.photo}" alt="${t('app.photo.preview')}">`;
    };
  }
  $('#itemForm')?.addEventListener('submit',saveItem);
  $('#profileInstall')?.addEventListener('click',installHelp);
  $('#exportBackup')?.addEventListener('click',exportBackup);
  $('#importBackup')?.addEventListener('click',()=>$('#backupInput')?.click());
  $('#backupInput')?.addEventListener('change',importBackup);
  $('#resetDemo')?.addEventListener('click',resetLocal);
  bindSyncForm();
}

async function saveItem(e){
  e.preventDefault();
  const f=new FormData(e.currentTarget),now=new Date().toISOString();
  const item={id:crypto.randomUUID(),airtableRecordId:null,name:String(f.get('name')||'').trim(),category:String(f.get('category')||'Accessorie'),colors:f.getAll('colors'),styles:f.getAll('styles'),tags:f.getAll('tags'),photo:$('#photoInput')?.dataset.photo||null,favorite:false,source:'local',syncState:'pending-create',createdAt:now,updatedAt:now,cloudWriteAt:null};
  await putItem(item);
  await queueMutation('create',item);
  await refresh();
  say('Đã thêm vào tủ đồ ✦');
  setRoute('closet');
  syncNow(true);
}

async function compress(file){
  const img=new Image(),url=URL.createObjectURL(file);
  await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});
  const max=1500,s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg',.78);
}

async function pruneOutfitsForItem(itemId){
  const impacted=state.outfits.filter(o=>(o.itemIds||[]).includes(itemId));
  for(const outfit of impacted){
    await putOutfit({...outfit,itemIds:(outfit.itemIds||[]).filter(id=>id!==itemId),updatedAt:new Date().toISOString()});
  }
}

function openItem(id){
  const i=state.items.find(x=>x.id===id);
  if(!i)return;
  itemDialog.innerHTML=`<div class="sheet-content"><button class="sheet-close" data-close>×</button>
    ${i.photo?`<img class="detail-photo" src="${i.photo}" alt="${esc(i.name)}">`:`<div class="detail-placeholder">${emoji[i.category]||'◇'}</div>`}
    <div class="detail-body"><p class="eyebrow">${esc(label('category',i.category))}</p><h2>${esc(i.name)}</h2>
    <div class="detail-chips">${[...(i.colors||[]).map(v=>label('color',v)),...(i.styles||[]).map(v=>label('style',v)),...(i.tags||[]).map(v=>label('tag',v))].map(v=>`<span>${esc(v)}</span>`).join('')}</div>
    ${syncText(i)?`<p class="sync-detail">↻ ${esc(syncText(i))}</p>`:''}
    <div class="detail-actions three"><button id="detailFav" class="secondary-button">${i.favorite?'♥':'♡'}</button><button id="detailEdit" class="secondary-button">Sửa</button><button id="detailDelete" class="danger-button">Xóa</button></div></div></div>`;
  window.TranClosetI18n?.apply?.(itemDialog);
  itemDialog.showModal();
  itemDialog.querySelector('[data-close]').onclick=()=>itemDialog.close();
  itemDialog.querySelector('#detailFav').onclick=async()=>{await putItem({...i,favorite:!i.favorite});itemDialog.close();await refresh();render();};
  itemDialog.querySelector('#detailEdit').onclick=()=>openEdit(i.id);
  itemDialog.querySelector('#detailDelete').onclick=async()=>{
    if(!confirm(`Xóa “${i.name}” khỏi tủ đồ?`))return;
    await queueMutation('delete',i);
    await deleteItem(i.id);
    await pruneOutfitsForItem(i.id);
    itemDialog.close();
    await refresh();
    say(t(navigator.onLine?'app.delete.syncing':'app.delete.offline'));
    render();syncNow(true);
  };
}

function openEdit(id){
  const i=state.items.find(x=>x.id===id);
  if(!i)return;
  itemDialog.innerHTML=`<div class="sheet-content edit-sheet"><button class="sheet-close" data-close>×</button><div class="detail-body">
    <p class="eyebrow">${t('app.edit.eyebrow')}</p><h2>${esc(i.name)}</h2>${i.photo?`<img class="edit-photo" src="${i.photo}" alt="${esc(i.name)}">`:''}
    <form id="editItemForm" class="item-form">${itemFields(i)}<p class="form-note">${t('app.edit.photoLater')}</p><button class="primary-button" type="submit">Lưu thay đổi</button></form>
    </div></div>`;
  window.TranClosetI18n?.apply?.(itemDialog);
  itemDialog.querySelector('[data-close]').onclick=()=>itemDialog.close();
  itemDialog.querySelector('#editItemForm').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget),now=new Date().toISOString();
    const updated={...i,name:String(f.get('name')||'').trim(),category:String(f.get('category')||'Accessorie'),colors:f.getAll('colors'),styles:f.getAll('styles'),tags:f.getAll('tags'),syncState:i.airtableRecordId?'pending-update':'pending-create',updatedAt:now};
    await putItem(updated);
    await queueMutation('update',updated);
    itemDialog.close();
    await refresh();say('Đã lưu thay đổi');render();syncNow(true);
  };
}

async function syncNow(silent=true){
  if(state.syncing)return;
  state.syncing=true;
  if(!silent&&state.route==='profile')render();
  const result=await flushMutationQueue();
  await refresh();
  state.syncing=false;
  if(!silent){
    if(result.ok)say('Đồng bộ Airtable hoàn tất ✓');
    else if(result.offline)say('Ngoại tuyến · thay đổi vẫn được lưu');
    else if(result.configured===false)say('Hãy cấu hình Worker trước');
    else if(result.status===401)say('Khóa đồng bộ không đúng');
    else say(`${state.pending} thay đổi vẫn đang chờ`);
  }
  render();
}

let silentSyncOnSearchBlur=false;
function syncWhenSearchIdle(){
  const search=document.querySelector('#searchInput');
  if(state.route==='closet'&&search&&document.activeElement===search){
    if(!silentSyncOnSearchBlur){
      silentSyncOnSearchBlur=true;
      search.addEventListener('blur',()=>{
        silentSyncOnSearchBlur=false;
        syncNow(true);
      },{once:true});
    }
    return;
  }
  syncNow(true);
}

function installHelp(){
  if(standalone())return say(t('app.install.installed'));
  if(state.installPrompt)return state.installPrompt.prompt();
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  installDialog.innerHTML=`<div class="sheet-content install-sheet"><button class="sheet-close" data-close>×</button><div class="coming-icon">⌄</div>
    <h2>${t(ios?'app.install.iphoneTitle':'app.install.appTitle')}</h2>${t(ios?'app.install.iosHtml':'app.install.browserHtml')}</div>`;
  installDialog.showModal();
  installDialog.querySelector('[data-close]').onclick=()=>installDialog.close();
}

async function exportBackup(){
  const wearEvents=await getAllWearEvents();
  const blob=new Blob([JSON.stringify({version:5,exportedAt:new Date().toISOString(),items:state.items,outfits:state.outfits,wearEvents},null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`tran-closet-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importBackup(e){
  const f=e.target.files?.[0];
  if(!f)return;
  try{
    const p=JSON.parse(await f.text());
    if(!Array.isArray(p.items))throw 0;
    await clearItems();
    await clearMutations();
    await clearOutfits();
    await clearWearEvents();
    await bulkPutItems(p.items);
    if(Array.isArray(p.outfits))await bulkPutOutfits(p.outfits);
    if(Array.isArray(p.wearEvents))await bulkPutWearEvents(p.wearEvents);
    await refresh();say('Đã khôi phục dữ liệu ✓');render();
  }catch{say('File sao lưu không hợp lệ');}
}

async function resetLocal(){
  if(!confirm('Xóa dữ liệu cục bộ trên thiết bị? Dữ liệu Airtable sẽ không bị xóa. Outfits cục bộ cũng sẽ bị xóa.'))return;
  await clearItems();
  await clearMutations();
  await clearOutfits();
  await clearWearEvents();
  await setMeta('seeded-v1',false);
  location.reload();
}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;});
window.addEventListener('appinstalled',()=>{state.installPrompt=null;say('Đã cài Trân Closet ✓');});
window.addEventListener('online',syncWhenSearchIdle);
$('#installButton').onclick=installHelp;
$$('.nav-item').forEach(n=>n.onclick=()=>setRoute(n.dataset.route));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.error));
await seed();
await refresh();
render();
setTimeout(syncWhenSearchIdle,700);
