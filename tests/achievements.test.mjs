import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createMatcher}from'../src/matcher.js';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),match=createMatcher(d.entries,d.slotValues);
const corpus=JSON.parse(readFileSync('tests/fixtures/achievements-v3.0.1.json'));
test('108 pinned achievement descriptions covered; preserved names and wrong scopes are not matched',()=>{
 assert.equal(corpus.entries.length,108);
 for(const e of corpus.entries){
  assert.ok(match(e.Description,'achievements'),e.ID);
  assert.equal(match(e.Description,'unknown'),null);
  if(corpus.preservedNames.includes(e.Name))assert.equal(match(e.Name,'achievements'),null);
  else assert.ok(match(e.Name,'achievements'),e.Name);
 }
 assert.equal(match('while(true);','achievements'),null);
 assert.equal(match('CyberSec','factions'),null);
 assert.equal(match('Rothman University','factions'),null);
});
test('source-shaped offline durations retain numbers and only accept known complete unit sequences',()=>{
 for(const [en,zh] of [['1 day 2 hours 3 minutes 4 seconds','1 天 2 小时 3 分钟 4 秒'],['0 seconds','0 秒'],['2 days 0 hours 0 minutes 1 second','2 天 0 小时 0 分钟 1 秒']]){
  assert.equal(match(en,'offline').zh,zh);assert.equal(match(en,'stats'),null);
 }
 for(const en of ['2 seconds; ns.hack()','two seconds','500 years','9999'])assert.equal(match(en,'offline'),null);
});
