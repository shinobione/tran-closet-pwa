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

await import('./app.js?v=0.4.0');
await import('./outfit-picker.js?v=0.4.0');
await import('./outfit-sync-client.js?v=0.4.0');
await import('./outfit-presentation.js?v=0.4.0');
await import('./item-ai-assistant.js?v=0.4.0');
await import('./sync-diagnostics.js?v=0.4.0');
