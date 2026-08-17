# Roadmap — Trân Closet PWA

## V0.1 — Local Closet ✅
- PWA installable
- offline shell
- IndexedDB
- CRUD local de base
- photos locales compressées
- recherche / filtres / favoris
- sauvegarde JSON

## V0.2 — Airtable Bridge ✅ CLOSED

### V0.2-A — Canonical read sync ✅
- snapshot Airtable versionné dans GitHub
- IDs Airtable conservés dans IndexedDB
- copie durable des photos Airtable vers `assets/items/`
- sync GitHub Actions manuelle + planifiée toutes les 6 h
- token Airtable uniquement dans GitHub Actions Secret
- fusion snapshot → stockage local en préservant les favoris
- redéploiement Pages après sync bot

### V0.2-B — Secure write bridge ✅
- backend Cloudflare Worker sécurisé
- sync create/update/delete PWA → Airtable
- création avec upload photo côté Worker
- file IndexedDB de mutations et retry au retour du réseau
- état de sync visible par item
- création idempotente via `Sync Mutation ID`
- tombstones anti-résurrection
- protection contre snapshots plus anciens que les writes locaux

### V0.2-C — Activation & verified write sync ✅
- Worker Cloudflare déployé
- PAT Airtable write-only/scopé et `CLOSET_SYNC_KEY` configurés
- test réel create → photo → update → delete
- reread Airtable + snapshot après writes
- absence de doublon / résurrection vérifiée

## V0.3 — Outfits ✅ CLOSED

### V0.3-A — Local Outfit Core ✅
- store IndexedDB `outfits`
- création multi-items, modification, suppression
- occasion / saison / note / favoris
- backup JSON vêtements + outfits

### V0.3-A.1 — Scalable Outfit Picker ✅
- recherche nom / catégorie / couleur / style
- filtres catégories, favoris et sélectionnés
- ruban de sélection + scroll interne
- conçu pour 100+ articles

### V0.3-B — Canonical Outfit Persistence ✅ VERIFIED PROD
- table Airtable dédiée + linked records vêtements
- `Outfit ID` idempotent
- queue `outfitMutations` séparée
- endpoint Worker séparé
- snapshot/bridge Outfit
- migration, CREATE, UPDATE, DELETE et anti-résurrection vérifiés

### V0.3-C — Outfit Presentation ✅ VERIFIED PROD
- Lookbook plein écran
- PNG 1080×1350
- Web Share + fallback sauvegarde
- validation utilisateur finale

## V0.4 — Smart Closet 🟡 ACTIVE

### V0.4-A — Analyse photo assistée 🟡 QA CANDIDATE v0.4.3

Fondations déjà en place :
- endpoint Workers AI authentifié
- analyse uniquement après action explicite utilisateur
- proposition séparée du formulaire
- `Áp dụng gợi ý` obligatoire avant tout pré-remplissage
- sauvegarde normale obligatoire avant écriture canonique
- preview image complète

Reliability Pass V0.4-A.3 :
- nouvelles catégories canoniques `Underwear`, `Headwear`, `Umbrella`
- deux passes vision serveur + troisième rescue si nécessaire
- règles spécifiques chaussures par paire, sous-vêtements, couvre-chefs et parapluies
- couleurs centrées sur l'objet principal, pas le décor
- styles multiples quand justifiés
- indicateur de fiabilité explicite
- **retry automatique client jusqu'à 3 analyses complètes sur un seul clic**
- meilleur résultat conservé et arrêt anticipé si suffisamment fiable
- sentinel anti-boucle DOM pour empêcher le crash `RESULT_CODE_HUNG`

QA réel à valider avant fermeture :
- DC shoes → `Giày` avec un seul clic utilisateur
- boxer → `Đồ lót`
- casquette → `Mũ / nón`
- parapluie → `Ô / dù`
- maillot Hazard → `Áo`, couleurs/styles cohérents

**Ne pas marquer V0.4-A VERIFIED PROD avant ce QA.**

### V0.4-B — Duplicate Guard
- détection de doublons probables avant création
- comparaison visuelle + métadonnées
- décision finale laissée à l'utilisateur

### V0.4-C — Smart Tags
- suggestions de tags utiles à la recherche et aux outfits
- tags explicables et éditables
- préparation des signaux pour l'assistant V0.5

## V0.5 — Assistant
- “Hôm nay mặc gì?”
- météo locale
- suggestions d'outfits
- historique des tenues
- rareté d'utilisation

## V1.0 — Daily Driver
- sync robuste
- auth privée
- notifications optionnelles
- polish iPhone
- install UX VN/FR
