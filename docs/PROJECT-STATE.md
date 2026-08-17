# PROJECT STATE — Trân Closet PWA

Dernière mise à jour : 2026-08-17

## Production / candidate

- PWA : `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker : `https://tran-closet-sync.jerryquinet.workers.dev`
- branche canonique : `main`
- dernière production totalement close : `v0.4.6` — V0.4-C Smart Tags
- phase active : `V0.5` — Assistant
- candidate en cours : `v0.5.1` — V0.5-A `Hôm nay mặc gì?` + interface FR/VI pour QA
- stockage local : IndexedDB `tran-closet`, schema version 4

## Phase

- **V0.2 — Airtable Bridge : CLOSED / VERIFIED PROD**
- **V0.3 — Outfits : CLOSED / VERIFIED PROD**
- **V0.4 — Smart Closet : CLOSED / VERIFIED PROD**
- **V0.5-A — Daily Assistant : CANDIDATE v0.5.1**

## V0.2 — CLOSED / VERIFIED PROD

Bridge vêtements vérifié de bout en bout : CREATE + photo, UPDATE, DELETE, retry offline, idempotence `Sync Mutation ID`, snapshot canonique, tombstones anti-résurrection et protection contre snapshots plus anciens.

## V0.3 — CLOSED / VERIFIED PROD

Outfits offline-first + picker 100+, persistance Airtable par linked records, queue séparée, CREATE/UPDATE/DELETE vérifiés, Lookbook plein écran, PNG 1080×1350 et Web Share validé.

## V0.4 — Smart Closet — CLOSED / VERIFIED PROD

- V0.4-A Photo AI Assistant : multi-pass, retry auto, nouvelles catégories/couleurs, QA réel PASS.
- V0.4-B Duplicate Guard : warning/cancel/bypass/delete/snapshot anti-résurrection vérifiés.
- V0.4-C Smart Tags : 22 tags canoniques, IA explicable, persistance PWA → Worker → Airtable → snapshot, QA réel PASS sur `VietCap` et `Jerry's Panty`.

Principe canonique : **l'IA et les heuristiques proposent, Trân décide avant toute écriture destructrice ou canonique.**

## V0.5-A — `Hôm nay mặc gì?` — CANDIDATE v0.5.1

Objectif : proposer jusqu'à 3 looks utiles à partir du vrai dressing, du contexte et de la météo, sans créer automatiquement quoi que ce soit.

Architecture :
- module `daily-assistant.js` séparé, injecté depuis la home ;
- moteur pur `daily-assistant-core.mjs` testable sans navigateur ;
- aucun changement du CRUD vêtements, d'IndexedDB, du Worker, des queues ou du schéma Airtable ;
- lecture directe des vêtements/outfits locaux déjà réconciliés ;
- météo via Open-Meteo Forecast API ;
- ville manuelle via Open-Meteo Geocoding API ;
- emplacement par défaut : TP. Hồ Chí Minh ;
- géolocalisation navigateur uniquement après action explicite ;
- cache météo local 30 minutes, strictement lié aux coordonnées ;
- fallback sans météo si réseau indisponible.

Signaux du moteur :
- occasion : Everyday / Work / Date / Party / Travel / Sport / Formal / Other ;
- saison météo dérivée : All / Hot / Rainy / Cool ;
- température ressentie, max/min, pluie, probabilité de pluie et vent ;
- catégories, styles, couleurs, favoris et Smart Tags ;
- `Lightweight`, `Summer`, `Warm`, `Winter`, `Rain-ready`, `Travel-friendly`, etc. ;
- harmonie couleur simple et diversité entre suggestions ;
- exclusion explicite de `Underwear`, `Swimware`, `Eye Lens` et `Socks` du montage automatique.

Comportement :
- les outfits déjà enregistrés peuvent être remontés lorsqu'ils correspondent bien au contexte ;
- sinon, le moteur construit des combinaisons top + bottom ou pièce unique, puis ajoute chaussures/sac/accessoires utiles ;
- en pluie, un parapluie disponible est fortement favorisé ;
- si le dressing ne contient pas encore assez de pièces de base, l'assistant montre seulement les accessoires pertinents et explique le manque ;
- chaque suggestion contient des raisons courtes ;
- la sauvegarde est disponible uniquement pour une suggestion générée d'au moins 2 pièces ;
- la sauvegarde crée un outfit local normal puis déclenche le pipeline Outfit existant ;
- une composition déjà présente dans `Phối đồ` n'est pas dupliquée.

### Interface bilingue FR / VI — v0.5.1

Pour rendre le QA compréhensible sans modifier l'expérience de Trân :
- sélecteur persistant `FR / VI` dans la topbar ;
- vietnamien conservé comme langue par défaut ;
- `?lang=fr` force et mémorise le mode français sur l'appareil de test ;
- navigation, dressing, formulaires, outfits, assistant météo, IA photo, Duplicate Guard, profil/sync et diagnostics traduits côté client ;
- confirmations et messages dynamiques principaux également traduits ;
- les données Airtable, catégories canoniques, queues et Worker ne changent pas ;
- aucune donnée métier n'est dupliquée par langue.

Release :
- PWA/cache/diagnostics : `v0.5.1` ;
- tests ciblés V0.5-A conservés ;
- nouveau guard CI pour le contrat bilingue et la persistance de langue.

Statut : **candidate à valider dans la PWA réelle. Aucun statut VERIFIED PROD avant QA réel en français puis contrôle du retour VI.**

## V0.5-B — Historique & rotation — NEXT

- historique des tenues portées ;
- dernière utilisation ;
- rareté / vêtements sous-utilisés ;
- signal de rotation ajouté à V0.5-A sans écraser les choix manuels.

## Deferred / connus

- remplacement de la photo d'un vêtement Airtable existant
- palettes/couleurs fines au-delà des couleurs canoniques
