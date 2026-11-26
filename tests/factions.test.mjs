import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMatcher } from '../src/matcher.js';
const d = JSON.parse(readFileSync('translations/zh-CN.json'));
const corpus = JSON.parse(readFileSync('tests/fixtures/factions-v3.0.1.json'));
const match = createMatcher(d.entries, d.slotValues);
test('fixed-source faction prose, campaign messages and placeholders are covered', () => {
  for (const item of corpus.items) {
    if (item.retained) continue;
    const result = match(item.text.replace('{faction}', 'The Black Hand'), item.scope);
    assert.ok(result, item.text);
    if (item.attribute) assert.equal(result.attribute, item.attribute);
  }
});
