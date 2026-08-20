import {flushMutationQueue,pendingMutationCount} from './sync-client.js?v=0.5.18';
import {flushOutfitQueue,pendingOutfitMutationCount} from './outfit-sync-client.js?v=0.5.18';
import {flushWearQueue,pendingWearMutationCount} from './wear-sync-client.js?v=0.5.18';
import {t} from './i18n-keyed.mjs?v=0.5.18';

let running=false;

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
  button.disabled=true;button.textContent=t('sync.running');
  try{
    const [clothing,outfits,wear]=await Promise.all([flushMutationQueue(),flushOutfitQueue(),flushWearQueue()]);
    const [clothingPending,outfitPending,wearPending]=await Promise.all([pendingMutationCount(),pendingOutfitMutationCount(),pendingWearMutationCount()]);
    const pending=clothingPending+outfitPending+wearPending;
    if(clothing?.ok&&outfits?.ok&&wear?.ok&&pending===0){
      toast(t('sync.done'));
      window.dispatchEvent(new Event('online'));
      return;
    }
    if(clothing?.offline||outfits?.offline||wear?.offline)toast(t('sync.offline'));
    else if(clothing?.configured===false||outfits?.configured===false||wear?.configured===false)toast(t('sync.config'));
    else if(clothing?.status===401||outfits?.status===401||wear?.status===401)toast(t('sync.auth'));
    else toast(t('sync.pending',{count:pending}));
    button.disabled=false;
    button.textContent=previous.replace(/\s*\(\d+\)\s*$/,'')+(pending?` (${pending})`:'');
  }catch(error){
    console.error('Manual sync failed safely.',error);
    toast(t('sync.error'));button.disabled=false;button.textContent=previous;
  }finally{running=false;}
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#syncNow');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  safeManualSync(button);
},true);
