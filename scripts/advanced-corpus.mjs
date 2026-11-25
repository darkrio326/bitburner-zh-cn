// Read pinned source without importing game modules or accessing a save.
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readSource, parse, staticText, TARGET } from './source-corpus.mjs';
import { normalize } from '../src/matcher.js';

export function advancedCorpus() {
  const roots = { 'src/PersonObjects/Sleeve/ui': 'sleeves', 'src/CotMG/ui': 'stanek', 'src/Go/ui': 'go' };
  const paths = execFileSync('git', ['-C', '.cache/upstream', 'ls-tree', '-r', '--name-only', TARGET, ...Object.keys(roots)], { encoding: 'utf8' }).trim().split('\n').filter(p => p.endsWith('.tsx'));
  const items = new Map(), pages = [];
  function add(text, node, root, path, scope, extra = {}) {
    if (text === undefined) return;
    text = normalize(text.replaceAll('&nbsp;', ' ').replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
    if (!/[A-Za-z]/.test(text)) return;
    const key = scope + '\0' + text;
    if (!items.has(key)) items.set(key, { text, scope, source: { kind: 'supplement', path, target: TARGET, targetLine: root.getLineAndCharacterOfPosition(node.getStart(root)).line + 1, targetExcerpt: node.getText(root) }, ...extra });
  }
  for (const path of paths) {
    const scope = roots[Object.keys(roots).find(p => path.startsWith(p + '/'))];
    const source = readSource(path), root = parse(path, source);
    function displayExpression(node) {
      const value = staticText(node, {});
      if (value !== undefined) add(value, node, root, path, scope);
      else if (ts.isConditionalExpression(node)) { displayExpression(node.whenTrue); displayExpression(node.whenFalse); }
    }
    function walk(node) {
      if (ts.isJsxElement(node) && ['code', 'pre'].includes(node.openingElement.tagName.getText(root))) return;
      if (ts.isJsxText(node)) add(node.text, node, root, path, scope);
      if (ts.isJsxAttribute(node) && ['title', 'label', 'text', 'placeholder', 'description', 'correctText', 'incorrectText'].includes(node.name.getText(root))) {
        if (node.initializer && ts.isStringLiteral(node.initializer)) add(node.initializer.text, node.initializer, root, path, scope, node.name.getText(root) === 'placeholder' ? { attribute: 'placeholder' } : {});
        if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) displayExpression(node.initializer.expression);
      }
      if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) displayExpression(node.expression);
      if (ts.isCallExpression(node) && node.expression.getText(root) === 'dialogBoxCreate') for (const arg of node.arguments) displayExpression(arg);
      // These components render labels from tuples or their name prop.
      if (path.endsWith('/StatsElement.tsx')) {
        if (ts.isJsxAttribute(node) && node.name.getText(root) === 'name' && node.initializer) add(staticText(node.initializer, {}), node.initializer, root, path, scope);
        if (ts.isArrayLiteralExpression(node) && node.elements.length === 2) add(staticText(node.elements[0], {}), node.elements[0], root, path, scope);
      }
      // Task names are visible option labels; the Select's original values are retained.
      if (path.endsWith('/TaskSelector.tsx')) {
        if (ts.isStringLiteral(node) && (ts.isArrayLiteralExpression(node.parent) || ts.isCallExpression(node.parent) && node.parent.expression.getText(root) === 'options.push')) add(node.text, node, root, path, scope);
        if (ts.isVariableDeclaration(node) && node.name.getText(root) === 'canDo') {
          const object = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer;
          for (const prop of object.properties) add(ts.isStringLiteral(prop.name) ? prop.name.text : prop.name.getText(root), prop.name, root, path, scope);
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(root);
    pages.push({ path, scope });
  }
  const dataPath = 'src/Go/Constants.ts', dataRoot = parse(dataPath, readSource(dataPath));
  const opponents = [];
  function dataWalk(node) {
    if (ts.isPropertyAssignment(node) && ts.isComputedPropertyName(node.name) && node.name.expression.getText(dataRoot).startsWith('GoOpponent.')) {
      const key = node.name.expression.getText(dataRoot).split('.')[1];
      if (key !== 'w0r1d_d43m0n') {
        const fields = {};
        for (const prop of node.initializer.properties ?? []) if (ts.isPropertyAssignment(prop) && ['description', 'flavorText', 'bonusDescription'].includes(prop.name.getText(dataRoot))) {
          const text = staticText(prop.initializer, {}); fields[prop.name.getText(dataRoot)] = text;
          add(text, prop.initializer, dataRoot, dataPath, 'go');
        }
        opponents.push({ key, ...fields });
      }
    }
    ts.forEachChild(node, dataWalk);
  }
  dataWalk(dataRoot);
  return { target: TARGET, pages, items: [...items.values()], opponents };
}
