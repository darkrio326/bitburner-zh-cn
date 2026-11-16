import {readFileSync,writeFileSync}from'node:fs';
import assert from'node:assert/strict';
import{documentationCorpus}from'./documentation-corpus.mjs';
import{createMatcher}from'../src/matcher.js';
import{readSource}from'./source-corpus.mjs';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),c=documentationCorpus(),match=createMatcher(d.entries,d.slotValues);
const retained=JSON.parse(readFileSync('translations/documentation-retained.json'));
const missing=c.items.filter(e=>!retained.includes(e.text)&&!match(e.text,e.scope));assert.deepEqual(missing,[]);
const additions=d.entries.filter(e=>e.review.note.startsWith('v0.7：')),cache=new Map();
for(const e of additions){if(!cache.has(e.source.path))cache.set(e.source.path,readSource(e.source.path));const s=cache.get(e.source.path);assert.ok(s.includes(e.source.targetExcerpt),e.id);assert.ok(s.split('\n')[e.source.targetLine-1].includes(e.source.targetExcerpt.split('\n')[0]),e.id+' line');}
d.documentationHeadings=c.headings;writeFileSync('translations/zh-CN.json',JSON.stringify(d,null,2)+'\n');
writeFileSync('tests/fixtures/documentation-v3.0.1.json',JSON.stringify(c,null,2)+'\n');
const report={target:c.target,sourceFileDescriptions:c.sourceFiles.map(s=>s.number),guidePages:c.pages.map(p=>p.path),reviewedNewEntries:additions.length,sourceTextFragments:c.items.length,retainedIdentifiers:retained,unmatchedFragments:missing.length,meaning:'Fixed-source coverage of selected guide prose and Source-File effects; not all API references, guides or unlocked live gameplay.'};
writeFileSync('docs/documentation-coverage.json',JSON.stringify(report,null,2)+'\n');console.log({pages:c.pages.length,sourceFiles:c.sourceFiles.length,additions:additions.length,unmatched:missing.length});
