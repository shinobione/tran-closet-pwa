import {flushMutationQueue,pendingMutationCount} from './sync-client.js?v=0.5.1';

let running=false;

function fr(){return document.documentElement.lang==='fr';}
function label(key,count=0){
  const map={
    running:fr()?'Synchronisation…':'Đang đồng bộ…',
    done:fr()?'Synchronisation terminée · actualisation…':'Đồng bộ hoàn tất · đang làm mới…',
    offline:fr()?'Hors ligne · les modifications restent en attente':'Ngoại tuyến · thay đổi vẫn đang chờ',
    config:fr()?'Configure la connexion de synchronisation':'Hãy cấu hình kết nối đồng bộ',
    auth:fr()?'Clé de synchronisation incorrecte':'Khóa đồng bộ không đúng',
    pending:fr()?`${count} modification${count===1?'':'s'} encore en attente`:`${count} thay đổi vẫn đang chờ`,
    error:fr()?'Erreur de synchronisation · réessaie':'Lỗi đồng bộ · hãy thử lại'
  };
  return map[key];
}

function toast(message){
  const node=document.querySelector('#toast');
  if(!node)return;
  node.textContent=message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.classList.remove('show'),2600);
}

async function safeManualSync(button){
  if(running)return;
  running=true;
  const previous=button.textContent;
  button.disabled=true;
  button.textContent=label('running');
  try{
    const result=await flushMutationQueue();
    const pending=await pendingMutationCount();
    if(result?.ok&&pending===0){
      button.textContent=label('done');
      toast(label('done'));
      setTimeout(()=>location.reload(),220);
      return;
    }
    if(result?.offline)toast(label('offline'));
    else if(result?.configured===false)toast(label('config'));
    else if(result?.status===401)toast(label('auth'));
    else toast(label('pending',pending));
    button.disabled=false;
    button.textContent=previous.replace(/\s*\(\d+\)\s*$/,'')+(pending?` (${pending})`:'');
  }catch(error){
    console.error('Manual sync failed safely.',error);
    toast(label('error'));
    button.disabled=false;
    button.textContent=previous;
  }finally{
    running=false;
  }
}

// Capture phase is intentional: app.js owns an older target-level #syncNow
// handler that rerenders Profile before flushing. Stop it before it can run.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('#syncNow');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  safeManualSync(button);
},true);
