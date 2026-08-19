import fs from 'node:fs';
import assert from 'node:assert/strict';

function read(path){return fs.readFileSync(path,'utf8');}
function write(path,value){fs.writeFileSync(path,value);}
function replaceOnce(path,from,to){
  const source=read(path);
  const count=source.split(from).length-1;
  assert.equal(count,1,`${path}: expected exactly one occurrence of ${JSON.stringify(from)}, found ${count}`);
  write(path,source.replace(from,to));
}
function replaceCount(path,from,to,expected){
  const source=read(path);
  const count=source.split(from).length-1;
  assert.equal(count,expected,`${path}: expected ${expected} occurrences of ${JSON.stringify(from)}, found ${count}`);
  write(path,source.split(from).join(to));
}

// Duplicate Guard: render every dynamic label through keyed i18n.
replaceOnce('js/duplicate-guard.js',"import {LABELS} from './data.js';","import {LABELS,FR_LABELS} from './data.js';");
replaceOnce('js/duplicate-guard.js',"import {metadataSimilarity,hammingDistance,duplicateAssessment,duplicateReasons} from './duplicate-core.mjs?v=0.4.6';","import {metadataSimilarity,hammingDistance,duplicateAssessment,duplicateReasons} from './duplicate-core.mjs?v=0.5.16';\nimport {t,currentLanguage} from './i18n-keyed.mjs?v=0.5.16';");
replaceOnce('js/duplicate-guard.js',"const label=(type,value)=>LABELS[type]?.[value]||value;","const label=(type,value)=>(currentLanguage()==='fr'?FR_LABELS:LABELS)[type]?.[value]||value;");
replaceOnce('js/duplicate-guard.js',"const level=match.level==='high'?'Rất giống':'Có thể trùng';","const level=t(match.level==='high'?'duplicate.level.high':'duplicate.level.medium');");
replaceOnce('js/duplicate-guard.js',"${match.reasons.map(reason=>`<span>${esc(reason)}</span>`).join('')}","${match.reasons.map(reason=>`<span>${esc(t(reason.key,reason.params||{}))}</span>`).join('')}");
replaceOnce('js/duplicate-guard.js','<p class="eyebrow">KIỂM TRA TRÙNG</p><h3>Có vẻ món này đã có trong tủ</h3>','<p class="eyebrow">${t(\'duplicate.eyebrow\')}</p><h3>${t(\'duplicate.title\')}</h3>');
replaceOnce('js/duplicate-guard.js','<p>Ứng dụng chỉ cảnh báo dựa trên ảnh và thông tin hiện tại. Hãy kiểm tra các món gần giống trước khi lưu thêm một bản nữa.</p>','<p>${t(\'duplicate.body\')}</p>');
replaceOnce('js/duplicate-guard.js','>Quay lại kiểm tra</button>','>${t(\'duplicate.review\')}</button>');
replaceOnce('js/duplicate-guard.js','>Vẫn lưu món này</button>','>${t(\'duplicate.continue\')}</button>');
replaceOnce('js/duplicate-guard.js','<small>Không có món nào bị xóa hoặc gộp tự động. Quyết định cuối cùng luôn là của Trân.</small>','<small>${t(\'duplicate.footnote\')}</small>');
replaceOnce('js/duplicate-guard.js',"if(submit){submit.disabled=true;submit.textContent='Đang kiểm tra trùng…';}","if(submit){submit.disabled=true;submit.textContent=t('duplicate.checking');}");

