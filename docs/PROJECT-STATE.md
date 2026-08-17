# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- release candidate de closeout : `v0.4.4`
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **V0.2 — Airtable Bridge : CLOSED / VERIFIED PROD**
- **V0.3 — Outfits : CLOSED / VERIFIED PROD**
- **V0.4-A — Analyse photo assistée : CLOSED / VERIFIED PROD**
- **phase active suivante : V0.4-B — Duplicate Guard**

## V0.2 — CLOSED / VERIFIED PROD

Le bridge vêtements est vérifié de bout en bout :

- CREATE + photo
- UPDATE du même record
- DELETE
- retry offline
- idempotence via `Sync Mutation ID`
- snapshot canonique GitHub Actions
- tombstones anti-résurrection
- protection contre snapshots plus anciens
- cache applicatif network-first/no-store

Le canonique final est revenu à 3 vrais vêtements, sans record de test.

## V0.3 — CLOSED / VERIFIED PROD

### Local Outfit Core + Scalable Picker

- outfits IndexedDB offline-first
- minimum 2 vêtements
- occasion / saison / note / favoris
- recherche et filtres pour catalogue 100+
- picker à scroll interne + ruban sélectionné
- backup JSON vêtements + outfits

### Canonical Outfit Persistence

- table Airtable `Trân's Outfits` : `tblhtL2UlsgCAh6E7`
- linked records vers `Trân's Clothes`
- UUID stable `Outfit ID`
- queue `outfitMutations` séparée
- endpoint Worker `/v1/outfit-mutations`
- CREATE / UPDATE / DELETE vérifiés
- snapshot / bridge Outfit séparés
- anti-doublon et anti-résurrection vérifiés

### Outfit Presentation

- Lookbook plein écran
- PNG 1080×1350
- Web Share fichier + fallback sauvegarde
- validation utilisateur finale VERIFIED PROD

## V0.4-A — Analyse photo assistée — CLOSED / VERIFIED PROD

### Contrat produit validé

L'IA reste strictement human-in-the-loop :

1. Trân choisit une photo.
2. Elle déclenche explicitement `Phân tích bằng AI`.
3. L'IA propose catégorie, couleurs et styles.
4. Le formulaire ne change pas avant `Áp dụng gợi ý`.
5. Après application, tout reste éditable.
6. Aucune écriture IndexedDB/Airtable n'arrive avant `Lưu vào tủ đồ`.

### Architecture vérifiée

- Cloudflare Workers AI via `env.AI`
- vision : `@cf/llava-hf/llava-1.5-7b-hf`
- classification structurée : `@cf/meta/llama-4-scout-17b-16e-instruct`
- endpoint authentifié : `POST /v1/analyze-item`
- image d'analyse réduite à 1024 px sans recadrage du contenu
- sortie `guided_json` revalidée contre `TAXONOMY`
- aucun secret IA dans la PWA

### Reliability Pass vérifié

Taxonomie ajoutée jusque dans Airtable / PWA / Worker :

- `Underwear` → `Đồ lót`
- `Headwear` → `Mũ / nón`
- `Umbrella` → `Ô / dù`

Fiabilisation :

- 2 inspections vision indépendantes
- 3e passe rescue si résultat faible
- jusqu'à 3 analyses Worker complètes déclenchées automatiquement par un seul clic client si nécessaire
- meilleur résultat conservé
- arrêt anticipé dès qu'une réponse est assez fiable
- indicateurs `Tin cậy cao` / `Cần kiểm tra` / `Tin cậy thấp`
- règles explicites chaussures par paire, sous-vêtements, couvre-chefs, parapluies
- couleurs dominantes de l'objet seulement, autant que possible sans décor/cintre/ombres
- crash `RESULT_CODE_HUNG` corrigé via sentinel anti-montage multiple

### QA utilisateur réel — PASS

Les cas réels qui avaient exposé les limites ont tous passé la candidate v0.4.3 :

- chaussures DC → `Giày` avec retry automatique et un seul clic utilisateur
- boxer → `Đồ lót`
- casquette → `Mũ / nón`
- parapluie → `Ô / dù`
- aucune écriture canonique déclenchée au simple stade analyse/proposition

**V0.4-A est CLOSED / VERIFIED PROD.**

### V0.4-A.4 — polish de fermeture v0.4.4

- ajout canonique `Brown` → `Nâu` dans Airtable, PWA et Worker
- prompts couleur renforcés pour distinguer brown/tan/camel de noir/gris/vert
- preview `Thêm` durcie en `object-fit: contain` avec sélecteur spécifique
- aucun changement du CRUD, IndexedDB, queues, snapshots ou outfits

## V0.4-B — Duplicate Guard — ACTIVE NEXT

Objectif : empêcher les doublons probables avant création sans bloquer un ajout légitime.

Contrat visé :

- comparaison visuelle locale avant sauvegarde
- comparaison métadonnées (catégorie / couleurs / styles / nom)
- résultat explicable avec item(s) proches
- avertissement uniquement quand le signal est réellement utile
- décision finale toujours laissée à Trân
- aucun delete/merge automatique
- fonctionnement offline-first, sans nouvelle clé ni secret

## V0.4-C — Smart Tags — QUEUED

- suggestions de tags explicables et éditables
- signaux utiles aux recherches, outfits et futur assistant

Principe canonique : **l'IA et les heuristiques proposent, Trân décide avant toute écriture destructrice ou canonique.**

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- amélioration continue des palettes/couleurs fines au-delà des couleurs canoniques
