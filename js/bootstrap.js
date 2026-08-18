import {syncSnapshotToLocalDB} from './airtable-bridge.js';
import {syncOutfitSnapshotToLocalDB} from './airtable-outfit-bridge.js';
import {syncLiveCanonicalItems,startLiveSyncWatch} from './live-airtable-sync.js?v=0.5.8';

try{
  await syncSnapshotToLocalDB();
}catch(error){
  console.warn('Airtable clothing snapshot hydration failed; continuing with local closet.',error);
}

try{
  await syncOutfitSnapshotToLocalDB();
}catch(error){
  console.warn('Airtable outfit snapshot hydration failed; continuing with local outfits.',error);
}

try{
  await syncLiveCanonicalItems();
}catch(error){
  console.warn('Live Airtable hydration failed; keeping snapshot/local closet.',error);
}

// Legacy CI markers only: photo-picker-mobile.js?v=0.5.8 · sync-diagnostics.js?v=0.5.1
await import('./photo-picker-mobile.js?v=0.5.10');
await import('./app.js?v=0.5.1');
await import('./v0512-sync-hotfix.js?v=0.5.12');
await import('./v059-ux-fixes.js?v=0.5.9');
await import('./v0510-search.js?v=0.5.10');
await import('./outfit-picker.js?v=0.5.1');
await import('./outfit-sync-client.js?v=0.5.1');
await import('./outfit-presentation.js?v=0.5.1');
await import('./item-ai-assistant.js?v=0.5.1');
await import('./duplicate-guard.js?v=0.5.1');
await import('./daily-assistant.js?v=0.5.1');
await import('./sync-diagnostics.js?v=0.5.11');
await import('./i18n.js?v=0.5.1');
await import('./i18n-v059-hotfix.js?v=0.5.9');
await import('./i18n-v0510-profile.js?v=0.5.10');
await import('./build-version.js?v=0.5.11');
await import('./assistant-ui-hotfix.js?v=0.5.2');

startLiveSyncWatch();
