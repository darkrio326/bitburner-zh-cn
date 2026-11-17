import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { readSource, parse, staticText, TARGET } from './source-corpus.mjs';
import { createMatcher, normalize } from '../src/matcher.js';

const texts = new Map();
function add(node, root, path, scope, en, selector) {
  en = normalize(en);
  if (!/[A-Za-z]/.test(en)) return;
  const key = scope + '\0' + en;
  if (!texts.has(key)) texts.set(key, { en, scope, selector, source: {
    kind: 'supplement', path, target: TARGET,
    targetLine: root.getLineAndCharacterOfPosition(node.getStart(root)).line + 1,
    targetExcerpt: node.getText(root),
  } });
}
function enumRecords(path, name, scope, selector) {
  const root = parse(path, readSource(path));
  const declaration = root.statements.find(n => ts.isEnumDeclaration(n) && n.name.text === name);
  return declaration.members.map(member => {
    const value = member.initializer.text;
    if (scope) add(member.initializer, root, path, scope, value, selector);
    return { key: member.name.text, value };
  });
}
const hashNames = Object.fromEntries(enumRecords('src/Hacknet/Enums.ts', 'HashUpgradeEnum').map(e => [e.key, e.value]));
const hashPath = 'src/Hacknet/data/HashUpgradesMetadata.tsx', hashRoot = parse(hashPath, readSource(hashPath));
let metadata;
function findMetadata(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(hashRoot) === 'HashUpgradesMetadata') metadata = node.initializer;
  ts.forEachChild(node, findMetadata);
}
findMetadata(hashRoot);
const hashes = metadata.elements.map(object => {
  const fields = Object.fromEntries(object.properties.map(p => [p.name.getText(hashRoot), p.initializer]));
  for (const node of [fields.desc, fields.effectText].filter(Boolean)) {
    const plain = staticText(node, {});
    if (plain !== undefined) add(node, hashRoot, hashPath, 'hacknet', plain, 'p');
    else {
      function visit(part) {
        if (ts.isJsxText(part)) add(part, hashRoot, hashPath, 'hacknet', part.text, 'p');
        ts.forEachChild(part, visit);
      }
      visit(node);
    }
  }
  return { name: hashNames[fields.name.name.text], desc: fields.desc.getText(hashRoot), effect: fields.effectText?.getText(hashRoot) ?? null };
});
const selectors = enumRecords('src/StockMarket/ui/StockTicker.tsx', 'SelectorOrderType', 'stocks', '[role="combobox"],[role="option"]');
const orders = enumRecords('src/StockMarket/Enums.ts', 'OrderType', 'stocks', 'p');
// Purchase receipt is one React Text node with a known augmentation-name slot.
const purchasePath = 'src/Faction/FactionHelpers.tsx', purchaseRoot = parse(purchasePath, readSource(purchasePath));
function receiptText(node) {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) return receiptText(node.left) + receiptText(node.right);
  assert.ok(ts.isTemplateExpression(node));
  return node.head.text + node.templateSpans.map(span => {
    assert.equal(span.expression.getText(purchaseRoot), 'augmentation.name');
    return '{augmentation}' + span.literal.text;
  }).join('');
}
function findReceipt(node) {
  if (ts.isCallExpression(node) && node.expression.getText(purchaseRoot) === 'dialogBoxCreate' && node.arguments[0]?.getText(purchaseRoot).includes('You purchased')) {
    add(node.arguments[0], purchaseRoot, purchasePath, 'augmentations', receiptText(node.arguments[0]));
    Object.assign(texts.get('augmentations\0' + normalize(receiptText(node.arguments[0]))), { match: 'template', slots: { augmentation: 'augmentation' } });
  }
  ts.forEachChild(node, findReceipt);
}
findReceipt(purchaseRoot);
for (const path of ['src/ui/React/ReputationInfo.tsx', 'src/ui/React/FavorInfo.tsx']) {
  const root = parse(path, readSource(path));
  function visit(node) {
    if (ts.isJsxText(node) && /^(Reputation:|Favor:)$/.test(normalize(node.text))) add(node, root, path, 'augmentations', node.text);
    ts.forEachChild(node, visit);
  }
  visit(root);
}
const filterPath = 'src/Faction/ui/AugmentationsPage.tsx', filterRoot = parse(filterPath, readSource(filterPath));
function findFilter(node) {
  if (ts.isJsxAttribute(node) && node.name.getText(filterRoot) === 'placeholder' && node.initializer?.text === 'Filter augmentations') {
    add(node.initializer, filterRoot, filterPath, 'augmentations', node.initializer.text);
    texts.get('augmentations\0Filter augmentations').attribute = 'placeholder';
  }
  ts.forEachChild(node, findFilter);
}
findFilter(filterRoot);
const corpus = { target: TARGET, hashes, selectors, orders, texts: [...texts.values()] };
writeFileSync('tests/fixtures/supplement-v071-v3.0.1.json', JSON.stringify(corpus, null, 2) + '\n');
if (process.argv.includes('--extract')) {
  console.log(JSON.stringify({ hashUpgrades: hashes.length, textSegments: texts.size }));
} else {
  const d = JSON.parse(readFileSync('translations/zh-CN.json')), match = createMatcher(d.entries, d.slotValues);
  for (const text of texts.values()) assert.ok(match(text.match === 'template' ? text.en.replace('{augmentation}', 'Neurotrainer I') : text.en, text.scope), text.en);
  const additions = d.entries.filter(e => e.review.note.startsWith('v0.7.1：'));
  for (const entry of additions) {
    const source = readSource(entry.source.path);
    assert.equal(entry.source.target, TARGET);
    assert.ok(source.includes(entry.source.targetExcerpt), entry.id);
    assert.ok(source.split('\n')[entry.source.targetLine - 1].includes(entry.source.targetExcerpt.split('\n')[0]), entry.id + ' line');
  }
  const report = { target: TARGET, newEntries: additions.length,
    updatedExistingEntries: d.entries.filter(e => e.review.note.includes(' v0.7.1：')).length,
    augmentationPurchaseReceipt: true, augmentationShopLabelsAndFilter: true, hashUpgrades: hashes.length,
    cumulativeEffects: hashes.filter(h => h.effect).length, stockSelectorLabels: selectors.length,
    stockOrderLabels: orders.length, sourceTextSegments: texts.size, sourceExcerptsVerified: true,
    retained: 'Hash-upgrade/API names, stock symbols, order values, server/company identifiers and all numbers.',
    meaning: 'Pinned-source matching audit and local fixture coverage; not live purchase or unlocked-save acceptance.' };
  writeFileSync('docs/supplement-v0.7.1-coverage.json', JSON.stringify(report, null, 2) + '\n');
  console.log(report);
}
