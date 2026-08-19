const LANGUAGE_KEY='tran-closet-language';
const SUPPORTED=new Set(['vi','fr']);
const requested=new URL(location.href).searchParams.get('lang');
if(SUPPORTED.has(requested))localStorage.setItem(LANGUAGE_KEY,requested);
const language=SUPPORTED.has(localStorage.getItem(LANGUAGE_KEY))?localStorage.getItem(LANGUAGE_KEY):'vi';

const EXACT=new Map(Object.entries({
  'TỦ ĐỒ CỦA TRÂN':'DRESSING DE TRÂN',
  'Tủ đồ của tôi':'Mon dressing',
  'Tủ đồ':'Dressing',
  'Phối đồ':'Tenues',
  'Thêm':'Ajouter',
  'Yêu thích':'Favoris',
  'Hồ sơ':'Profil',
  'Điều hướng chính':'Navigation principale',
  'Cài ứng dụng':'Installer l’application',
  'Tất cả':'Tout',
  'Bộ sưu tập':'Collection',
  'Danh sách':'Liste',
  'Chưa có gì ở đây':'Rien ici pour le moment',
  'Thêm một món mới để bắt đầu.':'Ajoute un premier article pour commencer.',
  'Tìm tên, loại, màu, phong cách, nhãn…':'Rechercher par nom, catégorie, couleur, style, tag…',
  'NHỮNG MÓN TRÂN THÍCH':'LES FAVORIS DE TRÂN',
  'Chọn nhanh, lọc theo loại và luôn mang tủ đồ theo bên mình.':'Recherche et filtre rapidement tout le dressing, même en déplacement.',
  'Những món đánh dấu để tìm lại thật nhanh.':'Les articles marqués comme favoris, faciles à retrouver.',
  'Thêm món mới':'Ajouter un article',
  'Thêm ảnh':'Ajouter une photo',
  'Chụp hoặc chọn từ thư viện':'Prendre une photo ou choisir dans la galerie',
  'Tên món đồ':'Nom de l’article',
  'Ví dụ: Túi Melody':'Ex. : Sac Melody',
  'Loại':'Catégorie',
  'Màu sắc':'Couleurs',
  'Phong cách':'Style',
  'Nhãn thông minh':'Tags intelligents',
  'AI có thể gợi ý':'L’IA peut suggérer',
  'Lưu vào tủ đồ':'Enregistrer dans le dressing',
  'Chờ tạo':'Création en attente',
  'Chờ cập nhật':'Mise à jour en attente',
  'Chờ ảnh':'Photo en attente',
  'Đã gửi':'Envoyé',
  'PHỐI ĐỒ CỦA TRÂN':'TENUES DE TRÂN',
  'Tạo outfit đầu tiên':'Créer la première tenue',
  'Ghép các món trong tủ thành những bộ đồ riêng cho từng dịp.':'Assemble les articles du dressing en tenues adaptées à chaque occasion.',
  '＋ Tạo outfit mới':'＋ Créer une tenue',
  'Bộ sưu tập outfit':'Collection de tenues',
  'Chưa có outfit nào':'Aucune tenue enregistrée',
  'Chọn ít nhất 2 món để tạo một bộ đồ.':'Choisis au moins 2 articles pour créer une tenue.',
  'Tên outfit':'Nom de la tenue',
  'Ví dụ: Đi ăn tối':'Ex. : Dîner en ville',
  'Dịp':'Occasion',
  'Mùa':'Saison',
  'Ghi chú':'Note',
  'Một chi tiết để nhớ outfit này…':'Un détail à retenir pour cette tenue…',
  'Chọn món đồ':'Choisir les articles',
  'ít nhất 2':'au moins 2',
  'OUTFIT MỚI':'NOUVELLE TENUE',
  'Tạo một bộ đồ':'Créer une tenue',
  'Lưu outfit':'Enregistrer la tenue',
  'CHỈNH SỬA OUTFIT':'MODIFIER LA TENUE',
  'Lưu thay đổi':'Enregistrer les modifications',
  'Sửa':'Modifier',
  'Xóa':'Supprimer',
  'Đã cập nhật outfit ✓':'Tenue mise à jour ✓',
  'Đã lưu outfit ✦':'Tenue enregistrée ✦',
  'Đã xóa outfit':'Tenue supprimée',
  'Đã bỏ yêu thích':'Retiré des favoris',
  'Đã thêm vào yêu thích ♥':'Ajouté aux favoris ♥',
  'Hằng ngày':'Quotidien',
  'Đi làm':'Travail',
  'Hẹn hò':'Rendez-vous',
  'Tiệc':'Soirée',
  'Du lịch':'Voyage',
  'Thể thao':'Sport',
  'Trang trọng':'Formel',
  'Khác':'Autre',
  'Mọi mùa':'Toutes saisons',
  'Nắng nóng':'Chaud',
  'Mùa mưa':'Saison des pluies',
  'Mát mẻ':'Frais',
  'Trân':'Trân',
  'AIRTABLE':'AIRTABLE',
  'Đồng bộ đã cấu hình':'Synchronisation configurée',
  'Kết nối đồng bộ':'Configurer la synchronisation',
  'Không có thay đổi đang chờ.':'Aucune modification en attente.',
  'Địa chỉ Worker':'Adresse du Worker',
  'Khóa đồng bộ':'Clé de synchronisation',
  'Khóa riêng của Trân':'Clé privée de Trân',
  'Kiểm tra':'Tester',
  'Lưu kết nối':'Enregistrer la connexion',
  'Đồng bộ ngay':'Synchroniser maintenant',
  'Cài trên iPhone':'Installer sur iPhone',
  'Ứng dụng đã được cài':'Application déjà installée',
  'Thêm vào màn hình chính':'Ajouter à l’écran d’accueil',
  'Sao lưu dữ liệu':'Sauvegarder les données',
  'Xuất JSON cục bộ · gồm outfits':'Exporter un JSON local · tenues incluses',
  'Khôi phục dữ liệu':'Restaurer les données',
  'Nhập file JSON':'Importer un fichier JSON',
  'Tải lại dữ liệu cục bộ':'Réinitialiser les données locales',
  'Xóa bản cục bộ rồi nạp lại dữ liệu chuẩn':'Effacer la copie locale puis recharger les données canoniques',
  'Đã lưu kết nối đồng bộ':'Connexion de synchronisation enregistrée',
  'Kết nối Worker thành công ✓':'Connexion au Worker réussie ✓',
  'Khóa đồng bộ không đúng':'Clé de synchronisation incorrecte',
  'Không kết nối được Worker':'Impossible de joindre le Worker',
  'Đã thêm vào tủ đồ ✦':'Article ajouté au dressing ✦',
  'TRỢ LÝ ẢNH':'ASSISTANT PHOTO',
  'Để AI gợi ý phân loại + nhãn':'Laisser l’IA proposer catégorie + tags',
  'AI đối chiếu nhiều lượt và chỉ đề xuất. Không có loại, màu, phong cách hay nhãn nào được thay đổi cho đến khi Trân chọn áp dụng.':'L’IA analyse plusieurs fois et ne fait que proposer. Rien n’est modifié tant que Trân n’a pas choisi d’appliquer la suggestion.',
  '✦ Phân tích bằng AI':'✦ Analyser avec l’IA',
  'Ảnh chỉ được gửi đến Worker bảo mật khi Trân chủ động bấm nút phân tích.':'La photo n’est envoyée au Worker sécurisé que lorsque Trân lance volontairement l’analyse.',
  'Đang đối chiếu ảnh…':'Analyse de la photo…',
  'AI đang nhìn ảnh nhiều lượt để gợi ý phân loại và nhãn. Nếu kết quả còn yếu, hệ thống sẽ tự thử lại.':'L’IA examine la photo plusieurs fois pour proposer catégorie et tags. Si le résultat est trop faible, elle réessaie automatiquement.',
  'GỢI Ý AI':'SUGGESTION IA',
  'Chưa nhận diện chắc chắn':'Reconnaissance incertaine',
  'Hãy thử ảnh rõ hơn, chỉ có một món đồ chính trong khung hình.':'Essaie une photo plus nette avec un seul article principal dans le cadre.',
  'Tin cậy cao':'Fiabilité élevée',
  'AI khá chắc chắn, nhưng Trân vẫn là người quyết định.':'L’IA est assez sûre, mais Trân garde la décision finale.',
  'Cần kiểm tra':'À vérifier',
  'AI có tín hiệu tốt nhưng nên kiểm tra loại, màu và nhãn trước khi áp dụng.':'Le signal est bon, mais vérifie la catégorie, les couleurs et les tags avant d’appliquer.',
  'Tin cậy thấp':'Fiabilité faible',
  'Kết quả còn yếu. Nên kiểm tra kỹ hoặc thử ảnh rõ hơn.':'Résultat encore faible. Vérifie attentivement ou essaie une photo plus nette.',
  'Nhãn thông minh':'Tags intelligents',
  'Áp dụng gợi ý':'Appliquer la suggestion',
  'Trân vẫn có thể sửa loại, màu, phong cách và mọi nhãn trước khi lưu.':'Trân peut encore modifier catégorie, couleurs, style et tags avant d’enregistrer.',
  '✓ Đã áp dụng cả phân loại và nhãn. Hãy kiểm tra lại trước khi lưu vào tủ đồ.':'✓ Catégorie et tags appliqués. Vérifie avant d’enregistrer dans le dressing.',
  'Không thể phân tích':'Analyse impossible',
  'Cần cấu hình kết nối trong Hồ sơ trước khi dùng trợ lý AI.':'Configure d’abord la connexion dans Profil pour utiliser l’assistant IA.',
  'AI đang bận hoặc đã đạt giới hạn hôm nay. Hãy thử lại sau.':'L’IA est occupée ou la limite du jour est atteinte. Réessaie plus tard.',
  'Không phân tích được ảnh lúc này. Ảnh và biểu mẫu của bạn vẫn nguyên vẹn.':'Impossible d’analyser la photo pour le moment. La photo et le formulaire restent intacts.',
  'KIỂM TRA TRÙNG':'VÉRIFICATION DES DOUBLONS',
  'Có vẻ món này đã có trong tủ':'Cet article semble déjà présent',
  'Ứng dụng chỉ cảnh báo dựa trên ảnh và thông tin hiện tại. Hãy kiểm tra các món gần giống trước khi lưu thêm một bản nữa.':'L’application avertit seulement à partir de la photo et des informations actuelles. Vérifie les articles similaires avant d’enregistrer un doublon.',
  'Quay lại kiểm tra':'Revenir vérifier',
  'Vẫn lưu món này':'Enregistrer quand même',
  'Không có món nào bị xóa hoặc gộp tự động. Quyết định cuối cùng luôn là của Trân.':'Aucun article n’est supprimé ni fusionné automatiquement. La décision finale reste celle de Trân.',
  'Rất giống':'Très similaire',
  'Có thể trùng':'Doublon possible',
  'Ảnh gần như trùng':'Photo presque identique',
  'Ảnh rất giống':'Photo très similaire',
  'Ảnh khá giống':'Photo assez similaire',
  'Cùng loại':'Même catégorie',
  'Màu tương tự':'Couleurs similaires',
  'Phong cách tương tự':'Style similaire',
  'Tên rất gần':'Nom très proche',
  'Đang kiểm tra trùng…':'Recherche de doublons…',
  'TRỢ LÝ CỦA TRÂN':'ASSISTANT DE TRÂN',
  'Hôm nay mặc gì?':'Qu’est-ce que je mets aujourd’hui ?',
  'Gợi ý từ tủ đồ thật · Trân luôn là người quyết định.':'Suggestions basées sur le vrai dressing · Trân garde toujours la décision.',
  'Vị trí':'Localisation',
  'Đổi':'Changer',
  'Vị trí hiện tại':'Position actuelle',
  '⌖ Vị trí hiện tại':'⌖ Position actuelle',
  'Tìm thành phố…':'Rechercher une ville…',
  'Tìm':'Rechercher',
  'GỢI Ý':'SUGGESTIONS',
  'Chưa đủ dữ liệu':'Données insuffisantes',
  '↻ Làm mới':'↻ Actualiser',
  'Chưa tạo được gợi ý':'Impossible de créer une suggestion',
  'Hãy thêm vài món cơ bản hoặc outfit đã lưu.':'Ajoute quelques vêtements de base ou une tenue enregistrée.',
  'Vị trí chỉ được dùng để lấy thời tiết. Không có outfit nào được lưu nếu Trân chưa bấm “Lưu thành outfit”.':'La localisation sert uniquement à récupérer la météo. Aucune tenue n’est enregistrée sans action explicite de Trân.',
  'Đang nhìn tủ đồ và thời tiết…':'Analyse du dressing et de la météo…',
  'Trợ lý đang xếp các món phù hợp nhất cho hôm nay.':'L’assistant classe les articles les plus adaptés pour aujourd’hui.',
  'Không có dữ liệu thời tiết':'Aucune donnée météo',
  'Trợ lý vẫn có thể gợi ý theo dịp và tủ đồ hiện tại.':'L’assistant peut quand même suggérer selon l’occasion et le dressing actuel.',
  'Trời quang':'Ciel dégagé',
  'Ít mây':'Peu nuageux',
  'Nhiều mây':'Nuageux',
  'Có sương':'Brouillard',
  'Mưa phùn':'Bruine',
  'Có mưa':'Pluie',
  'Dông':'Orage',
  'Thời tiết hiện tại':'Météo actuelle',
  'OUTFIT ĐÃ LƯU':'TENUE ENREGISTRÉE',
  'GỢI Ý HÔM NAY':'SUGGESTION DU JOUR',
  'TỦ ĐỒ HIỆN TẠI':'DRESSING ACTUEL',
  'Voir dans Phối đồ':'Voir dans Tenues',
  'Lưu thành outfit':'Enregistrer comme tenue',
  'Thêm một áo + quần/váy, hoặc đầm/jumpsuit để tạo outfit hoàn chỉnh.':'Ajoute un haut + pantalon/jupe, ou une robe/combinaison, pour créer une tenue complète.',
  'Không lấy được thời tiết mới · đang dùng dữ liệu gần nhất.':'Impossible d’actualiser la météo · utilisation des dernières données disponibles.',
  'Không lấy được thời tiết lúc này.':'Impossible de récupérer la météo pour le moment.',
  'Không lấy được vị trí hiện tại. Bạn có thể tìm thành phố thủ công.':'Impossible d’obtenir la position actuelle. Tu peux rechercher une ville manuellement.',
  'Đang tìm…':'Recherche…',
  'Không tìm thấy.':'Aucun résultat.',
  'Không tìm được thành phố lúc này.':'Impossible de rechercher une ville pour le moment.',
  'Đã có trong Phối đồ ✓':'Déjà présent dans Tenues ✓',
  'Đã lưu outfit ✓':'Tenue enregistrée ✓',
  'Outfit đã lưu trong Phối đồ.':'Tenue déjà enregistrée dans Tenues.',
  'Trời có khả năng mưa — nhớ mang ô/dù nếu ra ngoài.':'Risque de pluie — pense à prendre un parapluie si tu sors.',
  'Ưu tiên món nhẹ cho thời tiết nóng.':'Privilégie les pièces légères par temps chaud.',
  'Có lớp ấm hơn cho thời tiết mát.':'Ajoute une couche plus chaude par temps frais.',
  'Món hợp hôm nay':'Articles adaptés aujourd’hui',
  'Tủ chưa có đủ áo + quần/váy hoặc một món liền thân để dựng outfit hoàn chỉnh.':'Le dressing n’a pas encore assez de hauts + bas, ni de pièce une-pièce, pour construire une tenue complète.',
  'Đây là các món phụ kiện phù hợp nhất với thời tiết và dịp đã chọn.':'Voici les accessoires les plus adaptés à la météo et à l’occasion choisie.',
  'Áo':'Haut',
  'Quần':'Pantalon',
  'Váy':'Jupe',
  'Đầm':'Robe',
  'Bộ đồ':'Ensemble',
  'Áo khoác':'Veste / manteau',
  'Túi':'Sac',
  'Giày':'Chaussures',
  'Phụ kiện':'Accessoire',
  'Thắt lưng':'Ceinture',
  'Đồ bơi':'Maillot de bain',
  'Kính áp tròng':'Lentilles',
  'Vớ':'Chaussettes',
  'Jumpsuit':'Combinaison',
  'Đồ lót':'Sous-vêtement',
  'Mũ / nón':'Casquette / chapeau',
  'Ô / dù':'Parapluie',
  'Xanh dương':'Bleu',
  'Hồng':'Rose',
  'Vàng':'Jaune',
  'Đen':'Noir',
  'Nâu':'Marron',
  'Xanh lá':'Vert',
  'Tím':'Violet',
  'Trắng':'Blanc',
  'Xám':'Gris',
  'Cam':'Orange',
  'Đỏ':'Rouge',
  'Thường ngày':'Décontracté',
  'Thanh lịch':'Élégant',
  'Hoạt hình':'Cartoon',
  'Cổ điển':'Vintage',
  'Tối giản':'Minimaliste',
  'Nổi bật':'Statement',
  'Đồ họa':'Graphique',
  'Nhân vật':'Personnage',
  'Họa tiết':'À motifs',
  'Logo':'Logo',
  'Chữ':'Texte',
  'Trung tính':'Neutre',
  'Nhiều màu':'Coloré',
  'Oversize':'Oversize',
  'Cropped':'Court / cropped',
  'Ôm dáng':'Ajusté',
  'Thoải mái':'Relaxed',
  'Phối lớp':'Superposition',
  'Nhẹ':'Léger',
  'Ấm':'Chaud',
  'Đi mưa':'Pluie',
  'Mùa hè':'Été',
  'Mùa đông':'Hiver',
  'Gọn':'Compact',
  'Êm ái':'Confortable',
  'Chẩn đoán đồng bộ':'Diagnostic de synchronisation',
  'Chạy chẩn đoán + đồng bộ':'Lancer diagnostic + synchronisation',
  'Đang chẩn đoán…':'Diagnostic en cours…',
  'Sẵn sàng.':'Prêt.',
  'Không hiển thị khóa bí mật. Nút bên dưới chạy cả đồng bộ quần áo và outfit, rồi hiển thị lỗi thật.':'Aucune clé secrète n’est affichée. Le bouton lance la synchronisation des vêtements et des tenues, puis affiche les erreurs réelles.'
}));

