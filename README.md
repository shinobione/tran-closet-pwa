# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2-A Canonical Airtable read sync** ✅ actif
- **V0.2-B Offline-first secure write bridge** ✅ vérifié en production
- **V0.2-C Worker deployment & round-trip verification** ✅ clos
- **V0.3-A Local Outfits Core** ✅ actif

La PWA reste local-first : les ajouts, modifications et suppressions de vêtements sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via une file de mutations dès que le réseau et le Worker sont disponibles. Les favoris des vêtements restent locaux et ne génèrent aucune écriture Airtable.

Les outfits de V0.3-A sont eux aussi stockés localement dans IndexedDB. Leur synchronisation Airtable est volontairement différée à une tranche dédiée afin de ne pas mélanger le nouveau modèle Outfit avec le bridge vêtements déjà stabilisé.

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

## V0.2-B/C — Écriture sécurisée et round-trip vérifié

`worker/` contient le backend Cloudflare Worker. Le navigateur ne reçoit jamais le PAT Airtable.

Flux :

`PWA / IndexedDB → file de mutations → Worker authentifié → Airtable → snapshot GitHub → PWA`

Le bridge prend en charge :

- création d'un article, avec photo ;
- modification du nom, de la catégorie, des couleurs et des styles ;
- suppression ;
- retry automatique après retour du réseau ;
- retry séparé de la photo si le record a été créé mais que l'upload de l'image a échoué ;
- tombstones de suppression pour empêcher un vieux snapshot de ressusciter un article ;
- protection des écritures récentes contre un snapshot plus ancien ;
- création idempotente grâce au champ Airtable technique `Sync Mutation ID`, donc un retry réseau ne crée pas de doublon ;
- réparation d'anciens items locaux sans mutation ni `airtableRecordId` ;
- stratégie de cache PWA network-first/no-store pour éviter un client de sync périmé.

### Vérification production

Le 16 août 2026, le round-trip réel a été vérifié de bout en bout :

- **CREATE + photo** depuis la PWA → Airtable ;
- **UPDATE** du même record sans duplication ni perte de photo ;
- **DELETE** d'un record jetable depuis la PWA ;
- reread Airtable après chaque opération ;
- snapshot canonique post-write/post-delete ;
- absence de doublon et absence de résurrection après reread.

V0.2 est donc **clos côté produit et infrastructure**.

Le remplacement de la photo d'un article existant reste volontairement reporté à une tranche dédiée afin de conserver des sémantiques d'attachment sûres.

### Déploiement Cloudflare via GitHub Actions

`.github/workflows/deploy-worker.yml` déploie `worker/` avec Wrangler puis vérifie l'endpoint authentifié `/health`.

Secrets GitHub Actions nécessaires :

- `CLOUDFLARE_API_TOKEN` ;
- `CLOUDFLARE_ACCOUNT_ID` ;
- `AIRTABLE_PAT_WRITE` ;
- `CLOSET_SYNC_KEY`.

Le workflow transmet `AIRTABLE_PAT_WRITE` au Worker sous le nom runtime `AIRTABLE_PAT`. Aucun de ces secrets n'est commité dans le repo.

## V0.3-A — Outfits locaux

L'onglet **Phối đồ** est maintenant fonctionnel et offline-first :

- création d'un outfit à partir d'au moins deux vêtements ;
- nom, occasion, saison et note ;
- favoris outfits ;
- modification et suppression ;
- détail avec composition visuelle et accès aux vêtements associés ;
- nettoyage des références si un vêtement est supprimé ;
- persistance dans un store IndexedDB `outfits` ;
- export/import JSON incluant les outfits.

Cette tranche est **local-only**. La persistance canonique/synchronisation des outfits sera traitée séparément.

## Développement local

La PWA doit être servie en HTTP(S) :

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

Le Worker se trouve dans `worker/` et utilise Wrangler.

## Documentation projet

- état canonique : `docs/PROJECT-STATE.md`
- roadmap : `docs/ROADMAP.md`
