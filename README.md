# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2 Airtable Bridge** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet** 🟡 active
- **V0.4-A.3 Photo AI Reliability Pass** 🟡 `v0.4.3` — candidate QA utilisateur

La PWA reste local-first : les ajouts, modifications et suppressions de vêtements et d'outfits sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via des files de mutations séparées lorsque le réseau et le Worker sont disponibles.

## Déploiement PWA

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## V0.2 — Sync vêtements ✅ VERIFIED PROD

Flux canonique :

`PWA / IndexedDB → file de mutations → Worker authentifié → Airtable → snapshot GitHub → PWA`

Le bridge vêtements prend en charge :
- CREATE avec photo ;
- UPDATE ;
- DELETE ;
- retry offline ;
- idempotence via `Sync Mutation ID` ;
- tombstones anti-résurrection ;
- protection contre les snapshots plus anciens.

Le round-trip réel a été vérifié de bout en bout en production.

## V0.3 — Outfits ✅ VERIFIED PROD

L'onglet **Phối đồ** permet :
- création/édition/suppression d'outfits ;
- picker scalable pour gros catalogue ;
- occasion, saison, note et favoris ;
- sync Airtable canonique via table Outfit séparée et linked records ;
- queue offline dédiée ;
- Lookbook plein écran ;
- génération PNG 1080×1350 ;
- partage natif Web Share avec fallback sauvegarde image.

CREATE, UPDATE, DELETE, snapshot retour et anti-résurrection ont été vérifiés en production.

## V0.4-A — Analyse photo assistée 🟡 v0.4.3

Principe produit : **l'IA propose, Trân valide avant toute écriture canonique.**

Parcours :
1. choisir une photo ;
2. cliquer explicitement `Phân tích bằng AI` ;
3. recevoir une proposition de catégorie, couleurs et styles ;
4. cliquer `Áp dụng gợi ý` pour copier la proposition dans le formulaire ;
5. corriger librement ;
6. sauvegarder avec le bouton normal.

L'analyse seule ne modifie ni IndexedDB ni Airtable.

### Reliability Pass V0.4-A.3

La candidate `v0.4.3` ajoute :
- taxonomie canonique enrichie avec `Underwear` (`Đồ lót`), `Headwear` (`Mũ / nón`) et `Umbrella` (`Ô / dù`) ;
- preview de la photo complète au lieu d'un cadrage visuellement trompeur ;
- deux passes vision serveur, avec troisième passe de secours si nécessaire ;
- règles plus strictes sur l'objet principal, les couleurs de fond et les styles ;
- niveaux `Tin cậy cao`, `Cần kiểm tra`, `Tin cậy thấp` ;
- retry automatique côté PWA : un seul clic utilisateur peut lancer jusqu'à trois analyses complètes, avec arrêt anticipé et conservation du meilleur résultat ;
- compteur de retries/passes lorsque le système a dû réessayer ;
- garde anti-boucle DOM corrigeant la régression `RESULT_CODE_HUNG` sur l'écran `Thêm`.

Le Worker stable a été redéployé et le contrat d'analyse a repassé un smoke sur les trois photos canoniques. La clôture de V0.4-A attend encore le QA utilisateur sur les cas réels qui avaient révélé les faiblesses : chaussures, boxer, casquette, parapluie et maillot.

## Suite V0.4

### V0.4-B — Duplicate Guard
- détection de doublons probables avant création ;
- comparaison visuelle + métadonnées ;
- décision finale laissée à l'utilisateur.

### V0.4-C — Smart Tags
- suggestions de tags utiles ;
- tags explicables et éditables.

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

La PWA doit être servie en HTTP(S) :

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Documentation projet

- état canonique : `docs/PROJECT-STATE.md`
- roadmap : `docs/ROADMAP.md`