const PATTERNS=[
  [/^(\d+) món trong tủ$/,(_,n)=>`${n} article${n==='1'?'':'s'} dans le dressing`],
  [/^(\d+) món yêu thích$/,(_,n)=>`${n} favori${n==='1'?'':'s'}`],
  [/^(\d+) thay đổi đang chờ đồng bộ\. Tủ đồ vẫn dùng được ngoại tuyến\.$/,(_,n)=>`${n} modification${n==='1'?'':'s'} en attente de synchronisation. Le dressing reste utilisable hors ligne.`],
  [/^(\d+) outfit đã lưu$/,(_,n)=>`${n} tenue${n==='1'?'':'s'} enregistrée${n==='1'?'':'s'}`],
  [/^(\d+) outfit yêu thích · (.+)$/,(_,n,rest)=>`${n} tenue${n==='1'?'':'s'} favorite${n==='1'?'':'s'} · ${translateRaw(rest)}`],
  [/^(\d+) món$/,(_,n)=>`${n} article${n==='1'?'':'s'}`],
  [/^Tủ đồ cá nhân • (\d+) món • (\d+) outfit$/,(_,a,o)=>`Dressing personnel • ${a} article${a==='1'?'':'s'} • ${o} tenue${o==='1'?'':'s'}`],
  [/^(\d+) thay đổi đang chờ gửi\.$/,(_,n)=>`${n} modification${n==='1'?'':'s'} en attente d’envoi.`],
  [/^Đồng bộ ngay \((\d+)\)$/,(_,n)=>`Synchroniser maintenant (${n})`],
  [/^(\d+) lựa chọn$/,(_,n)=>`${n} proposition${n==='1'?'':'s'}`],
  [/^Cảm giác (-?\d+)°$/,(_,n)=>`Ressenti ${n}°`],
  [/^Có chuẩn bị cho mưa(?: · (\d+)%| (\d+)%)?\.$/,(_,a,b)=>`Prévu pour la pluie${a||b?` · ${a||b}%`:''}.`],
  [/^Phong cách hợp dịp (.+)\.$/,(_,occasion)=>`Style adapté à l’occasion « ${translateRaw(occasion)} ».`],
  [/^Cân bằng theo dịp (.+) và các món hiện có\.$/,(_,occasion)=>`Équilibre basé sur l’occasion « ${translateRaw(occasion)} » et les articles disponibles.`],
  [/^Gợi ý (\d+)$/,(_,n)=>`Suggestion ${n}`],
  [/^Gợi ý (\d{2}\/\d{2}) · (.+)$/,(_,date,occasion)=>`Suggestion ${date} · ${translateRaw(occasion)}`],
  [/^Trợ lý hôm nay · (.+)$/,(_,summary)=>`Assistant du jour · ${translateWeatherSummary(summary)}`],
  [/^AI đã tự thử lại (\d+) lần · (\d+) lượt nhìn tổng cộng$/,(_,a,b)=>`L’IA a réessayé ${a} fois · ${b} analyses visuelles au total`],
  [/^AI đã tự kiểm tra lại ảnh · (\d+) lượt$/,(_,n)=>`L’IA a revérifié la photo · ${n} passes`],
  [/^AI đã đối chiếu ảnh · (\d+) lượt nhìn$/,(_,n)=>`L’IA a comparé la photo · ${n} passes`],
  [/^Đang tự thử lại (\d+)\/(\d+)…$/,(_,a,b)=>`Nouvel essai automatique ${a}/${b}…`],
  [/^Kết quả trước chưa đủ chắc\. AI đang tự phân tích lại lần (\d+) để chọn phương án tốt hơn…$/,(_,n)=>`Le résultat précédent n’était pas assez fiable. L’IA relance l’analyse n°${n} pour choisir une meilleure proposition…`],
  [/^Xóa outfit “(.+)”\?$/,(_,name)=>`Supprimer la tenue « ${name} » ?`],
  [/^Xóa “(.+)”\?$/,(_,name)=>`Supprimer « ${name} » ?`]
];

