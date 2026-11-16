import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMatcher} from '../src/matcher.js';
const d=JSON.parse(readFileSync('translations/zh-CN.json'));
const match=createMatcher(d.entries,d.slotValues);
const corpus=JSON.parse(readFileSync('tests/fixtures/augmentation-text-v3.0.1.json'));
test('all 137 pinned augmentation descriptions and nonempty static custom effects are covered',()=>{
  assert.equal(corpus.entries.filter(e=>e.field==='info').length,137);
  for(const entry of corpus.entries.filter(e=>e.text))assert.ok(match(entry.text,'augmentations'),`${entry.name} ${entry.field}`);
  for(const name of d.augmentationNames)assert.equal(match(name,'augmentations'),null,`name preserved: ${name}`);
});
test('whole source templates retain exact numbers, names, formatting and signs',()=>{
  assert.equal(match('12 Augmentations left','factions').zh,'剩余 12 项强化');
  assert.equal(match('Have $12.500m','factions').zh,'持有 $12.500m');
  // v3.0.1 formatRam() appends its unit without a separating space.
  assert.equal(match('Total Hacknet RAM of 8.00GB','factions').zh,'Hacknet 总 RAM 达到 8.00GB');
  assert.equal(match('Total Hacknet RAM of 1,024.00GiB','factions').zh,'Hacknet 总 RAM 达到 1,024.00GiB');
  assert.equal(match('1\u202f234,50 reputation with Bachman & Associates','factions').zh,'在 Bachman & Associates 的声望达到 1\u202f234,50');
  assert.equal(match('Backdoor access to I.I.I.I server','factions').zh,'已在 I.I.I.I 服务器安装后门');
  assert.equal(match('NeuroFlux Governor - Level 17','augmentations').zh,'NeuroFlux Governor - 等级 17');
  assert.equal(match('In BitNode 6 or 7 or have SourceFile 6 or 7','factions').zh,'位于 BitNode 6 or 7 或持有对应 SourceFile 6 or 7');
});
test('source templates reject changed sentences, wrong scopes, unknown identifiers and mismatched repeated values',()=>{
  for(const text of ['12 Augmentations left over','12 Augmentations left; ns.hack()','Have home','Backdoor access to unknown-user-server server','NeuroFlux Governor - Level NaN','In BitNode 6 or have SourceFile 7']){
    assert.equal(match(text,'factions'),null,text);assert.equal(match(text,'augmentations'),null,text);
  }
  assert.equal(match('12 Augmentations left','stats'),null);
  assert.equal(match('Have $12.500m','unknown'),null);
});
test('generated effect blocks preserve newlines, function names, programs, amount and percentage data',()=>{
  const input='Effects:\n+5.00% faster hack(), grow(), and weaken()\n-10.5% hacknet RAM upgrade cost\nStart with 1000000 after installing Augmentations.\nStart with FTPCrack.exe and relaySMTP.exe after installing Augmentations.';
  assert.equal(match(input,'augmentations').zh,'效果：\n+5.00% hack()、grow() 和 weaken() 执行速度\n-10.5% Hacknet RAM 升级费用\n安装强化后，初始资金为 1000000。\n安装强化后，初始拥有 FTPCrack.exe and relaySMTP.exe。');
  assert.equal(match('Effects:\n+7.0% unknown future stat','augmentations'),null);
  assert.equal(match('Effects:\nns.hack("n00dles")','augmentations'),null);
  assert.equal(match(input,'factions'),null);
  const text='This special augmentation can be leveled up infinitely. Each level of this augmentation increases MOST multipliers by 1% (+0.123456%), stacking multiplicatively.';
  assert.equal(match(text,'augmentations').zh,'此特殊强化可以无限升级。每级使大多数倍率提高 1%（+0.123456%），各级以乘法叠加。');
});
test('template review validates placeholders without evaluating source or arbitrary regex',()=>{
  const entry={id:'fixture',en:'Have {amount}',zh:'持有 {amount}',scopes:['factions'],match:'template',slots:{amount:'money'},review:{status:'approved'}};
  assert.throws(()=>createMatcher([{...entry,zh:'持有 {value}'}]),/Invalid template slots/);
  assert.throws(()=>createMatcher([{...entry,slots:{amount:'unknown'}}]),/Unknown slot type/);
  assert.equal(createMatcher([{...entry,review:{status:'pending'}}])('Have $10','factions'),null);
});
