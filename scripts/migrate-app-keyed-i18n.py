from pathlib import Path

APP=Path('js/app.js')
I18N=Path('js/i18n-keyed.mjs')


def replace_once(text, old, new, label):
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 occurrence, found {count}')
    return text.replace(old,new,1)

app=APP.read_text(encoding='utf-8')
app=replace_once(app,
    "import {TAXONOMY,LABELS,SEED_ITEMS} from './data.js';",
    "import {TAXONOMY,LABELS,SEED_ITEMS} from './data.js';\nimport {t} from './i18n-keyed.mjs?v=0.5.16';",
    'app import')
app=replace_once(app,
    '<p class="eyebrow">CHỈNH SỬA</p>',
    '<p class="eyebrow">${t(\'app.edit.eyebrow\')}</p>',
    'edit eyebrow')
app=replace_once(app,
    '<p class="form-note">Thay ảnh sẽ được thêm trong bản cập nhật tiếp theo. Ảnh hiện tại được giữ nguyên.</p>',
    '<p class="form-note">${t(\'app.edit.photoLater\')}</p>',
    'edit photo note')
app=replace_once(app,
    "say(navigator.onLine?'Đã xóa · đang đồng bộ':'Đã xóa · sẽ đồng bộ khi có mạng');",
    "say(t(navigator.onLine?'app.delete.syncing':'app.delete.offline'));",
    'delete status')
app=replace_once(app,
    "if(standalone())return say('Ứng dụng đã được cài ✓');",
    "if(standalone())return say(t('app.install.installed'));",
    'installed toast')
app=replace_once(app,
    "<h2>${ios?'Cài trên iPhone':'Cài ứng dụng'}</h2>${ios?'<ol><li>Mở bằng <strong>Safari</strong>.</li><li>Chạm <strong>Chia sẻ</strong>.</li><li>Chọn <strong>Thêm vào Màn hình chính</strong>.</li><li>Chạm <strong>Thêm</strong>.</li></ol>':'<p>Mở menu trình duyệt và chọn <strong>Cài ứng dụng</strong>.</p>'}</div>",
    "<h2>${t(ios?'app.install.iphoneTitle':'app.install.appTitle')}</h2>${t(ios?'app.install.iosHtml':'app.install.browserHtml')}</div>",
    'install help')
app=replace_once(app,
    'pp.innerHTML=`<img src="${pi.dataset.photo}" alt="Xem trước">`;',
    'pp.innerHTML=`<img src="${pi.dataset.photo}" alt="${t(\'app.photo.preview\')}">`;',
    'photo preview')
app=replace_once(app,
    '<p class="privacy-note">Khóa Airtable không nằm trong PWA. Ứng dụng chỉ lưu khóa đồng bộ riêng của thiết bị và gửi thay đổi tới Worker bảo mật. Vêtements, nhãn và outfits đều đi qua luồng đồng bộ canonique.</p>',
    '<p class="privacy-note">${t(\'app.privacy\')}</p>',
    'privacy note')
APP.write_text(app,encoding='utf-8')

i18n=I18N.read_text(encoding='utf-8')
vi_marker="'sync.error':'Lỗi đồng bộ · hãy thử lại',"
fr_marker="'sync.error':'Erreur de synchronisation · réessaie',"
vi_keys="'app.edit.eyebrow':'CHỈNH SỬA','app.edit.photoLater':'Thay ảnh sẽ được thêm trong bản cập nhật tiếp theo. Ảnh hiện tại được giữ nguyên.','app.delete.syncing':'Đã xóa · đang đồng bộ','app.delete.offline':'Đã xóa · sẽ đồng bộ khi có mạng','app.install.installed':'Ứng dụng đã được cài ✓','app.install.iphoneTitle':'Cài trên iPhone','app.install.appTitle':'Cài ứng dụng','app.install.iosHtml':'<ol><li>Mở bằng <strong>Safari</strong>.</li><li>Chạm <strong>Chia sẻ</strong>.</li><li>Chọn <strong>Thêm vào Màn hình chính</strong>.</li><li>Chạm <strong>Thêm</strong>.</li></ol>','app.install.browserHtml':'<p>Mở menu trình duyệt và chọn <strong>Cài ứng dụng</strong>.</p>','app.photo.preview':'Xem trước','app.privacy':'Khóa Airtable không nằm trong PWA. Ứng dụng chỉ lưu khóa đồng bộ riêng của thiết bị và gửi thay đổi tới Worker bảo mật. Quần áo, nhãn và outfit đều đi qua luồng đồng bộ chuẩn.',"
fr_keys="'app.edit.eyebrow':'MODIFIER','app.edit.photoLater':'Le remplacement de la photo sera ajouté dans une prochaine mise à jour. La photo actuelle est conservée.','app.delete.syncing':'Supprimé · synchronisation en cours','app.delete.offline':'Supprimé · sera synchronisé au retour du réseau','app.install.installed':'Application déjà installée ✓','app.install.iphoneTitle':'Installer sur iPhone','app.install.appTitle':'Installer l’application','app.install.iosHtml':'<ol><li>Ouvre dans <strong>Safari</strong>.</li><li>Touche <strong>Partager</strong>.</li><li>Choisis <strong>Ajouter à l’écran d’accueil</strong>.</li><li>Touche <strong>Ajouter</strong>.</li></ol>','app.install.browserHtml':'<p>Ouvre le menu du navigateur et choisis <strong>Installer l’application</strong>.</p>','app.photo.preview':'Aperçu','app.privacy':'La clé Airtable n’est pas intégrée à la PWA. L’application conserve uniquement la clé de synchronisation de l’appareil et envoie les modifications au Worker sécurisé. Vêtements, tags et tenues passent tous par le flux de synchronisation canonique.',"
i18n=replace_once(i18n,vi_marker,vi_marker+'\n    '+vi_keys,'VI app keys')
i18n=replace_once(i18n,fr_marker,fr_marker+'\n    '+fr_keys,'FR app keys')
I18N.write_text(i18n,encoding='utf-8')

print('app.js keyed i18n migration: PASS')
