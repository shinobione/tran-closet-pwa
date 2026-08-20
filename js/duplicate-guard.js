import {getAllItems} from './db.js';
import {LABELS,FR_LABELS} from './data.js';
import {metadataSimilarity,hammingDistance,duplicateAssessment,duplicateReasons} from './duplicate-core.mjs?v=0.5.17';
import {t,currentLanguage} from './i18n-keyed.mjs?v=0.5.17';

const root=document.querySelector('#mainContent');
const hashMemory=new Map();
const MAX_VISUAL_CANDIDATES=80;
const HASH_CONCURRENCY=5;

const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>ESC[char]);
const label=(type,value)=>(currentLanguage()==='fr'?FR_LABELS:LABELS)[type]?.[value]||value;

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.decoding='async';
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('IMAGE_LOAD_FAILED'));
    image.src=src;
  });
}

async function differenceHash(src){
  if(!src)return null;
  const image=await loadImage(src);
  const canvas=document.createElement('canvas');
  canvas.width=9;
  canvas.height=8;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,0,0,9,8);
  const data=ctx.getImageData(0,0,9,8).data;
  const grey=[];
  for(let i=0;i<data.length;i+=4){
    grey.push(data[i]*.299+data[i+1]*.587+data[i+2]*.114);
  }
  let bits='';
  for(let y=0;y<8;y++){
    for(let x=0;x<8;x++){
      const index=y*9+x;
      bits+=grey[index]>grey[index+1]?'1':'0';
    }
  }
  return bits;
}

async function itemHash(item){
  if(!item?.photo)return null;
  const key=`${item.id}|${item.updatedAt||''}|${String(item.photo).slice(0,48)}`;
  if(hashMemory.has(key))return hashMemory.get(key);
  const storageKey=`tc-dup-hash:${key}`;
  try{
    const stored=sessionStorage.getItem(storageKey);
    if(stored&&stored.length===64){hashMemory.set(key,stored);return stored;}
  }catch{}
  let hash=null;
  try{hash=await differenceHash(item.photo);}catch{}
  if(hash){
    hashMemory.set(key,hash);
    try{sessionStorage.setItem(storageKey,hash);}catch{}
  }
  return hash;
}

async function mapLimit(values,limit,worker){
  const results=new Array(values.length);
  let cursor=0;
  async function runner(){
    while(cursor<values.length){
      const index=cursor++;
      results[index]=await worker(values[index],index);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,values.length)},runner));
  return results;
}

function formCandidate(form,photoInput){
  const data=new FormData(form);
  return {
    name:String(data.get('name')||'').trim(),
    category:String(data.get('category')||''),
    colors:data.getAll('colors').map(String),
    styles:data.getAll('styles').map(String),
    photo:photoInput?.dataset?.photo||null
  };
}

function selectVisualCandidates(items,candidate){
  const rows=items.map(item=>({item,metadata:metadataSimilarity(candidate,item)}));
  if(rows.length<=MAX_VISUAL_CANDIDATES)return rows;

  const useful=rows.filter(row=>
    row.metadata.category===1 ||
    row.metadata.colors>0 ||
    row.metadata.name>=.3 ||
    row.metadata.score>=.24
  ).sort((a,b)=>
    b.metadata.score-a.metadata.score ||
    String(b.item.updatedAt||'').localeCompare(String(a.item.updatedAt||''))
  );

  const seen=new Set(useful.map(row=>row.item.id));
  const recent=rows
    .filter(row=>!seen.has(row.item.id))
    .sort((a,b)=>String(b.item.updatedAt||'').localeCompare(String(a.item.updatedAt||'')))
    .slice(0,20);

  return [...useful,...recent].slice(0,MAX_VISUAL_CANDIDATES);
}

async function findDuplicates(candidate,items){
  if(!items.length)return [];
  let candidateHash=null;
  if(candidate.photo){
    try{candidateHash=await differenceHash(candidate.photo);}catch{}
  }

  const rows=selectVisualCandidates(items,candidate);
  const assessments=await mapLimit(rows,HASH_CONCURRENCY,async row=>{
    let distance=null;
    if(candidateHash&&row.item.photo){
      const existingHash=await itemHash(row.item);
      if(existingHash)distance=hammingDistance(candidateHash,existingHash);
    }
    const assessment=duplicateAssessment({distance,metadata:row.metadata});
    return {
      item:row.item,
      ...assessment,
      reasons:duplicateReasons(assessment)
    };
  });

  return assessments
    .filter(match=>match.level!=='none')
    .sort((a,b)=>b.score-a.score || (a.distance??99)-(b.distance??99))
    .slice(0,3);
}

