let refreshTimer=null;

function requestCanonicalUiRefresh(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{
    if(!navigator.onLine)return;
    // app.js already owns the canonical IndexedDB refresh + render path on the
    // online event. Centralize all external data-change refresh requests here
    // until app.js is split into explicit controllers.
    window.dispatchEvent(new Event('online'));
  },80);
}

window.addEventListener('tran:outfits-live-changed',requestCanonicalUiRefresh);
window.addEventListener('tran:app-refresh-requested',requestCanonicalUiRefresh);
