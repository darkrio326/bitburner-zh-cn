import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { factionCorpus } from './faction-corpus.mjs';
import { createMatcher } from '../src/matcher.js';
import { readSource } from './source-corpus.mjs';
const corpus = factionCorpus(), dictionary = JSON.parse(readFileSync('translations/zh-CN.json'));
const match = createMatcher(dictionary.entries, dictionary.slotValues);
for (const item of corpus.items) {
  if (item.retained) continue;
  const result = match(item.text.replace('{faction}', 'The Black Hand'), item.scope);
  assert.ok(result, item.text);
  if (item.attribute) assert.equal(result.attribute, item.attribute, item.text);
}
for (const entry of dictionary.entries.filter(e => e.id.startsWith('v082-'))) {
  const source = readSource(entry.source.path);
  assert.ok(source.includes(entry.source.targetExcerpt));
  assert.ok(source.split('\n')[entry.source.targetLine - 1].includes(entry.source.targetExcerpt.trim()));
}
writeFileSync('tests/fixtures/factions-v3.0.1.json', JSON.stringify(corpus, null, 2) + '\n');
const report = { target: corpus.target, sourceFiles: corpus.paths.length, inventoriedTexts: corpus.items.length,
  matchedTexts: corpus.items.filter(e => !e.retained).length,
  retainedTexts: corpus.items.filter(e => e.retained).map(e => ({ text: e.text, reason: e.retained })),
  factionAugmentationNameCollisions: dictionary.factionNames.filter(n => dictionary.augmentationNames.includes(n)),
  newEntries: dictionary.entries.filter(e => e.id.startsWith('v082-')).length,
  meaning: 'Pinned faction UI prose/label inventory and two gang-type templates; not every runtime branch, real save or Tampermonkey acceptance.' };
writeFileSync('docs/faction-coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log({ sourceFiles: report.sourceFiles, inventoriedTexts: report.inventoriedTexts, matchedTexts: report.matchedTexts, retainedTexts: report.retainedTexts.length, newEntries: report.newEntries });
