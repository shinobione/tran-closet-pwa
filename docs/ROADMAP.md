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
- Worker sécurisé
- queue offline create/update/delete
- idempotence + anti-résurrection
- round-trip réel CREATE + photo / UPDATE / DELETE vérifié

## V0.3 — Outfits ✅ CLOSED / VERIFIED PROD
- Outfit Core offline-first
- picker scalable 100+
- persistance Airtable + linked records
- queue Outfit séparée
- Lookbook + PNG + Web Share
- CRUD/snapshot/anti-résurrection vérifiés

## V0.4 — Smart Closet 🟡 ACTIVE

### V0.4-A — Analyse photo assistée ✅ CLOSED / VERIFIED PROD
- Workers AI human-in-the-loop
- vision multi-pass + rescue
- retry client automatique
- `Underwear`, `Headwear`, `Umbrella`
- `Brown / Nâu`
- indicateurs de fiabilité
- preview full-frame
- QA réel PASS : chaussures, boxer, casquette, parapluie

### V0.4-B — Duplicate Guard 🟡 CANDIDATE v0.4.5
- dHash perceptuel local 64 bits
- distance de Hamming + score visuel
- comparaison catégorie / couleurs / styles / nom
- maximum 80 candidats visuels pour gros catalogue
- cache des fingerprints local à la session
- jusqu'à 3 candidats proches affichés avec raisons
- warning avant création seulement au-dessus d'un seuil utile
- `Quay lại kiểm tra` : aucune création
- `Vẫn lưu món này` : bypass explicite
- fail-open si le guard rencontre une erreur
- aucun merge/delete automatique
- offline-first, aucun nouveau secret
- QA utilisateur requis avant VERIFIED PROD

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
