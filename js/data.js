export const TAXONOMY = {
  categories: ['Shirt','Pant','Skirt','Dress','Combo','Coat','Bag','Shoes','Accessorie','Belt','Swimware','Eye Lens','Socks','Jumpsuit','Underwear','Headwear','Umbrella'],
  colors: ['Blue','Navy','Light Blue','Turquoise','Teal','Pink','Yellow','Black','Brown','Camel','Beige','Cream','Green','Olive','Khaki','Mint','Purple','White','Grey','Orange','Red','Burgundy','Gold','Silver'],
  styles: ['Hip-Hop','Sport','Casual','Classy','Cartoon','Old'],
  tags: ['Minimal','Statement','Graphic','Character','Patterned','Logo','Text','Neutral','Colorful','Oversized','Cropped','Fitted','Relaxed','Layering','Lightweight','Warm','Rain-ready','Summer','Winter','Travel-friendly','Compact','Cozy']
};

export const LABELS = {
  category: {Shirt:'Áo',Pant:'Quần',Skirt:'Váy',Dress:'Đầm',Combo:'Bộ đồ',Coat:'Áo khoác',Bag:'Túi',Shoes:'Giày',Accessorie:'Phụ kiện',Belt:'Thắt lưng',Swimware:'Đồ bơi','Eye Lens':'Kính áp tròng',Socks:'Vớ',Jumpsuit:'Jumpsuit',Underwear:'Đồ lót',Headwear:'Mũ / nón',Umbrella:'Ô / dù'},
  color: {Blue:'Xanh dương',Navy:'Xanh navy','Light Blue':'Xanh dương nhạt',Turquoise:'Xanh ngọc lam',Teal:'Xanh cổ vịt',Pink:'Hồng',Yellow:'Vàng',Black:'Đen',Brown:'Nâu',Camel:'Nâu camel',Beige:'Be',Cream:'Kem',Green:'Xanh lá',Olive:'Xanh ô liu',Khaki:'Kaki',Mint:'Xanh bạc hà',Purple:'Tím',White:'Trắng',Grey:'Xám',Orange:'Cam',Red:'Đỏ',Burgundy:'Đỏ rượu vang',Gold:'Vàng kim',Silver:'Bạc'},
  style: {'Hip-Hop':'Hip-Hop',Sport:'Thể thao',Casual:'Thường ngày',Classy:'Thanh lịch',Cartoon:'Hoạt hình',Old:'Cổ điển'},
  tag: {Minimal:'Tối giản',Statement:'Nổi bật',Graphic:'Đồ họa',Character:'Nhân vật',Patterned:'Họa tiết',Logo:'Logo',Text:'Chữ',Neutral:'Trung tính',Colorful:'Nhiều màu',Oversized:'Oversize',Cropped:'Cropped',Fitted:'Ôm dáng',Relaxed:'Thoải mái',Layering:'Phối lớp',Lightweight:'Nhẹ',Warm:'Ấm','Rain-ready':'Đi mưa',Summer:'Mùa hè',Winter:'Mùa đông','Travel-friendly':'Du lịch',Compact:'Gọn',Cozy:'Êm ái'}
};

export const FR_LABELS = {
  category: {Shirt:'Haut',Pant:'Pantalon',Skirt:'Jupe',Dress:'Robe',Combo:'Ensemble',Coat:'Veste / manteau',Bag:'Sac',Shoes:'Chaussures',Accessorie:'Accessoire',Belt:'Ceinture',Swimware:'Maillot de bain','Eye Lens':'Lentilles',Socks:'Chaussettes',Jumpsuit:'Combinaison',Underwear:'Sous-vêtement',Headwear:'Casquette / chapeau',Umbrella:'Parapluie'},
  color: {Blue:'Bleu',Navy:'Bleu marine','Light Blue':'Bleu clair',Turquoise:'Turquoise',Teal:'Bleu canard',Pink:'Rose',Yellow:'Jaune',Black:'Noir',Brown:'Marron',Camel:'Camel',Beige:'Beige',Cream:'Crème',Green:'Vert',Olive:'Vert olive',Khaki:'Kaki',Mint:'Menthe',Purple:'Violet',White:'Blanc',Grey:'Gris',Orange:'Orange',Red:'Rouge',Burgundy:'Bordeaux',Gold:'Doré',Silver:'Argenté'},
  style: {'Hip-Hop':'Hip-Hop',Sport:'Sport',Casual:'Décontracté',Classy:'Élégant',Cartoon:'Cartoon',Old:'Vintage'},
  tag: {Minimal:'Minimaliste',Statement:'Statement',Graphic:'Graphique',Character:'Personnage',Patterned:'À motifs',Logo:'Logo',Text:'Texte',Neutral:'Neutre',Colorful:'Coloré',Oversized:'Oversize',Cropped:'Court / cropped',Fitted:'Ajusté',Relaxed:'Relaxed',Layering:'Superposition',Lightweight:'Léger',Warm:'Chaud','Rain-ready':'Pluie',Summer:'Été',Winter:'Hiver','Travel-friendly':'Voyage',Compact:'Compact',Cozy:'Confortable'}
};

export const SEED_ITEMS = [
  {id:'seed-tui-xach',airtableRecordId:'recZFFx4HaeVHOrTc',name:'Tui Xach',category:'Bag',colors:['Red','White'],styles:['Classy'],tags:[],photo:null,favorite:false,createdAt:'2026-07-15T09:43:15.000Z',updatedAt:'2026-07-15T09:43:15.000Z'},
  {id:'seed-melody-bag',airtableRecordId:'recrtzfBVgQOYfAQN',name:'Melody Bag',category:'Bag',colors:['Pink'],styles:['Cartoon'],tags:[],photo:null,favorite:true,createdAt:'2026-07-23T12:04:10.000Z',updatedAt:'2026-07-23T12:04:10.000Z'}
];
