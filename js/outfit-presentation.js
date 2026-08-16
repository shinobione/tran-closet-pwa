const dialog=document.querySelector('#itemDialog');
const prepared=new WeakMap();

function slug(value){
  return String(value||'outfit')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'outfit';
}

function readOutfit(root){
  const chips=[...root.querySelectorAll('.detail-chips span')].map(node=>node.textContent.trim()).filter(Boolean);
  const items=[...root.querySelectorAll('[data-outfit-item]')].map(button=>({
    name:button.querySelector('strong')?.textContent.trim()||'Món đồ',
    category:button.querySelector('small')?.textContent.trim()||'',
    src:button.querySelector('img')?.currentSrc||button.querySelector('img')?.src||null,
    fallback:button.querySelector('span b')?.textContent.trim()||'◇'
  }));
  return {
    title:root.querySelector('.detail-body h2')?.textContent.trim()||'Outfit',
    occasion:root.querySelector('.detail-body .eyebrow')?.textContent.trim()||'Outfit',
    season:chips[0]||'',
    count:chips[1]||`${items.length} món`,
    note:root.querySelector('.outfit-note')?.textContent.trim()||'',
    items
  };
}

function roundedPath(ctx,x,y,w,h,r){
  const radius=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}

function drawCoverImage(ctx,img,x,y,w,h){
  if(!img)return false;
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
  const sw=w/scale,sh=h/scale;
  const sx=Math.max(0,(img.naturalWidth-sw)/2),sy=Math.max(0,(img.naturalHeight-sh)/2);
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
  return true;
}

function drawPlaceholder(ctx,item,x,y,w,h){
  const g=ctx.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,'#3a2c43');
  g.addColorStop(1,'#1b161f');
  ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
  ctx.fillStyle='rgba(255,255,255,.9)';
  ctx.font='700 72px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(item?.fallback||'◇',x+w/2,y+h/2);
}

function loadImage(src){
  if(!src)return Promise.resolve(null);
  return new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}

function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=2){
  const words=String(text||'').split(/\s+/).filter(Boolean);
  const lines=[];
  let line='';
  for(const word of words){
    const test=line?`${line} ${word}`:word;
    if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}
    else line=test;
  }
  if(line)lines.push(line);
  const visible=lines.slice(0,maxLines);
  if(lines.length>maxLines&&visible.length){
    let last=visible[visible.length-1];
    while(last&&ctx.measureText(`${last}…`).width>maxWidth)last=last.slice(0,-1);
    visible[visible.length-1]=`${last.trim()}…`;
  }
  visible.forEach((value,index)=>ctx.fillText(value,x,y+index*lineHeight));
  return y+visible.length*lineHeight;
}

function tileRects(count,x,y,w,h,gap=12){
  if(count<=1)return [{x,y,w,h}];
  if(count===2){const cw=(w-gap)/2;return [{x,y,w:cw,h},{x:x+cw+gap,y,w:cw,h}];}
  if(count===3){
    const left=Math.round(w*.59),right=w-left-gap,half=(h-gap)/2;
    return [{x,y,w:left,h},{x:x+left+gap,y,w:right,h:half},{x:x+left+gap,y:y+half+gap,w:right,h:half}];
  }
  const cw=(w-gap)/2,ch=(h-gap)/2;
  return [
    {x,y,w:cw,h:ch},{x:x+cw+gap,y,w:cw,h:ch},
    {x,y:y+ch+gap,w:cw,h:ch},{x:x+cw+gap,y:y+ch+gap,w:cw,h:ch}
  ];
}

