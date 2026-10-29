# Mekart

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

## État de la refonte (branche de préparation)

Les modifications de la pull request sont expérimentales tant qu'elles ne sont pas
validées sur un navigateur réel avec un jeu de cartes de test. Ne pas fusionner
automatiquement cette branche.

- `localStorage['loyalty_cards_v1']` reste la source de vérité.
- `storage-backup.js` effectue une copie parallèle non destructive dans IndexedDB.
- `crypto-vault.js` fournit des primitives AES-256-GCM **non activées** : aucune
  donnée existante n'est chiffrée ni migrée par ce module.
- L'import JSON limite les champs autorisés et conserve les anciens objets de
  code cagnotte chiffré.
- `node --test tests/*.test.cjs` exécute les tests unitaires. Les tests
  automatisés ne remplacent pas une validation sur téléphone et navigateur.

### Validation indispensable avant publication

1. Exporter une sauvegarde JSON sur l'ancienne version et en garder une copie
   hors du navigateur.
2. Sur un profil de test, créer des cartes fidélité et cadeau, avec catégories,
   logos, favoris, historique, PIN et code cagnotte.
3. Vérifier l'export, l'import, le scan, le mode hors ligne et le redémarrage.
4. Tester les sauvegardes historiques, y compris celles qui contiennent des
   codes chiffrés, sans écraser les données existantes.
5. Vérifier que les cartes restent présentes après mise à jour du service worker
   et que la sauvegarde IndexedDB reflète les dernières modifications.
6. Ne publier qu'après validation manuelle de ces scénarios.

**Attention :** une phrase secrète perdue rend les données chiffrées
indéchiffrables. Avant toute activation du chiffrement, prévoir et valider un
parcours de récupération et une sauvegarde restaurable.
