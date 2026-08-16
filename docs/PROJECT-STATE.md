# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- version production vérifiée : `v0.3.3`
- stockage local production : IndexedDB `tran-closet`, schema version 4

## Phase

- **dernière phase close : V0.3 — Outfits**
- **phase active : V0.4 — Smart Closet**
- **dernière slice vérifiée : V0.3-C — Outfit Presentation**
- prochaine tranche : **V0.4-A — analyse photo assistée**

## V0.2 — État vérifié

Le bridge vêtements est vérifié en production de bout en bout :

- CREATE avec upload photo
- UPDATE du même Airtable record
- DELETE
- reread Airtable
- snapshot GitHub Actions
- redéploiement Pages
- idempotence create via `Sync Mutation ID`
- tombstones anti-résurrection
- réparation d'items locaux orphelins
- cache app network-first/no-store

Le test final a laissé le canonique à 3 vêtements réels, sans record jetable de test.

## V0.3-A — Contrat vérifié

Données outfit locales :
- `id`
- `name`
- `itemIds[]`
- `occasion`
- `season`
- `note`
- `favorite`
- `createdAt`
- `updatedAt`

Règles :
- minimum 2 vêtements à la création/édition
- références vers les `item.id` locaux stables
- si un vêtement est supprimé, sa référence est retirée des outfits
- backup JSON V3 contient `items` + `outfits`

## V0.3-A.1 — Scalable Outfit Picker vérifié

Le sélecteur d'articles est conçu pour un catalogue large (100+ vêtements) :

- recherche par nom, catégorie, couleur et style
- filtres catégories horizontaux
- filtres favoris et sélectionnés
- compteur résultats / total et compteur sélection
- ruban horizontal des vêtements déjà sélectionnés avec retrait rapide
- grille filtrée à scroll interne
- bouton de sauvegarde sticky dans le formulaire Outfit

## V0.3-B — CLOSED / VERIFIED PROD

Schéma canonique dans la même base Airtable :

- table `Trân's Outfits` : `tblhtL2UlsgCAh6E7`
- `Name`
- `Items` : linked records vers `Trân's Clothes`
- `Occasion`
- `Season`
- `Note`
- `Favorite`
- `Outfit ID` : UUID stable et clé d'idempotence
- `Created At` / `Updated At` : timestamps ISO-8601

Architecture vérifiée :

- IndexedDB schema v4 avec queue `outfitMutations` séparée
- `putOutfit()` / `deleteOutfit()` queue automatiquement les writes sans modifier l'UI
- Worker : endpoint séparé `/v1/outfit-mutations`
- CREATE Outfit via Airtable upsert sur `Outfit ID`
- UPDATE / DELETE idempotents
- une mutation Outfit attend si un vêtement sélectionné n'a pas encore son `airtableRecordId`
- snapshot séparé `airtable-outfit-snapshot.js`
- bridge séparé avec protection pending writes, `cloudWriteAt` et tombstones anti-résurrection
- diagnostic v0.3.2 expose séparément queues vêtements/outfits
- le bridge vêtements existant reste isolé

Vérifications production réalisées le 16/08/2026 :

1. CI V0.3-B verte
2. Worker v0.3.2 déployé avec health check authentifié
3. smoke Worker Outfit CREATE → UPDATE → DELETE avec deux vrais linked records
4. snapshot Outfit GitHub Actions lu avec le PAT read-only existant
5. migration automatique du vrai outfit local `test` vers Airtable sans doublon
6. reread snapshot du même UUID / record Airtable en état `synced`
7. UPDATE réel depuis la PWA sur le même record sans duplication
8. DELETE réel depuis la PWA → Airtable revenu à 0 outfit
9. snapshot post-delete à `recordCount: 0`, aucune résurrection

**V0.3-B est close et vérifiée en production.**

## V0.3-C — CLOSED / VERIFIED PROD

Couche de présentation ajoutée sans modifier le modèle de données ni la sync :

- module `outfit-presentation.js` séparé du CRUD Outfit
- vue Lookbook plein écran avec safe-area mobile/iPhone
- composition visuelle premium et transitions avec respect de `prefers-reduced-motion`
- génération locale d'une carte PNG 1080×1350 depuis les photos déjà présentes dans la PWA
- pré-génération de la carte à l'ouverture afin de conserver le geste utilisateur requis par Web Share
- partage natif de fichier via Web Share API quand disponible
- fallback sauvegarde PNG quand le partage de fichier n'est pas disponible
- aucune URL publique d'outfit : le partage image ne publie pas la garde-robe
- jusqu'à 4 pièces visibles sur la carte, avec compteur `+N` pour les outfits plus grands
- aucune modification `app.js`, `db.js`, Worker ou Airtable

Vérifications production :

1. CI PR #12 verte
2. déploiement Pages v0.3.3 réussi sur le commit `1d9f7f8c793a30bccf655274d0e5cc6cc2eddd94`
3. rendu Lookbook généré vérifié avec photos, titre, occasion/saison et branding
4. fichier PNG `tran-closet-lookbook-test.png` généré et transmis à la feuille de partage système
5. fallback image et logique Web Share intégrés sans toucher au CRUD/sync
6. validation utilisateur finale : **VERIFIED PROD**

**V0.3 est désormais close.**

## V0.4 — Smart Closet

Prochaine direction produit :

- analyse photo IA : catégorie, couleurs, styles
- validation humaine avant sauvegarde
- détection de doublons
- suggestions de tags

Le principe canonique pour V0.4 reste : **l'IA propose, Trân valide avant toute écriture canonique**.

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
