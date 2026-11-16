import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createMatcher,normalize } from '../src/matcher.js';
import { managementCorpus } from './management-corpus.mjs';
import { readSource,TARGET } from './source-corpus.mjs';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),match=createMatcher(d.entries,d.slotValues),corpus=managementCorpus();
const retained=new Set(['=> x','(x','>','AdVert.Inc','-','/s)','Market-TA.I','Market-TA.II']);
const missing=corpus.ui.filter(x=>!retained.has(x.text)&&!match(x.text,x.scope));
assert.deepEqual(missing,[], 'Untranslated pinned UI fragments');
for(const x of corpus.descriptions)for(const text of x.text.split(/<br\s*\/?\s*>/i).map(normalize).filter(Boolean))assert.ok(match(text,x.scope),x.name+' '+text);
const additions=d.entries.filter(e=>e.review.note.startsWith('v0.6：')),cache=new Map();
for(const e of additions){assert.equal(e.source.target,TARGET);if(!cache.has(e.source.path))cache.set(e.source.path,readSource(e.source.path));const source=cache.get(e.source.path);assert.ok(source.includes(e.source.targetExcerpt),e.id);assert.ok(source.split('\n')[e.source.targetLine-1].includes(e.source.targetExcerpt.split('\n')[0]),e.id+' line');}
writeFileSync('tests/fixtures/management-v3.0.1.json',JSON.stringify(corpus,null,2)+'\n');
const report={target:TARGET,reviewedNewEntries:additions.length,byScope:Object.fromEntries(['gang','bladeburner','corporation'].map(scope=>[scope,{entries:additions.filter(e=>e.scopes.includes(scope)).length,uiFragments:new Set(corpus.ui.filter(e=>e.scope===scope&&!retained.has(e.text)).map(e=>e.text)).size,descriptionFields:corpus.descriptions.filter(e=>e.scope===scope).length}])),retainedSyntaxAndIdentifiers:[...retained],supplementSourceExcerptsVerified:true,meaning:'Fixed-source match coverage only; not live unlock or gameplay acceptance.'};
writeFileSync('docs/management-coverage.json',JSON.stringify(report,null,2)+'\n');console.log(report);
