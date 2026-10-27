'use strict';
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = process.cwd();
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const seeded = JSON.stringify([{ id: 'test-preserved', name: 'Carte conservée', code: '1234567890123', codeType: 'barcode', kind: 'loyalty' }]);
    await page.addInitScript(raw => localStorage.setItem('loyalty_cards_v1', raw), seeded);
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const actual = await page.evaluate(() => localStorage.getItem('loyalty_cards_v1'));
    assert.ok(JSON.parse(actual).some(c => c.id === 'test-preserved'), 'existing cards must survive startup');
    assert.equal(await page.locator('#encryptedExportButton').count(), 1);
    assert.equal(await page.evaluate(() => typeof window.CardsCrypto?.encrypt), 'function');
    // Round-trip réel dans Chromium, sans modifier le stockage utilisateur.
    const passphrase = 'Phrase-test-unique-2026!';
    const encrypted = await page.evaluate(async ({ raw, passphrase }) =>
      window.CardsCrypto.encrypt(raw, passphrase), { raw: actual, passphrase });
    const restored = await page.evaluate(async ({ encrypted, passphrase }) =>
      window.CardsCrypto.decrypt(encrypted, passphrase), { encrypted, passphrase });
    assert.equal(restored, actual, 'encrypted backup must decrypt to identical card data');
    await assert.rejects(page.evaluate(async ({ encrypted }) =>
      window.CardsCrypto.decrypt(encrypted, 'Wrong-password-2026!'), { encrypted }),
      'wrong password must reject');
    assert.equal(await page.evaluate(() => localStorage.getItem('loyalty_cards_v1')), actual,
      'encryption must not mutate existing cards');
    // Vérifier les chemins d'interface : téléchargement et import chiffré.
    const dialogText = passphrase;
    page.on('dialog', async dialog => {
      await dialog.accept(dialogText);
    });
    await page.evaluate(() => { document.querySelector('#encryptedExportButton').click(); });
    const download = await page.waitForEvent('download', { timeout: 15000 });
    const downloaded = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(downloaded.app, 'mes-cartes-encrypted');
    assert.ok(downloaded.encrypted, 'download must contain encrypted data');
    assert.ok(!JSON.stringify(downloaded).includes('Carte conservée'), 'download must not contain plaintext card name');
    const beforeImport = await page.evaluate(() => localStorage.getItem('loyalty_cards_v1'));
    await page.locator('#importInput').setInputFiles({
      name: 'encrypted-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(downloaded))
    });
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => localStorage.getItem('loyalty_cards_v1')), beforeImport,
      'importing an existing encrypted card must not duplicate or delete it');
    assert.deepEqual(errors, [], 'no uncaught application errors');
    console.log('Browser smoke passed: existing card preserved, encrypted backup available, no page errors');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
