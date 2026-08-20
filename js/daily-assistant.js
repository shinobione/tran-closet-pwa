import {getAllItems,getAllOutfits,putOutfit,getMeta,setMeta} from './db.js';
import {recommendLooks,weatherSummaryParts,OCCASIONS} from './daily-assistant-core.mjs?v=0.5.18';
import {LABELS,FR_LABELS} from './data.js';
import {currentLanguage,t} from './i18n-keyed.mjs?v=0.5.18';

const root=document.querySelector('#mainContent');
const DEFAULT_LOCATION={name:'TP. Hồ Chí Minh',latitude:10.7769,longitude:106.7009,timezone:'Asia/Ho_Chi_Minh'};
const LOCATION_KEY='daily-assistant-location';
const WEATHER_KEY='daily-assistant-weather';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const label=(type,value)=>currentLanguage()==='fr'?(FR_LABELS[type]?.[value]||LABELS[type]?.[value]||value):(LABELS[type]?.[value]||value);
let dialog=null;
let state={location:null,weather:null,occasion:'Everyday',suggestions:[],profile:null,loading:false,error:null};

function weatherCodeLabel(code){
  code=Number(code);
  if(code===0)return t('weather.clear');
  if([1,2].includes(code))return t('weather.fewClouds');
  if(code===3)return t('weather.cloudy');
  if([45,48].includes(code))return t('weather.fog');
  if([51,53,55,56,57].includes(code))return t('weather.drizzle');
  if([61,63,65,66,67,80,81,82].includes(code))return t('weather.rain');
  if([95,96,99].includes(code))return t('weather.thunder');
  return t('weather.current');
}
function reasonText(reason){
  if(typeof reason==='string')return reason;
  if(!reason?.key)return '';
  const params={...(reason.params||{})};
  if(params.occasion)params.occasion=t(`occasion.${params.occasion}`);
  return t(reason.key,params);
}
function weatherSummaryText(profile){return weatherSummaryParts(profile||{}).map(reasonText).filter(Boolean).join(' · ');}
function displayLocationName(location){const name=location?.name||DEFAULT_LOCATION.name;return location?.current===true||['Vị trí hiện tại','Position actuelle'].includes(name)?t('daily.currentLocationName'):name;}
async function getLocation(){return (await getMeta(LOCATION_KEY))||DEFAULT_LOCATION;}
function sameLocation(cache,location){return Boolean(cache)&&Math.abs(Number(cache.latitude)-Number(location.latitude))<.01&&Math.abs(Number(cache.longitude)-Number(location.longitude))<.01;}

