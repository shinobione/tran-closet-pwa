import {syncSnapshotToLocalDB} from './airtable-bridge.js';

try{
  await syncSnapshotToLocalDB();
}catch(error){
  console.warn('Airtable snapshot hydration failed; continuing with local closet.',error);
}

await import('./app.js?v=0.3.1');
await import('./outfit-picker.js?v=0.3.1');
await import('./sync-diagnostics.js?v=0.3.0');
