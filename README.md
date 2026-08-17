# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2 Airtable Bridge** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet** 🟡 active
- **V0.4-A Photo AI Assistant** ✅ CLOSED / VERIFIED PROD
- **V0.4-B Duplicate Guard** 🟡 candidate `v0.4.5`

La PWA reste local-first : les ajouts, modifications et suppressions de vêtements et d'outfits sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via des files de mutations séparées lorsque le réseau et le Worker sont disponibles.

## Déploiement PWA

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## V0.2 — Sync vêtements ✅ VERIFIED PROD

Flux canonique :

`PWA / IndexedDB → file de mutations → Worker authentifié → Airtable → snapshot GitHub → PWA`

Le bridge vêtements prend en charge CREATE + photo, UPDATE, DELETE, retry offline, idempotence via `Sync Mutation ID`, tombstones anti-résurrection et protection contre snapshots plus anciens. Le round-trip réel a été vérifié en production.

## V0.3 — Outfits ✅ VERIFIED PROD

**Phối đồ** fournit création/édition/suppression, picker scalable 100+, persistance Airtable par linked records, queue offline séparée, Lookbook plein écran, PNG 1080×1350 et Web Share. CRUD, snapshot retour et anti-résurrection sont vérifiés.

## V0.4-A — Analyse photo assistée ✅ VERIFIED PROD

Principe : **l'IA propose, Trân valide avant toute écriture canonique.**

Le pipeline validé utilise LLaVA pour la vision, Llama 4 pour la classification structurée, plusieurs passes vision, retry client automatique, indicateurs de fiabilité et les catégories `Underwear`, `Headwear`, `Umbrella`. Le QA réel a passé chaussures DC, boxer, casquette et parapluie.

Le polish v0.4.4 ajoute `Brown / Nâu` jusque dans Airtable/PWA/Worker et durcit la preview full-frame.

## V0.4-B — Duplicate Guard 🟡 CANDIDATE v0.4.5

Objectif : repérer un article probablement déjà présent avant sa création, sans bloquer un ajout légitime.

La candidate utilise :
- un dHash perceptuel 64 bits calculé localement ;
- une distance de Hamming pour la proximité visuelle ;
- catégorie, couleurs, styles et nom pour le contexte ;
- un score explicable avec jusqu'à 3 candidats proches ;
- un cache local des fingerprints ;
- une limite de 80 candidats visuels pour rester fluide avec un gros catalogue.

UX :
- si rien de suffisamment proche n'est trouvé, la sauvegarde continue normalement ;
- si un doublon probable est trouvé, rien n'est encore créé ;
- `Quay lại kiểm tra` laisse corriger le formulaire ;
- `Vẫn lưu món này` permet explicitement de passer outre ;
- aucun merge/delete automatique ;
- si le guard plante, il échoue ouvert et ne bloque pas la garde-robe ;
- aucun Worker, nouveau secret ou appel cloud n'est requis pour cette détection.

**V0.4-B reste candidate tant que le warning + bypass n'ont pas été testés réellement dans la PWA.**

## V0.4-C — Smart Tags ⏳
- suggestions de tags explicables et éditables ;
- tags utiles aux recherches, outfits et futur assistant.

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
