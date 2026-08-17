# Roadmap — Trân Closet PWA

## V0.1 — Local Closet ✅
- PWA installable
- offline shell
- IndexedDB
- CRUD local
- photos compressées
- recherche / filtres / favoris
- backup JSON

## V0.2 — Airtable Bridge ✅ CLOSED / VERIFIED PROD
- snapshot Airtable canonique
- Worker sécurisé
- queue offline create/update/delete
- idempotence + anti-résurrection
- round-trip réel CREATE + photo / UPDATE / DELETE vérifié

## V0.3 — Outfits ✅ CLOSED / VERIFIED PROD
- Outfit Core offline-first
- picker scalable 100+
- persistance Airtable + linked records
- queue Outfit séparée
- Lookbook + PNG + Web Share
- CRUD/snapshot/anti-résurrection vérifiés

## V0.4 — Smart Closet ✅ CLOSED / VERIFIED PROD

### V0.4-A — Analyse photo assistée ✅
- vision multi-pass + rescue
- retry client automatique
- taxonomie enrichie
- indicateurs de fiabilité
- QA réel PASS

### V0.4-B — Duplicate Guard ✅
- dHash perceptuel + métadonnées
- warning/cancel/bypass
- aucun merge/delete automatique
- QA réel + snapshot anti-résurrection PASS

### V0.4-C — Smart Tags ✅
- 22 tags canoniques
- tags éditables/recherchables
- suggestions IA explicables
- round-trip PWA → Worker → Airtable → snapshot
- QA réel PASS sur `VietCap` et `Jerry's Panty`

## V0.5 — Assistant 🟡 ACTIVE

### V0.5-A — “Hôm nay mặc gì?” 🟡 CANDIDATE v0.5.0
- bouton Assistant directement sur la home du dressing
- météo actuelle + max/min + risque de pluie + vent
- Open-Meteo sans nouveau secret
- TP. Hồ Chí Minh par défaut
- ville manuelle ou géolocalisation explicite
- cache météo 30 min + fallback offline
- occasion : quotidien, travail, date, fête, voyage, sport, formel
- ranking des outfits déjà sauvegardés
- génération de looks top+bottom / pièce unique
- chaussures, sac, couvre-chef et parapluie ajoutés selon contexte
- Smart Tags / styles / couleurs / favoris comme signaux
- explication courte pour chaque recommandation
- diversité entre suggestions
- fallback accessoires si dressing incomplet
- sauvegarde explicite seulement, minimum 2 pièces
- déduplication d'une composition déjà existante
- tests unitaires ciblés du moteur
- aucun changement Worker/Airtable/DB/CRUD

QA requis avant fermeture :
1. météo TP.HCM affichée ;
2. changement de ville et/ou localisation actuelle ;
3. changement d'occasion recalcule les suggestions ;
4. dressing incomplet géré proprement ;
5. avec assez de pièces, `Lưu thành outfit` crée un outfit puis sync via le pipeline existant.

### V0.5-B — Historique & rotation — NEXT
- historique des tenues portées
- dernière utilisation
- rareté / vêtements sous-utilisés
- éviter les répétitions sans imposer la décision

### V0.5-C — Assistant conversationnel
- questions simples autour du dressing
- raisons détaillées à la demande
- préparation d'une tenue pour une date/occasion future
- toujours human-in-the-loop

## V1.0 — Daily Driver
- auth privée
- notifications optionnelles
- polish iPhone
- install UX VN/FR
