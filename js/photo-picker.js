import {t} from './i18n-keyed.mjs?v=0.5.16';

const root=document.querySelector('#mainContent');

async function compressPhoto(file){
  const image=new Image();
  const url=URL.createObjectURL(file);
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
  const max=1500;
  const width=image.naturalWidth||image.width;
  const height=image.naturalHeight||image.height;
  const scale=Math.min(1,max/Math.max(width,height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));
  canvas.height=Math.max(1,Math.round(height*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg',.78);
}

function sourceMarkup(){
  return `<div class="photo-source-actions" data-photo-source-actions>
    <button type="button" class="secondary-button" data-photo-camera><span>📷</span><b>${t('photo.take')}</b></button>
    <button type="button" class="secondary-button" data-photo-gallery><span>▧</span><b>${t('photo.gallery')}</b></button>
  </div>`;
}

function introMarkup(){
  return `<div data-photo-picker-intro class="photo-picker-intro"><span>＋</span><strong>${t('photo.add')}</strong><small>${t('photo.intro')}</small></div>`;
}

function ensurePickerIntro(preview){
  if(preview.querySelector('img'))return;
  if(!preview.querySelector('[data-photo-picker-intro]'))preview.innerHTML=introMarkup();
}

function bindSourceButtons(input,camera,preview,form){
  let actions=preview.querySelector('[data-photo-source-actions]');
  if(!actions){preview.insertAdjacentHTML('beforeend',sourceMarkup());actions=preview.querySelector('[data-photo-source-actions]');}
  if(preview.dataset.photoSourceBound!=='1'){
    preview.dataset.photoSourceBound='1';
    preview.addEventListener('click',event=>{
      if(event.target.closest('[data-photo-camera],[data-photo-gallery]'))return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);
  }
  const cameraButton=actions.querySelector('[data-photo-camera]');
  const galleryButton=actions.querySelector('[data-photo-gallery]');
  if(cameraButton&&!cameraButton.dataset.bound){
    cameraButton.dataset.bound='1';
    cameraButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();camera.value='';camera.click();});
  }
  if(galleryButton&&!galleryButton.dataset.bound){
    galleryButton.dataset.bound='1';
    galleryButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();input.value='';input.click();});
  }
  if(!camera.dataset.bound){
    camera.dataset.bound='1';
    camera.addEventListener('change',async()=>{
      const file=camera.files?.[0];
      if(!file)return;
      try{
        const photo=await compressPhoto(file);
        input.value='';
        input.dataset.photo=photo;
        preview.innerHTML=`<img src="${photo}" alt="${t('photo.preview')}">${sourceMarkup()}`;
        preview.dataset.photoSourceBound='';
        mountPhotoPicker();
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(error){console.warn('Camera photo processing failed.',error);}
    });
  }
}

function mountPhotoPicker(){
  const input=document.querySelector('#photoInput');
  const preview=document.querySelector('#photoPreview');
  const form=document.querySelector('#itemForm');
  if(!input||!preview||!form)return false;
  input.removeAttribute('capture');
  input.setAttribute('accept','image/*');
  let camera=form.querySelector('#cameraInput');
  if(!camera){
    camera=document.createElement('input');
    camera.id='cameraInput';camera.type='file';camera.accept='image/*';camera.setAttribute('capture','environment');camera.hidden=true;
    input.after(camera);
  }
  ensurePickerIntro(preview);
  bindSourceButtons(input,camera,preview,form);
  return true;
}

mountPhotoPicker();
if(root)new MutationObserver(mountPhotoPicker).observe(root,{childList:true});
