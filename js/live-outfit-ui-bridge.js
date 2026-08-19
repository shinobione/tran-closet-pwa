let refreshTimer=null;

function requestCanonicalUiRefresh(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{
    if(!navigator.onLine)return;
    // app.js already owns the canonical IndexedDB refresh + render path on
    // `online`. Reuse that proven path for V0.5.16 without forcing a full-page
    // reload; Slice 16.4 will absorb this into a dedicated app refresh hook.
    window.dispatchEvent(new Event('online'));
  },80);
}

window.addEventListener('tran:outfits-live-changed',requestCanonicalUiRefresh);
