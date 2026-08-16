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
- outfits explicitement local-only dans cette tranche

### V0.3-A.1 — Scalable Outfit Picker ✅
- recherche nom / catégorie / couleur / style
- filtres catégories adaptés aux gros catalogues
- filtres favoris et sélectionnés
- compteur de résultats + compteur de sélection
- ruban des vêtements déjà sélectionnés avec retrait rapide
- grille filtrée à scroll interne
- sauvegarde Outfit accessible pendant le browsing
- conçu pour 100+ articles sans modifier le modèle Outfit

### V0.3-B — Canonical Outfit Persistence
- définir le schéma canonique Outfit
- décider Airtable table dédiée vs autre stockage canonique
- sync create/update/delete des outfits
- stratégie idempotence / retry / conflits
- conserver le bridge vêtements intact

### V0.3-C — Outfit Presentation
- vue plein écran partageable
- composition/couverture plus premium
- partage image ou lien selon architecture retenue
- polish iPhone et transitions

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
