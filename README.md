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
- **V0.3-C Outfit Presentation** ✅ VERIFIED PROD
- **V0.4 Smart Closet** 🟡 active

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

## V0.3 — Outfits ✅ CLOSED

L'onglet **Phối đồ** est fonctionnel, offline-first et synchronisé :

- création d'un outfit à partir d'au moins deux vêtements ;
- nom, occasion, saison et note ;
- favoris outfits ;
- modification et suppression ;
- picker scalable avec recherche, filtres, favoris/sélectionnés et scroll interne ;
- linked records Airtable vers les vêtements ;
- queue Outfit séparée, idempotence, pending-write protection et tombstones anti-résurrection ;
- détail Lookbook plein écran ;
- génération locale d'une carte PNG 1080×1350 ;
- partage natif de fichier via Web Share quand disponible ;
- fallback sauvegarde PNG ;
- partage image retenu plutôt qu'un lien public afin de préserver le caractère privé/offline-first de la garde-robe.

### Vérification production Outfit

V0.3-B a validé le CRUD/sync de bout en bout : migration locale, CREATE, UPDATE, DELETE, snapshot retour canonique, absence de doublon et absence de résurrection.

V0.3-C a ensuite validé la couche présentation :

- PR #12 et CI vertes ;
- déploiement Pages v0.3.3 réussi ;
- rendu Lookbook vérifié avec photos et métadonnées ;
- fichier `tran-closet-lookbook-test.png` généré correctement ;
- fichier transmis à la feuille de partage système ;
- validation utilisateur finale **VERIFIED PROD**.

**V0.3 est close.**

## V0.4 — Smart Closet 🟡 ACTIVE

La prochaine phase ajoute une couche d'assistance intelligente sans retirer le contrôle utilisateur :

- analyse photo IA pour proposer catégorie, couleurs et styles ;
- pré-remplissage du formulaire ;
- validation humaine obligatoire avant sauvegarde ;
- détection de doublons probables avant création ;
- suggestions de tags éditables et explicables.

Principe produit : **l'IA propose, Trân valide avant toute écriture canonique.**

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
