# Tủ Đồ của Trân — PWA

V0.1 local-first de la garde-robe de Trân. L'application est une vraie PWA installable sur iPhone/Android, fonctionne hors-ligne et ne contient aucun secret Airtable.

## V0.1

- UI mobile premium, vietnamien par défaut
- installation sur écran d'accueil iPhone/Android
- Service Worker + cache app shell
- stockage IndexedDB local
- ajout photo (caméra ou photothèque) avec compression client
- catégories / couleurs / styles issus de la base Airtable `Trân's Clothes`
- recherche, filtres, favoris, détail et suppression
- export/import JSON de sauvegarde
- deux records Airtable actuels seedés sans embarquer les photos privées
- emplacement prévu pour future synchronisation Airtable sécurisée

## Lancer localement

La PWA doit être servie en HTTP(S), pas ouverte en `file://`.

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Déploiement GitHub Pages

1. Créer un repo, par exemple `tran-closet`.
2. Mettre ce dossier à la racine du repo.
3. GitHub → Settings → Pages → Deploy from a branch → `main` / `/ (root)`.
4. Ouvrir l'URL Pages dans Safari sur l'iPhone de Trân.
5. Partager → Ajouter à l'écran d'accueil.

Le `start_url` et les chemins sont relatifs, donc le projet fonctionne également sous un sous-chemin GitHub Pages.

## Sécurité Airtable

Ne jamais mettre de Personal Access Token Airtable dans le JavaScript servi au navigateur. La future synchronisation passera par un backend minimal (Cloudflare Worker recommandé pour ce projet) qui garde le secret côté serveur.

## Roadmap

Voir `docs/ROADMAP.md`.
