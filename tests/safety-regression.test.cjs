'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

test('force-update cache cleanup is scoped to this app', () => {
  assert.match(app, /keys\.filter\(k => k\.startsWith\('mes-cartes-'\)\)/);
  assert.doesNotMatch(app, /Promise\.all\(keys\.map\(k => caches\.delete\(k\)\)\)/);
});

test('service worker only removes its own obsolete caches', () => {
  assert.match(sw, /k\.startsWith\('mes-cartes-'\) && k !== CACHE/);
});

test('legacy protected codes are never deleted after failed conversion', () => {
  const start = app.indexOf('async function convertLegacyCodes() {');
  const end = app.indexOf('/* ---------- Sauvegarde (export / import) ---------- */', start);
  assert.ok(start >= 0 && end > start);
  const conversion = app.slice(start, end);
  assert.doesNotMatch(conversion, /delete\s+c\.cagnotteCode/);
  assert.doesNotMatch(conversion, /localStorage\.removeItem\(VAULT_KEY\)/);
  assert.match(conversion, /if \(failed\) return/);
  assert.match(conversion, /if \(!save\(\)\)/);
});
