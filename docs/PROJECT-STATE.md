# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-16

## Production

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- version production vérifiée : `v0.3.1`
- stockage local production : IndexedDB `tran-closet`, schema version 3

## Phase

- **dernière phase close : V0.2 — Airtable Bridge**
- **phase active : V0.3 — Outfits**
- **dernière slice vérifiée : V0.3-A.1 — Scalable Outfit Picker**
- **candidate active : V0.3-B — Canonical Outfit Persistence / v0.3.2**
- prochaine tranche après vérification : **V0.3-C — Outfit Presentation**

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

## V0.3-B — Candidate v0.3.2

Schéma canonique créé dans la même base Airtable :

- table `Trân's Outfits` : `tblhtL2UlsgCAh6E7`
- `Name`
- `Items` : linked records vers `Trân's Clothes`
- `Occasion`
- `Season`
- `Note`
- `Favorite`
- `Outfit ID` : UUID stable et clé d'idempotence
- `Created At` / `Updated At` : timestamps ISO-8601

Architecture candidate :

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

À vérifier avant clôture V0.3-B :

1. CI PR verte
2. Worker v0.3.2 déployé + smoke CREATE/UPDATE/DELETE Outfit
3. snapshot Outfit GitHub Actions lisible avec le PAT read-only existant
4. migration réelle de l'outfit local existant vers Airtable sans doublon
5. reread snapshot → `synced`
6. test update + delete Outfit depuis la PWA

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- vue outfit partageable plein écran
- composition Outfit plus premium
- analyse photo IA
