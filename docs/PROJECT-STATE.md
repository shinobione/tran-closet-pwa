# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production / candidate

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- dernière production totalement close : `v0.4.5` — V0.4-B Duplicate Guard
- candidate active : `v0.4.6` — V0.4-C Smart Tags
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **V0.2 — Airtable Bridge : CLOSED / VERIFIED PROD**
- **V0.3 — Outfits : CLOSED / VERIFIED PROD**
- **V0.4-A — Analyse photo assistée : CLOSED / VERIFIED PROD**
- **V0.4-B — Duplicate Guard : CLOSED / VERIFIED PROD**
- **V0.4-C — Smart Tags : MERGED / BACKEND VERIFIED / USER QA PENDING**

## V0.2 — CLOSED / VERIFIED PROD

Bridge vêtements vérifié de bout en bout : CREATE + photo, UPDATE, DELETE, retry offline, idempotence `Sync Mutation ID`, snapshot canonique, tombstones anti-résurrection et protection contre snapshots plus anciens.

## V0.3 — CLOSED / VERIFIED PROD

Outfits offline-first + picker 100+, persistance Airtable par linked records, queue séparée, CREATE/UPDATE/DELETE vérifiés, Lookbook plein écran, PNG 1080×1350 et Web Share validé.

## V0.4-A — Analyse photo assistée — CLOSED / VERIFIED PROD

Contrat human-in-the-loop validé. Pipeline Workers AI LLaVA + Llama 4 structuré, multi-pass + rescue, retry client automatique, fiabilité explicite, taxonomie `Underwear`, `Headwear`, `Umbrella`, polish `Brown / Nâu`, preview full-frame. QA réel PASS : chaussures DC, boxer, casquette, parapluie.

## V0.4-B — Duplicate Guard — CLOSED / VERIFIED PROD

QA réel PASS : warning avant écriture, `Quay lại kiểm tra` sans création, bypass explicite `Vẫn lưu món này`, création volontaire d'un doublon distinct, suppression PWA du doublon, retour Airtable à 3 records et snapshot post-delete sans résurrection.

Le Duplicate Guard utilise un dHash perceptuel local 64 bits + métadonnées, affiche des raisons et ne merge/supprime jamais automatiquement.

## V0.4-C — Smart Tags — CANDIDATE v0.4.6

PR #23 `V0.4-C — Canonical Smart Tags` mergée sur `main` après ré-ancrage sur V0.4-B vérifiée.

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

Gates déjà vérifiées en production :
- PR ré-ancrée et CI complète verte ;
- Worker v0.4.6 déployé + `/health` authentifié SUCCESS ;
- smoke réversible : Worker ajoute temporairement `Cozy` à Neck Poca → Airtable voit `Cozy` → le générateur de snapshot conserve `Cozy` → Worker retire `Cozy` → Airtable revient propre ;
- smoke IA : réponse HTTP 200, `analysis.tags` tableau de 0–5 valeurs, toutes dans la taxonomie, `tagReason` présent ;
- après cleanup : exactement 3 vêtements canoniques et aucun tag temporaire restant.

QA utilisateur requis avant CLOSED / VERIFIED PROD : vérifier dans la PWA réelle l'affichage/édition des Tags, une suggestion IA + raison, `Áp dụng gợi ý`, correction manuelle et sauvegarde PWA d'un tag, puis restauration.

Principe canonique : **l'IA et les heuristiques proposent, Trân décide avant toute écriture destructrice ou canonique.**

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- palettes/couleurs fines au-delà des couleurs canoniques
