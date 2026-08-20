import {syncSnapshotToLocalDB} from './airtable-bridge.js';
import {syncOutfitSnapshotToLocalDB} from './airtable-outfit-bridge.js';
import {syncLiveCanonicalItems,startLiveSyncWatch} from './live-airtable-sync.js?v=0.5.17';
import {syncLiveCanonicalOutfits,startLiveOutfitSyncWatch} from './live-airtable-outfit-sync.js?v=0.5.17';

try{await syncSnapshotToLocalDB();}catch(error){console.warn('Airtable clothing snapshot hydration failed; continuing with local closet.',error);}
try{await syncOutfitSnapshotToLocalDB();}catch(error){console.warn('Airtable outfit snapshot hydration failed; continuing with local outfits.',error);}
try{await syncLiveCanonicalItems();}catch(error){console.warn('Live Airtable clothing hydration failed; keeping snapshot/local closet.',error);}
try{await syncLiveCanonicalOutfits();}catch(error){console.warn('Live Airtable Outfit hydration failed; keeping snapshot/local outfits.',error);}

await import('./app.js?v=0.5.17');
await import('./app-refresh.js?v=0.5.17');
await import('./closet-search.js?v=0.5.17');
await import('./photo-picker.js?v=0.5.17');
await import('./outfit-picker.js?v=0.5.17');
await import('./outfit-sync-client.js?v=0.5.17');
await import('./manual-sync.js?v=0.5.17');
await import('./outfit-presentation.js?v=0.5.17');
await import('./outfit-integrity-ui.js?v=0.5.17');
await import('./wear-history.js?v=0.5.17');
await import('./item-ai-assistant.js?v=0.5.17');
await import('./duplicate-guard.js?v=0.5.17');
await import('./daily-assistant.js?v=0.5.17');
await import('./sync-diagnostics.js?v=0.5.17');
await import('./i18n.js?v=0.5.17');
await import('./build-version.js?v=0.5.17');

startLiveSyncWatch();
startLiveOutfitSyncWatch();
