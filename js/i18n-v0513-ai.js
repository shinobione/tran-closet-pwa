if(document.documentElement.lang==='fr'){
  const root=document.querySelector('#mainContent');

  function translate(value){
    const text=String(value??'').trim();
    let m=text.match(/^✦ AI đã tự thử lại (\d+) lần · (\d+) lượt nhìn tổng cộng$/);
    if(m)return `✦ L’IA a réessayé automatiquement ${m[1]} fois · ${m[2]} analyses visuelles au total`;
    m=text.match(/^✦ AI đã tự kiểm tra lại ảnh · (\d+) lượt$/);
    if(m)return `✦ L’IA a revérifié automatiquement la photo · ${m[1]} analyses`;
    m=text.match(/^✦ AI đã đối chiếu ảnh · (\d+) lượt nhìn$/);
    if(m)return `✦ L’IA a vérifié la photo · ${m[1]} analyses`;
    m=text.match(/^Đang tự thử lại (\d+)\/(\d+)…$/);
    if(m)return `Nouvelle tentative automatique ${m[1]}/${m[2]}…`;
    m=text.match(/^Kết quả trước chưa đủ chắc\. AI đang tự phân tích lại lần (\d+) để chọn phương án tốt hơn…$/);
    if(m)return `Le résultat précédent n’était pas assez fiable. L’IA relance l’analyse (${m[1]}) pour choisir une meilleure proposition…`;
    return text;
  }

  function patchNode(node){
    if(!(node instanceof Element))return;
    const targets=[];
    if(node.matches('.ai-check-note,.ai-loading p,.ai-analyze'))targets.push(node);
    targets.push(...node.querySelectorAll('.ai-check-note,.ai-loading p,.ai-analyze'));
    for(const el of targets){
      const before=el.textContent||'';
      const after=translate(before);
      if(after!==before.trim())el.textContent=after;
    }
  }

  patchNode(root);
  if(root)new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes)patchNode(node);
    }
  }).observe(root,{childList:true,subtree:true});
}
