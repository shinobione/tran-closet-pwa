const LANGUAGE_KEY='tran-closet-language';

const FR_EXACT=new Map([
  ['Mở trong Phối đồ','Ouvrir dans Tenues'],
  ['Tủ còn thiếu quần/váy để hoàn thiện bộ này.','Il manque encore un pantalon ou une jupe pour compléter cette tenue.'],
  ['Tủ còn thiếu áo để hoàn thiện bộ này.','Il manque encore un haut pour compléter cette tenue.'],
  ['Đây là các món hiện có phù hợp nhất với thời tiết và dịp đã chọn.','Voici les articles disponibles les plus adaptés à la météo et à l’occasion choisie.'],
  ['Đang chuẩn bị ảnh…','Préparation de l’image…'],
  ['Chia sẻ dưới dạng ảnh · không công khai tủ đồ','Partager sous forme d’image · le dressing reste privé'],
  ['↗ Chia sẻ outfit','↗ Partager la tenue'],
  ['⇩ Lưu ảnh outfit','⇩ Enregistrer l’image de la tenue'],
  ['Không tạo được ảnh','Impossible de créer l’image'],
  ['Đã lưu ảnh ✓','Image enregistrée ✓'],
  ['Một outfit được lưu trong Trân Closet','Une tenue enregistrée dans Trân Closet'],
  ['CHỈNH SỬA','MODIFIER'],
  ['Thay ảnh sẽ được thêm trong bản cập nhật tiếp theo. Ảnh hiện tại được giữ nguyên.','Le remplacement de la photo sera ajouté dans une prochaine mise à jour. La photo actuelle est conservée.'],
  ['Đã xóa · đang đồng bộ','Supprimé · synchronisation en cours'],
  ['Đã xóa · sẽ đồng bộ khi có mạng','Supprimé · sera synchronisé au retour du réseau'],
  ['Mở bằng','Ouvrir avec'],['Chia sẻ','Partager'],['Chạm','Touchez'],
  ['Xem trước','Aperçu'],['Tìm món đồ','Rechercher un article'],['Đặt lại','Réinitialiser'],
  ['♥ Yêu thích','♥ Favoris'],['✓ Đã chọn','✓ Sélectionnés'],['Lọc theo loại','Filtrer par catégorie'],
  ['Không tìm thấy món phù hợp.','Aucun article correspondant.']
]);

const FR_PATTERNS=[
  [/^(\d+) đã chọn$/,(_,n)=>`${n} sélectionné${n==='1'?'':'s'}`],
  [/^(\d+)\/(\d+) món$/,(_,a,b)=>`${a}/${b} articles`],
  [/^(\d+) món · (.+)$/,(_,n,rest)=>`${n} article${n==='1'?'':'s'} · ${rest}`],
  [/^Bỏ (.+)$/,(_,name)=>`Retirer ${name}`],
  [/^\+(\d+) món$/,(_,n)=>`+${n} article${n==='1'?'':'s'}`]
];

function translateFr(value){
  const text=String(value??'').trim();
  if(FR_EXACT.has(text))return FR_EXACT.get(text);
  for(const [pattern,replacer] of FR_PATTERNS){const match=text.match(pattern);if(match)return replacer(...match);}
  return text;
}

function cleanVietnameseSourceCopy(scope=document){
  if(document.documentElement.lang==='fr')return;
  scope.querySelectorAll?.('.daily-assistant-launch small').forEach(node=>{
    if(node.textContent.includes('Météo'))node.textContent='Thời tiết + tủ đồ thật + dịp hôm nay';
  });
  scope.querySelectorAll?.('.privacy-note').forEach(node=>{
    if(node.textContent.includes('Vêtements')||node.textContent.includes('canonique')){
      node.textContent='Khóa Airtable không nằm trong PWA. Ứng dụng chỉ lưu khóa đồng bộ riêng của thiết bị và gửi thay đổi tới Worker bảo mật. Quần áo, nhãn và outfit đều đi qua luồng đồng bộ chuẩn.';
    }
  });
}

function translateTree(scope){
  if(document.documentElement.lang!=='fr'||!scope)return;
  const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
  let node=walker.nextNode();
  while(node){
    if(!node.parentElement?.closest('script,style,code,pre')){
      const raw=node.nodeValue||'',trimmed=raw.trim();
      if(trimmed){const next=translateFr(trimmed);if(next!==trimmed)node.nodeValue=`${raw.match(/^\s*/)?.[0]||''}${next}${raw.match(/\s*$/)?.[0]||''}`;}
    }
    node=walker.nextNode();
  }
}

function patch(scope=document){cleanVietnameseSourceCopy(scope);translateTree(scope);}

patch(document.body);
// Transitional compatibility only. Slice 16.5 replaces this with key-based
// translations. One child-list observer replaces the historical v059/profile/
// AI/assistant stack. It ignores characterData/attributes, so its own text
// replacements cannot recursively trigger another translation pass.
new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===Node.ELEMENT_NODE)patch(node);
      else if(node.nodeType===Node.TEXT_NODE&&node.parentElement)patch(node.parentElement);
    }
  }
}).observe(document.body,{childList:true,subtree:true});
