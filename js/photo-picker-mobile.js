const root=document.querySelector('#mainContent');

async function compress(file){
  const image=new Image();
  const url=URL.createObjectURL(file);
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
  const max=1500;
  const scale=Math.min(1,max/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale));
  canvas.height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg',.78);
}

function patchPhotoInput(){
  const input=document.querySelector('#photoInput');
  const preview=document.querySelector('#photoPreview');
  const form=document.querySelector('#itemForm');
  if(!input||!preview||!form)return false;

  // The canonical input remains the gallery/file picker. A dedicated second
  // input owns capture=environment so mobile users always keep BOTH choices.
  input.removeAttribute('capture');
  input.setAttribute('accept','image/*');

  let camera=form.querySelector('#cameraInput');
  if(!camera){
    camera=document.createElement('input');
    camera.id='cameraInput';
    camera.type='file';
    camera.accept='image/*';
    camera.setAttribute('capture','environment');
    camera.hidden=true;
    input.after(camera);
  }

  let actions=form.parentElement?.querySelector('.photo-source-actions');
  if(!actions){
    actions=document.createElement('div');
    actions.className='photo-source-actions';
    actions.innerHTML=`<button type="button" class="secondary-button" data-photo-camera>📷 Chụp ảnh</button><button type="button" class="secondary-button" data-photo-gallery>▧ Chọn từ thư viện</button>`;
    preview.after(actions);
  }

  const cameraButton=actions.querySelector('[data-photo-camera]');
  const galleryButton=actions.querySelector('[data-photo-gallery]');
  if(cameraButton&&!cameraButton.dataset.bound){
    cameraButton.dataset.bound='1';
    cameraButton.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      camera.value='';
      camera.click();
    });
  }
  if(galleryButton&&!galleryButton.dataset.bound){
    galleryButton.dataset.bound='1';
    galleryButton.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      input.click();
    });
  }
  if(!camera.dataset.bound){
    camera.dataset.bound='1';
    camera.addEventListener('change',async()=>{
      const file=camera.files?.[0];
      if(!file)return;
      try{
        const photo=await compress(file);
        input.value='';
        input.dataset.photo=photo;
        preview.innerHTML=`<img src="${photo}" alt="Xem trước">`;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(error){
        console.warn('Camera photo processing failed.',error);
      }
    });
  }
  return true;
}

patchPhotoInput();
if(root){
  new MutationObserver(()=>patchPhotoInput()).observe(root,{childList:true,subtree:true});
}
