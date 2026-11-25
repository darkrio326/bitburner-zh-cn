import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { dialogCorpus } from './dialog-corpus.mjs';
import { readSource, parse, TARGET } from './source-corpus.mjs';
import { createMatcher } from '../src/matcher.js';

const corpus = dialogCorpus(), d = JSON.parse(readFileSync('translations/zh-CN.json'));
const match = createMatcher(d.entries, d.slotValues);
assert.deepEqual(d.slotValues.sourceFile, corpus.sourceFileNames);
assert.ok(readSource('src/SourceFile/SourceFile.ts').includes('`Source-File ${number}: ${bitnode.name}`'));
for (const item of corpus.items) {
  const sample = type => type === 'augmentationLines' ? 'Neurotrainer II\nNeuroFlux Governor - 1\n' : type === 'integer' ? '2' : d.slotValues[type][0];
  const text = item.en.replace(/\{(\w+)\}/g, (_, name) => sample(item.slots[name]));
  assert.ok(match(text, item.scope), text);
  const source = readSource(item.source.path);
  assert.ok(source.includes(item.source.targetExcerpt), item.en);
  assert.ok(source.split('\n')[item.source.targetLine - 1].includes(item.source.targetExcerpt.split('\n')[0]), item.en + ': source line');
}
const paths = execFileSync('git', ['-C', '.cache/upstream', 'grep', '-l', 'dialogBoxCreate(', TARGET, '--', 'src'], { encoding: 'utf8' }).trim().split('\n').map(p => p.slice(p.indexOf(':') + 1));
let calls = 0;
for (const path of paths) {
  const root = parse(path, readSource(path));
  function visit(n) { if (ts.isCallExpression(n) && n.expression.getText(root) === 'dialogBoxCreate') calls++; ts.forEachChild(n, visit); }
  visit(root);
}
writeFileSync('tests/fixtures/dialogs-v3.0.1.json', JSON.stringify(corpus, null, 2) + '\n');
const report = {
  target: TARGET, inspectedDialogFiles: paths.length, inspectedDirectDialogCalls: calls,
  reviewedResultPaths: corpus.paths, newEntries: corpus.items.length,
  newTemplates: corpus.items.filter(e => e.match === 'template').length,
  sourceExcerptsVerified: true,
  reusedSourceFileDescriptions: 'Existing augmentation-scoped Source-File 1-15 descriptions are also recognized in the award dialog.',
  remaining: 'The inventory includes developer tools, arbitrary script/engine errors and other gameplay dialogs outside this fix; it is not a claim that every call is translated.',
};
writeFileSync('docs/dialog-coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(report);
