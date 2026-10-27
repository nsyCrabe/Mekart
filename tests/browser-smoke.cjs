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
    const page = await browser.newPage();
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
    assert.deepEqual(errors, [], 'no uncaught application errors');
    console.log('Browser smoke passed: existing card preserved, encrypted backup available, no page errors');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
