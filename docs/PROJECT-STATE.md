# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-16

## Production

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- version applicative : `v0.3.1`
- stockage local : IndexedDB `tran-closet`, schema version 3

## Phase

- **dernière phase close : V0.2 — Airtable Bridge**
- **phase active : V0.3 — Outfits**
- **slice active/implémentée : V0.3-A.1 — Scalable Outfit Picker**
- prochaine tranche canonique : **V0.3-B — Canonical Outfit Persistence**

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

## V0.3-A — Contrat

Les outfits sont stockés **localement uniquement** dans V0.3-A.

Données outfit :
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
- aucun write Airtable Outfit dans V0.3-A

## V0.3-A.1 — Scalable Outfit Picker

Le sélecteur d'articles est conçu pour un catalogue large (100+ vêtements) :

- recherche par nom, catégorie, couleur et style ;
- filtres catégories horizontaux ;
- filtres favoris et sélectionnés ;
- compteur résultats / total et compteur sélection ;
- ruban horizontal des vêtements déjà sélectionnés avec retrait rapide ;
- grille filtrée à scroll interne ;
- bouton de sauvegarde sticky dans le formulaire Outfit ;
- aucun changement du format Outfit ni du bridge Airtable vêtements.

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- synchronisation canonique des outfits
- vue outfit partageable plein écran
- analyse photo IA
