import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createMatcher } from '../src/matcher.js';
const data = JSON.parse(readFileSync(new URL('../translations/zh-CN.json', import.meta.url)));
const match = createMatcher(data.entries, data.slotValues);

test('exact, whitespace-normalized and scope-bound matching', () => {
  assert.equal(match(' \n Purchased   Augmentations\u00a0', 'augmentations').zh, '已购买的强化');
  assert.equal(match('Factions', 'sidebar').zh, '派系');
  assert.equal(match('FactionsPlus', 'sidebar'), null);
  assert.equal(match('factions', 'sidebar'), null);
  assert.equal(match('Stats', 'unknown'), null);
  assert.equal(match('Total', 'sidebar'), null);
});
test('commands, identifiers, arbitrary numeric values are never matched', () => {
  for (const text of ['n00dles', 'home', 'CyberSec', 'NUKE.exe', 'ns.hack()', 'run foo.js', 'NeuroFlux Governor', '$1.500m']) {
    for (const scope of ['sidebar', 'stats', 'factions', 'hacknet', 'augmentations']) assert.equal(match(text, scope), null);
  }
});
test('pending candidates never ship; conflicts fail build', () => {
  assert.equal(createMatcher([{en:'Hello',zh:'你好',scopes:['stats'],review:{status:'pending'}}])('Hello','stats'), null);
  const entry={en:'Hello',zh:'你好',scopes:['stats'],review:{status:'approved'}};
  assert.throws(()=>createMatcher([entry,{...entry,zh:'不同译文'}]),/Conflicting/);
});
test('every approved PR translation is traced to unchanged v3.0.1 text and a changed PR pair', () => {
  const candidates=JSON.parse(readFileSync(new URL('../translations/candidates.json',import.meta.url))).candidates;
  for(const e of data.entries.filter(e=>e.source.kind==='pr-diff')) {
    const c=candidates.find(c=>c.id===e.id);
    assert.ok(c?.targetVerified, e.id);
    assert.equal(e.en,c.en);
    assert.deepEqual(e.source,c.source);
    assert.ok(e.review.note);
    assert.equal(e.review.humanReviewed,false);
  }
  assert.equal(data.entries.some(e=>e.id==='2c3116fbf138'),false,'known bad AST pairing must remain excluded');
});
test('standalone artifact is reproducible and needs no runtime network dependencies', () => {
  execFileSync(process.execPath,['scripts/build.mjs','--check']);
  const script=readFileSync('bitburner-zh-cn.user.js','utf8');
  assert.ok(script.startsWith('// ==UserScript=='));
  assert.ok(script.includes('// @match        https://bitburner-official.github.io/*'));
  assert.doesNotMatch(script, /@require|GM_xmlhttpRequest|\bfetch\(|\bXMLHttpRequest\b|\beval\(|localStorage|indexedDB|unsafeWindow/);
});
