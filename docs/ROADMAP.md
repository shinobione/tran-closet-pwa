# Roadmap — Trân Closet PWA

## V0.1 — Local Closet ✅
- PWA installable
- offline shell
- IndexedDB
- CRUD local
- photos compressées
- recherche / filtres / favoris
- backup JSON

## V0.2 — Airtable Bridge ✅ CLOSED / VERIFIED PROD
- snapshot Airtable canonique
- IDs Airtable conservés
- photos durables dans `assets/items/`
- Worker write-only sécurisé
- queue offline create/update/delete
- idempotence via `Sync Mutation ID`
- tombstones anti-résurrection
- round-trip réel CREATE + photo / UPDATE / DELETE vérifié

## V0.3 — Outfits ✅ CLOSED / VERIFIED PROD

### V0.3-A — Local Outfit Core ✅
- store IndexedDB `outfits`
- création / modification / suppression
- occasion / saison / note / favoris
- backup vêtements + outfits

### V0.3-A.1 — Scalable Outfit Picker ✅
- recherche / filtres / favoris / sélectionnés
- ruban sélectionné
- scroll interne
- conçu pour 100+ articles

### V0.3-B — Canonical Outfit Persistence ✅
- table Airtable dédiée
- linked records vêtements
- UUID `Outfit ID`
- queue Outfit séparée
- CREATE / UPDATE / DELETE / snapshot / anti-résurrection vérifiés

### V0.3-C — Outfit Presentation ✅
- Lookbook plein écran
- PNG 1080×1350
- Web Share + fallback sauvegarde
- validation utilisateur finale

## V0.4 — Smart Closet 🟡 ACTIVE

### V0.4-A — Analyse photo assistée ✅ CLOSED / VERIFIED PROD

Fondations :
- Cloudflare Workers AI authentifié
- analyse seulement après action explicite
- proposition séparée du formulaire
- `Áp dụng gợi ý` avant pré-remplissage
- sauvegarde normale avant toute écriture canonique

Reliability Pass :
- `Underwear` / `Đồ lót`
- `Headwear` / `Mũ / nón`
- `Umbrella` / `Ô / dù`
- 2 passes vision + rescue serveur
- jusqu'à 3 analyses complètes automatiques côté client sur un seul clic
- indicateur de fiabilité
- anti-loop `RESULT_CODE_HUNG`
- QA réel PASS : chaussures DC, boxer, casquette, parapluie

Polish de fermeture v0.4.4 :
- `Brown` / `Nâu` ajouté à Airtable + PWA + Worker
- distinction brown/tan/camel renforcée
- preview photo full-frame durcie

### V0.4-B — Duplicate Guard 🟡 ACTIVE NEXT
- comparaison visuelle locale avant création
- comparaison catégorie / couleurs / styles / nom
- score explicable et liste des candidats proches
- avertissement seulement au-dessus d'un seuil utile
- possibilité de continuer malgré l'alerte
- aucun merge/delete automatique
- offline-first, pas de nouveau secret

### V0.4-C — Smart Tags ⏳ QUEUED
- suggestions de tags explicables et éditables
- tags utiles à la recherche et aux outfits
- préparation des signaux pour l'assistant V0.5

## V0.5 — Assistant
- “Hôm nay mặc gì?”
- météo locale
- suggestions d'outfits
- historique des tenues
- rareté d'utilisation

## V1.0 — Daily Driver
- auth privée
- notifications optionnelles
- polish iPhone
- install UX VN/FR
