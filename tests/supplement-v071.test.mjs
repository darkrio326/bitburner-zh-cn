import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMatcher } from '../src/matcher.js';
const corpus = JSON.parse(readFileSync('tests/fixtures/supplement-v071-v3.0.1.json'));
const dictionary = JSON.parse(readFileSync('translations/zh-CN.json'));
const match = createMatcher(dictionary.entries, dictionary.slotValues);

test('all pinned hash upgrade prose and stock labels match without translating API names or symbols', () => {
  assert.equal(corpus.hashes.length, 11); assert.equal(corpus.hashes.filter(e => e.effect).length, 8);
  for (const text of corpus.texts.filter(e => e.scope !== 'augmentations')) {
    assert.ok(match(text.en, text.scope), text.en);
    assert.equal(match(text.en, 'unknown'), null);
  }
  for (const hash of corpus.hashes) assert.equal(match(hash.name, 'hacknet'), null, hash.name);
  for (const value of ['ECP', 'L', 'S', 'ns.stock.placeOrder', 'home', 'n00dles']) assert.equal(match(value, 'stocks'), null);
  assert.equal(match('Filter augmentations', 'augmentations').attribute, 'placeholder');
  assert.equal(match('Filter augmentations', 'unknown'), null);
});

test('purchase receipts preserve every approved augmentation name and the installation warning', () => {
  const receipt = corpus.texts.find(e => e.match === 'template').en;
  for (const name of dictionary.slotValues.augmentation) {
    const result = match(receipt.replace('{augmentation}', name), 'augmentations');
    assert.ok(result.zh.includes(name)); assert.ok(result.zh.includes('只有在安装后才会生效'));
    assert.ok(result.zh.includes('继续购买其他强化的价格会更高'));
  }
  assert.equal(match(receipt.replace('{augmentation}', 'Unknown arbitrary input'), 'augmentations'), null);
  assert.equal(match(receipt.replace('{augmentation}', 'Neurotrainer I'), 'stats'), null);
});
