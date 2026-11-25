import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMatcher } from '../src/matcher.js';
const d = JSON.parse(readFileSync('translations/zh-CN.json'));
const corpus = JSON.parse(readFileSync('tests/fixtures/dialogs-v3.0.1.json'));
const match = createMatcher(d.entries, d.slotValues);
const install = corpus.items.find(e => e.slots?.augmentations);
test('installation receipt translates prose and preserves every allowed name, level and list newline', () => {
  const names = d.slotValues.augmentation.filter(n => n !== 'NeuroFlux Governor');
  names.push('NeuroFlux Governor - 12345');
  const list = names.join('\n') + '\n';
  const text = install.en.replace('{augmentations}', list);
  const translated = match(text, 'dialogs');
  assert.ok(translated.zh.includes('\n' + list + '\n'));
  assert.equal(translated.zh.split('\n').length, text.split('\n').length);
  assert.ok(translated.zh.endsWith('你在家中醒来……感觉有些不同……'));
  for (const invalid of ['arbitrary.js\n', 'Neurotrainer II - 3\n', 'NeuroFlux Governor - unknown\n', 'Neurotrainer II\nNew arbitrary effect\n']) {
    assert.equal(match(install.en.replace('{augmentations}', invalid), 'dialogs'), null);
  }
  assert.equal(match(text, 'unknown'), null);
});
test('pinned result dialogs retain constrained names and keep the no-refund warning', () => {
  for (const item of corpus.items) {
    const sample = type => type === 'augmentationLines' ? 'Neurotrainer II\n' : type === 'integer' ? '123' : d.slotValues[type][0];
    assert.ok(match(item.en.replace(/\{(\w+)\}/g, (_, key) => sample(item.slots[key])), item.scope), item.en);
  }
  assert.equal(match('Your money was not returned to you.', 'grafting').zh, '花费的资金不会退还。');
  for (const name of corpus.sourceFileNames) {
    const text = `${name} was upgraded to level 123 for destroying its corresponding BitNode!`;
    const result = match(text, 'dialogs');
    assert.ok(result.zh.includes(name)); assert.ok(result.zh.includes('123'));
  }
  assert.equal(match('You are now in Arbitrary City!', 'dialogs'), null);
  assert.equal(match('You have', 'dialogs'), null);
});
