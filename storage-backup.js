/* Copie de secours non destructive vers IndexedDB.
 * localStorage reste la source de vérité pendant cette phase de transition.
 * Aucun effacement ni restauration automatique : une copie obsolète ne doit
 * jamais écraser les cartes plus récentes. */
(function () {
  'use strict';
  const KEY = 'loyalty_cards_v1';
  const DB = 'mes-cartes-backup';
  const STORE = 'snapshots';
  if (!('indexedDB' in window)) return;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function isValid(raw) {
    if (typeof raw !== 'string') return false;
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) && data.every(card =>
        card && typeof card === 'object' &&
        typeof card.id === 'string' && card.id.length > 0 &&
        typeof card.name === 'string' && card.name.length > 0);
    } catch { return false; }
  }

  let dbPromise;
  function getDB() {
    if (!dbPromise) {
      dbPromise = openDB().catch(error => {
        // Autoriser une nouvelle tentative si IndexedDB était indisponible.
        dbPromise = undefined;
        throw error;
      });
    }
    return dbPromise;
  }
  let pending = Promise.resolve();
  function mirror(raw) {
    if (!isValid(raw)) return Promise.resolve(false);
    pending = pending.catch(() => {}).then(async () => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ raw, savedAt: Date.now(), schema: 1 }, KEY);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    });
    return pending;
  }

  // Sauvegarde initiale. Une erreur n'empêche pas l'application de démarrer.
  try {
    const existing = localStorage.getItem(KEY);
    if (existing !== null) mirror(existing).catch(() => {});
  } catch {}

  // API explicite : aucune modification globale de Storage.prototype.
  // L'appelant doit avoir terminé son écriture localStorage avec succès.
  window.mirrorCardsBackup = function (raw) {
    return mirror(raw);
  };

  // Utilitaire de diagnostic : aucune donnée sensible n'est affichée.
  window.cardsBackupStatus = async function () {
    // Attendre les écritures déjà planifiées pour éviter un statut obsolète.
    await pending.catch(() => {});
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result ? {
        available: true, savedAt: req.result.savedAt,
        cardCount: JSON.parse(req.result.raw).length
      } : { available: false });
      req.onerror = () => reject(req.error);
    });
  };
})();
