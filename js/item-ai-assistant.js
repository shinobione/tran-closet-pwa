import {TAXONOMY,LABELS,FR_LABELS} from './data.js';
import {getSyncConfig} from './sync-client.js?v=0.5.16';
import {t,currentLanguage} from './i18n-keyed.mjs?v=0.5.16';

const root=document.querySelector('#mainContent');
const MAX_CLIENT_ATTEMPTS=3;
let activeRequest=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const label=(type,value)=>(currentLanguage()==='fr'?FR_LABELS:LABELS)[type]?.[value]||value;

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=reject;
    image.src=src;
  });
}

async function analysisImage(dataUrl){
  const image=await loadImage(dataUrl);
  const max=1024;
  const scale=Math.min(1,max/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale));
  canvas.height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.74);
}

function reliabilityValue(body,analysis){
  return ['high','medium','low'].includes(body?.reliability)
    ? body.reliability
    : analysis?.confidence>=.9?'high':analysis?.confidence>=.78?'medium':'low';
}

function resultScore(body){
  const analysis=body?.analysis||{};
  const reliability=reliabilityValue(body,analysis);
  const reliabilityScore={high:40,medium:24,low:4}[reliability]||0;
  return (analysis.recognized?100:0)+reliabilityScore+(Number(analysis.confidence)||0)*20+(analysis.category?3:0);
}

function shouldClientRetry(body){
  const analysis=body?.analysis||{};
  const reliability=reliabilityValue(body,analysis);
  if(!analysis.recognized)return true;
  if(reliability==='low')return true;
  if(reliability==='medium'&&(Number(analysis.confidence)||0)<.86)return true;
  return false;
}

function reliabilityMeta(body,analysis){
  const value=reliabilityValue(body,analysis);
  const copy={
    high:{label:t('ai.reliability.high.label'),hint:t('ai.reliability.high.hint')},
    medium:{label:t('ai.reliability.medium.label'),hint:t('ai.reliability.medium.hint')},
    low:{label:t('ai.reliability.low.label'),hint:t('ai.reliability.low.hint')}
  }[value];
  return {
    value,
    ...copy,
    retryUsed:Boolean(body?.retryUsed),
    attempts:Math.max(1,Number(body?.attempts)||1),
    clientAttempts:Math.max(1,Number(body?.clientAttempts)||1),
    totalVisionPasses:Math.max(1,Number(body?.totalVisionPasses)||Number(body?.attempts)||1)
  };
}

function resultMarkup(analysis,meta){
  const confidence=Math.round((Number(analysis?.confidence)||0)*100);
  const checked=meta.clientAttempts>1
    ? `<div class="ai-check-note is-retry">✦ ${t('ai.retry.client',{count:meta.clientAttempts-1,passes:meta.totalVisionPasses})}</div>`
    : meta.attempts>1
      ? `<div class="ai-check-note ${meta.retryUsed?'is-retry':''}">✦ ${t(meta.retryUsed?'ai.retry.server':'ai.retry.compared',{passes:meta.attempts})}</div>`
      : '';
  if(!analysis?.recognized){
    return `<div class="ai-result ai-result-warning">
      <div class="ai-result-head"><div><span>${t('ai.result.eyebrow')}</span><strong>${t('ai.result.unrecognized')}</strong></div><b>${confidence}%</b></div>
      ${checked}
      <p>${esc(analysis?.reason||t('ai.result.clearerPhoto'))}</p>
      <small class="ai-reliability ai-reliability-low">${esc(meta.hint)}</small>
    </div>`;
  }
  const tags=Array.isArray(analysis.tags)?analysis.tags:[];
  return `<div class="ai-result">
    <div class="ai-result-head"><div><span>${t('ai.result.eyebrow')}</span><strong>${esc(label('category',analysis.category))}</strong></div><b>${confidence}%</b></div>
    <div class="ai-reliability ai-reliability-${meta.value}"><strong>${esc(meta.label)}</strong><span>${esc(meta.hint)}</span></div>
    ${checked}
    <div class="ai-result-group"><small>${t('ai.group.colors')}</small><div class="ai-result-chips">${(analysis.colors||[]).map(value=>`<span>${esc(label('color',value))}</span>`).join('')||'<span>—</span>'}</div></div>
    <div class="ai-result-group"><small>${t('ai.group.styles')}</small><div class="ai-result-chips">${(analysis.styles||[]).map(value=>`<span>${esc(label('style',value))}</span>`).join('')||'<span>—</span>'}</div></div>
    <div class="ai-result-group ai-tag-suggestions"><small>${t('ai.group.tags')}</small><div class="ai-result-chips">${tags.map(value=>`<span>${esc(label('tag',value))}</span>`).join('')||'<span>—</span>'}</div>${analysis.tagReason?`<p class="ai-tag-reason">${esc(analysis.tagReason)}</p>`:''}</div>
    ${analysis.reason?`<p>${esc(analysis.reason)}</p>`:''}
    <button type="button" class="primary-button ai-apply">${t('ai.apply')}</button>
    <small class="ai-human-note">${t('ai.humanNote')}</small>
  </div>`;
}

