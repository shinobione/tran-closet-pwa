import {syncSnapshotToLocalDB} from './airtable-bridge.js';
import {syncOutfitSnapshotToLocalDB} from './airtable-outfit-bridge.js';

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

await import('./app.js?v=0.5.1');
await import('./outfit-picker.js?v=0.5.1');
await import('./outfit-sync-client.js?v=0.5.1');
await import('./outfit-presentation.js?v=0.5.1');
await import('./item-ai-assistant.js?v=0.5.1');
await import('./duplicate-guard.js?v=0.5.1');
await import('./daily-assistant.js?v=0.5.1');
await import('./sync-diagnostics.js?v=0.5.1');
await import('./i18n.js?v=0.5.1');
await import('./assistant-ui-hotfix.js?v=0.5.2');
