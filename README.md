# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2 Airtable Bridge** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet** 🟡 active
- **V0.4-A Photo AI Assistant** ✅ CLOSED / VERIFIED PROD
- **V0.4-B Duplicate Guard** ✅ CLOSED / VERIFIED PROD
- **V0.4-C Smart Tags** 🟡 candidate `v0.4.6` — backend/snapshot/IA vérifiés, QA PWA utilisateur en attente

La PWA reste local-first : les ajouts, modifications et suppressions de vêtements et d'outfits sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via des files de mutations séparées lorsque le réseau et le Worker sont disponibles.

## Déploiement PWA

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## V0.2 — Sync vêtements ✅ VERIFIED PROD

Flux canonique :

`PWA / IndexedDB → file de mutations → Worker authentifié → Airtable → snapshot GitHub → PWA`

CREATE + photo, UPDATE, DELETE, retry offline, idempotence via `Sync Mutation ID`, tombstones anti-résurrection et snapshots canoniques sont vérifiés en production.

## V0.3 — Outfits ✅ VERIFIED PROD

**Phối đồ** fournit création/édition/suppression, picker scalable 100+, persistance Airtable par linked records, queue offline séparée, Lookbook plein écran, PNG 1080×1350 et Web Share. CRUD, snapshot retour et anti-résurrection sont vérifiés.

## V0.4-A — Analyse photo assistée ✅ VERIFIED PROD

Principe : **l'IA propose, Trân valide avant toute écriture canonique.**

Pipeline validé : LLaVA pour la vision, Llama 4 pour la classification structurée, plusieurs passes vision, retry client automatique, indicateurs de fiabilité, catégories `Underwear`, `Headwear`, `Umbrella`, couleur `Brown / Nâu`, preview full-frame. QA réel : chaussures DC, boxer, casquette et parapluie.

## V0.4-B — Duplicate Guard ✅ VERIFIED PROD

Le Duplicate Guard repère localement un article probablement déjà présent avant création : dHash perceptuel 64 bits, distance de Hamming, métadonnées, score explicable et jusqu'à 3 candidats proches.

Le parcours réel a été vérifié : warning avant écriture, `Quay lại kiểm tra` sans création, bypass explicite `Vẫn lưu món này`, création d'un doublon volontaire distinct, suppression PWA du doublon, retour Airtable à 3 records et snapshot post-delete sans résurrection.

Le guard n'effectue jamais de merge/delete automatique et n'a besoin d'aucun nouveau secret ni appel cloud.

## V0.4-C — Smart Tags 🟡 CANDIDATE v0.4.6

La PR #23 est mergée sur `main` et le Worker v0.4.6 est déployé.

Fonctionnalités :
- champ Airtable canonique `Tags` ;
- vocabulaire fixe de 22 tags avec labels vietnamiens ;
- tags éditables dans création/édition et visibles dans le détail ;
- recherche vêtements et Outfit Picker par tags ;
- backup JSON v4 ;
- sync PWA → Worker → Airtable et snapshot retour avec Tags ;
- suggestions IA de 0–5 tags maximum, strictement dans la taxonomie, avec `tagReason` ;
- `Áp dụng gợi ý` applique aussi les tags, toujours éditables avant sauvegarde ;
- vieux clients protégés : un payload qui omet `tags` ne les efface pas.

Gates déjà passées : Worker + health SUCCESS, round-trip réversible `Cozy` via Worker/Airtable/snapshot/restauration SUCCESS, contrat IA Smart Tags SUCCESS. Le cleanup final laisse exactement 3 vêtements canoniques et aucun tag temporaire.

La seule gate restante avant **CLOSED / VERIFIED PROD** est le QA PWA utilisateur : affichage/édition Tags, suggestion IA + raison, application, correction manuelle et vraie sauvegarde PWA.

## Infrastructure

`.github/workflows/sync-airtable.yml` génère les snapshots vêtements/outfits avec le PAT read-only. `worker/` contient le backend Cloudflare sécurisé ; `.github/workflows/deploy-worker.yml` le déploie et vérifie `/health`.

Secrets Actions :
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `AIRTABLE_PAT_WRITE`
- `CLOSET_SYNC_KEY`

## Développement local

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Documentation projet

- état canonique : `docs/PROJECT-STATE.md`
- roadmap : `docs/ROADMAP.md`
