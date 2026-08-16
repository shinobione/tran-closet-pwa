# Roadmap — Trân Closet PWA

## V0.1 — Local Closet ✅
- PWA installable
- offline shell
- IndexedDB
- CRUD local de base
- photos locales compressées
- recherche / filtres / favoris
- sauvegarde JSON

## V0.2 — Airtable Bridge ✅ CLOSED

### V0.2-A — Canonical read sync ✅
- snapshot Airtable versionné dans GitHub
- IDs Airtable conservés dans IndexedDB
- copie durable des photos Airtable vers `assets/items/`
- sync GitHub Actions manuelle + planifiée toutes les 6 h
- token Airtable uniquement dans GitHub Actions Secret
- fusion snapshot → stockage local en préservant les favoris
- redéploiement Pages après sync bot

### V0.2-B — Secure write bridge ✅
- backend Cloudflare Worker sécurisé
- sync create/update/delete PWA → Airtable
- création avec upload photo côté Worker
- file IndexedDB de mutations et retry au retour du réseau
- état de sync visible par item
- favoris local-only
- compactage create/update/delete avant envoi
- retry photo séparé après création partielle
- tombstones de suppression
- protection contre snapshots plus anciens que les writes locaux
- création idempotente via Airtable `Sync Mutation ID`
- réparation des vieux items locaux orphelins
- cache applicatif durci contre le JS de sync périmé
- remplacement de photo d'un article existant reporté à une tranche dédiée

### V0.2-C — Activation & verified write sync ✅
- Worker Cloudflare déployé
- PAT Airtable write-only/scopé et `CLOSET_SYNC_KEY` configurés
- PWA connectée au Worker
- test réel create → photo → update → delete
- reread Airtable + snapshot après les writes
- vérification absence de doublon
- vérification anti-résurrection après delete
- **V0.2 fermé le 16/08/2026**

## V0.3 — Outfits 🟡 ACTIVE

### V0.3-A — Local Outfit Core ✅
- store IndexedDB `outfits`
- création multi-items (minimum 2)
- modification / suppression
- occasion / saison / note
- favoris outfits
- composition visuelle dans la liste et le détail
- navigation depuis un outfit vers ses vêtements
- références outfit nettoyées lorsqu'un vêtement est supprimé
- backup JSON V3 incluant vêtements + outfits
- fonctionnement offline-first

### V0.3-A.1 — Scalable Outfit Picker ✅
- recherche nom / catégorie / couleur / style
- filtres catégories adaptés aux gros catalogues
- filtres favoris et sélectionnés
- compteur de résultats + compteur de sélection
- ruban des vêtements déjà sélectionnés avec retrait rapide
- grille filtrée à scroll interne
- sauvegarde Outfit accessible pendant le browsing
- conçu pour 100+ articles sans modifier le modèle Outfit

### V0.3-B — Canonical Outfit Persistence ✅ CLOSED
- table Airtable dédiée `Trân's Outfits`
- linked records natifs vers `Trân's Clothes`
- UUID stable `Outfit ID` comme clé d'idempotence
- IndexedDB schema v4 + queue `outfitMutations` séparée
- auto-queue create/update/delete via couche DB sans modifier `app.js`
- endpoint Worker séparé `/v1/outfit-mutations`
- CREATE via upsert sur `Outfit ID`
- UPDATE / DELETE retry-safe
- blocage propre si un vêtement lié n'est pas encore synchronisé
- snapshot Airtable Outfit séparé + workflow 6 h/manual commun
- bridge snapshot avec pending-write protection et tombstones anti-résurrection
- diagnostic vêtements/outfits séparé
- Worker smoke CREATE → UPDATE → DELETE vérifié en prod
- migration du vrai outfit local vers Airtable sans doublon
- UPDATE réel PWA sur le même record vérifié
- DELETE réel PWA vérifié
- snapshot post-delete `recordCount: 0`, aucune résurrection
- **V0.3-B fermée le 16/08/2026**

### V0.3-C — Outfit Presentation 🟡 CANDIDATE v0.3.3
- détail Outfit en vue Lookbook plein écran mobile
- safe-area iPhone et fermeture toujours accessible
- composition/couverture premium avec transitions respectant `prefers-reduced-motion`
- génération locale d'une carte PNG 1080×1350
- pré-génération de l'image avant interaction de partage pour Safari/iPhone
- partage natif Web Share avec fichier quand disponible
- fallback sauvegarde image
- partage image choisi plutôt qu'un lien public afin de préserver le modèle privé/offline-first
- jusqu'à 4 pièces visibles sur la carte + compteur pour les outfits plus grands
- aucun changement du CRUD, IndexedDB, Worker ou Airtable
- reste à valider sur téléphone réel avant ✅

## V0.4 — Smart Closet
- analyse photo IA : catégorie, couleurs, styles
- validation humaine avant sauvegarde
- détection de doublons
- suggestions de tags

## V0.5 — Assistant
- “Hôm nay mặc gì?”
- météo locale
- suggestions d'outfits
- historique des tenues
- rareté d'utilisation

## V1.0 — Daily Driver
- sync robuste
- auth privée
- notifications optionnelles
- polish iPhone
- install UX VN/FR
