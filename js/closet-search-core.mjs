import {LABELS,FR_LABELS} from './data.js';

export const normalizeClosetSearch=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .trim();

export function closetSearchText(item={}){
  const translated=(type,value)=>[
    value,
    LABELS[type]?.[value],
    FR_LABELS[type]?.[value]
  ].filter(Boolean).join(' ');
  return normalizeClosetSearch([
    item.name,
    translated('category',item.category),
    ...(item.colors||[]).map(value=>translated('color',value)),
    ...(item.styles||[]).map(value=>translated('style',value)),
    ...(item.tags||[]).map(value=>translated('tag',value))
  ].join(' '));
}

export function closetSearchMatches(item,query){
  const normalized=normalizeClosetSearch(query);
  return !normalized||closetSearchText(item).includes(normalized);
}
