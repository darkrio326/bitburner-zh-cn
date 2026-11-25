import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createMatcher } from '../src/matcher.js';
import { advancedCorpus } from './advanced-corpus.mjs';
import { advancedDynamicCorpus } from './advanced-dynamic-corpus.mjs';
import { readSource, TARGET } from './source-corpus.mjs';

const dictionary = JSON.parse(readFileSync('translations/zh-CN.json'));
const match = createMatcher(dictionary.entries, dictionary.slotValues);
const corpus = advancedCorpus(), dynamic = advancedDynamicCorpus();
const retained = ['[X, Y]', 'ID:', 'ID: N/A', 'IPvGO', 'x'];
const sample = type => ({ number: '12.500', integer: '7', money: '$1.250b' }[type] ?? dictionary.slotValues[type][0]);
for (const item of [...corpus.items, ...dynamic.items, ...dynamic.choices]) {
  if (retained.includes(item.text)) continue;
  const text = item.text.replace(/\{(\w+)\}/g, (_, name) => sample(item.slots[name]));
  assert.ok(match(text, item.scope), item.scope + ': ' + text);
}
const additions = dictionary.entries.filter(e => e.id.startsWith('v08-'));
const sources = new Map();
function verify(source) {
  assert.equal(source.target, TARGET);
  if (!sources.has(source.path)) sources.set(source.path, readSource(source.path));
  const text = sources.get(source.path);
  assert.ok(text.includes(source.targetExcerpt), source.path + ': excerpt');
  assert.ok(text.split('\n')[source.targetLine - 1].includes(source.targetExcerpt.split('\n')[0]), source.path + ': line');
  for (const related of source.related ?? []) verify(related);
}
for (const entry of additions) verify(entry.source);
writeFileSync('tests/fixtures/advanced-v3.0.1.json', JSON.stringify({ ...corpus, dynamic, retained }, null, 2) + '\n');
const report = {
  target: TARGET, reviewedNewEntries: additions.length, sourceUiFiles: corpus.pages.length,
  byScope: Object.fromEntries(['sleeves', 'stanek', 'go'].map(scope => [scope, {
    entries: additions.filter(e => e.scopes.includes(scope)).length,
    templates: additions.filter(e => e.scopes.includes(scope) && e.match === 'template').length,
  }])),
  retainedSyntaxAndIdentifiers: retained, supplementSourceExcerptsVerified: true,
  meaning: 'Pinned v3.0.1 source-match coverage; not all game branches, unlocked live saves or Tampermonkey acceptance.',
};
writeFileSync('docs/advanced-coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(report);
