export const LANGUAGE_KEY='tran-closet-language';
export const SUPPORTED_LANGUAGES=new Set(['vi','fr']);

const MESSAGES={
  vi:{
    'search.empty.title':'Không có kết quả',
    'search.empty.body':'Hãy thử tên, loại, màu, phong cách hoặc nhãn khác.',
    'photo.take':'Chụp ảnh',
    'photo.gallery':'Chọn từ thư viện',
    'photo.add':'Thêm ảnh',
    'photo.intro':'Chụp ảnh hoặc chọn từ thư viện',
    'photo.preview':'Xem trước',
    'sync.running':'Đang đồng bộ…',
    'sync.done':'Đồng bộ hoàn tất ✓',
    'sync.offline':'Ngoại tuyến · thay đổi vẫn đang chờ',
    'sync.config':'Hãy cấu hình kết nối đồng bộ',
    'sync.auth':'Khóa đồng bộ không đúng',
    'sync.pending':({count})=>`${count} thay đổi vẫn đang chờ`,
    'sync.error':'Lỗi đồng bộ · hãy thử lại',
    'outfit.incomplete.title':'Outfit chưa hoàn chỉnh',
    'outfit.incomplete.card':'Outfit chưa hoàn chỉnh',
    'outfit.incomplete.count':({count,minimum})=>`${count}/${minimum} món còn sẵn`,
    'outfit.incomplete.detail':({count,minimum})=>`Outfit này chỉ còn ${count} món khả dụng. Hãy chỉnh sửa để thêm ít nhất ${Math.max(0,minimum-count)} món nữa, hoặc xóa outfit nếu không còn cần.`,
    'outfit.incomplete.share':'Hãy sửa outfit trước khi chia sẻ.',
    'build.eyebrow':'PHIÊN BẢN TRIỂN KHAI',
    'build.liveTitle':'Build stamp GitHub Pages',
    'build.fallbackTitle':'Fallback local',
    'build.exact':'Khớp chính xác với commit đang được GitHub Pages phục vụ.',
    'build.fallback':'Không đọc được build stamp · đang dùng giá trị dự phòng cục bộ.',
    'build.deployed':'Triển khai',
    'build.copy':'Sao chép thông tin phiên bản',
    'diagnostics.title':'Chẩn đoán đồng bộ',
    'diagnostics.intro':'Không hiển thị khóa bí mật. Nút bên dưới chạy cả đồng bộ quần áo và outfit, rồi hiển thị lỗi thật.',
    'diagnostics.run':'Chạy chẩn đoán + đồng bộ',
    'diagnostics.running':'Đang chẩn đoán…',
    'diagnostics.ready':'Sẵn sàng.'
  },
  fr:{
    'search.empty.title':'Aucun résultat',
    'search.empty.body':'Essaie un nom, une catégorie, une couleur, un style ou un tag.',
    'photo.take':'Prendre une photo',
    'photo.gallery':'Choisir dans la galerie',
    'photo.add':'Ajouter une photo',
    'photo.intro':'Prendre une photo ou choisir dans la galerie',
    'photo.preview':'Aperçu',
    'sync.running':'Synchronisation…',
    'sync.done':'Synchronisation terminée ✓',
    'sync.offline':'Hors ligne · les modifications restent en attente',
    'sync.config':'Configure la connexion de synchronisation',
    'sync.auth':'Clé de synchronisation incorrecte',
    'sync.pending':({count})=>`${count} modification${Number(count)===1?'':'s'} encore en attente`,
    'sync.error':'Erreur de synchronisation · réessaie',
    'outfit.incomplete.title':'Tenue incomplète',
    'outfit.incomplete.card':'Tenue incomplète',
    'outfit.incomplete.count':({count,minimum})=>`${count}/${minimum} articles disponibles`,
    'outfit.incomplete.detail':({count,minimum})=>{const missing=Math.max(0,minimum-count);return `Cette tenue ne contient plus que ${count} article${Number(count)===1?'':'s'} disponible${Number(count)===1?'':'s'}. Modifie-la pour ajouter au moins ${missing} article${missing===1?'':'s'}, ou supprime-la si elle n’est plus utile.`;},
    'outfit.incomplete.share':'Répare la tenue avant de la partager.',
    'build.eyebrow':'VERSION DÉPLOYÉE',
    'build.liveTitle':'Build stamp GitHub Pages',
    'build.fallbackTitle':'Fallback local',
    'build.exact':'Correspond exactement au commit servi par GitHub Pages.',
    'build.fallback':'Build stamp indisponible · valeur locale de secours.',
    'build.deployed':'Déployé',
    'build.copy':'Copier les infos de version',
    'diagnostics.title':'Diagnostic de synchronisation',
    'diagnostics.intro':'Aucune clé secrète n’est affichée. Le bouton lance la synchronisation des vêtements et des tenues puis affiche les erreurs réelles.',
    'diagnostics.run':'Lancer diagnostic + synchronisation',
    'diagnostics.running':'Diagnostic en cours…',
    'diagnostics.ready':'Prêt.'
  }
};

export function normalizeLanguage(value){return SUPPORTED_LANGUAGES.has(value)?value:'vi';}

export function currentLanguage(){
  if(typeof document!=='undefined'&&SUPPORTED_LANGUAGES.has(document.documentElement?.lang))return document.documentElement.lang;
  if(typeof localStorage!=='undefined')return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
  return 'vi';
}

function interpolate(template,params){
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g,(_,key)=>params[key]??'');
}

export function t(key,params={},language=currentLanguage()){
  const lang=normalizeLanguage(language);
  const candidate=MESSAGES[lang]?.[key]??MESSAGES.vi[key];
  if(candidate==null){
    if(typeof console!=='undefined')console.warn(`Missing i18n key: ${key}`);
    return key;
  }
  return typeof candidate==='function'?candidate(params):interpolate(candidate,params);
}

export function hasTranslation(key,language){return MESSAGES[normalizeLanguage(language)]?.[key]!=null;}
export function translationKeys(){return Object.keys(MESSAGES.vi);}
