import {getSyncConfig,testSyncConnection,flushMutationQueue,pendingMutationCount} from './sync-client.js?v=0.2.7';
import {getAllItems,getAllMutations} from './db.js';

const VERSION='v0.2.7';
let running=false;

function orphanCount(items,mutations){
  const queued=new Set(mutations.map(m=>m.localItemId));
  return items.filter(i=>!i.airtableRecordId&&!queued.has(i.id)).length;
}

function safeResult(value){
  if(value instanceof Error)return value.message;
  if(Array.isArray(value))return value.map(safeResult);
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(/token|authorization|key/i.test(k))continue;
      out[k]=safeResult(v);
    }
    return out;
  }
  return value;
}

async function snapshot(){
  const [cfg,items,mutations,health]=await Promise.all([
    getSyncConfig(),getAllItems(),getAllMutations(),testSyncConnection()
  ]);
  return {
    version:VERSION,
    online:navigator.onLine,
    endpoint:cfg.endpoint,
    syncKeyPresent:Boolean(cfg.token),
    health:safeResult(health),
    itemCount:items.length,
    pendingMutations:mutations.length,
    orphanedLocalCreates:orphanCount(items,mutations),
    mutationOps:mutations.map(m=>m.operation),
    itemStates:items.map(i=>({
      name:i.name,
      airtableRecordId:i.airtableRecordId||null,
      source:i.source||null,
      syncState:i.syncState||null,
      cloudWriteAt:i.cloudWriteAt||null
    }))
  };
}

function mount(){
  const card=document.querySelector('.sync-card');
  if(!card||card.querySelector('#syncDiagnostics'))return;
  const box=document.createElement('details');
  box.id='syncDiagnostics';
  box.style.marginTop='14px';
  box.style.padding='12px';
  box.style.border='1px solid rgba(255,255,255,.12)';
  box.style.borderRadius='14px';
  box.innerHTML=`<summary style="cursor:pointer;font-weight:700">Chẩn đoán đồng bộ · ${VERSION}</summary>
    <p style="opacity:.72;font-size:.84rem;margin:10px 0">Không hiển thị khóa bí mật. Nút bên dưới chạy đúng client sync của ứng dụng và hiển thị lỗi thật.</p>
    <button type="button" id="runSyncDiagnostics" class="secondary-button">Chạy chẩn đoán + đồng bộ</button>
    <pre id="syncDiagnosticsOutput" style="white-space:pre-wrap;word-break:break-word;font-size:.72rem;line-height:1.45;max-height:420px;overflow:auto;margin-top:10px;padding:10px;border-radius:10px;background:rgba(0,0,0,.24)">Sẵn sàng.</pre>`;
  card.appendChild(box);
  box.querySelector('#runSyncDiagnostics').onclick=async()=>{
    if(running)return;
    running=true;
    const btn=box.querySelector('#runSyncDiagnostics');
    const out=box.querySelector('#syncDiagnosticsOutput');
    btn.disabled=true;btn.textContent='Đang chẩn đoán…';
    try{
      const before=await snapshot();
      const flush=await flushMutationQueue();
      const after=await snapshot();
      const pending=await pendingMutationCount();
      out.textContent=JSON.stringify({before,flush:safeResult(flush),after,pending},null,2);
    }catch(error){
      out.textContent=JSON.stringify({version:VERSION,error:String(error?.message||error)},null,2);
    }finally{
      running=false;btn.disabled=false;btn.textContent='Chạy chẩn đoán + đồng bộ';
    }
  };
}

new MutationObserver(mount).observe(document.querySelector('#mainContent'),{childList:true,subtree:true});
mount();
