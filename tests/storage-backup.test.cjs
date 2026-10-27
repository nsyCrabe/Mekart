'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('storage-backup.js', 'utf8');

function setup(initial) {
  const values = new Map(initial === undefined ? [] : [['loyalty_cards_v1', initial]]);
  const writes = [];
  class Storage {
    getItem(key) { return values.has(key) ? values.get(key) : null; }
    setItem(key, value) { values.set(key, String(value)); }
    removeItem(key) { values.delete(key); }
  }
  const localStorage = new Storage();
  const data = new Map();
  const indexedDB = {
    open() {
      const request = {};
      queueMicrotask(() => {
        const db = {
          objectStoreNames: { contains: () => true },
          transaction(_store, mode) {
            const tx = {
              objectStore() {
                return {
                  put(value, key) {
                    queueMicrotask(() => { data.set(key, value); writes.push(value); tx.oncomplete?.(); });
                  },
                  get(key) {
                    const req = {};
                    queueMicrotask(() => { req.result = data.get(key); req.onsuccess?.(); });
                    return req;
                  }
                };
              }
            };
            return tx;
          }
        };
        request.result = db;
        request.onsuccess?.();
      });
      return request;
    }
  };
  const window = { indexedDB };
  vm.runInNewContext(source, { window, indexedDB, localStorage, Storage, queueMicrotask, Date });
  const settle = async () => { for (let i = 0; i < 15; i++) await new Promise(resolve => setImmediate(resolve)); };
  return { localStorage, values, writes, window, settle };
}

const one = JSON.stringify([{ id: 'card1', name: 'Carte test', code: '1234' }]);
const two = JSON.stringify([{ id: 'card1', name: 'Carte test', code: '5678' }]);

test('copies existing cards without changing localStorage', async () => {
  const env = setup(one);
  await env.settle();
  assert.equal(env.localStorage.getItem('loyalty_cards_v1'), one);
  assert.equal(env.writes.at(-1).raw, one);
  const status = await env.window.cardsBackupStatus();
  assert.equal(status.cardCount, 1);
});

test('mirrors subsequent successful writes in order', async () => {
  const env = setup(one);
  env.localStorage.setItem('loyalty_cards_v1', two);
  await env.window.mirrorCardsBackup(two);
  await env.settle();
  assert.equal(env.writes.at(-1).raw, two);
  assert.equal(env.localStorage.getItem('loyalty_cards_v1'), two);
});

test('rejects malformed payloads and never removes original', async () => {
  const env = setup(one);
  await env.settle();
  const count = env.writes.length;
  env.localStorage.setItem('loyalty_cards_v1', '{broken');
  await env.window.mirrorCardsBackup('{broken');
  await env.settle();
  assert.equal(env.writes.length, count);
  assert.equal(env.values.get('loyalty_cards_v1'), '{broken');
});

test('does not restore old backup over empty storage', async () => {
  const env = setup();
  await env.settle();
  assert.equal(env.writes.length, 0);
  assert.equal(env.localStorage.getItem('loyalty_cards_v1'), null);
});

test('does not mirror unrelated localStorage settings', async () => {
  const env = setup(one);
  await env.settle();
  const count = env.writes.length;
  env.localStorage.setItem('loyalty_theme_v2', 'dark');
  await env.settle();
  assert.equal(env.writes.length, count);
});

test('does not monkeypatch Storage.prototype.setItem', () => {
  assert.doesNotMatch(source, /Storage\.prototype\.setItem\s*=/);
  assert.match(source, /window\.mirrorCardsBackup\s*=/);
});
