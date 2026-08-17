# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- version applicative candidate : `v0.4.3`
- dernière phase produit entièrement close : `V0.3 — Outfits`
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **phase active : V0.4 — Smart Closet**
- **slice active : V0.4-A — analyse photo assistée**
- **candidate QA : V0.4-A.3 / v0.4.3 — Reliability Pass**
- **statut : backend et gates techniques vérifiés ; QA utilisateur final en attente**

## V0.2 — CLOSED / VERIFIED PROD

Le bridge vêtements est vérifié en production de bout en bout :

- CREATE avec upload photo
- UPDATE du même Airtable record
- DELETE
- reread Airtable
- snapshot GitHub Actions
- redéploiement Pages
- idempotence create via `Sync Mutation ID`
- tombstones anti-résurrection
- réparation d'items locaux orphelins
- cache app network-first/no-store

Le test final a laissé le canonique à 3 vêtements réels, sans record jetable de test.

## V0.3 — CLOSED / VERIFIED PROD

### V0.3-A — Local Outfit Core ✅

- store IndexedDB `outfits`
- création multi-items (minimum 2)
- modification / suppression
- occasion / saison / note
- favoris outfits
- composition visuelle liste/détail
- backup JSON vêtements + outfits
- nettoyage des références lorsqu'un vêtement est supprimé

### V0.3-A.1 — Scalable Outfit Picker ✅

- recherche nom / catégorie / couleur / style
- filtres catégories, favoris et sélectionnés
- compteur résultats / total et sélection
- ruban des vêtements choisis
- grille filtrée à scroll interne
- conçu pour 100+ articles

### V0.3-B — Canonical Outfit Persistence ✅ VERIFIED PROD

- table Airtable `Trân's Outfits` : `tblhtL2UlsgCAh6E7`
- linked records natifs vers `Trân's Clothes`
- UUID stable `Outfit ID` comme clé d'idempotence
- IndexedDB schema v4 + queue `outfitMutations` séparée
- endpoint Worker `/v1/outfit-mutations`
- CREATE / UPDATE / DELETE retry-safe
- snapshot et bridge Outfit séparés
- pending-write protection et tombstones anti-résurrection
- migration réelle local → Airtable sans doublon
- UPDATE réel même record
- DELETE réel + snapshot post-delete `recordCount: 0`

### V0.3-C — Outfit Presentation ✅ VERIFIED PROD

- Lookbook plein écran
- safe-area mobile/iPhone
- génération locale PNG 1080×1350
- Web Share fichier + fallback sauvegarde PNG
- aucune URL publique d'outfit
- validation utilisateur finale VERIFIED PROD

## V0.4-A — Analyse photo assistée — CANDIDATE v0.4.3

### Contrat produit

L'assistant IA ne remplace jamais la validation humaine :

1. Trân choisit une photo.
2. Elle déclenche explicitement `Phân tích bằng AI`.
3. L'IA propose uniquement catégorie, couleurs et styles.
4. Le formulaire reste inchangé tant que `Áp dụng gợi ý` n'est pas pressé.
5. Après application, tous les champs restent éditables.
6. Aucune écriture IndexedDB/Airtable n'a lieu avant le bouton normal `Lưu vào tủ đồ`.

### Architecture candidate

- Cloudflare Workers AI via binding `env.AI`
- vision stable : `@cf/llava-hf/llava-1.5-7b-hf`
- classification taxonomique : `@cf/meta/llama-4-scout-17b-16e-instruct`
- endpoint authentifié séparé : `POST /v1/analyze-item`
- image d'analyse réduite à 1024 px en conservant le cadre complet
- preview UI en `contain` pour montrer l'image entière
- sortie guidée + revalidation stricte contre la taxonomie
- aucun secret IA dans le navigateur

### V0.4-A.1/A.2 — fondations et correctifs

- premier pipeline direct Llama 4 abandonné car l'image n'était pas réellement exploitée dans cette interface
- pipeline LLaVA → Llama 4 validé sur photos canoniques
- correction du payload LLaVA en tableau d'octets
- hotfix `RESULT_CODE_HUNG` : le montage répétitif de la carte IA dans `Thêm` est bloqué par un sentinel sur `#itemForm`
- validation utilisateur : `Thêm` s'ouvre de nouveau normalement

### V0.4-A.3 — Reliability Pass / v0.4.3

Taxonomie canonique enrichie, dans la PWA, le Worker et Airtable :

- `Underwear` → `Đồ lót`
- `Headwear` → `Mũ / nón`
- `Umbrella` → `Ô / dù`

Fiabilisation serveur :

- deux inspections vision indépendantes par analyse
- troisième passe de secours si la classification reste faible
- règles explicites pour paire de chaussures, sous-vêtements, couvre-chefs et parapluies
- couleurs dominantes de l'objet uniquement ; décor, cintre, peau, ombres et petits accents ignorés autant que possible
- jusqu'à deux styles lorsque visuellement justifiés
- réponse enrichie avec `reliability`, `retryUsed` et `attempts`

Fiabilisation client v0.4.3 :

- un seul clic utilisateur peut lancer jusqu'à 3 analyses Worker complètes
- retry automatique si le meilleur résultat est non reconnu, faible ou medium trop peu confiant
- arrêt anticipé dès qu'un résultat assez fiable existe
- conservation du meilleur résultat entre les tentatives
- affichage du niveau `Tin cậy cao` / `Cần kiểm tra` / `Tin cậy thấp`
- affichage du nombre de retries automatiques et de passes vision cumulées
- l'utilisateur n'a plus à cliquer quatre fois manuellement pour tenter d'obtenir une reconnaissance

### Gates techniques déjà validées

- CI syntaxe / shell / secrets verte
- isolation et cache PWA verts
- Worker restauré sur le backend vision stable après rejet d'une expérimentation moins fiable
- déploiement Worker + `/health` authentifié : SUCCESS
- smoke backend sur Neck Poca, Melody Bag et Tui Xach : HTTP 200 + contrat reliability valide
- aucun changement du CRUD, d'IndexedDB, des queues, des snapshots ou des outfits pour le retry client

### QA utilisateur requise avant clôture

Priorité aux cas réels qui avaient exposé les limites :

- chaussures DC : un seul clic doit suffire grâce aux retries automatiques ; attendu `Giày`
- boxer : attendu `Đồ lót`
- casquette : attendu `Mũ / nón`
- parapluie : attendu `Ô / dù`
- maillot Hazard : attendu `Áo`, avec style/couleurs à contrôler

**V0.4-A ne sera marquée CLOSED / VERIFIED PROD qu'après ce QA réel.**

## V0.4 — suite

- V0.4-B : Duplicate Guard — doublons probables avant création
- V0.4-C : Smart Tags — tags explicables et éditables

Principe canonique : **l'IA propose, Trân valide avant toute écriture canonique**.

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
