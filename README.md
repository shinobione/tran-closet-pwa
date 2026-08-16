# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2-A Canonical Airtable read sync** ✅ actif
- **V0.2-B Offline-first secure write bridge** ✅ côté code, activation du Worker requise

La PWA reste local-first : les ajouts, modifications et suppressions sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via une file de mutations dès que le réseau et le Worker sont disponibles. Les favoris restent locaux et ne génèrent aucune écriture Airtable.

## Déploiement PWA

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## V0.2-A — Lecture Airtable canonique

Le navigateur **ne contacte jamais Airtable avec un secret**. `.github/workflows/sync-airtable.yml` exécute `scripts/sync-airtable.mjs` côté GitHub Actions :

1. lecture de la table Airtable canonique ;
2. téléchargement de la première photo de chaque article ;
3. copie durable dans `assets/items/` ;
4. génération de `js/airtable-snapshot.js` ;
5. commit automatique sur `main` uniquement si quelque chose a changé ;
6. redéploiement GitHub Pages automatique.

Le workflow est exécutable à la demande et planifié toutes les 6 heures.

Le secret GitHub `AIRTABLE_PAT` utilisé par ce workflow peut rester limité à `data.records:read` et à la base **Trân's Clothes**.

## V0.2-B — Écriture sécurisée et offline-first

`worker/` contient le backend Cloudflare Worker. Le navigateur ne reçoit jamais le PAT Airtable.

Flux :

`PWA / IndexedDB → file de mutations → Worker authentifié → Airtable`

Le bridge prend en charge :

- création d'un article, avec photo ;
- modification du nom, de la catégorie, des couleurs et des styles ;
- suppression ;
- retry automatique après retour du réseau ;
- retry séparé de la photo si le record a été créé mais que l'upload de l'image a échoué ;
- tombstones de suppression pour empêcher un vieux snapshot de ressusciter un article ;
- protection des écritures récentes contre un snapshot plus ancien ;
- création idempotente grâce au champ Airtable technique `Sync Mutation ID`, donc un retry réseau ne crée pas de doublon.

Le remplacement de la photo d'un article existant est volontairement reporté à une tranche dédiée afin de conserver des sémantiques d'attachment sûres.

### Déploiement Cloudflare via GitHub Actions

`.github/workflows/deploy-worker.yml` déploie `worker/` avec Wrangler puis vérifie l'endpoint authentifié `/health`.

Configurer une seule fois quatre **GitHub Actions repository secrets** :

- `CLOUDFLARE_API_TOKEN` : token Cloudflare autorisé à déployer des Workers sur le compte cible ;
- `CLOUDFLARE_ACCOUNT_ID` : identifiant du compte Cloudflare cible ;
- `AIRTABLE_PAT_WRITE` : PAT Airtable avec droits d'écriture, limité à **Trân's Clothes** ;
- `CLOSET_SYNC_KEY` : longue clé privée partagée uniquement entre le Worker et l'appareil de Trân.

Le workflow transmet `AIRTABLE_PAT_WRITE` au Worker sous le nom runtime `AIRTABLE_PAT`. Aucun de ces secrets n'est commité dans le repo.

Le workflow peut être lancé depuis GitHub Actions ou en touchant `.github/worker-deploy.trigger` sur `main` une fois les secrets configurés.

Une fois le Worker déployé, saisir une seule fois dans **Hồ sơ → Airtable** :

- l'URL du Worker ;
- la même `CLOSET_SYNC_KEY`.

La configuration est ensuite conservée localement sur l'appareil.

## Développement local

La PWA doit être servie en HTTP(S) :

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

Le Worker se trouve dans `worker/` et utilise Wrangler.

## Roadmap

Voir `docs/ROADMAP.md`.
