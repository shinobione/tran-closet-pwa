const root=document.querySelector('#mainContent');

function bindSearchFocus(){
  const input=document.querySelector('#searchInput');
  if(!input||input.dataset.v059FocusBound==='1')return;
  input.dataset.v059FocusBound='1';
  input.addEventListener('input',event=>{
    const source=event.currentTarget;
    const start=source.selectionStart;
    const end=source.selectionEnd;
    // app.js redraws the closet on each query update. Restore focus immediately
    // onto the replacement input so mobile keyboards stay active while typing.
    queueMicrotask(()=>{
      const replacement=document.querySelector('#searchInput');
      if(!replacement||replacement===source)return;
      try{replacement.focus({preventScroll:true});}catch{replacement.focus();}
      const length=replacement.value.length;
      try{
        const nextStart=Math.min(start??length,length);
        const nextEnd=Math.min(end??nextStart,length);
        replacement.setSelectionRange(nextStart,nextEnd);
      }catch{}
    });
  },true);
}

function cleanVietnameseSourceCopy(){
  if(document.documentElement.lang==='fr')return;
  const assistantSub=document.querySelector('.daily-assistant-launch small');
  if(assistantSub&&assistantSub.textContent.includes('Météo'))assistantSub.textContent='Thời tiết + tủ đồ thật + dịp hôm nay';
  document.querySelectorAll('.privacy-note').forEach(note=>{
    if(note.textContent.includes('Vêtements')||note.textContent.includes('canonique')){
      note.textContent='Khóa Airtable không nằm trong PWA. Ứng dụng chỉ lưu khóa đồng bộ riêng của thiết bị và gửi thay đổi tới Worker bảo mật. Quần áo, nhãn và outfit đều đi qua luồng đồng bộ chuẩn.';
    }
  });
}

function patch(){
  bindSearchFocus();
  cleanVietnameseSourceCopy();
}

patch();
if(root)new MutationObserver(patch).observe(root,{childList:true,subtree:true});
