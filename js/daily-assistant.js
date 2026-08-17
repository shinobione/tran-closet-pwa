import {getAllItems,getAllOutfits,putOutfit,getMeta,setMeta} from './db.js';
import {recommendLooks,weatherSummary,OCCASION_LABELS} from './daily-assistant-core.mjs?v=0.5.0';
import {LABELS} from './data.js';

const root=document.querySelector('#mainContent');
const DEFAULT_LOCATION={name:'TP. Hồ Chí Minh',latitude:10.7769,longitude:106.7009,timezone:'Asia/Ho_Chi_Minh'};
const LOCATION_KEY='daily-assistant-location';
const WEATHER_KEY='daily-assistant-weather';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const label=(type,value)=>LABELS[type]?.[value]||value;
let dialog=null;
let state={location:null,weather:null,occasion:'Everyday',suggestions:[],profile:null,loading:false,error:null};

function weatherCodeLabel(code){
  code=Number(code);
  if(code===0)return 'Trời quang';
  if([1,2].includes(code))return 'Ít mây';
  if(code===3)return 'Nhiều mây';
  if([45,48].includes(code))return 'Có sương';
  if([51,53,55,56,57].includes(code))return 'Mưa phùn';
  if([61,63,65,66,67,80,81,82].includes(code))return 'Có mưa';
  if([95,96,99].includes(code))return 'Dông';
  return 'Thời tiết hiện tại';
}

async function getLocation(){
  return (await getMeta(LOCATION_KEY))||DEFAULT_LOCATION;
}

async function fetchWeather(location,force=false){
  const cached=await getMeta(WEATHER_KEY);
  const same=cached&&Math.abs(Number(cached.latitude)-Number(location.latitude))<.01&&Math.abs(Number(cached.longitude)-Number(location.longitude))<.01;
  if(!force&&same&&Date.now()-Number(cached.fetchedAt||0)<30*60*1000)return cached.weather;
  const params=new URLSearchParams({
    latitude:String(location.latitude),longitude:String(location.longitude),timezone:'auto',forecast_days:'1',
    current:'temperature_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m',
    daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code'
  });
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if(!response.ok)throw new Error(`WEATHER_${response.status}`);
  const body=await response.json();
  const weather={
    temperature:body.current?.temperature_2m,
    apparentTemperature:body.current?.apparent_temperature,
    precipitation:body.current?.precipitation,
    rain:body.current?.rain,
    showers:body.current?.showers,
    weatherCode:body.current?.weather_code??body.daily?.weather_code?.[0],
    windSpeed:body.current?.wind_speed_10m,
    dailyMax:body.daily?.temperature_2m_max?.[0],
    dailyMin:body.daily?.temperature_2m_min?.[0],
    precipitationProbability:body.daily?.precipitation_probability_max?.[0],
    timezone:body.timezone||location.timezone||null,
    observedAt:body.current?.time||null
  };
  await setMeta(WEATHER_KEY,{latitude:location.latitude,longitude:location.longitude,fetchedAt:Date.now(),weather});
  return weather;
}

function ensureDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');
  dialog.id='dailyAssistantDialog';
  dialog.className='daily-assistant-dialog';
  document.body.appendChild(dialog);
  return dialog;
}

function weatherCard(){
  if(!state.weather)return `<div class="assistant-weather assistant-weather-offline"><strong>Không có dữ liệu thời tiết</strong><span>Trợ lý vẫn có thể gợi ý theo dịp và tủ đồ hiện tại.</span></div>`;
  const w=state.weather;
  return `<section class="assistant-weather">
    <div><p>${esc(weatherCodeLabel(w.weatherCode))}</p><strong>${Math.round(Number(w.temperature)||0)}°</strong><span>Cảm giác ${Math.round(Number(w.apparentTemperature)||0)}°</span></div>
    <div class="assistant-weather-stats"><span>↑ ${Math.round(Number(w.dailyMax)||0)}°</span><span>↓ ${Math.round(Number(w.dailyMin)||0)}°</span><span>☔ ${Math.round(Number(w.precipitationProbability)||0)}%</span><span>⌁ ${Math.round(Number(w.windSpeed)||0)} km/h</span></div>
    <small>${esc(weatherSummary(state.profile||{}))} · Open-Meteo</small>
  </section>`;
}

function itemTile(item){
  return `<div class="assistant-item">${item.photo?`<img src="${item.photo}" alt="${esc(item.name)}">`:`<span>◇</span>`}<div><strong>${esc(item.name)}</strong><small>${esc(label('category',item.category))}</small></div></div>`;
}

