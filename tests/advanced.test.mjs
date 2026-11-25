import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMatcher } from '../src/matcher.js';
const d = JSON.parse(readFileSync('translations/zh-CN.json'));
const match = createMatcher(d.entries, d.slotValues);
const corpus = JSON.parse(readFileSync('tests/fixtures/advanced-v3.0.1.json'));

test('pinned advanced UI and dynamic contracts all have scoped translations', () => {
  for (const item of [...corpus.items, ...corpus.dynamic.items, ...corpus.dynamic.choices]) {
    if (corpus.retained.includes(item.text)) continue;
    const sample = type => ({ number: '98.765', money: '$2.500b' }[type] ?? d.slotValues[type][0]);
    const text = item.text.replace(/\{(\w+)\}/g, (_, name) => sample(item.slots[name]));
    assert.ok(match(text, item.scope), item.scope + ': ' + text);
    assert.equal(match(text, 'unknown'), null, text);
  }
});

test('sleeve multiline progress preserves game values and rejects unknown lines', () => {
  const text = 'This sleeve is currently attempting to perform Tracking.\n\nEstimated success chance: 65.1% ~ 78.9%\n\nTasks Completed: 1,234\n \nProgress: 12.50%';
  const result = match(text, 'sleeves');
  assert.ok(result);
  for (const value of ['Tracking', '65.1%', '78.9%', '1,234', '12.50%']) assert.ok(result.zh.includes(value));
  assert.equal(result.zh.split('\n').length, text.split('\n').length);
  assert.equal(match(text + '\nUnknown new effect: 999', 'sleeves'), null);
  assert.equal(match(text, 'gang'), null);
  assert.equal(match('This sleeve is currently working your job at arbitrary player text', 'sleeves'), null);
});
test('fragment effects and go results preserve signed values and known names', () => {
  for (const value of ['+12.500', '-9.25', '1.234e6']) {
    assert.ok(match(`${value}% hack() power`, 'stanek')?.zh.includes(value));
  }
  assert.equal(match('Score: Black: 12 White: 6.5', 'go').zh, '得分：黑方 12，白方 6.5');
  assert.equal(match('Winner: Netburners', 'go').zh, '胜者：Netburners');
  assert.equal(match('Winner: unknown user name', 'go'), null);
  assert.equal(match('-12.500% cheaper hacknet costs', 'stanek').zh, 'Hacknet 费用 -12.500%');
  for (const text of ['ns.go.makeMove(1, 2)', 'ns.stanek.chargeFragment(0, 0)', 'NeuroFlux Governor', '[X, Y]']) {
    for (const scope of ['sleeves', 'stanek', 'go']) assert.equal(match(text, scope), null);
  }
});