function applySuggestion(form,analysis,card){
  if(!analysis?.recognized)return;
  if(TAXONOMY.categories.includes(analysis.category)){
    const category=form.elements.category;
    if(category)category.value=analysis.category;
  }
  const colors=new Set((analysis.colors||[]).filter(value=>TAXONOMY.colors.includes(value)));
  form.querySelectorAll('input[name="colors"]').forEach(input=>{input.checked=colors.has(input.value);});
  const styles=new Set((analysis.styles||[]).filter(value=>TAXONOMY.styles.includes(value)));
  form.querySelectorAll('input[name="styles"]').forEach(input=>{input.checked=styles.has(input.value);});
  const tags=new Set((analysis.tags||[]).filter(value=>TAXONOMY.tags.includes(value)));
  form.querySelectorAll('input[name="tags"]').forEach(input=>{input.checked=tags.has(input.value);});
  form.dispatchEvent(new Event('change',{bubbles:true}));
  const note=card.querySelector('.ai-applied');
  if(note){note.hidden=false;note.textContent=t('ai.applied');}
}

async function fetchAnalysis(endpoint,token,prepared,controller){
  const response=await fetch(`${endpoint.replace(/\/$/,'')}/v1/analyze-item`,{
    method:'POST',
    headers:{'content-type':'application/json','authorization':`Bearer ${token}`},
    body:JSON.stringify({image:prepared,language:currentLanguage()}),
    signal:controller.signal
  });
  let body=null;try{body=await response.json();}catch{}
  if(!response.ok||!body?.ok){
    const error=new Error(body?.error||`HTTP ${response.status}`);
    error.status=response.status;
    throw error;
  }
  return body;
}

async function requestAnalysis(card,form,photoInput){
  const image=photoInput?.dataset?.photo;
  if(!image)return;
  const button=card.querySelector('.ai-analyze');
  const output=card.querySelector('.ai-output');
  const applied=card.querySelector('.ai-applied');
  if(activeRequest)activeRequest.abort();
  const controller=new AbortController();
  activeRequest=controller;
  button.disabled=true;
  button.textContent=t('ai.loading.button');
  output.innerHTML=`<div class="ai-loading"><span></span><p>${t('ai.loading.body')}</p></div>`;
  if(applied)applied.hidden=true;
  try{
    const config=await getSyncConfig();
    if(!config.endpoint||!config.token)throw new Error('SYNC_NOT_CONFIGURED');
    const prepared=await analysisImage(image);
    const candidates=[];
    let totalVisionPasses=0;

    for(let attempt=1;attempt<=MAX_CLIENT_ATTEMPTS;attempt++){
      if(attempt>1){
        button.textContent=t('ai.retry.button',{current:attempt-1,total:MAX_CLIENT_ATTEMPTS-1});
        output.innerHTML=`<div class="ai-loading"><span></span><p>${t('ai.retry.body',{attempt})}</p></div>`;
      }
      const body=await fetchAnalysis(config.endpoint,config.token,prepared,controller);
      candidates.push(body);
      totalVisionPasses+=Math.max(1,Number(body.attempts)||1);
      const best=[...candidates].sort((a,b)=>resultScore(b)-resultScore(a))[0];
      if(!shouldClientRetry(best))break;
    }

    const best=[...candidates].sort((a,b)=>resultScore(b)-resultScore(a))[0];
    best.clientAttempts=candidates.length;
    best.totalVisionPasses=totalVisionPasses;
    const analysis=best.analysis||{};
    const meta=reliabilityMeta(best,analysis);
    output.innerHTML=resultMarkup(analysis,meta);
    output.querySelector('.ai-apply')?.addEventListener('click',()=>applySuggestion(form,analysis,card));
  }catch(error){
    if(error?.name==='AbortError')return;
    const message=String(error?.message||error);
    const friendly=message==='SYNC_NOT_CONFIGURED'
      ?t('ai.error.config')
      :error?.status===429||message.includes('429')
        ?t('ai.error.busy')
        :t('ai.error.generic');
    output.innerHTML=`<div class="ai-result ai-result-warning"><strong>${t('ai.error.title')}</strong><p>${esc(friendly)}</p></div>`;
  }finally{
    if(activeRequest===controller)activeRequest=null;
    button.disabled=!photoInput?.dataset?.photo;
    button.textContent=t('ai.analyze');
  }
}

function mount(){
  const form=document.querySelector('#itemForm');
  const photoPreview=document.querySelector('#photoPreview');
  const photoInput=document.querySelector('#photoInput');
  if(!form||!photoPreview||!photoInput||form.dataset.aiAssistantMounted==='1')return;
  form.dataset.aiAssistantMounted='1';
  photoPreview.classList.add('ai-photo-preview');

  const card=document.createElement('section');
  card.className='ai-assistant-card';
  card.innerHTML=`<div class="ai-assistant-head">
      <div><p class="eyebrow">${t('ai.card.eyebrow')}</p><h3>${t('ai.card.title')}</h3></div><span>✦</span>
    </div>
    <p class="ai-assistant-copy">${t('ai.card.copy')}</p>
    <button type="button" class="secondary-button ai-analyze" disabled>${t('ai.analyze')}</button>
    <div class="ai-output"></div>
    <p class="ai-applied" hidden></p>
    <small class="ai-privacy">${t('ai.privacy')}</small>`;

  photoPreview.after(card);
  const analyze=card.querySelector('.ai-analyze');
  const refreshReady=()=>{
    const ready=Boolean(photoInput.dataset.photo);
    analyze.disabled=!ready;
    if(!ready){
      card.querySelector('.ai-output').innerHTML='';
      card.querySelector('.ai-applied').hidden=true;
    }
  };
  new MutationObserver(refreshReady).observe(photoPreview,{childList:true,subtree:true});
  photoInput.addEventListener('change',()=>setTimeout(refreshReady,80));
  analyze.addEventListener('click',()=>requestAnalysis(card,form,photoInput));
  refreshReady();
}

if(root)new MutationObserver(mount).observe(root,{childList:true,subtree:true});
mount();
