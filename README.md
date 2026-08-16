# Tủ Đồ của Trân — PWA

PWA mobile-first de la garde-robe de Trân, installable sur iPhone/Android, offline-first et publiée sur GitHub Pages.

## État actuel

- **V0.1 Local Closet** ✅
- **V0.2-A Canonical Airtable read sync** ✅ côté code, activation du secret Airtable requise une seule fois
- **V0.2-B Secure write bridge** prochaine tranche

La PWA conserve son stockage IndexedDB local. Les records Airtable sont importés via un snapshot versionné ; les favoris restent locaux. Les nouveaux articles créés depuis la PWA restent locaux jusqu'à V0.2-B.

## Déploiement

Chaque push sur `main` déploie automatiquement :

`https://shinobione.github.io/tran-closet-pwa/`

Sur iPhone : Safari → Partager → Ajouter à l'écran d'accueil.

## Synchronisation Airtable V0.2-A

Le navigateur **ne contacte jamais Airtable avec un secret**. `.github/workflows/sync-airtable.yml` exécute `scripts/sync-airtable.mjs` côté GitHub Actions :

1. lecture de la table Airtable canonique ;
2. téléchargement de la première photo de chaque article ;
3. copie durable dans `assets/items/` ;
4. génération de `js/airtable-snapshot.js` ;
5. commit automatique sur `main` uniquement si quelque chose a changé ;
6. redéploiement GitHub Pages automatique.

Le workflow est exécutable à la demande et planifié toutes les 6 heures.

### Configuration unique du secret

Créer un Personal Access Token Airtable limité à la base **Trân's Clothes** avec le scope minimal `data.records:read`, puis :

GitHub → `tran-closet-pwa` → Settings → Secrets and variables → Actions → New repository secret

Nom : `AIRTABLE_PAT`

Valeur : le token Airtable.

Ensuite : Actions → **Sync Airtable closet** → Run workflow.

> Ne jamais mettre le PAT dans `js/`, dans un commit, dans le manifest ou dans le navigateur.

## Développement local

La PWA doit être servie en HTTP(S) :

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Roadmap

Voir `docs/ROADMAP.md`.
