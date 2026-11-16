import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createMatcher}from'../src/matcher.js';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),match=createMatcher(d.entries,d.slotValues),corpus=JSON.parse(readFileSync('tests/fixtures/deep-pages-v3.0.1.json'));
test('all 36 source jobs and 12 source crimes have UI translations, preserve identifiers and reject wrong scopes',()=>{
 assert.equal(corpus.jobs.length,36);assert.equal(corpus.crimes.length,12);
 for(const j of corpus.jobs){assert.match(match(j.apply,'locations').zh,/[\u3400-\u9fff]/);assert.match(match(j.hired,'locations').zh,/[\u3400-\u9fff]/);assert.ok(match(j.name,'locations').zh.includes(j.name));assert.equal(match(j.apply,'factions'),null);}
 for(const c of corpus.crimes){assert.ok(match(c.name,'locations').zh.includes(c.name));assert.ok(match(c.tooltip,'locations'));assert.ok(match(`You are attempting ${c.work}`,'work'));assert.equal(match(c.name,'unknown'),null);}
 for(const command of ['ns.dnet.authenticate()','home','n00dles','heartbleed','ns.dnet.memoryReallocation()','NS','WASD'])assert.equal(match(command,'darknet'),null);
});
test('darknet typed templates preserve exact RAM and PID values and reject unknown data',()=>{
 assert.equal(match('RAM in use: 2.50+1.20/8 GB','darknet').zh,'已用 RAM：2.50+1.20/8 GB');
 assert.equal(match('You are following the progress of pid 1234 instead of the manual mode.','darknet').zh,'你正在跟随 PID 1234 的进度，而非手动模式。');
 assert.equal(match('RAM in use: home/n00dles GB','darknet'),null);assert.equal(match('RAM in use: 2/8 GB','locations'),null);
 assert.equal(match('1 hour 2 minutes 03 seconds','grafting').zh,'1 小时 2 分钟 03 秒');
});
