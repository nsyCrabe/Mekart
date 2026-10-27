'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

test('encrypted export and import are wired to the crypto module', () => {
  assert.match(html, /id="encryptedExportButton"/);
  assert.match(html, /src="crypto-vault\.js"/);
  assert.match(app, /window\.CardsCrypto\.encrypt\(/);
  assert.match(app, /window\.CardsCrypto\.decrypt\(/);
  assert.match(app, /mes-cartes-encrypted/);
  assert.match(app, /phrase !== confirmation/);
  assert.match(sw, /'crypto-vault\.js'/);
});

test('unencrypted legacy JSON import remains supported', () => {
  const body = app.slice(app.indexOf('async function importCards(file) {'), app.indexOf('/* ---------- Événements ---------- */'));
  assert.match(body, /Array\.isArray\(data\) \? data/);
  assert.match(body, /if \(data && data\.app === 'mes-cartes-encrypted'\)/);
});