function suggestionCard(suggestion,index){
  const action=suggestion.source==='saved'
    ? `<button type="button" class="secondary-button" data-open-outfits>Voir dans Phối đồ</button>`
    : suggestion.complete
      ? `<button type="button" class="primary-button" data-save-look="${index}">Lưu thành outfit</button>`
      : `<small class="assistant-incomplete">Thêm một áo + quần/váy, hoặc đầm/jumpsuit để tạo outfit hoàn chỉnh.</small>`;
  return `<article class="assistant-suggestion ${suggestion.complete?'':'is-partial'}">
    <div class="assistant-suggestion-head"><div><p>${suggestion.source==='saved'?'OUTFIT ĐÃ LƯU':suggestion.complete?'GỢI Ý HÔM NAY':'TỦ ĐỒ HIỆN TẠI'}</p><h3>${esc(suggestion.name)}</h3></div><span>#${index+1}</span></div>
    <div class="assistant-items">${suggestion.items.map(itemTile).join('')}</div>
    <ul>${suggestion.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul>
    ${action}
  </article>`;
}

function render(){
  const d=ensureDialog();
  if(state.loading){
    d.innerHTML=`<div class="assistant-shell"><button class="assistant-close" data-assistant-close>×</button><div class="assistant-loading"><span>✦</span><strong>Đang nhìn tủ đồ và thời tiết…</strong><p>Trợ lý đang xếp các món phù hợp nhất cho hôm nay.</p></div></div>`;
    d.querySelector('[data-assistant-close]').onclick=()=>d.close();
    return;
  }
  d.innerHTML=`<div class="assistant-shell">
    <header class="assistant-header"><div><p class="eyebrow">TRỢ LÝ CỦA TRÂN</p><h2>Hôm nay mặc gì?</h2><span>Gợi ý từ tủ đồ thật · Trân luôn là người quyết định.</span></div><button class="assistant-close" data-assistant-close>×</button></header>
    <section class="assistant-controls">
      <div class="assistant-location"><div><small>Vị trí</small><strong>${esc(state.location?.name||DEFAULT_LOCATION.name)}</strong></div><button type="button" class="secondary-button" data-location-edit>Đổi</button></div>
      <label>Dịp<select data-assistant-occasion>${Object.entries(OCCASION_LABELS).map(([key,value])=>`<option value="${key}" ${state.occasion===key?'selected':''}>${esc(value)}</option>`).join('')}</select></label>
      <div class="assistant-location-editor" hidden>
        <div class="assistant-location-actions"><button type="button" class="secondary-button" data-use-location>⌖ Vị trí hiện tại</button></div>
        <div class="assistant-city-search"><input type="search" data-city-query placeholder="Tìm thành phố…"><button type="button" class="secondary-button" data-city-search>Tìm</button></div>
        <div class="assistant-city-results"></div>
      </div>
    </section>
    ${weatherCard()}
    ${state.error?`<p class="assistant-error">${esc(state.error)}</p>`:''}
    <div class="assistant-section-title"><div><p class="eyebrow">GỢI Ý</p><h3>${state.suggestions.length?`${state.suggestions.length} lựa chọn`:'Chưa đủ dữ liệu'}</h3></div><button type="button" class="secondary-button" data-refresh-weather>↻ Làm mới</button></div>
    <section class="assistant-suggestions">${state.suggestions.length?state.suggestions.map(suggestionCard).join(''):`<div class="empty-state"><strong>Chưa tạo được gợi ý</strong><p>Hãy thêm vài món cơ bản hoặc outfit đã lưu.</p></div>`}</section>
    <p class="assistant-privacy">Vị trí chỉ được dùng để lấy thời tiết. Không có outfit nào được lưu nếu Trân chưa bấm “Lưu thành outfit”.</p>
  </div>`;
  bindDialog();
}

async function recompute(forceWeather=false){
  state.loading=true;state.error=null;render();
  try{
    state.location=await getLocation();
    try{state.weather=await fetchWeather(state.location,forceWeather);}catch(error){
      const cached=await getMeta(WEATHER_KEY);
      state.weather=cached?.weather||null;
      state.error=state.weather?'Không lấy được thời tiết mới · đang dùng dữ liệu gần nhất.':'Không lấy được thời tiết lúc này.';
    }
    const [items,outfits]=await Promise.all([getAllItems(),getAllOutfits()]);
    const result=recommendLooks({items,outfits,weather:state.weather||{},occasion:state.occasion,limit:3});
    state.profile=result.profile;state.suggestions=result.suggestions;
  }finally{state.loading=false;render();}
}

function geolocate(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('NO_GEO'));
    navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:10000,maximumAge:600000});
  });
}

