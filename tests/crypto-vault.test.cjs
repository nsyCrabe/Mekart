'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync('crypto-vault.js', 'utf8');
function vault() {
  const window = {};
  vm.runInNewContext(source, { window, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob });
  return window.CardsCrypto;
}
test('encrypted values round-trip with the recovery passphrase', async () => {
  const api = vault();
  const secret = 'Code cagnotte 1234';
  const payload = await api.encrypt(secret, 'phrase-de-recuperation-assez-longue');
  assert.equal(await api.decrypt(payload, 'phrase-de-recuperation-assez-longue'), secret);
  assert.equal(payload.version, 1);
  assert.ok(!JSON.stringify(payload).includes(secret));
});
test('wrong recovery passphrase cannot decrypt', async () => {
  const api = vault();
  const payload = await api.encrypt('secret', 'phrase-de-recuperation-assez-longue');
  await assert.rejects(api.decrypt(payload, 'une-autre-phrase-de-recuperation'));
});
test('each encryption uses fresh random salt and nonce', async () => {
  const api = vault();
  const a = await api.encrypt('secret', 'phrase-de-recuperation-assez-longue');
  const b = await api.encrypt('secret', 'phrase-de-recuperation-assez-longue');
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.ct, b.ct);
});
test('rejects malformed metadata', async () => {
  const api = vault();
  const payload = await api.encrypt('secret', 'phrase-de-recuperation-assez-longue');
  await assert.rejects(api.decrypt({ ...payload, iv: 'abc' }, 'phrase-de-recuperation-assez-longue'));
  await assert.rejects(api.decrypt({ ...payload, iterations: 1 }, 'phrase-de-recuperation-assez-longue'));
});