async function fetchWeather(location,force=false){
  const cached=await getMeta(WEATHER_KEY),same=sameLocation(cached,location);
  if(!force&&same&&Date.now()-Number(cached.fetchedAt||0)<30*60*1000)return cached.weather;
  const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),timezone:'auto',forecast_days:'1',current:'temperature_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code'});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);if(!response.ok)throw new Error(`WEATHER_${response.status}`);
  const body=await response.json();
  const weather={temperature:body.current?.temperature_2m,apparentTemperature:body.current?.apparent_temperature,precipitation:body.current?.precipitation,rain:body.current?.rain,showers:body.current?.showers,weatherCode:body.current?.weather_code??body.daily?.weather_code?.[0],windSpeed:body.current?.wind_speed_10m,dailyMax:body.daily?.temperature_2m_max?.[0],dailyMin:body.daily?.temperature_2m_min?.[0],precipitationProbability:body.daily?.precipitation_probability_max?.[0],timezone:body.timezone||location.timezone||null,observedAt:body.current?.time||null};
  await setMeta(WEATHER_KEY,{latitude:location.latitude,longitude:location.longitude,fetchedAt:Date.now(),weather});return weather;
}
function ensureDialog(){if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='dailyAssistantDialog';dialog.className='daily-assistant-dialog';document.body.appendChild(dialog);return dialog;}
function weatherCard(){
  if(!state.weather)return `<div class="assistant-weather assistant-weather-offline"><strong>${t('weather.none.title')}</strong><span>${t('weather.none.body')}</span></div>`;
  const w=state.weather;return `<section class="assistant-weather"><div><p>${esc(weatherCodeLabel(w.weatherCode))}</p><strong>${Math.round(Number(w.temperature)||0)}°</strong><span>${t('weather.feels',{temperature:Math.round(Number(w.apparentTemperature)||0)})}</span></div><div class="assistant-weather-stats"><span>↑ ${Math.round(Number(w.dailyMax)||0)}°</span><span>↓ ${Math.round(Number(w.dailyMin)||0)}°</span><span>☔ ${Math.round(Number(w.precipitationProbability)||0)}%</span><span>⌁ ${Math.round(Number(w.windSpeed)||0)} km/h</span></div><small>${esc(weatherSummaryText(state.profile||{}))} · Open-Meteo</small></section>`;
}
function itemTile(item){return `<div class="assistant-item">${item.photo?`<img src="${item.photo}" alt="${esc(item.name)}">`:`<span>◇</span>`}<div><strong>${esc(item.name)}</strong><small>${esc(label('category',item.category))}</small></div></div>`;}
function suggestionName(suggestion,index){return suggestion.name||(suggestion.source==='partial'?t('daily.card.partial'):`${t('daily.card.generated')} ${index+1}`);}
function suggestionCard(suggestion,index){
  const saveable=suggestion.complete&&suggestion.itemIds.length>=2;
  const action=suggestion.source==='saved'?`<button type="button" class="secondary-button" data-open-outfits>${t('daily.openSaved')}</button>`:saveable?`<button type="button" class="primary-button" data-save-look="${index}">${t('daily.save')}</button>`:`<small class="assistant-incomplete">${t(suggestion.complete?'daily.needOneMore':'daily.needCore')}</small>`;
  const heading=suggestion.source==='saved'?t('daily.card.saved'):suggestion.complete?t('daily.card.generated'):t('daily.card.partial');
  return `<article class="assistant-suggestion ${suggestion.complete?'':'is-partial'}"><div class="assistant-suggestion-head"><div><p>${heading}</p><h3>${esc(suggestionName(suggestion,index))}</h3></div><span>#${index+1}</span></div><div class="assistant-items">${suggestion.items.map(itemTile).join('')}</div><ul>${suggestion.reasons.map(reason=>`<li>${esc(reasonText(reason))}</li>`).join('')}</ul>${action}</article>`;
}
function occasionOptions(){return OCCASIONS.map(key=>`<option value="${key}" ${state.occasion===key?'selected':''}>${esc(t(`occasion.${key}`))}</option>`).join('');}
function render(){
  const d=ensureDialog();
  if(state.loading){d.innerHTML=`<div class="assistant-shell"><button class="assistant-close" data-assistant-close>×</button><div class="assistant-loading"><span>✦</span><strong>${t('daily.loading.title')}</strong><p>${t('daily.loading.body')}</p></div></div>`;d.querySelector('[data-assistant-close]').onclick=()=>d.close();return;}
  d.innerHTML=`<div class="assistant-shell"><header class="assistant-header"><div><p class="eyebrow">${t('daily.header.eyebrow')}</p><h2>${t('daily.header.title')}</h2><span>${t('daily.header.subtitle')}</span></div><button class="assistant-close" data-assistant-close>×</button></header><section class="assistant-controls"><div class="assistant-location"><div><small>${t('daily.location')}</small><strong>${esc(displayLocationName(state.location))}</strong></div><button type="button" class="secondary-button" data-location-edit>${t('daily.change')}</button></div><label>${t('daily.occasion')}<select data-assistant-occasion>${occasionOptions()}</select></label><div class="assistant-location-editor" hidden><div class="assistant-location-actions"><button type="button" class="secondary-button" data-use-location>${t('daily.currentLocation')}</button></div><div class="assistant-city-search"><input type="search" data-city-query placeholder="${t('daily.city.placeholder')}"><button type="button" class="secondary-button" data-city-search>${t('daily.city.search')}</button></div><div class="assistant-city-results"></div></div></section>${weatherCard()}${state.error?`<p class="assistant-error">${esc(state.error)}</p>`:''}<div class="assistant-section-title"><div><p class="eyebrow">${t('daily.suggestions.eyebrow')}</p><h3>${state.suggestions.length?t('daily.suggestions.count',{count:state.suggestions.length}):t('daily.suggestions.none')}</h3></div><button type="button" class="secondary-button" data-refresh-weather>${t('daily.refresh')}</button></div><section class="assistant-suggestions">${state.suggestions.length?state.suggestions.map(suggestionCard).join(''):`<div class="empty-state"><strong>${t('daily.empty.title')}</strong><p>${t('daily.empty.body')}</p></div>`}</section><p class="assistant-privacy">${t('daily.privacy')}</p></div>`;bindDialog();
}
async function recompute(forceWeather=false){
  state.loading=true;state.error=null;render();
  try{state.location=await getLocation();try{state.weather=await fetchWeather(state.location,forceWeather);}catch(error){const cached=await getMeta(WEATHER_KEY);state.weather=sameLocation(cached,state.location)?cached.weather:null;state.error=t(state.weather?'daily.error.weatherCached':'daily.error.weather');}const [items,outfits]=await Promise.all([getAllItems(),getAllOutfits()]);const result=recommendLooks({items,outfits,weather:state.weather||{},occasion:state.occasion,limit:3});state.profile=result.profile;state.suggestions=result.suggestions;}finally{state.loading=false;render();}
}
function geolocate(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('NO_GEO'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:10000,maximumAge:600000});});}
async function searchCity(query){const params=new URLSearchParams({name:query,count:'5',language:currentLanguage(),format:'json'});const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);if(!response.ok)throw new Error(`GEO_${response.status}`);return (await response.json()).results||[];}
async function saveLook(index,button){
  const suggestion=state.suggestions[index];if(!suggestion?.complete||suggestion.source!=='generated'||suggestion.itemIds.length<2)return;
  const existing=await getAllOutfits(),signature=ids=>[...ids].map(String).sort().join('|'),sig=signature(suggestion.itemIds),same=existing.find(outfit=>signature(outfit.itemIds||[])===sig);if(same){button.textContent=t('daily.save.exists');button.disabled=true;return;}
  const now=new Date().toISOString(),locale=currentLanguage()==='fr'?'fr-FR':'vi-VN',date=new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit'}).format(new Date()),occasion=t(`occasion.${state.occasion}`),weather=weatherSummaryText(state.profile||{});
  await putOutfit({id:crypto.randomUUID(),name:t('daily.generatedName',{date,occasion}),occasion:state.occasion,season:suggestion.season||'All',note:t('daily.generatedNote',{weather}),itemIds:suggestion.itemIds,favorite:false,createdAt:now,updatedAt:now});window.dispatchEvent(new CustomEvent('tran:outfit-sync-needed'));button.textContent=t('daily.save.done');button.disabled=true;
}
function bindDialog(){
  const d=ensureDialog();d.querySelector('[data-assistant-close]')?.addEventListener('click',()=>d.close());d.querySelector('[data-assistant-occasion]')?.addEventListener('change',async event=>{state.occasion=event.target.value;await recompute(false);});d.querySelector('[data-refresh-weather]')?.addEventListener('click',()=>recompute(true));d.querySelector('[data-location-edit]')?.addEventListener('click',()=>{const editor=d.querySelector('.assistant-location-editor');editor.hidden=!editor.hidden;});
  d.querySelector('[data-use-location]')?.addEventListener('click',async event=>{event.currentTarget.disabled=true;try{const pos=await geolocate();await setMeta(LOCATION_KEY,{name:'current',current:true,latitude:pos.coords.latitude,longitude:pos.coords.longitude});await recompute(true);}catch{state.error=t('daily.geo.error');render();}});
  d.querySelector('[data-city-search]')?.addEventListener('click',async()=>{const input=d.querySelector('[data-city-query]'),results=d.querySelector('.assistant-city-results'),query=input.value.trim();if(query.length<2)return;results.innerHTML=`<small>${t('daily.city.searching')}</small>`;try{const cities=await searchCity(query);results.innerHTML=cities.length?cities.map((city,index)=>`<button type="button" data-city-index="${index}"><strong>${esc(city.name)}</strong><small>${esc([city.admin1,city.country].filter(Boolean).join(' · '))}</small></button>`).join(''):`<small>${t('daily.city.notFound')}</small>`;results.querySelectorAll('[data-city-index]').forEach(button=>button.onclick=async()=>{const city=cities[Number(button.dataset.cityIndex)];await setMeta(LOCATION_KEY,{name:[city.name,city.admin1].filter(Boolean).join(', '),latitude:city.latitude,longitude:city.longitude,timezone:city.timezone});await recompute(true);});}catch{results.innerHTML=`<small>${t('daily.city.error')}</small>`;}});
  d.querySelectorAll('[data-save-look]').forEach(button=>button.onclick=()=>saveLook(Number(button.dataset.saveLook),button));d.querySelectorAll('[data-open-outfits]').forEach(button=>button.onclick=()=>{d.close();document.querySelector('.nav-item[data-route="outfits"]')?.click();});
}
async function openAssistant(){const d=ensureDialog();if(!d.open)d.showModal();await recompute(false);}
function mount(){if(document.querySelector('.daily-assistant-launch'))return;const hero=root?.querySelector('.hero-card');if(!hero)return;const button=document.createElement('button');button.type='button';button.className='primary-button daily-assistant-launch';button.innerHTML=`<span>✦</span><div><strong>${t('daily.launch.title')}</strong><small>${t('daily.launch.subtitle')}</small></div><b>›</b>`;button.addEventListener('click',openAssistant);hero.after(button);}
if(root)new MutationObserver(mount).observe(root,{childList:true});
mount();
