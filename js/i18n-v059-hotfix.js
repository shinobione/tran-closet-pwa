import {LABELS,FR_LABELS} from './data.js';

if(document.documentElement.lang==='fr'){
  const vietnameseLabels={};
  for(const [type,values] of Object.entries(LABELS))vietnameseLabels[type]={...values};

  const EXACT=new Map([
    ['CHỈNH SỬA','MODIFIER'],
    ['Thay ảnh sẽ được thêm trong bản cập nhật tiếp theo. Ảnh hiện tại được giữ nguyên.','Le remplacement de la photo sera ajouté dans une prochaine mise à jour. La photo actuelle est conservée.'],
    ['Đã xóa · đang đồng bộ','Supprimé · synchronisation en cours'],
    ['Đã xóa · sẽ đồng bộ khi có mạng','Supprimé · sera synchronisé au retour du réseau'],
    ['Đồng bộ Airtable hoàn tất ✓','Synchronisation Airtable terminée ✓'],
    ['Ngoại tuyến · thay đổi vẫn được lưu','Hors ligne · les modifications restent enregistrées'],
    ['Hãy cấu hình Worker trước','Configure d’abord le Worker'],
    ['Đã khôi phục dữ liệu ✓','Données restaurées ✓'],
    ['File sao lưu không hợp lệ','Fichier de sauvegarde invalide'],
    ['Xóa dữ liệu cục bộ trên thiết bị? Dữ liệu Airtable sẽ không bị xóa. Outfits cục bộ cũng sẽ bị xóa.','Effacer les données locales de cet appareil ? Les données Airtable ne seront pas supprimées. Les tenues locales seront également effacées.'],
    ['Mở bằng','Ouvrir avec'],
    ['Chia sẻ','Partager'],
    ['Thêm vào Màn hình chính','Ajouter à l’écran d’accueil'],
    ['Chạm','Touchez'],
    ['Mở menu trình duyệt và chọn','Ouvrez le menu du navigateur et choisissez'],
    ['📷 Chụp ảnh','📷 Prendre une photo'],
    ['▧ Chọn từ thư viện','▧ Choisir dans la galerie'],
    ['Chụp ảnh','Prendre une photo'],
    ['Chọn từ thư viện','Choisir dans la galerie'],
    ['Xem trước','Aperçu'],
    ['0 đã chọn','0 sélectionné'],
    ['Tìm món đồ','Rechercher un article'],
    ['Đặt lại','Réinitialiser'],
    ['♥ Yêu thích','♥ Favoris'],
    ['✓ Đã chọn','✓ Sélectionnés'],
    ['Lọc theo loại','Filtrer par catégorie'],
    ['Không tìm thấy món phù hợp.','Aucun article correspondant.'],
    ['Món đồ','Article'],
    ['Lưu thành outfit','Enregistrer comme tenue'],
    ['Thêm ít nhất một món nữa để lưu thành outfit.','Ajoute au moins un article supplémentaire pour enregistrer cette tenue.'],
    ['Thêm một áo + quần/váy, hoặc đầm/jumpsuit để tạo outfit hoàn chỉnh.','Ajoute un haut + un pantalon/une jupe, ou une robe/combinaison pour créer une tenue complète.'],
    ['OUTFIT ĐÃ LƯU','TENUE ENREGISTRÉE'],
    ['GỢI Ý HÔM NAY','SUGGESTION DU JOUR'],
    ['TỦ ĐỒ HIỆN TẠI','DRESSING ACTUEL'],
    ['Không lấy được thời tiết mới · đang dùng dữ liệu gần nhất.','Impossible d’actualiser la météo · dernières données disponibles utilisées.'],
    ['Không lấy được thời tiết lúc này.','Impossible de récupérer la météo pour le moment.'],
    ['Météo + tủ đồ thật + dịp của hôm nay','Météo + vrai dressing + occasion du jour'],
    ['Thời tiết + tủ đồ thật + dịp hôm nay','Météo + vrai dressing + occasion du jour'],
    ['Tủ còn thiếu quần/váy để hoàn thiện bộ này.','Il manque encore un pantalon ou une jupe pour compléter cette tenue.'],
    ['Tủ còn thiếu áo để hoàn thiện bộ này.','Il manque encore un haut pour compléter cette tenue.'],
    ['Đây là các món hiện có phù hợp nhất với thời tiết và dịp đã chọn.','Voici les articles disponibles les plus adaptés à la météo et à l’occasion choisie.'],
    ['Mở trong Phối đồ','Ouvrir dans Tenues'],
    ['Đang chuẩn bị ảnh…','Préparation de l’image…'],
    ['Chia sẻ dưới dạng ảnh · không công khai tủ đồ','Partager sous forme d’image · le dressing reste privé'],
    ['↗ Chia sẻ outfit','↗ Partager la tenue'],
    ['⇩ Lưu ảnh outfit','⇩ Enregistrer l’image de la tenue'],
    ['Không tạo được ảnh','Impossible de créer l’image'],
    ['Đã lưu ảnh ✓','Image enregistrée ✓'],
    ['Một outfit được lưu trong Trân Closet','Une tenue enregistrée dans Trân Closet'],
    ['Khóa Airtable không nằm trong PWA. Ứng dụng chỉ lưu khóa đồng bộ riêng của thiết bị và gửi thay đổi tới Worker bảo mật. Vêtements, nhãn và outfits đều đi qua luồng đồng bộ canonique.','La clé Airtable n’est jamais stockée dans la PWA. L’application conserve uniquement la clé de synchronisation propre à cet appareil et envoie les modifications au Worker sécurisé. Vêtements, tags et tenues suivent tous le flux de synchronisation canonique.'],
    ['Khóa Airtable không nằm trong PWA. Ứng dụng chỉ lưu khóa đồng bộ riêng của thiết bị và gửi thay đổi tới Worker bảo mật. Quần áo, nhãn và outfit đều đi qua luồng đồng bộ chuẩn.','La clé Airtable n’est jamais stockée dans la PWA. L’application conserve uniquement la clé de synchronisation propre à cet appareil et envoie les modifications au Worker sécurisé. Vêtements, tags et tenues suivent tous le flux de synchronisation canonique.']
  ]);

  for(const type of Object.keys(FR_LABELS)){
    for(const [key,french] of Object.entries(FR_LABELS[type])){
      const vietnamese=vietnameseLabels[type]?.[key];
      if(vietnamese)EXACT.set(vietnamese,french);
      if(LABELS[type])LABELS[type][key]=french;
    }
  }

  const PATTERNS=[
    [/^(\d+) đã chọn$/,(_,n)=>`${n} sélectionné${n==='1'?'':'s'}`],
    [/^(\d+)\/(\d+) món$/,(_,a,b)=>`${a}/${b} articles`],
    [/^(\d+) món · (.+)$/,(_,n,rest)=>`${n} article${n==='1'?'':'s'} · ${translateRaw(rest)}`],
    [/^Bỏ (.+)$/,(_,name)=>`Retirer ${name}`],
    [/^(\d+) thay đổi vẫn đang chờ$/,(_,n)=>`${n} modification${n==='1'?'':'s'} encore en attente`],
    [/^Xóa “(.+)” khỏi tủ đồ\?$/,(_,name)=>`Supprimer « ${name} » du dressing ?`],
    [/^\+(\d+) món$/,(_,n)=>`+${n} article${n==='1'?'':'s'}`]
  ];

  function translateRaw(value){
    const text=String(value??'').trim();
    if(EXACT.has(text))return EXACT.get(text);
    for(const [pattern,replacer] of PATTERNS){
      const match=text.match(pattern);
      if(match)return replacer(...match);
    }
    return text;
  }

  function translateText(node){
    if(node.nodeType!==Node.TEXT_NODE||node.parentElement?.closest('script,style,code,pre'))return;
    const original=node.nodeValue||'';
    const trimmed=original.trim();
    if(!trimmed)return;
    const translated=translateRaw(trimmed);
    if(translated===trimmed)return;
    const leading=original.match(/^\s*/)?.[0]||'';
    const trailing=original.match(/\s*$/)?.[0]||'';
    node.nodeValue=`${leading}${translated}${trailing}`;
  }

  function translateAttributes(element){
    if(!(element instanceof Element))return;
    for(const attr of ['placeholder','title','aria-label','alt']){
      const value=element.getAttribute(attr);
      if(!value)continue;
      const translated=translateRaw(value);
      if(translated!==value.trim())element.setAttribute(attr,translated);
    }
  }

  function translateTree(root=document.body){
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){translateText(root);return;}
    if(root instanceof Element)translateAttributes(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    let node=walker.currentNode;
    while(node){
      if(node.nodeType===Node.TEXT_NODE)translateText(node);
      else translateAttributes(node);
      node=walker.nextNode();
    }
  }

  translateTree(document.body);
  new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData')translateText(record.target);
      if(record.type==='attributes')translateAttributes(record.target);
      for(const node of record.addedNodes)translateTree(node);
    }
  }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']});
}
