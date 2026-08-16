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

Le repo contient `.github/workflows/deploy-pages.yml` et déploie automatiquement chaque push sur `main` vers GitHub Pages.

Configuration unique du repository : GitHub → Settings → Pages → Build and deployment → Source → `GitHub Actions`.

URL cible : `https://shinobione.github.io/tran-closet-pwa/`

Sur l'iPhone de Trân :

1. Ouvrir l'URL dans Safari.
2. Partager.
3. Ajouter à l'écran d'accueil.
4. Activer « Ouvrir comme app » si iOS propose l'option.

Le `start_url` et les chemins sont relatifs, donc la PWA fonctionne sous le sous-chemin GitHub Pages du repository.

## Sécurité Airtable

Ne jamais mettre de Personal Access Token Airtable dans le JavaScript servi au navigateur. La future synchronisation passera par un backend minimal (Cloudflare Worker recommandé pour ce projet) qui garde le secret côté serveur.

## Roadmap

Voir `docs/ROADMAP.md`.