function translateWeatherSummary(value){
  return String(value).split(' · ').map(part=>{
    if(part==='rất nóng')return 'très chaud';
    if(part==='nóng')return 'chaud';
    if(part==='mát')return 'frais';
    if(part==='dễ chịu')return 'agréable';
    if(part==='có gió')return 'venteux';
    const rain=part.match(/^có mưa(?: (\d+)%)?$/);
    if(rain)return `pluie${rain[1]?` ${rain[1]}%`:''}`;
    return part;
  }).join(' · ');
}

function translateRaw(value){
  const text=String(value??'');
  if(EXACT.has(text))return EXACT.get(text);
  for(const [pattern,replacer] of PATTERNS){
    const match=text.match(pattern);
    if(match)return typeof replacer==='function'?replacer(...match):text.replace(pattern,replacer);
  }
  if(/^(rất nóng|nóng|mát|dễ chịu)( · |$)/.test(text)||text.includes('có mưa')||text.includes('có gió'))return translateWeatherSummary(text);
  return text;
}

function translateTextNode(node){
  if(language!=='fr'||node.nodeType!==Node.TEXT_NODE)return;
  if(node.parentElement?.closest('script,style,code,pre'))return;
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
  if(language!=='fr'||!(element instanceof Element))return;
  for(const attr of ['placeholder','title','aria-label']){
    const value=element.getAttribute(attr);
    if(!value)continue;
    const translated=translateRaw(value);
    if(translated!==value)element.setAttribute(attr,translated);
  }
}

