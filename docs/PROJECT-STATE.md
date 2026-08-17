# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production / candidate

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- production close : `v0.4.4`
- candidate active : `v0.4.5` — V0.4-B Duplicate Guard
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **V0.2 — Airtable Bridge : CLOSED / VERIFIED PROD**
- **V0.3 — Outfits : CLOSED / VERIFIED PROD**
- **V0.4-A — Analyse photo assistée : CLOSED / VERIFIED PROD**
- **V0.4-B — Duplicate Guard : CANDIDATE v0.4.5**

## V0.2 — CLOSED / VERIFIED PROD

Le bridge vêtements est vérifié de bout en bout : CREATE + photo, UPDATE, DELETE, retry offline, idempotence `Sync Mutation ID`, snapshot canonique, tombstones anti-résurrection et protection contre snapshots plus anciens.

## V0.3 — CLOSED / VERIFIED PROD

Outfits offline-first + picker 100+, persistance Airtable par linked records, queue séparée, CREATE/UPDATE/DELETE vérifiés, Lookbook plein écran, PNG 1080×1350 et Web Share validé.

## V0.4-A — Analyse photo assistée — CLOSED / VERIFIED PROD

Contrat human-in-the-loop validé : l'IA propose, `Áp dụng gợi ý` applique au formulaire, puis Trân reste libre de corriger et doit encore sauvegarder normalement.

Architecture :
- Workers AI via `env.AI`
- vision LLaVA + classification Llama 4 structurée
- 2 passes vision + rescue
- jusqu'à 3 analyses complètes automatiques sur un seul clic client
- taxonomie `Underwear`, `Headwear`, `Umbrella`
- indicateurs de fiabilité
- crash `RESULT_CODE_HUNG` corrigé

QA réel PASS :
- chaussures DC → `Giày`
- boxer → `Đồ lót`
- casquette → `Mũ / nón`
- parapluie → `Ô / dù`

Polish v0.4.4 :
- `Brown` → `Nâu` canonique dans Airtable / PWA / Worker
- distinction brown/tan/camel renforcée
- preview photo full-frame durcie

## V0.4-B — Duplicate Guard — CANDIDATE v0.4.5

Objectif : avertir avant de créer un article probablement déjà présent, sans empêcher un ajout légitime.

Architecture candidate :
- module `duplicate-guard.js` séparé du CRUD historique
- core pur `duplicate-core.mjs` testable indépendamment
- perceptual hash local dHash 64 bits, calculé via canvas 9×8
- distance de Hamming convertie en similarité visuelle
- score métadonnées : catégorie, couleurs, styles et nom
- score final explicable + niveaux `high / medium / none`
- jusqu'à 3 candidats proches montrés avec photo et raisons
- cache des fingerprints en mémoire + `sessionStorage`
- catalogue large : maximum 80 candidats visuels, priorité aux métadonnées proches + récents
- concurrence limitée à 5 calculs pour éviter de bloquer le téléphone
- fonctionne sans Worker, sans Airtable et sans nouveau secret

Sécurité UX :
- le guard intercepte la création avant `saveItem`
- aucun record n'est créé tant que l'avertissement est affiché
- `Quay lại kiểm tra` revient au formulaire
- `Vẫn lưu món này` permet explicitement de continuer
- aucun merge/delete automatique
- si le guard lui-même plante, il échoue ouvert : la création normale reste possible
- toute modification du formulaire invalide l'ancien avertissement

Gates techniques prévues :
- syntaxe JS
- tests unitaires du scoring perceptuel/métadonnées
- cache/version PWA v0.4.5
- CI secrets et identité PWA
- diff safety : pas de `app.js`, `db.js`, Worker, queues ni snapshots

QA utilisateur requise avant VERIFIED PROD :
1. reprendre une photo d'un article déjà présent ;
2. sauvegarder → avertissement attendu avant création ;
3. `Quay lại kiểm tra` ne doit rien créer ;
4. refaire puis `Vẫn lưu món này` doit autoriser la création ;
5. supprimer ensuite l'éventuel article jetable de QA et vérifier la sync normale.

**V0.4-B ne doit pas être marquée VERIFIED PROD avant ce QA réel.**

## V0.4-C — Smart Tags — QUEUED

- tags explicables et éditables
- utiles à la recherche, aux outfits et au futur assistant

Principe canonique : **l'IA et les heuristiques proposent, Trân décide avant toute écriture destructrice ou canonique.**

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- palettes/couleurs fines au-delà des couleurs canoniques
