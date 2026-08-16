# Roadmap — Trân Closet PWA

## V0.1 — Local Closet ✅
- PWA installable
- offline shell
- IndexedDB
- CRUD local de base
- photos locales compressées
- recherche / filtres / favoris
- sauvegarde JSON

## V0.2 — Airtable Bridge 🟡

### V0.2-A — Canonical read sync ✅
- snapshot Airtable versionné dans GitHub
- IDs Airtable conservés dans IndexedDB
- copie durable des photos Airtable vers `assets/items/`
- sync GitHub Actions manuelle + planifiée toutes les 6 h
- token Airtable uniquement dans GitHub Actions Secret
- fusion snapshot → stockage local en préservant les favoris
- redéploiement Pages après sync bot

### V0.2-B — Secure write bridge ✅ code / 🟡 activation Worker
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
- remplacement de photo d'un article existant reporté à une tranche durcie

### V0.2-C — Activation & verified write sync
- déployer `worker/`
- configurer le PAT Airtable write-only/scopé et `CLOSET_SYNC_KEY`
- connecter l'iPhone de Trân au Worker
- test réel create → photo → update → delete
- reread Airtable + snapshot pour confirmer chaque write
- fermer V0.2 quand le round-trip est vérifié

## V0.3 — Outfits
- table Outfit
- composition multi-items
- occasion / saison / note
- favoris outfits
- vue plein écran partageable

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
