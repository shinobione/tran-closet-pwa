let refreshTimer=null;

function requestCanonicalUiRefresh(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{
    if(!navigator.onLine)return;
    // app.js owns the canonical IndexedDB refresh + render path on the online
    // event. Reuse it for both clothing and Outfit external-data changes.
    window.dispatchEvent(new Event('online'));
  },80);
}

window.addEventListener('tran:items-live-changed',requestCanonicalUiRefresh);
window.addEventListener('tran:outfits-live-changed',requestCanonicalUiRefresh);
window.addEventListener('tran:app-refresh-requested',requestCanonicalUiRefresh);
