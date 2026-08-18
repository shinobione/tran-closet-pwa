const root=document.querySelector('#mainContent');

function bindSearchFocus(){
  const input=document.querySelector('#searchInput');
  if(!input||input.dataset.v059FocusBound==='1')return;
  input.dataset.v059FocusBound='1';
  input.addEventListener('input',event=>{
    const source=event.currentTarget;
    const start=source.selectionStart;
    const end=source.selectionEnd;
    // app.js intentionally redraws the closet on each query update. Restore
    // focus immediately onto the replacement input so mobile keyboards do not
    // collapse after every character.
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

bindSearchFocus();
if(root)new MutationObserver(bindSearchFocus).observe(root,{childList:true,subtree:true});
