/* Chiffrement préparatoire, non activé automatiquement.
 * AES-GCM 256 bits avec clé dérivée d'une phrase secrète via PBKDF2.
 * Les paramètres de récupération doivent être conservés avec le coffre.
 * Aucun changement des cartes existantes n'est effectué ici. */
(function (root) {
  'use strict';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const ITERATIONS = 600000;
  const bytesToBase64 = bytes => {
    let text = '';
    for (const b of bytes) text += String.fromCharCode(b);
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const base64ToBytes = text => {
    if (typeof text !== 'string' || !/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('Invalid encoding');
    const base = text.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base + '='.repeat((4 - base.length % 4) % 4));
    return Uint8Array.from(decoded, char => char.charCodeAt(0));
  };
  async function derive(passphrase, salt, iterations) {
    if (typeof passphrase !== 'string' || passphrase.length < 12) throw new Error('Passphrase too short');
    if (!Number.isInteger(iterations) || iterations < 250000 || iterations > 1000000) throw new Error('Invalid KDF iterations');
    const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encrypt(plaintext, passphrase) {
    if (typeof plaintext !== 'string') throw new Error('Invalid plaintext');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await derive(passphrase, salt, ITERATIONS);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
    return { version: 1, algorithm: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS,
      salt: bytesToBase64(salt), iv: bytesToBase64(iv), ct: bytesToBase64(new Uint8Array(ciphertext)) };
  }
  async function decrypt(payload, passphrase) {
    if (!payload || payload.version !== 1 || payload.algorithm !== 'AES-256-GCM' ||
        payload.kdf !== 'PBKDF2-SHA256') throw new Error('Unsupported encrypted payload');
    const salt = base64ToBytes(payload.salt);
    const iv = base64ToBytes(payload.iv);
    const ct = base64ToBytes(payload.ct);
    if (salt.length !== 16 || iv.length !== 12 || ct.length < 16) throw new Error('Invalid encrypted payload');
    const key = await derive(passphrase, salt, payload.iterations);
    const result = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return decoder.decode(result);
  }
  root.CardsCrypto = Object.freeze({ encrypt, decrypt });
})(typeof window !== 'undefined' ? window : globalThis);