// Photo AI: deterministic UI copy is keyed; semantic reasons come back in the requested language.
replaceOnce('js/item-ai-assistant.js',"import {TAXONOMY,LABELS} from './data.js';","import {TAXONOMY,LABELS,FR_LABELS} from './data.js';");
replaceOnce('js/item-ai-assistant.js',"import {getSyncConfig} from './sync-client.js?v=0.4.6';","import {getSyncConfig} from './sync-client.js?v=0.4.6';\nimport {t,currentLanguage} from './i18n-keyed.mjs?v=0.5.16';");
replaceOnce('js/item-ai-assistant.js',"const label=(type,value)=>LABELS[type]?.[value]||value;","const label=(type,value)=>(currentLanguage()==='fr'?FR_LABELS:LABELS)[type]?.[value]||value;");
replaceOnce('js/item-ai-assistant.js',"high:{label:'Tin cậy cao',hint:'AI khá chắc chắn, nhưng Trân vẫn là người quyết định.'}","high:{label:t('ai.reliability.high.label'),hint:t('ai.reliability.high.hint')}");
replaceOnce('js/item-ai-assistant.js',"medium:{label:'Cần kiểm tra',hint:'AI có tín hiệu tốt nhưng nên kiểm tra loại, màu và nhãn trước khi áp dụng.'}","medium:{label:t('ai.reliability.medium.label'),hint:t('ai.reliability.medium.hint')}");
replaceOnce('js/item-ai-assistant.js',"low:{label:'Tin cậy thấp',hint:'Kết quả còn yếu. Nên kiểm tra kỹ hoặc thử ảnh rõ hơn.'}","low:{label:t('ai.reliability.low.label'),hint:t('ai.reliability.low.hint')}");
replaceOnce('js/item-ai-assistant.js','<div class="ai-check-note is-retry">✦ AI đã tự thử lại ${meta.clientAttempts-1} lần · ${meta.totalVisionPasses} lượt nhìn tổng cộng</div>','<div class="ai-check-note is-retry">✦ ${t(\'ai.retry.client\',{count:meta.clientAttempts-1,passes:meta.totalVisionPasses})}</div>');
replaceOnce('js/item-ai-assistant.js','<div class="ai-check-note ${meta.retryUsed?\'is-retry\':\'\'}">✦ ${meta.retryUsed?`AI đã tự kiểm tra lại ảnh · ${meta.attempts} lượt`:`AI đã đối chiếu ảnh · ${meta.attempts} lượt nhìn`}</div>','<div class="ai-check-note ${meta.retryUsed?\'is-retry\':\'\'}">✦ ${t(meta.retryUsed?\'ai.retry.server\':\'ai.retry.compared\',{passes:meta.attempts})}</div>');
replaceOnce('js/item-ai-assistant.js','<div class="ai-result-head"><div><span>GỢI Ý AI</span><strong>Chưa nhận diện chắc chắn</strong></div><b>${confidence}%</b></div>','<div class="ai-result-head"><div><span>${t(\'ai.result.eyebrow\')}</span><strong>${t(\'ai.result.unrecognized\')}</strong></div><b>${confidence}%</b></div>');
replaceOnce('js/item-ai-assistant.js',"analysis?.reason||'Hãy thử ảnh rõ hơn, chỉ có một món đồ chính trong khung hình.'","analysis?.reason||t('ai.result.clearerPhoto')");
replaceOnce('js/item-ai-assistant.js','<div class="ai-result-head"><div><span>GỢI Ý AI</span><strong>${esc(label(\'category\',analysis.category))}</strong></div><b>${confidence}%</b></div>','<div class="ai-result-head"><div><span>${t(\'ai.result.eyebrow\')}</span><strong>${esc(label(\'category\',analysis.category))}</strong></div><b>${confidence}%</b></div>');
replaceOnce('js/item-ai-assistant.js','<div class="ai-result-group"><small>Màu sắc</small>','<div class="ai-result-group"><small>${t(\'ai.group.colors\')}</small>');
replaceOnce('js/item-ai-assistant.js','<div class="ai-result-group"><small>Phong cách</small>','<div class="ai-result-group"><small>${t(\'ai.group.styles\')}</small>');
replaceOnce('js/item-ai-assistant.js','<div class="ai-result-group ai-tag-suggestions"><small>Nhãn thông minh</small>','<div class="ai-result-group ai-tag-suggestions"><small>${t(\'ai.group.tags\')}</small>');
replaceOnce('js/item-ai-assistant.js','>Áp dụng gợi ý</button>','>${t(\'ai.apply\')}</button>');
replaceOnce('js/item-ai-assistant.js','<small class="ai-human-note">Trân vẫn có thể sửa loại, màu, phong cách và mọi nhãn trước khi lưu.</small>','<small class="ai-human-note">${t(\'ai.humanNote\')}</small>');
replaceOnce('js/item-ai-assistant.js',"if(note){note.hidden=false;note.textContent='✓ Đã áp dụng cả phân loại và nhãn. Hãy kiểm tra lại trước khi lưu vào tủ đồ.';}","if(note){note.hidden=false;note.textContent=t('ai.applied');}");
replaceOnce('js/item-ai-assistant.js','body:JSON.stringify({image:prepared}),','body:JSON.stringify({image:prepared,language:currentLanguage()}),');
replaceOnce('js/item-ai-assistant.js',"button.textContent='Đang đối chiếu ảnh…';","button.textContent=t('ai.loading.button');");
replaceOnce('js/item-ai-assistant.js',"output.innerHTML='<div class=\"ai-loading\"><span></span><p>AI đang nhìn ảnh nhiều lượt để gợi ý phân loại và nhãn. Nếu kết quả còn yếu, hệ thống sẽ tự thử lại.</p></div>';","output.innerHTML=`<div class=\"ai-loading\"><span></span><p>${t('ai.loading.body')}</p></div>`;");
replaceOnce('js/item-ai-assistant.js',"button.textContent=`Đang tự thử lại ${attempt-1}/${MAX_CLIENT_ATTEMPTS-1}…`;","button.textContent=t('ai.retry.button',{current:attempt-1,total:MAX_CLIENT_ATTEMPTS-1});");
replaceOnce('js/item-ai-assistant.js',"output.innerHTML=`<div class=\"ai-loading\"><span></span><p>Kết quả trước chưa đủ chắc. AI đang tự phân tích lại lần ${attempt} để chọn phương án tốt hơn…</p></div>`;","output.innerHTML=`<div class=\"ai-loading\"><span></span><p>${t('ai.retry.body',{attempt})}</p></div>`;");
replaceOnce('js/item-ai-assistant.js',"const friendly=message==='SYNC_NOT_CONFIGURED'\n      ?'Cần cấu hình kết nối trong Hồ sơ trước khi dùng trợ lý AI.'\n      :error?.status===429||message.includes('429')\n        ?'AI đang bận hoặc đã đạt giới hạn hôm nay. Hãy thử lại sau.'\n        :'Không phân tích được ảnh lúc này. Ảnh và biểu mẫu của bạn vẫn nguyên vẹn.';","const friendly=message==='SYNC_NOT_CONFIGURED'\n      ?t('ai.error.config')\n      :error?.status===429||message.includes('429')\n        ?t('ai.error.busy')\n        :t('ai.error.generic');");
replaceOnce('js/item-ai-assistant.js','<div class="ai-result ai-result-warning"><strong>Không thể phân tích</strong><p>${esc(friendly)}</p></div>','<div class="ai-result ai-result-warning"><strong>${t(\'ai.error.title\')}</strong><p>${esc(friendly)}</p></div>');
replaceOnce('js/item-ai-assistant.js',"button.textContent='✦ Phân tích bằng AI';","button.textContent=t('ai.analyze');");
replaceOnce('js/item-ai-assistant.js','<div><p class="eyebrow">TRỢ LÝ ẢNH</p><h3>Để AI gợi ý phân loại + nhãn</h3></div><span>✦</span>','<div><p class="eyebrow">${t(\'ai.card.eyebrow\')}</p><h3>${t(\'ai.card.title\')}</h3></div><span>✦</span>');
replaceOnce('js/item-ai-assistant.js','<p class="ai-assistant-copy">AI đối chiếu nhiều lượt và chỉ đề xuất. Không có loại, màu, phong cách hay nhãn nào được thay đổi cho đến khi Trân chọn áp dụng.</p>','<p class="ai-assistant-copy">${t(\'ai.card.copy\')}</p>');
replaceOnce('js/item-ai-assistant.js','>✦ Phân tích bằng AI</button>','>${t(\'ai.analyze\')}</button>');
replaceOnce('js/item-ai-assistant.js','<small class="ai-privacy">Ảnh chỉ được gửi đến Worker bảo mật khi Trân chủ động bấm nút phân tích.</small>','<small class="ai-privacy">${t(\'ai.privacy\')}</small>');

