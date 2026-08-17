# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production / candidate

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- dernière production totalement close : `v0.4.6` — V0.4-C Smart Tags
- phase active : `V0.5` — Assistant
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **V0.2 — Airtable Bridge : CLOSED / VERIFIED PROD**
- **V0.3 — Outfits : CLOSED / VERIFIED PROD**
- **V0.4-A — Analyse photo assistée : CLOSED / VERIFIED PROD**
- **V0.4-B — Duplicate Guard : CLOSED / VERIFIED PROD**
- **V0.4-C — Smart Tags : CLOSED / VERIFIED PROD**
- **V0.5 — Assistant : ACTIVE**

## V0.2 — CLOSED / VERIFIED PROD

Bridge vêtements vérifié de bout en bout : CREATE + photo, UPDATE, DELETE, retry offline, idempotence `Sync Mutation ID`, snapshot canonique, tombstones anti-résurrection et protection contre snapshots plus anciens.

## V0.3 — CLOSED / VERIFIED PROD

Outfits offline-first + picker 100+, persistance Airtable par linked records, queue séparée, CREATE/UPDATE/DELETE vérifiés, Lookbook plein écran, PNG 1080×1350 et Web Share validé.

## V0.4-A — Analyse photo assistée — CLOSED / VERIFIED PROD

Contrat human-in-the-loop validé. Pipeline Workers AI LLaVA + Llama 4 structuré, multi-pass + rescue, retry client automatique, fiabilité explicite, taxonomie `Underwear`, `Headwear`, `Umbrella`, polish `Brown / Nâu`, preview full-frame. QA réel PASS : chaussures DC, boxer, casquette, parapluie.

## V0.4-B — Duplicate Guard — CLOSED / VERIFIED PROD

QA réel PASS : warning avant écriture, `Quay lại kiểm tra` sans création, bypass explicite `Vẫn lưu món này`, création volontaire d'un doublon distinct, suppression PWA du doublon, retour Airtable à 3 records et snapshot post-delete sans résurrection.

Le Duplicate Guard utilise un dHash perceptuel local 64 bits + métadonnées, affiche des raisons et ne merge/supprime jamais automatiquement.

## V0.4-C — Smart Tags — CLOSED / VERIFIED PROD

PR #23 `V0.4-C — Canonical Smart Tags` mergée sur `main`. Worker v0.4.6 déployé et `/health` authentifié SUCCESS.

Modèle canonique :
- champ Airtable `Tags` : `fld9hV9qirpfVfJmM` ;
- vocabulaire fermé de 22 tags ;
- tags éditables dans création/édition ;
- tags visibles dans le détail ;
- recherche vêtements + Outfit Picker par clés et labels vietnamiens ;
- backup JSON v4 ;
- mutation PWA → Worker → Airtable avec `tags[]` ;
- snapshot Airtable → PWA avec Tags ;
- compatibilité vieux clients : un payload sans propriété `tags` préserve les tags Airtable existants.

IA Smart Tags :
- 0–5 tags maximum ;
- uniquement issus du vocabulaire canonique ;
- `tagReason` court et explicable ;
- `Áp dụng gợi ý` applique les tags au formulaire avec catégorie/couleurs/styles ;
- tous les tags restent éditables avant sauvegarde.

Gates production vérifiées :
- CI complète verte ;
- smoke réversible Worker → Airtable → snapshot → restauration SUCCESS ;
- smoke IA : HTTP 200, tags conformes à la taxonomie et `tagReason` présent ;
- **QA PWA réel PASS** : création de `VietCap` et `Jerry's Panty` depuis l'interface v0.4.6 ;
- Airtable canonique : `VietCap` = `Headwear`, `Green + Red`, tags `Graphic + Logo` ; `Jerry's Panty` = `Underwear`, `Green`, tags `Graphic + Text` ;
- snapshot canonique post-QA SUCCESS : `recordCount: 5`, mêmes catégories/couleurs/tags relus depuis Airtable ;
- aucun tag temporaire de smoke restant.

Les cartes compactes de collection continuent d'afficher principalement catégorie/couleurs ; les Smart Tags sont conservés canoniquement et exploités par détail/recherche/Outfit Picker.

Principe canonique : **l'IA et les heuristiques proposent, Trân décide avant toute écriture destructrice ou canonique.**

## V0.5 — Assistant — ACTIVE

Objectif produit : `Hôm nay mặc gì?` — proposer des tenues utiles à partir du vrai dressing, sans modifier automatiquement les données.

Premiers axes :
- météo locale ;
- suggestions d'outfits à partir des catégories, couleurs, styles et Smart Tags ;
- contexte occasion/saison ;
- historique des tenues ;
- rareté d'utilisation / rotation du dressing ;
- explication courte de chaque recommandation ;
- validation explicite de Trân avant toute création d'outfit canonique.

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- palettes/couleurs fines au-delà des couleurs canoniques
