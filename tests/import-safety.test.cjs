'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('app.js', 'utf8');
test('import does not spread arbitrary card properties', () => {
  const start = app.indexOf('async function importCards(file) {');
  const end = app.indexOf('/* ---------- Événements ---------- */', start);
  assert.ok(start >= 0 && end > start);
  const importBody = app.slice(start, end);
  assert.doesNotMatch(importBody, /\.map\(c => \(\{\s*\.\.\.c/);
  for (const key of ['name:', 'code:', 'codeType:', 'logo:', 'notes:', 'pin:', 'cagnotteCode:']) {
    assert.ok(importBody.includes(key), `missing explicit field ${key}`);
  }
  assert.match(importBody, /data && typeof data === 'object'/);
});

test('legacy encrypted cagnotte codes remain importable', () => {
  const start = app.indexOf('async function importCards(file) {');
  const end = app.indexOf('/* ---------- Événements ---------- */', start);
  const body = app.slice(start, end);
  assert.match(body, /typeof c\.cagnotteCode\.iv === 'string'/);
  assert.match(body, /typeof c\.cagnotteCode\.ct === 'string'/);
  assert.match(body, /\{ iv: c\.cagnotteCode\.iv, ct: c\.cagnotteCode\.ct \}/);
});

test('import persists custom colors only after card save succeeds', () => {
  const start = app.indexOf('async function importCards(file) {');
  const end = app.indexOf('/* ---------- Événements ---------- */', start);
  const body = app.slice(start, end);
  const saved = body.indexOf('if (!save())');
  const colors = body.indexOf('persistSavedColors()');
  assert.ok(saved >= 0 && colors > saved, 'custom colors must not persist before card save');
});

test('duplicate card identifiers inside one backup are rejected', () => {
  const body = app.slice(app.indexOf('async function importCards(file) {'), app.indexOf('/* ---------- Événements ---------- */'));
  assert.match(body, /const seenImportIds = new Set\(\)/);
  assert.match(body, /seenImportIds\.has\(c\.id\)/);
  assert.match(body, /seenImportIds\.add\(c\.id\)/);
});

test('importing only duplicate cards does not rewrite the stored cards', () => {
  const body = app.slice(app.indexOf('async function importCards(file) {'), app.indexOf('/* ---------- Événements ---------- */'));
  assert.match(body, /if \(added\.length\) \{\s*ensureOrder\(\);\s*if \(!save\(\)\)/);
});