// Worker: free-form semantic explanation follows the UI language requested by the client.
replaceOnce('worker/src/index.js',"async function classifyDescriptions(descriptions,env){\n  const numbered=descriptions.map((text,index)=>`VISION PASS ${index+1}:\\n${text}`).join('\\n\\n');","async function classifyDescriptions(descriptions,env,language='vi'){\n  const outputLanguage=language==='fr'?'French':'Vietnamese';\n  const numbered=descriptions.map((text,index)=>`VISION PASS ${index+1}:\\n${text}`).join('\\n\\n');");
replaceOnce('worker/src/index.js',"'tagReason must be one short Vietnamese sentence explaining the strongest visible evidence for the chosen tags. If tags is empty, explain briefly that no extra tag is visually certain.',","`tagReason must be one short ${outputLanguage} sentence explaining the strongest visible evidence for the chosen tags. If tags is empty, explain briefly that no extra tag is visually certain.`,");
replaceOnce('worker/src/index.js',"'reason must be one short Vietnamese sentence grounded only in the descriptions.',","`reason must be one short ${outputLanguage} sentence grounded only in the descriptions.`,");
replaceOnce('worker/src/index.js',"const photo=parsePhoto(payload?.image,MAX_AI_IMAGE_BYTES);\n  if(!photo)throw new Error('Missing image');","const photo=parsePhoto(payload?.image,MAX_AI_IMAGE_BYTES);\n  if(!photo)throw new Error('Missing image');\n  const language=payload?.language==='fr'?'fr':'vi';");
replaceCount('worker/src/index.js','classifyDescriptions(descriptions,env)','classifyDescriptions(descriptions,env,language)',2);

