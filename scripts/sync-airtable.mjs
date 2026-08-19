import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {TAXONOMY,fromAirtableCategory} from '../js/taxonomy.generated.mjs';

const TOKEN = process.env.AIRTABLE_PAT;
const BASE_ID = 'appw8WNvdDuXUgYvN';
const TABLE_ID = 'tblKdCi4MI4AH26y8';
const API = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
const FIELDS = {
  name: 'fldaUBTQHssIqjYJ3',
  category: 'fldFgbepFfRYzQiSf',
  photos: 'fldgISbij3vO9IvjM',
  colors: 'fld9c3S0zKQ1AaMWL',
  styles: 'fldzFgTZ5iiakQBcy',
  tags: 'fld9hV9qirpfVfJmM'
};

if (!TOKEN) {
  console.log('AIRTABLE_PAT is not configured; keeping the checked-in snapshot unchanged.');
  process.exit(0);
}

const headers = { Authorization: `Bearer ${TOKEN}` };

async function listAllRecords() {
  const records = [];
  let offset = null;
  do {
    const url = new URL(API);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('returnFieldsByFieldId', 'true');
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Airtable list failed: ${response.status} ${await response.text()}`);
    const body = await response.json();
    records.push(...(body.records || []));
    offset = body.offset || null;
  } while (offset);
  return records;
}

const cleanSelect = value => typeof value === 'string' ? value.trim() : '';
const cleanCategory = value => {
  const canonical=fromAirtableCategory(value)||'Accessorie';
  if(!TAXONOMY.categories.includes(canonical))throw new Error(`Unknown Airtable category outside canonical taxonomy: ${canonical}`);
  return canonical;
};
const cleanMulti = (group,value) => Array.isArray(value) ? value.map(cleanSelect).filter(Boolean).map(entry=>{
  if(!TAXONOMY[group].includes(entry))throw new Error(`Unknown Airtable ${group} value outside canonical taxonomy: ${entry}`);
  return entry;
}) : [];

async function downloadPhoto(recordId, attachment) {
  const source = attachment?.thumbnails?.large?.url || attachment?.url;
  if (!source) return null;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Attachment download failed for ${recordId}: ${response.status}`);
  const contentType = response.headers.get('content-type') || attachment?.type || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const relative = `assets/items/${recordId}.${ext}`;
  await fs.mkdir(path.dirname(relative), { recursive: true });
  await fs.writeFile(relative, Buffer.from(await response.arrayBuffer()));
  return `./${relative}`;
}

async function removeStalePhotos(expectedFiles) {
  const dir = 'assets/items';
  try {
    const files = await fs.readdir(dir);
    await Promise.all(files.filter(file => !expectedFiles.has(`${dir}/${file}`)).map(file => fs.rm(`${dir}/${file}`)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const records = await listAllRecords();
const syncTime = new Date().toISOString();
const expectedFiles = new Set();
const items = [];

for (const record of records) {
  const fields = record.fields || {};
  const attachments = Array.isArray(fields[FIELDS.photos]) ? fields[FIELDS.photos] : [];
  let photo = null;
  if (attachments[0]) {
    photo = await downloadPhoto(record.id, attachments[0]);
    if (photo) expectedFiles.add(photo.replace(/^\.\//, ''));
  }
  items.push({
    id: `airtable-${record.id}`,
    airtableRecordId: record.id,
    name: String(fields[FIELDS.name] || 'Sans nom').trim(),
    category: cleanCategory(fields[FIELDS.category]),
    colors: cleanMulti('colors',fields[FIELDS.colors]),
    styles: cleanMulti('styles',fields[FIELDS.styles]),
    tags: cleanMulti('tags',fields[FIELDS.tags]),
    photo,
    favorite: false,
    source: 'airtable',
    syncState: 'synced',
    createdAt: record.createdTime || syncTime,
    updatedAt: record.createdTime || syncTime
  });
}

await removeStalePhotos(expectedFiles);

const snapshot = {
  syncedAt: syncTime,
  source: 'airtable',
  baseId: BASE_ID,
  tableId: TABLE_ID,
  recordCount: items.length,
  items
};
const output = `export const AIRTABLE_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`;
await fs.writeFile('js/airtable-snapshot.js', output);
console.log(`Synced ${items.length} Airtable record(s) at ${syncTime}.`);
