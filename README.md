# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2 Airtable Bridge** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet** ✅ CLOSED / VERIFIED PROD — `v0.4.6`
- **V0.5 Assistant** 🟡 active
- **V0.5-A `Hôm nay mặc gì?`** 🟡 candidate `v0.5.0`

La PWA reste local-first : les ajouts, modifications et suppressions de vêtements et d'outfits sont appliqués immédiatement dans IndexedDB, puis envoyés vers Airtable via des files de mutations séparées lorsque le réseau et le Worker sont disponibles.

## Déploiement PWA

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## V0.4 — Smart Closet ✅ VERIFIED PROD

Le dressing dispose maintenant d'une analyse photo assistée human-in-the-loop, d'un Duplicate Guard perceptuel et de Smart Tags canoniques. Les flows réels PWA → Worker → Airtable → snapshot ont été vérifiés en production.

## V0.5-A — `Hôm nay mặc gì?` 🟡 CANDIDATE v0.5.0

Le premier assistant quotidien est une surcouche locale : aucun nouveau secret, aucun nouveau champ Airtable, aucune modification du CRUD vêtements.

Fonctionnalités candidate :
- CTA **`Hôm nay mặc gì?`** sur la home du dressing ;
- météo actuelle, ressenti, max/min, pluie et vent via Open-Meteo ;
- TP. Hồ Chí Minh comme localisation par défaut ;
- recherche manuelle d'une ville via Open-Meteo Geocoding ;
- géolocalisation navigateur uniquement après action explicite ;
- cache météo local 30 minutes, lié aux coordonnées ;
- recalcul par occasion : quotidien, travail, date, fête, voyage, sport, formel ;
- ranking des outfits déjà enregistrés ;
- création locale de propositions top + bottom ou pièce unique ;
- ajout contextuel de chaussures, sac, couvre-chef et parapluie ;
- signaux catégories, couleurs, styles, favoris et Smart Tags ;
- explication courte de chaque suggestion ;
- diversité entre les 3 meilleurs looks ;
- fallback propre si le dressing n'a pas encore assez de pièces de base ;
- **aucune sauvegarde automatique** : `Lưu thành outfit` reste une action explicite ;
- minimum 2 pièces pour créer un outfit ;
- pas de doublon si la même composition existe déjà dans `Phối đồ`.

Le moteur est isolé dans `js/daily-assistant-core.mjs` avec tests unitaires ciblés. Le module UI est `js/daily-assistant.js`.

## V0.5 — suite

### V0.5-B — Historique & rotation
- historique des tenues portées ;
- dernière utilisation ;
- rareté / vêtements sous-utilisés ;
- signal de rotation pour réduire les répétitions.

### V0.5-C — Assistant conversationnel
- questions simples autour du dressing ;
- préparation d'une tenue pour une occasion future ;
- explications détaillées à la demande.

## Infrastructure

`.github/workflows/sync-airtable.yml` génère les snapshots vêtements/outfits avec le PAT read-only. `worker/` contient le backend Cloudflare sécurisé ; `.github/workflows/deploy-worker.yml` le déploie et vérifie `/health`.

Secrets Actions :
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `AIRTABLE_PAT_WRITE`
- `CLOSET_SYNC_KEY`

## Développement local

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Documentation projet

- état canonique : `docs/PROJECT-STATE.md`
- roadmap : `docs/ROADMAP.md`