function normalizeAiFreeCopy(root){
  if(language!=='fr'||!(root instanceof Element))return;
  const nodes=[];
  if(root.matches?.('.ai-tag-reason,.ai-result > p'))nodes.push(root);
  nodes.push(...root.querySelectorAll?.('.ai-tag-reason,.ai-result > p')||[]);
  for(const node of nodes){
    const text=node.textContent.trim();
    if(!text||EXACT.has(text)||PATTERNS.some(([pattern])=>pattern.test(text)))continue;
    if(node.closest('.ai-result-warning'))node.textContent='Reconnaissance insuffisamment fiable. Vérifie la photo et les champs avant de continuer.';
    else if(node.matches('.ai-tag-reason'))node.textContent='Tags proposés à partir des éléments visuels détectés.';
    else node.textContent='Analyse visuelle structurée : vérifie la catégorie, les couleurs, le style et les tags avant d’appliquer.';
  }
}

function translateTree(root=document.body){
  if(language!=='fr'||!root)return;
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return;}
  if(root instanceof Element)translateAttributes(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let node=walker.currentNode;
  while(node){
    if(node.nodeType===Node.TEXT_NODE)translateTextNode(node);
    else translateAttributes(node);
    node=walker.nextNode();
  }
  if(root instanceof Element)normalizeAiFreeCopy(root);
}