// Key catalog additions for Duplicate Guard + photo AI.
{
  const path='js/i18n-keyed.mjs';
  let source=read(path);
  assert.equal(source.includes("'duplicate.eyebrow'"),false,'duplicate keys already present');
  assert.equal(source.includes("'ai.card.eyebrow'"),false,'AI keys already present');
  const marker="    'outfit.incomplete.title'";
  const parts=source.split(marker);
  assert.equal(parts.length,3,'expected VI + FR outfit marker');
  const vi=`    'duplicate.eyebrow':'KIỂM TRA TRÙNG','duplicate.title':'Có vẻ món này đã có trong tủ','duplicate.body':'Ứng dụng chỉ cảnh báo dựa trên ảnh và thông tin hiện tại. Hãy kiểm tra các món gần giống trước khi lưu thêm một bản nữa.','duplicate.review':'Quay lại kiểm tra','duplicate.continue':'Vẫn lưu món này','duplicate.footnote':'Không có món nào bị xóa hoặc gộp tự động. Quyết định cuối cùng luôn là của Trân.','duplicate.level.high':'Rất giống','duplicate.level.medium':'Có thể trùng','duplicate.reason.nearlyIdentical':'Ảnh gần như trùng','duplicate.reason.verySimilar':'Ảnh rất giống','duplicate.reason.fairlySimilar':'Ảnh khá giống','duplicate.reason.sameCategory':'Cùng loại','duplicate.reason.similarColors':'Màu tương tự','duplicate.reason.similarStyles':'Phong cách tương tự','duplicate.reason.closeName':'Tên rất gần','duplicate.checking':'Đang kiểm tra trùng…',\n    'ai.card.eyebrow':'TRỢ LÝ ẢNH','ai.card.title':'Để AI gợi ý phân loại + nhãn','ai.card.copy':'AI đối chiếu nhiều lượt và chỉ đề xuất. Không có loại, màu, phong cách hay nhãn nào được thay đổi cho đến khi Trân chọn áp dụng.','ai.analyze':'✦ Phân tích bằng AI','ai.privacy':'Ảnh chỉ được gửi đến Worker bảo mật khi Trân chủ động bấm nút phân tích.','ai.loading.button':'Đang đối chiếu ảnh…','ai.loading.body':'AI đang nhìn ảnh nhiều lượt để gợi ý phân loại và nhãn. Nếu kết quả còn yếu, hệ thống sẽ tự thử lại.','ai.retry.button':({current,total})=>'Đang tự thử lại '+current+'/'+total+'…','ai.retry.body':({attempt})=>'Kết quả trước chưa đủ chắc. AI đang tự phân tích lại lần '+attempt+' để chọn phương án tốt hơn…','ai.retry.client':({count,passes})=>'AI đã tự thử lại '+count+' lần · '+passes+' lượt nhìn tổng cộng','ai.retry.server':({passes})=>'AI đã tự kiểm tra lại ảnh · '+passes+' lượt','ai.retry.compared':({passes})=>'AI đã đối chiếu ảnh · '+passes+' lượt nhìn','ai.result.eyebrow':'GỢI Ý AI','ai.result.unrecognized':'Chưa nhận diện chắc chắn','ai.result.clearerPhoto':'Hãy thử ảnh rõ hơn, chỉ có một món đồ chính trong khung hình.','ai.reliability.high.label':'Tin cậy cao','ai.reliability.high.hint':'AI khá chắc chắn, nhưng Trân vẫn là người quyết định.','ai.reliability.medium.label':'Cần kiểm tra','ai.reliability.medium.hint':'AI có tín hiệu tốt nhưng nên kiểm tra loại, màu và nhãn trước khi áp dụng.','ai.reliability.low.label':'Tin cậy thấp','ai.reliability.low.hint':'Kết quả còn yếu. Nên kiểm tra kỹ hoặc thử ảnh rõ hơn.','ai.group.colors':'Màu sắc','ai.group.styles':'Phong cách','ai.group.tags':'Nhãn thông minh','ai.apply':'Áp dụng gợi ý','ai.humanNote':'Trân vẫn có thể sửa loại, màu, phong cách và mọi nhãn trước khi lưu.','ai.applied':'✓ Đã áp dụng cả phân loại và nhãn. Hãy kiểm tra lại trước khi lưu vào tủ đồ.','ai.error.title':'Không thể phân tích','ai.error.config':'Cần cấu hình kết nối trong Hồ sơ trước khi dùng trợ lý AI.','ai.error.busy':'AI đang bận hoặc đã đạt giới hạn hôm nay. Hãy thử lại sau.','ai.error.generic':'Không phân tích được ảnh lúc này. Ảnh và biểu mẫu của bạn vẫn nguyên vẹn.',\n`;
  const fr=`    'duplicate.eyebrow':'VÉRIFICATION DES DOUBLONS','duplicate.title':'Cet article semble déjà présent','duplicate.body':'L’application avertit seulement à partir de la photo et des informations actuelles. Vérifie les articles similaires avant d’enregistrer un doublon.','duplicate.review':'Revenir vérifier','duplicate.continue':'Enregistrer quand même','duplicate.footnote':'Aucun article n’est supprimé ni fusionné automatiquement. La décision finale reste celle de Trân.','duplicate.level.high':'Très similaire','duplicate.level.medium':'Doublon possible','duplicate.reason.nearlyIdentical':'Photo presque identique','duplicate.reason.verySimilar':'Photo très similaire','duplicate.reason.fairlySimilar':'Photo assez similaire','duplicate.reason.sameCategory':'Même catégorie','duplicate.reason.similarColors':'Couleurs similaires','duplicate.reason.similarStyles':'Style similaire','duplicate.reason.closeName':'Nom très proche','duplicate.checking':'Recherche de doublons…',\n    'ai.card.eyebrow':'ASSISTANT PHOTO','ai.card.title':'Laisser l’IA proposer catégorie + tags','ai.card.copy':'L’IA analyse plusieurs fois et ne fait que proposer. Rien n’est modifié tant que Trân n’a pas choisi d’appliquer la suggestion.','ai.analyze':'✦ Analyser avec l’IA','ai.privacy':'La photo n’est envoyée au Worker sécurisé que lorsque Trân lance volontairement l’analyse.','ai.loading.button':'Analyse de la photo…','ai.loading.body':'L’IA examine la photo plusieurs fois pour proposer catégorie et tags. Si le résultat est trop faible, elle réessaie automatiquement.','ai.retry.button':({current,total})=>'Nouvel essai automatique '+current+'/'+total+'…','ai.retry.body':({attempt})=>'Le résultat précédent n’était pas assez fiable. L’IA relance l’analyse n°'+attempt+' pour choisir une meilleure proposition…','ai.retry.client':({count,passes})=>'L’IA a réessayé '+count+' fois · '+passes+' analyses visuelles au total','ai.retry.server':({passes})=>'L’IA a revérifié la photo · '+passes+' passes','ai.retry.compared':({passes})=>'L’IA a comparé la photo · '+passes+' passes','ai.result.eyebrow':'SUGGESTION IA','ai.result.unrecognized':'Reconnaissance incertaine','ai.result.clearerPhoto':'Essaie une photo plus nette avec un seul article principal dans le cadre.','ai.reliability.high.label':'Fiabilité élevée','ai.reliability.high.hint':'L’IA est assez sûre, mais Trân garde la décision finale.','ai.reliability.medium.label':'À vérifier','ai.reliability.medium.hint':'Le signal est bon, mais vérifie la catégorie, les couleurs et les tags avant d’appliquer.','ai.reliability.low.label':'Fiabilité faible','ai.reliability.low.hint':'Résultat encore faible. Vérifie attentivement ou essaie une photo plus nette.','ai.group.colors':'Couleurs','ai.group.styles':'Style','ai.group.tags':'Tags intelligents','ai.apply':'Appliquer la suggestion','ai.humanNote':'Trân peut encore modifier catégorie, couleurs, style et tags avant d’enregistrer.','ai.applied':'✓ Catégorie et tags appliqués. Vérifie avant d’enregistrer dans le dressing.','ai.error.title':'Analyse impossible','ai.error.config':'Configure d’abord la connexion dans Profil pour utiliser l’assistant IA.','ai.error.busy':'L’IA est occupée ou la limite du jour est atteinte. Réessaie plus tard.','ai.error.generic':'Impossible d’analyser la photo pour le moment. La photo et le formulaire restent intacts.',\n`;
  source=parts[0]+vi+marker+parts[1]+fr+marker+parts[2];
  write(path,source);
}

