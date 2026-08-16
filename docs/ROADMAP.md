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

### V0.2-B — Secure write bridge
- backend sécurisé
- sync create/update/delete PWA → Airtable
- uploads photos côté backend
- stratégie de conflits simple
- file offline de mutations et retry explicite
- état de sync visible par item

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
