import {syncSnapshotToLocalDB} from './airtable-bridge.js';

try{
  await syncSnapshotToLocalDB();
}catch(error){
  console.warn('Airtable snapshot hydration failed; continuing with local closet.',error);
}

await import('./app.js');