async function renderShareFile(data){
  const canvas=document.createElement('canvas');
  canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,1080,1350);
  bg.addColorStop(0,'#2b2032');bg.addColorStop(.42,'#151019');bg.addColorStop(1,'#0f0c12');
  ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);

  const glow=ctx.createRadialGradient(180,130,10,180,130,420);
  glow.addColorStop(0,'rgba(239,155,189,.22)');glow.addColorStop(1,'rgba(239,155,189,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,700,600);

  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.fillStyle='#ef9bbd';ctx.font='800 22px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.fillText('TỦ ĐỒ CỦA TRÂN',72,76);
  ctx.fillStyle='rgba(255,248,251,.52)';ctx.font='700 18px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.textAlign='right';ctx.fillText('LOOKBOOK',1008,76);ctx.textAlign='left';

  ctx.fillStyle='#fff8fb';ctx.font='800 58px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  wrapText(ctx,data.title,72,154,936,64,2);

  const meta=[data.occasion,data.season,data.count].filter(Boolean).join('  •  ');
  ctx.fillStyle='rgba(255,248,251,.68)';ctx.font='600 24px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.fillText(meta,72,262);

  const visible=data.items.slice(0,4);
  const images=await Promise.all(visible.map(item=>loadImage(item.src)));
  const area={x:72,y:312,w:936,h:800};
  const rects=tileRects(Math.max(1,visible.length),area.x,area.y,area.w,area.h);
  rects.forEach((rect,index)=>{
    ctx.save();roundedPath(ctx,rect.x,rect.y,rect.w,rect.h,28);ctx.clip();
    const item=visible[index];
    if(!item||!drawCoverImage(ctx,images[index],rect.x,rect.y,rect.w,rect.h))drawPlaceholder(ctx,item,rect.x,rect.y,rect.w,rect.h);
    const shade=ctx.createLinearGradient(0,rect.y+rect.h*.55,0,rect.y+rect.h);
    shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.58)');
    ctx.fillStyle=shade;ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    if(item){
      ctx.fillStyle='rgba(255,255,255,.94)';ctx.font='700 22px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.fillText(item.name.slice(0,34),rect.x+22,rect.y+rect.h-28);
    }
    ctx.restore();
  });

  if(data.items.length>4){
    ctx.fillStyle='rgba(16,13,20,.76)';roundedPath(ctx,842,1034,146,52,26);ctx.fill();
    ctx.fillStyle='#fff8fb';ctx.font='800 22px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign='center';ctx.fillText(`+${data.items.length-4} món`,915,1067);ctx.textAlign='left';
  }

  if(data.note){
    ctx.fillStyle='rgba(255,248,251,.78)';ctx.font='500 27px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    wrapText(ctx,data.note,72,1190,820,38,2);
  }else{
    ctx.fillStyle='rgba(255,248,251,.52)';ctx.font='500 24px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.fillText('Một outfit được lưu trong Trân Closet',72,1190);
  }
  ctx.fillStyle='#ef9bbd';ctx.font='800 20px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.fillText('TRÂN CLOSET',72,1290);
  ctx.fillStyle='rgba(255,248,251,.42)';ctx.font='500 18px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.textAlign='right';ctx.fillText('Made from her closet ✦',1008,1290);ctx.textAlign='left';

  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Canvas export failed')),'image/png'));
  return new File([blob],`tran-closet-${slug(data.title)}.png`,{type:'image/png'});
}

function canShareFile(file){
  if(!navigator.share||!navigator.canShare)return false;
  try{return navigator.canShare({files:[file]});}catch{return false;}
}

function saveFile(file){
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');
  a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

function sharePrepared(file,data,button){
  if(canShareFile(file)){
    navigator.share({files:[file],title:data.title,text:`${data.title} · Trân Closet`}).catch(error=>{
      if(error?.name!=='AbortError')saveFile(file);
    });
    return;
  }
  saveFile(file);
  const old=button.textContent;button.textContent='Đã lưu ảnh ✓';
  setTimeout(()=>button.textContent=old,1600);
}

function enhance(){
  if(!dialog)return;
  const root=dialog.querySelector('.outfit-detail');
  dialog.classList.toggle('outfit-presentation-dialog',Boolean(root));
  if(!root||root.dataset.presentationEnhanced==='true')return;
  root.dataset.presentationEnhanced='true';root.classList.add('is-presentation');

  const brand=document.createElement('div');
  brand.className='outfit-lookbook-brand';
  brand.innerHTML='<span>TỦ ĐỒ CỦA TRÂN</span><small>LOOKBOOK</small>';
  root.prepend(brand);

  const actions=root.querySelector('.detail-actions');
  const shareWrap=document.createElement('div');
  shareWrap.className='outfit-presentation-actions';
  shareWrap.innerHTML='<button type="button" class="outfit-share-button" disabled>Đang chuẩn bị ảnh…</button><small>Chia sẻ dưới dạng ảnh · không công khai tủ đồ</small>';
  actions?.before(shareWrap);
  const shareButton=shareWrap.querySelector('.outfit-share-button');
  const data=readOutfit(root);

  renderShareFile(data).then(file=>{
    prepared.set(root,{file,data});
    shareButton.disabled=false;
    shareButton.textContent=canShareFile(file)?'↗ Chia sẻ outfit':'⇩ Lưu ảnh outfit';
  }).catch(error=>{
    console.warn('Outfit share image preparation failed',error);
    shareButton.disabled=true;shareButton.textContent='Không tạo được ảnh';
  });

  shareButton.addEventListener('click',()=>{
    const ready=prepared.get(root);
    if(ready)sharePrepared(ready.file,ready.data,shareButton);
  });
}

if(dialog){
  new MutationObserver(enhance).observe(dialog,{childList:true,subtree:true});
  dialog.addEventListener('close',()=>{if(!dialog.querySelector('.outfit-detail'))dialog.classList.remove('outfit-presentation-dialog');});
}

document.addEventListener('click',event=>{
  if(event.target?.closest?.('[data-outfit-open]'))queueMicrotask(enhance);
});
document.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&event.target?.closest?.('[data-outfit-open]'))queueMicrotask(enhance);
});
