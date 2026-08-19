import {flushMutationQueue,pendingMutationCount} from './sync-client.js?v=0.5.16';
import {flushOutfitQueue,pendingOutfitMutationCount} from './outfit-sync-client.js?v=0.5.1';

let running=false;
const fr=()=>document.documentElement.lang==='fr';

function label(key,count=0){
  const map={
    running:fr()?'Synchronisation…':'Đang đồng bộ…',
    done:fr()?'Synchronisation terminée ✓':'Đồng bộ hoàn tất ✓',
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
  node.textContent=message;node.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2600);
}

async function safeManualSync(button){
  if(running)return;
  running=true;
  const previous=button.textContent;
  button.disabled=true;button.textContent=label('running');
  try{
    const [clothing,outfits]=await Promise.all([flushMutationQueue(),flushOutfitQueue()]);
    const [clothingPending,outfitPending]=await Promise.all([pendingMutationCount(),pendingOutfitMutationCount()]);
    const pending=clothingPending+outfitPending;
    if(clothing?.ok&&outfits?.ok&&pending===0){
      toast(label('done'));
      // Reuse the application's existing canonical refresh/render path without
      // forcing a browser reload. Live watchers are throttled independently.
      window.dispatchEvent(new Event('online'));
      return;
    }
    if(clothing?.offline||outfits?.offline)toast(label('offline'));
    else if(clothing?.configured===false||outfits?.configured===false)toast(label('config'));
    else if(clothing?.status===401||outfits?.status===401)toast(label('auth'));
    else toast(label('pending',pending));
    button.disabled=false;
    button.textContent=previous.replace(/\s*\(\d+\)\s*$/,'')+(pending?` (${pending})`:'');
  }catch(error){
    console.error('Manual sync failed safely.',error);
    toast(label('error'));button.disabled=false;button.textContent=previous;
  }finally{running=false;}
}

// Capture phase intentionally supersedes the legacy target handler still owned
// by app.js. This is the single runtime manual-sync controller until app.js is
// modularized; unlike the historical hotfix it never reloads the browser.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('#syncNow');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  safeManualSync(button);
},true);
