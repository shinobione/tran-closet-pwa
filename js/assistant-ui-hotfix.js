const FR_LABEL='Ouvrir dans Tenues';

function patchAssistantLabels(root=document){
  if(document.documentElement.lang!=='fr')return;
  const scope=root instanceof Element||root instanceof Document?root:document;
  scope.querySelectorAll?.('[data-open-outfits]').forEach(button=>{
    if(button.textContent.trim()==='Mở trong Phối đồ')button.textContent=FR_LABEL;
    button.setAttribute('aria-label',FR_LABEL);
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
