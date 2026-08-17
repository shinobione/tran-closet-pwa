# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2 Airtable Bridge** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet** 🟡 active
- **V0.4-A Photo AI Assistant** ✅ CLOSED / VERIFIED PROD
- **V0.4-B Duplicate Guard** 🟡 active next

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

**Phối đồ** fournit :
- création/édition/suppression d'outfits ;
- picker scalable 100+ articles ;
- occasion, saison, note et favoris ;
- sync Airtable canonique avec linked records ;
- queue offline séparée ;
- Lookbook plein écran ;
- PNG 1080×1350 ;
- Web Share + fallback sauvegarde image.

CREATE, UPDATE, DELETE, snapshot retour et anti-résurrection sont vérifiés.

## V0.4-A — Analyse photo assistée ✅ VERIFIED PROD

Principe : **l'IA propose, Trân valide avant toute écriture canonique.**

Parcours :
1. choisir une photo ;
2. `Phân tích bằng AI` ;
3. recevoir catégorie/couleurs/styles proposés ;
4. `Áp dụng gợi ý` ;
5. corriger si besoin ;
6. sauvegarder normalement.

L'analyse seule ne modifie ni IndexedDB ni Airtable.

### Reliability Pass validé

- Workers AI authentifié ;
- LLaVA pour la vision + Llama 4 pour la classification structurée ;
- 2 passes vision + rescue serveur ;
- jusqu'à 3 analyses complètes automatiques côté client sur un seul clic ;
- conservation du meilleur résultat ;
- indicateurs de fiabilité ;
- `Underwear` / `Đồ lót` ;
- `Headwear` / `Mũ / nón` ;
- `Umbrella` / `Ô / dù` ;
- garde anti-boucle `RESULT_CODE_HUNG` ;
- QA utilisateur réel PASS sur chaussures DC, boxer, casquette et parapluie.

### Polish de fermeture v0.4.4

- `Brown` / `Nâu` ajouté jusque dans Airtable, la PWA et le Worker ;
- distinction brown/tan/camel renforcée ;
- preview photo full-frame durcie en `contain`.

**V0.4-A est CLOSED / VERIFIED PROD.**

## V0.4-B — Duplicate Guard 🟡

Objectif : repérer un article probablement déjà présent avant sa création, sans bloquer les ajouts légitimes.

Contrat :
- comparaison visuelle locale ;
- comparaison catégorie / couleurs / styles / nom ;
- score et explication compréhensibles ;
- candidats proches montrés à Trân ;
- possibilité de continuer malgré l'alerte ;
- aucun merge/delete automatique ;
- aucun nouveau secret ;
- fonctionnement offline-first.

## V0.4-C — Smart Tags ⏳
- suggestions de tags explicables et éditables ;
- tags utiles aux recherches, outfits et futur assistant.

## Infrastructure

### Lecture Airtable

`.github/workflows/sync-airtable.yml` génère les snapshots vêtements et outfits avec le secret read-only `AIRTABLE_PAT`.

### Écriture sécurisée

`worker/` contient le Cloudflare Worker. Le navigateur ne reçoit jamais le PAT Airtable.

`.github/workflows/deploy-worker.yml` déploie le Worker via Wrangler et vérifie `/health`.

Secrets GitHub Actions nécessaires :
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
