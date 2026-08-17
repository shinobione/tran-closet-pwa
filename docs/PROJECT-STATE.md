# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production / candidate

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- production close : `v0.4.5`
- prochaine candidate : `v0.4.6` — V0.4-C Smart Tags
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **V0.2 — Airtable Bridge : CLOSED / VERIFIED PROD**
- **V0.3 — Outfits : CLOSED / VERIFIED PROD**
- **V0.4-A — Analyse photo assistée : CLOSED / VERIFIED PROD**
- **V0.4-B — Duplicate Guard : CLOSED / VERIFIED PROD**
- **V0.4-C — Smart Tags : NEXT / PR #23 prête à ré-ancrer sur main**

## V0.2 — CLOSED / VERIFIED PROD

Bridge vêtements vérifié de bout en bout : CREATE + photo, UPDATE, DELETE, retry offline, idempotence `Sync Mutation ID`, snapshot canonique, tombstones anti-résurrection et protection contre snapshots plus anciens.

## V0.3 — CLOSED / VERIFIED PROD

Outfits offline-first + picker 100+, persistance Airtable par linked records, queue séparée, CREATE/UPDATE/DELETE vérifiés, Lookbook plein écran, PNG 1080×1350 et Web Share validé.

## V0.4-A — Analyse photo assistée — CLOSED / VERIFIED PROD

Contrat human-in-the-loop validé. Pipeline Workers AI LLaVA + Llama 4 structuré, multi-pass + rescue, retry client automatique, fiabilité explicite, taxonomie `Underwear`, `Headwear`, `Umbrella`, polish `Brown / Nâu`, preview full-frame. QA réel PASS : chaussures DC, boxer, casquette, parapluie.

## V0.4-B — Duplicate Guard — CLOSED / VERIFIED PROD

Architecture :
- module `duplicate-guard.js` séparé du CRUD historique ;
- dHash perceptuel local 64 bits + distance de Hamming ;
- score visuel + catégorie/couleurs/styles/nom ;
- jusqu'à 3 candidats proches avec raisons ;
- cache session + maximum 80 candidats visuels ;
- aucun Worker/Airtable/nouveau secret requis pour la détection.

QA réel PASS :
1. duplicate probable `Neck Poca` détecté avant création ;
2. `Quay lại kiểm tra` → Airtable reste à 3 records ;
3. `Vẫn lưu món này` → doublon volontaire `neck test` créé comme 4e record, sans toucher à l'original ;
4. suppression PWA du doublon → Airtable revient à 3 ;
5. snapshot canonique post-delete SUCCESS, `recordCount: 3`, aucun `neck test` → anti-résurrection vérifiée.

Le Duplicate Guard avertit et explique ; il ne merge ni ne supprime automatiquement. La décision finale reste à Trân.

## V0.4-C — Smart Tags — NEXT

Modèle préparé :
- champ Airtable canonique `Tags` (`fld9hV9qirpfVfJmM`) ;
- vocabulaire fermé de 22 tags ;
- tags éditables, recherchables et utilisables dans Outfit Picker ;
- suggestions IA jusqu'à 5 tags + raison courte ;
- compatibilité vieux clients : absence de `tags` dans un payload ne doit pas effacer les tags existants.

PR #23 était volontairement Draft derrière la gate V0.4-B ; la gate est maintenant levée. Prochaine action : ré-ancrer la PR sur le `main` actuel, revalider CI, merger et faire le smoke canonique Tags.

Principe canonique : **l'IA et les heuristiques proposent, Trân décide avant toute écriture destructrice ou canonique.**

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- palettes/couleurs fines au-delà des couleurs canoniques
