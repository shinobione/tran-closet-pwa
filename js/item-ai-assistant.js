import {TAXONOMY,LABELS} from './data.js';
import {getSyncConfig} from './sync-client.js?v=0.4.2';

const root=document.querySelector('#mainContent');
let activeRequest=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const label=(type,value)=>LABELS[type]?.[value]||value;

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

function reliabilityMeta(body,analysis){
  const value=['high','medium','low'].includes(body?.reliability)?body.reliability:(analysis?.confidence>=.9?'high':analysis?.confidence>=.78?'medium':'low');
  const copy={
    high:{label:'Tin cậy cao',hint:'AI khá chắc chắn, nhưng Trân vẫn là người quyết định.'},
    medium:{label:'Cần kiểm tra',hint:'AI có tín hiệu tốt nhưng nên kiểm tra loại và màu trước khi áp dụng.'},
    low:{label:'Tin cậy thấp',hint:'Kết quả còn yếu. Nên kiểm tra kỹ hoặc thử ảnh rõ hơn.'}
  }[value];
  return {value,...copy,retryUsed:Boolean(body?.retryUsed),attempts:Math.max(1,Number(body?.attempts)||1)};
}

function resultMarkup(analysis,meta){
  const confidence=Math.round((Number(analysis?.confidence)||0)*100);
  const checked=meta.attempts>1
    ? `<div class="ai-check-note ${meta.retryUsed?'is-retry':''}">✦ ${meta.retryUsed?`AI đã tự kiểm tra lại ảnh · ${meta.attempts} lượt`:`AI đã đối chiếu ảnh · ${meta.attempts} lượt nhìn`}</div>`
    : '';
  if(!analysis?.recognized){
    return `<div class="ai-result ai-result-warning">
      <div class="ai-result-head"><div><span>GỢI Ý AI</span><strong>Chưa nhận diện chắc chắn</strong></div><b>${confidence}%</b></div>
      ${checked}
      <p>${esc(analysis?.reason||'Hãy thử ảnh rõ hơn, chỉ có một món đồ chính trong khung hình.')}</p>
      <small class="ai-reliability ai-reliability-low">${esc(meta.hint)}</small>
    </div>`;
  }
  return `<div class="ai-result">
    <div class="ai-result-head"><div><span>GỢI Ý AI</span><strong>${esc(label('category',analysis.category))}</strong></div><b>${confidence}%</b></div>
    <div class="ai-reliability ai-reliability-${meta.value}"><strong>${esc(meta.label)}</strong><span>${esc(meta.hint)}</span></div>
    ${checked}
    <div class="ai-result-group"><small>Màu sắc</small><div class="ai-result-chips">${(analysis.colors||[]).map(value=>`<span>${esc(label('color',value))}</span>`).join('')||'<span>—</span>'}</div></div>
    <div class="ai-result-group"><small>Phong cách</small><div class="ai-result-chips">${(analysis.styles||[]).map(value=>`<span>${esc(label('style',value))}</span>`).join('')||'<span>—</span>'}</div></div>
    ${analysis.reason?`<p>${esc(analysis.reason)}</p>`:''}
    <button type="button" class="primary-button ai-apply">Áp dụng gợi ý</button>
    <small class="ai-human-note">Trân vẫn có thể sửa mọi lựa chọn trước khi lưu.</small>
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
  const note=card.querySelector('.ai-applied');
  if(note){note.hidden=false;note.textContent='✓ Đã áp dụng. Hãy kiểm tra lại trước khi lưu vào tủ đồ.';}
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
  button.textContent='Đang đối chiếu ảnh…';
  output.innerHTML='<div class="ai-loading"><span></span><p>AI đang nhìn ảnh nhiều lượt để xác định món đồ, màu sắc và phong cách…</p></div>';
  if(applied)applied.hidden=true;
  try{
    const config=await getSyncConfig();
    if(!config.endpoint||!config.token)throw new Error('SYNC_NOT_CONFIGURED');
    const prepared=await analysisImage(image);
    const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/v1/analyze-item`,{
      method:'POST',
      headers:{'content-type':'application/json','authorization':`Bearer ${config.token}`},
      body:JSON.stringify({image:prepared}),
      signal:controller.signal
    });
    let body=null;try{body=await response.json();}catch{}
    if(!response.ok||!body?.ok)throw new Error(body?.error||`HTTP ${response.status}`);
    const analysis=body.analysis||{};
    const meta=reliabilityMeta(body,analysis);
    output.innerHTML=resultMarkup(analysis,meta);
    output.querySelector('.ai-apply')?.addEventListener('click',()=>applySuggestion(form,analysis,card));
  }catch(error){
    if(error?.name==='AbortError')return;
    const message=String(error?.message||error);
    const friendly=message==='SYNC_NOT_CONFIGURED'
      ?'Cần cấu hình kết nối trong Hồ sơ trước khi dùng trợ lý AI.'
      :message.includes('429')
        ?'AI đang bận hoặc đã đạt giới hạn hôm nay. Hãy thử lại sau.'
        :'Không phân tích được ảnh lúc này. Ảnh và biểu mẫu của bạn vẫn nguyên vẹn.';
    output.innerHTML=`<div class="ai-result ai-result-warning"><strong>Không thể phân tích</strong><p>${esc(friendly)}</p></div>`;
  }finally{
    if(activeRequest===controller)activeRequest=null;
    button.disabled=!photoInput?.dataset?.photo;
    button.textContent='✦ Phân tích bằng AI';
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
      <div><p class="eyebrow">TRỢ LÝ ẢNH</p><h3>Để AI gợi ý phân loại</h3></div><span>✦</span>
    </div>
    <p class="ai-assistant-copy">AI đối chiếu nhiều lượt rồi chỉ đề xuất loại, màu và phong cách. Không có gì được lưu hoặc thay đổi cho đến khi Trân chọn áp dụng rồi tự bấm Lưu.</p>
    <button type="button" class="secondary-button ai-analyze" disabled>✦ Phân tích bằng AI</button>
    <div class="ai-output"></div>
    <p class="ai-applied" hidden></p>
    <small class="ai-privacy">Ảnh chỉ được gửi đến Worker bảo mật khi Trân chủ động bấm nút phân tích.</small>`;

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
