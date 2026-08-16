# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2-A Canonical Airtable read sync** ✅ actif
- **V0.2-B Offline-first secure write bridge** ✅ vérifié en production
- **V0.2-C Worker deployment & round-trip verification** ✅ clos
- **V0.3-A Local Outfits Core** ✅
- **V0.3-A.1 Scalable Outfit Picker** ✅
- **V0.3-B Canonical Outfit Persistence** ✅ vérifié en production
- **V0.3-C Outfit Presentation** 🟡 candidate v0.3.3

La PWA reste local-first : les ajouts, modifications et suppressions de vêtements **et d'outfits** sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via des files de mutations séparées dès que le réseau et le Worker sont disponibles. Les favoris des vêtements restent locaux ; les favoris outfits font partie du modèle Outfit canonique.

## Déploiement PWA

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## V0.2-A — Lecture Airtable canonique

Le navigateur **ne contacte jamais Airtable avec un secret**. `.github/workflows/sync-airtable.yml` exécute les scripts de snapshot côté GitHub Actions :

1. lecture de la table Airtable des vêtements ;
2. téléchargement de la première photo de chaque article ;
3. copie durable dans `assets/items/` ;
4. génération de `js/airtable-snapshot.js` ;
5. lecture de la table Airtable des outfits ;
6. génération de `js/airtable-outfit-snapshot.js` ;
7. commit automatique sur `main` uniquement si quelque chose a changé ;
8. redéploiement GitHub Pages automatique.

Le workflow est exécutable à la demande et planifié toutes les 6 heures.

Le secret GitHub `AIRTABLE_PAT` utilisé par ce workflow peut rester limité à `data.records:read` et à la base **Trân's Clothes**.

## V0.2-B/C — Écriture sécurisée vêtements et round-trip vérifié

`worker/` contient le backend Cloudflare Worker. Le navigateur ne reçoit jamais le PAT Airtable.

Flux :

`PWA / IndexedDB → file de mutations → Worker authentifié → Airtable → snapshot GitHub → PWA`

Le bridge vêtements prend en charge :

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

### Vérification production vêtements

Le 16 août 2026, le round-trip réel a été vérifié de bout en bout :

- **CREATE + photo** depuis la PWA → Airtable ;
- **UPDATE** du même record sans duplication ni perte de photo ;
- **DELETE** d'un record jetable depuis la PWA ;
- reread Airtable après chaque opération ;
- snapshot canonique post-write/post-delete ;
- absence de doublon et absence de résurrection après reread.

V0.2 est donc **clos côté produit et infrastructure**.

Le remplacement de la photo d'un article existant reste volontairement reporté à une tranche dédiée afin de conserver des sémantiques d'attachment sûres.

## V0.3 — Outfits

L'onglet **Phối đồ** est fonctionnel et offline-first :

- création d'un outfit à partir d'au moins deux vêtements ;
- nom, occasion, saison et note ;
- favoris outfits ;
- modification et suppression ;
- détail avec composition visuelle et accès aux vêtements associés ;
- nettoyage des références si un vêtement est supprimé ;
- persistance dans un store IndexedDB `outfits` ;
- export/import JSON incluant les outfits ;
- picker scalable avec recherche, filtres, sélectionnés/favoris et scroll interne pour les gros catalogues.

### V0.3-B — Persistance canonique Outfit

Les outfits sont maintenant synchronisés vers la table Airtable dédiée `Trân's Outfits` :

- linked records natifs vers `Trân's Clothes` ;
- `Outfit ID` UUID stable comme clé d'idempotence ;
- queue IndexedDB `outfitMutations` distincte de la queue vêtements ;
- endpoint Worker séparé `/v1/outfit-mutations` ;
- CREATE par upsert Airtable sur `Outfit ID` ;
- UPDATE / DELETE retry-safe ;
- attente automatique si un vêtement sélectionné n'a pas encore son `airtableRecordId` ;
- snapshot canonique séparé `js/airtable-outfit-snapshot.js` ;
- protection des pending writes et tombstones anti-résurrection.

### Vérification production Outfit

Le 16 août 2026, V0.3-B a été vérifiée de bout en bout :

- Worker v0.3.2 déployé + health check authentifié ;
- smoke CREATE → UPDATE → DELETE avec deux vrais linked records ;
- lecture snapshot avec le PAT read-only ;
- migration automatique du vrai outfit local `test` vers Airtable sans doublon ;
- reread canonique du même UUID / record ;
- UPDATE réel depuis la PWA sur le même record ;
- DELETE réel depuis la PWA ;
- Airtable revenu à 0 outfit ;
- snapshot post-delete à `recordCount: 0` et aucune résurrection.

**V0.3-B est donc CLOSED / VERIFIED PROD.**

### V0.3-C — Présentation Outfit (candidate v0.3.3)

La candidate ajoute une couche de présentation sans modifier le CRUD ni la sync :

- détail Outfit transformé en Lookbook plein écran sur mobile ;
- safe-area iPhone et transitions respectant `prefers-reduced-motion` ;
- génération locale d'une carte PNG 1080×1350 ;
- jusqu'à quatre pièces visibles sur la carte, avec compteur pour les outfits plus grands ;
- pré-génération de l'image à l'ouverture pour préserver le geste utilisateur requis par Safari ;
- partage natif via Web Share API avec fichier quand disponible ;
- fallback sauvegarde PNG ;
- partage image retenu plutôt qu'un lien public afin de préserver le caractère privé/offline-first de la garde-robe.

Cette tranche reste **candidate tant que le rendu et le partage n'ont pas été vérifiés sur téléphone réel**.

### Déploiement Cloudflare via GitHub Actions

`.github/workflows/deploy-worker.yml` déploie `worker/` avec Wrangler puis vérifie l'endpoint authentifié `/health`.

Secrets GitHub Actions nécessaires :

- `CLOUDFLARE_API_TOKEN` ;
- `CLOUDFLARE_ACCOUNT_ID` ;
- `AIRTABLE_PAT_WRITE` ;
- `CLOSET_SYNC_KEY`.

Le workflow transmet `AIRTABLE_PAT_WRITE` au Worker sous le nom runtime `AIRTABLE_PAT`. Aucun de ces secrets n'est commité dans le repo.

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
