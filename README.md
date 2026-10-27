# Mes cartes

Application web progressive (PWA) de cartes de fidélité et de cartes cadeaux.

**Application :** https://nsycrabe.github.io/fid/

## Fonctionnalités

- Cartes de fidélité et cartes cadeaux, QR codes et codes-barres.
- Favoris, catégories, personnalisation et consultation hors ligne.
- Gestion des soldes, sauvegarde et import de cartes.

## Protection des données — à lire avant toute mise à jour

Les cartes sont stockées **localement dans le navigateur**, sous la clé `localStorage['loyalty_cards_v1']`. Elles ne sont pas stockées dans le dépôt GitHub et ne se synchronisent pas automatiquement entre appareils.

1. Sur l'appareil où les cartes sont présentes, ouvrez l'application actuelle.
2. Utilisez la fonction d'export/sauvegarde et conservez le fichier JSON hors de l'appareil.
3. Vérifiez que le fichier est bien enregistré avant de vider les données du navigateur ou de désinstaller l'application.
4. Ne supprimez pas les données du site : cela pourrait supprimer toutes les cartes.

**Important :** la reconnaissance biométrique peut masquer certains codes dans l'interface, mais les données sensibles stockées localement ne sont pas encore chiffrées. Ne partagez pas un export JSON contenant des codes confidentiels.

## Développement

Projet statique : `index.html`, `app.js`, `style.css`, `sw.js` et `manifest.json`.

Servir les fichiers via un serveur HTTP local (par exemple `python -m http.server 8000`), puis ouvrir `http://localhost:8000`. Le service worker nécessite HTTPS ou localhost.

## Publication et mises à jour

- Augmenter la version du cache dans `sw.js` à chaque publication.
- Vérifier le chargement en ligne et hors ligne, le scan, l'ajout et la modification des cartes, ainsi que l'export/import.
- Toujours tester avec un jeu de données de démonstration et conserver une sauvegarde réelle avant migration.
- Ne pas effacer `loyalty_cards_v1` lors d'une future migration vers IndexedDB tant que la lecture et l'écriture n'ont pas été validées.

## Limites connues

- `localStorage` peut atteindre son quota, notamment avec les logos en base64.
- Les codes sensibles ne bénéficient pas encore d'un chiffrement au repos.
- Une migration vers IndexedDB et une suite de tests automatisés restent à développer.

## Licence

Aucune licence n'est déclarée actuellement.
