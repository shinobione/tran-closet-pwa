const FR_LABEL='Ouvrir dans Tenues';
const FR_REASON_MAP=new Map([
  ['Tủ còn thiếu quần/váy để hoàn thiện bộ này.','Il manque encore un pantalon ou une jupe pour compléter cette tenue.'],
  ['Tủ còn thiếu áo để hoàn thiện bộ này.','Il manque encore un haut pour compléter cette tenue.'],
  ['Tủ chưa có đủ áo + quần/váy hoặc một món liền thân để dựng outfit hoàn chỉnh.','Le dressing n’a pas encore assez de pièces de base pour construire une tenue complète.'],
  ['Đây là các món hiện có phù hợp nhất với thời tiết và dịp đã chọn.','Voici les articles disponibles les plus adaptés à la météo et à l’occasion choisie.']
]);

function patchAssistantLabels(root=document){
  if(document.documentElement.lang!=='fr')return;
  const scope=root instanceof Element||root instanceof Document?root:document;
  scope.querySelectorAll?.('[data-open-outfits]').forEach(button=>{
    if(button.textContent.trim()==='Mở trong Phối đồ')button.textContent=FR_LABEL;
    button.setAttribute('aria-label',FR_LABEL);
  });
  scope.querySelectorAll?.('.assistant-suggestion li').forEach(item=>{
    const translated=FR_REASON_MAP.get(item.textContent.trim());
    if(translated)item.textContent=translated;
  });
}

patchAssistantLabels();
new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===Node.ELEMENT_NODE)patchAssistantLabels(node);
    }
  }
}).observe(document.body,{childList:true,subtree:true});
