import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),corpus=JSON.parse(readFileSync('tests/fixtures/city-maps-v3.0.1.json'));
test('all 76 pinned ASCII map labels across six cities have a reviewed translation and source',()=>{
 assert.equal(corpus.maps.length,6);assert.equal(d.mapLabels.length,56);
 const labels=corpus.maps.flatMap(m=>[...m.text.matchAll(/\[[^\]\n]+\]/g)].map(x=>x[0]));assert.equal(labels.length,76);
 for(const en of labels){const e=d.mapLabels.find(x=>x.en===en);assert.ok(e,en);assert.equal(e.review.status,'approved');assert.ok(e.source.targetExcerpt.includes(en));assert.match(e.zh,/[\u3400-\u9fff]/u);}
 assert.equal(new Set(d.mapLabels.map(e=>e.en)).size,56);
});
