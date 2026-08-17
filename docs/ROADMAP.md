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

### V0.4-B — Duplicate Guard ✅ CLOSED / VERIFIED PROD
- dHash perceptuel local 64 bits
- distance de Hamming + score visuel
- comparaison catégorie / couleurs / styles / nom
- maximum 80 candidats visuels
- jusqu'à 3 candidats proches affichés avec raisons
- warning/cancel/bypass vérifiés réellement
- doublon volontaire supprimé depuis la PWA
- snapshot post-delete à 3 records, anti-résurrection vérifiée
- aucun merge/delete automatique

### V0.4-C — Smart Tags 🟡 CANDIDATE v0.4.6
- PR #23 mergée après ré-ancrage sur V0.4-B vérifiée
- champ Airtable canonique `Tags`
- vocabulaire fixe de 22 tags
- tags éditables, visibles et recherchables
- recherche Outfit par tags
- suggestions IA explicables jusqu'à 5 tags
- compatibilité vieux clients
- Worker v0.4.6 + health SUCCESS
- smoke Worker → Airtable → snapshot → restauration SUCCESS
- smoke contrat IA Smart Tags SUCCESS
- QA PWA utilisateur encore requis avant CLOSED / VERIFIED PROD

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