function candidateMarkup(match){
  const item=match.item;
  const percent=Math.round(match.score*100);
  const level=t(match.level==='high'?'duplicate.level.high':'duplicate.level.medium');
  const media=item.photo
    ? `<img src="${esc(item.photo)}" alt="${esc(item.name)}">`
    : `<span>◇</span>`;
  return `<article class="duplicate-candidate ${match.level==='high'?'is-high':''}">
    <div class="duplicate-candidate-media">${media}</div>
    <div class="duplicate-candidate-copy">
      <div class="duplicate-candidate-title"><div><strong>${esc(item.name)}</strong><small>${esc(label('category',item.category))}</small></div><b>${percent}%</b></div>
      <div class="duplicate-reasons">${match.reasons.map(reason=>`<span>${esc(t(reason.key,reason.params||{}))}</span>`).join('')}</div>
      <small class="duplicate-level">${level}</small>
    </div>
  </article>`;
}

function clearWarning(form){
  form.querySelector('.duplicate-warning')?.remove();
}

function renderWarning(form,matches){
  clearWarning(form);
  const submit=form.querySelector('button[type="submit"]');
  const panel=document.createElement('section');
  panel.className='duplicate-warning';
  panel.setAttribute('role','alert');
  panel.innerHTML=`
    <div class="duplicate-warning-head"><span>◎</span><div><p class="eyebrow">${t('duplicate.eyebrow')}</p><h3>${t('duplicate.title')}</h3></div></div>
    <p>${t('duplicate.body')}</p>
    <div class="duplicate-candidates">${matches.map(candidateMarkup).join('')}</div>
    <div class="duplicate-actions">
      <button type="button" class="secondary-button" data-dup-dismiss>${t('duplicate.review')}</button>
      <button type="button" class="primary-button" data-dup-continue>${t('duplicate.continue')}</button>
    </div>
    <small>${t('duplicate.footnote')}</small>`;
  submit?.before(panel);
  panel.querySelector('[data-dup-dismiss]')?.addEventListener('click',()=>{
    panel.remove();
    form.elements.name?.focus();
  });
  panel.querySelector('[data-dup-continue]')?.addEventListener('click',()=>{
    form.dataset.duplicateBypass='1';
    panel.remove();
    form.requestSubmit();
  });
  panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
}

function mount(){
  const form=document.querySelector('#itemForm');
  const photoInput=document.querySelector('#photoInput');
  if(!form||!photoInput||form.dataset.duplicateGuardMounted==='1')return;
  form.dataset.duplicateGuardMounted='1';

  form.addEventListener('submit',async event=>{
    if(form.dataset.duplicateBypass==='1'){
      delete form.dataset.duplicateBypass;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    clearWarning(form);

    const submit=form.querySelector('button[type="submit"]');
    const originalText=submit?.textContent||'Lưu vào tủ đồ';
    if(submit){submit.disabled=true;submit.textContent=t('duplicate.checking');}

    try{
      const [items,candidate]=await Promise.all([getAllItems(),Promise.resolve(formCandidate(form,photoInput))]);
      const matches=await findDuplicates(candidate,items);
      if(matches.length){
        renderWarning(form,matches);
        return;
      }
      form.dataset.duplicateBypass='1';
      form.requestSubmit();
    }catch(error){
      console.warn('Duplicate guard failed open; creation remains available.',error);
      form.dataset.duplicateBypass='1';
      form.requestSubmit();
    }finally{
      if(submit){submit.disabled=false;submit.textContent=originalText;}
    }
  },true);

  const invalidate=()=>clearWarning(form);
  form.addEventListener('input',invalidate);
  form.addEventListener('change',invalidate);
  photoInput.addEventListener('change',invalidate);
}

if(root)new MutationObserver(mount).observe(root,{childList:true,subtree:true});
mount();