function setLanguage(next){
  if(!SUPPORTED.has(next))return;
  localStorage.setItem(LANGUAGE_KEY,next);
  const url=new URL(location.href);
  url.searchParams.set('lang',next);
  location.href=url.toString();
}

function mountSwitcher(){
  const topbar=document.querySelector('.topbar');
  const install=document.querySelector('#installButton');
  if(!topbar||document.querySelector('#languageSwitch'))return;
  const wrap=document.createElement('div');
  wrap.id='languageSwitch';
  wrap.className='language-switch';
  wrap.setAttribute('aria-label',language==='fr'?'Langue de l’interface':'Ngôn ngữ giao diện');
  wrap.innerHTML=`<button type="button" data-lang="fr" class="${language==='fr'?'active':''}">FR</button><button type="button" data-lang="vi" class="${language==='vi'?'active':''}">VI</button>`;
  wrap.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
  if(install)topbar.insertBefore(wrap,install);else topbar.appendChild(wrap);
}

const nativeConfirm=window.confirm.bind(window);
const nativeAlert=window.alert.bind(window);
if(language==='fr'){
  window.confirm=message=>nativeConfirm(translateRaw(message));
  window.alert=message=>nativeAlert(translateRaw(message));
  document.documentElement.lang='fr';
  document.title='Dressing de Trân';
}

window.TranClosetI18n={language,setLanguage,t:translateRaw,isFrench:language==='fr',apply:scope=>{mountSwitcher();if(language==='fr')translateTree(scope);}};

mountSwitcher();
translateTree(document.body);