async function searchCity(query){
  const params=new URLSearchParams({name:query,count:'5',language:'vi',format:'json'});
  const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if(!response.ok)throw new Error(`GEO_${response.status}`);
  return (await response.json()).results||[];
}

async function saveLook(index,button){
  const suggestion=state.suggestions[index];
  if(!suggestion?.complete||suggestion.source!=='generated')return;
  const existing=await getAllOutfits();
  const signature=ids=>[...ids].map(String).sort().join('|');
  const sig=signature(suggestion.itemIds);
  const same=existing.find(outfit=>signature(outfit.itemIds||[])===sig);
  if(same){button.textContent='Đã có trong Phối đồ ✓';button.disabled=true;return;}
  const now=new Date().toISOString();
  const date=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit'}).format(new Date());
  await putOutfit({
    id:crypto.randomUUID(),name:`Gợi ý ${date} · ${OCCASION_LABELS[state.occasion]||state.occasion}`,
    occasion:state.occasion,season:suggestion.season||'All',
    note:`Trợ lý hôm nay · ${weatherSummary(state.profile||{})}`,
    itemIds:suggestion.itemIds,favorite:false,createdAt:now,updatedAt:now
  });
  window.dispatchEvent(new CustomEvent('tran:outfit-sync-needed'));
  button.textContent='Đã lưu outfit ✓';button.disabled=true;
}

function bindDialog(){
  const d=ensureDialog();
  d.querySelector('[data-assistant-close]')?.addEventListener('click',()=>d.close());
  d.querySelector('[data-assistant-occasion]')?.addEventListener('change',async event=>{state.occasion=event.target.value;await recompute(false);});
  d.querySelector('[data-refresh-weather]')?.addEventListener('click',()=>recompute(true));
  d.querySelector('[data-location-edit]')?.addEventListener('click',()=>{const editor=d.querySelector('.assistant-location-editor');editor.hidden=!editor.hidden;});
  d.querySelector('[data-use-location]')?.addEventListener('click',async button=>{
    button.target.disabled=true;
    try{
      const pos=await geolocate();
      await setMeta(LOCATION_KEY,{name:'Vị trí hiện tại',latitude:pos.coords.latitude,longitude:pos.coords.longitude});
      await recompute(true);
    }catch{state.error='Không lấy được vị trí hiện tại. Bạn có thể tìm thành phố thủ công.';render();}
  });
  d.querySelector('[data-city-search]')?.addEventListener('click',async()=>{
    const input=d.querySelector('[data-city-query]');
    const results=d.querySelector('.assistant-city-results');
    const query=input.value.trim();if(query.length<2)return;
    results.innerHTML='<small>Đang tìm…</small>';
    try{
      const cities=await searchCity(query);
      results.innerHTML=cities.length?cities.map((city,index)=>`<button type="button" data-city-index="${index}"><strong>${esc(city.name)}</strong><small>${esc([city.admin1,city.country].filter(Boolean).join(' · '))}</small></button>`).join(''):'<small>Không tìm thấy.</small>';
      results.querySelectorAll('[data-city-index]').forEach(button=>button.onclick=async()=>{
        const city=cities[Number(button.dataset.cityIndex)];
        await setMeta(LOCATION_KEY,{name:[city.name,city.admin1].filter(Boolean).join(', '),latitude:city.latitude,longitude:city.longitude,timezone:city.timezone});
        await recompute(true);
      });
    }catch{results.innerHTML='<small>Không tìm được thành phố lúc này.</small>';}
  });
  d.querySelectorAll('[data-save-look]').forEach(button=>button.onclick=()=>saveLook(Number(button.dataset.saveLook),button));
  d.querySelectorAll('[data-open-outfits]').forEach(button=>button.onclick=()=>{d.close();document.querySelector('.nav-item[data-route="outfits"]')?.click();});
}

async function openAssistant(){
  const d=ensureDialog();
  if(!d.open)d.showModal();
  await recompute(false);
}

function mount(){
  if(document.querySelector('.daily-assistant-launch'))return;
  const title=document.querySelector('#pageTitle');
  if(title?.textContent!=='Tủ đồ của tôi')return;
  const hero=root?.querySelector('.hero-card');
  if(!hero)return;
  const button=document.createElement('button');
  button.type='button';button.className='primary-button daily-assistant-launch';
  button.innerHTML='<span>✦</span><div><strong>Hôm nay mặc gì?</strong><small>Météo + tủ đồ thật + dịp của hôm nay</small></div><b>›</b>';
  button.addEventListener('click',openAssistant);
  hero.after(button);
}

if(root)new MutationObserver(mount).observe(root,{childList:true,subtree:true});
mount();
