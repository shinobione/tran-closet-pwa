if(document.documentElement.lang==='fr'){
  const MAP=new Map([
    ['Hồ sơ','Profil'],
    ['Tủ đồ cá nhân','Dressing personnel'],
    ['Đồng bộ đã cấu hình','Synchronisation configurée'],
    ['Kết nối đồng bộ','Connexion de synchronisation'],
    ['Không có thay đổi đang chờ.','Aucune modification en attente.'],
    ['Địa chỉ Worker','Adresse du Worker'],
    ['Khóa đồng bộ','Clé de synchronisation'],
    ['Khóa riêng của Trân','Clé privée de Trân'],
    ['Kiểm tra','Tester'],
    ['Lưu kết nối','Enregistrer la connexion'],
    ['Đồng bộ ngay','Synchroniser maintenant'],
    ['Đang đồng bộ…','Synchronisation…'],
    ['Cài trên iPhone','Installer sur iPhone'],
    ['Ứng dụng đã được cài','Application déjà installée'],
    ['Thêm vào màn hình chính','Ajouter à l’écran d’accueil'],
    ['Sao lưu dữ liệu','Sauvegarder les données'],
    ['Xuất JSON cục bộ · gồm outfits','Exporter un JSON local · tenues incluses'],
    ['Khôi phục dữ liệu','Restaurer les données'],
    ['Nhập file JSON','Importer un fichier JSON'],
    ['Tải lại dữ liệu cục bộ','Réinitialiser les données locales'],
    ['Xóa bản cục bộ rồi nạp lại dữ liệu chuẩn','Effacer la copie locale puis recharger les données canoniques'],
    ['Chẩn đoán đồng bộ','Diagnostic de synchronisation'],
    ['Chạy chẩn đoán + đồng bộ','Lancer diagnostic + synchronisation'],
    ['Đang chẩn đoán…','Diagnostic en cours…'],
    ['Sẵn sàng.','Prêt.'],
    ['Không hiển thị khóa bí mật. Nút bên dưới chạy cả đồng bộ quần áo và outfit, rồi hiển thị lỗi thật.','Aucune clé secrète n’est affichée. Le bouton lance la synchronisation des vêtements et des tenues puis affiche les erreurs réelles.'],
    ['Đã lưu kết nối đồng bộ','Connexion de synchronisation enregistrée'],
    ['Kết nối Worker thành công ✓','Connexion au Worker réussie ✓'],
    ['Khóa đồng bộ không đúng','Clé de synchronisation incorrecte'],
    ['Không kết nối được Worker','Impossible de joindre le Worker'],
    ['Đã cài Trân Closet ✓','Trân Closet est installée ✓']
  ]);

  const patterns=[
    [/^Tủ đồ cá nhân • (\d+) món • (\d+) outfit$/,(_,items,outfits)=>`Dressing personnel • ${items} article${items==='1'?'':'s'} • ${outfits} tenue${outfits==='1'?'':'s'}`],
    [/^(\d+) thay đổi đang chờ gửi\.$/,(_,n)=>`${n} modification${n==='1'?'':'s'} en attente d’envoi.`],
    [/^Đồng bộ ngay \((\d+)\)$/,(_,n)=>`Synchroniser maintenant (${n})`],
    [/^Chẩn đoán đồng bộ · (.+)$/,(_,v)=>`Diagnostic de synchronisation · ${v}`]
  ];

  function translate(value){
    const text=String(value??'').trim();
    if(MAP.has(text))return MAP.get(text);
    for(const [pattern,replacer] of patterns){
      const match=text.match(pattern);
      if(match)return replacer(...match);
    }
    return text;
  }

  function walk(root){
    if(!root)return;
    const nodes=[];
    if(root.nodeType===Node.TEXT_NODE)nodes.push(root);
    else nodes.push(...document.createTreeWalker(root,NodeFilter.SHOW_TEXT));
  }

  function translateTree(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node=walker.nextNode();
    while(node){
      if(!node.parentElement?.closest('script,style,code,pre')){
        const raw=node.nodeValue||'';
        const trimmed=raw.trim();
        if(trimmed){
          const next=translate(trimmed);
          if(next!==trimmed)node.nodeValue=`${raw.match(/^\s*/)?.[0]||''}${next}${raw.match(/\s*$/)?.[0]||''}`;
        }
      }
      node=walker.nextNode();
    }
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el=>{
      for(const attr of ['placeholder','title','aria-label']){
        const value=el.getAttribute(attr);
        if(!value)continue;
        const next=translate(value);
        if(next!==value.trim())el.setAttribute(attr,next);
      }
    });
  }

  translateTree(document.body);
  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===Node.TEXT_NODE){
          const raw=node.nodeValue||'',trimmed=raw.trim(),next=translate(trimmed);
          if(trimmed&&next!==trimmed)node.nodeValue=`${raw.match(/^\s*/)?.[0]||''}${next}${raw.match(/\s*$/)?.[0]||''}`;
        }else if(node instanceof Element)translateTree(node);
      }
    }
  }).observe(document.body,{childList:true,subtree:true});
}