// Duplicate unit contract now checks reason descriptors rather than Vietnamese copy.
replaceOnce('scripts/test-duplicate-core.mjs',"assert.ok(duplicateReasons(exactImage).includes('Ảnh gần như trùng'));","assert.ok(duplicateReasons(exactImage).some(reason=>reason.key==='duplicate.reason.nearlyIdentical'));\nassert.ok(duplicateReasons(exactImage).every(reason=>typeof reason.key==='string'));");

// Explicit legacy translation refresh after each app render; no global DOM observer.
replaceOnce('js/app.js',"function render(){\n  main.innerHTML=state.route==='closet'?closet():state.route==='favorites'?closet(true):state.route==='add'?addView():state.route==='outfits'?outfits():profile();\n  bind();\n}","function render(){\n  main.innerHTML=state.route==='closet'?closet():state.route==='favorites'?closet(true):state.route==='add'?addView():state.route==='outfits'?outfits():profile();\n  bind();\n  window.TranClosetI18n?.apply?.(main);\n}");
replaceOnce('js/i18n.js',"window.TranClosetI18n={language,setLanguage,t:translateRaw,isFrench:language==='fr'};","window.TranClosetI18n={language,setLanguage,t:translateRaw,isFrench:language==='fr',apply:scope=>{mountSwitcher();if(language==='fr')translateTree(scope);}};");
{
  const path='js/i18n.js';
  let source=read(path);
  const start=source.indexOf('\nconst observer=new MutationObserver(records=>{');
  assert.notEqual(start,-1,'legacy observer start not found');
  const endNeedle="observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});";
  const endStart=source.indexOf(endNeedle,start);
  assert.notEqual(endStart,-1,'legacy observer end not found');
  source=source.slice(0,start)+'\n';
  write(path,source);
}

for(const path of ['js/duplicate-core.mjs','js/duplicate-guard.js','js/item-ai-assistant.js','js/i18n-keyed.mjs','js/app.js','js/i18n.js','worker/src/index.js','scripts/test-duplicate-core.mjs']){
  assert.ok(read(path).length>0,`${path} became empty`);
}
console.log('Dynamic i18n closeout migration: PASS');
