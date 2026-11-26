// Fixed-source inventory of faction prose, labels and campaign messages.
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readSource, parse, staticText, TARGET } from './source-corpus.mjs';
import { normalize } from '../src/matcher.js';

export function factionCorpus() {
  const paths = execFileSync('git', ['-C', '.cache/upstream', 'ls-tree', '-r', '--name-only', TARGET, 'src/Faction/ui'], { encoding: 'utf8' }).trim().split('\n');
  paths.push('src/Faction/FactionInfo.tsx');
  const items = new Map();
  for (const path of paths) {
    const root = parse(path, readSource(path));
    const scope = path.endsWith('/AugmentationsPage.tsx') ? 'augmentations' : 'factions';
    const add = (text, node, extra = {}) => {
      if (text === undefined) return;
      text = normalize(text.replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&'));
      if (!/[A-Za-z]/.test(text)) return;
      let retained;
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (ts.isStringLiteral(node) && ts.isJsxExpression(node.parent) && ts.isPropertyAssignment(parent) && ['[FactionName.NiteSec]', '[FactionName.ChurchOfTheMachineGod]'].includes(parent.name.getText(root))) retained = 'Faction ASCII artwork';
      }
      if (['I.I.I.I', '~~//*>H4CK|\\|3T 8URN3R5**>?>\\\\~~'].includes(text) || /__(Y0U|N0T|TH3|TRU1H)__/.test(text)) retained = 'Encoded in-game clue';
      if (text === 'x') retained = 'Multiplier symbol';
      const key = scope + '\0' + (extra.attribute ?? '') + '\0' + text;
      if (!items.has(key)) items.set(key, { text, scope, ...(retained ? { retained } : {}), ...extra, source: { kind: 'supplement', path, target: TARGET,
        targetLine: root.getLineAndCharacterOfPosition(node.getStart(root)).line + 1, targetExcerpt: node.getText(root) } });
    };
    function expression(node) {
      const value = staticText(node, {});
      if (value !== undefined) add(value, node);
      else if (ts.isConditionalExpression(node)) { expression(node.whenTrue); expression(node.whenFalse); }
    }
    function walk(node) {
      if (ts.isJsxText(node)) add(node.text, node);
      if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) expression(node.expression);
      if (ts.isJsxAttribute(node) && ['title', 'buttonText', 'infoText', 'placeholder'].includes(node.name.getText(root)) && node.initializer) {
        const value = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
        add(staticText(value, {}), value, node.name.getText(root) === 'placeholder' ? { attribute: 'placeholder' } : {});
      }
      if (ts.isVariableDeclaration(node) && ['hackingContractsInfo', 'fieldWorkInfo', 'securityWorkInfo', 'augmentationsInfo'].includes(node.name.getText(root))) expression(node.initializer);
      if (ts.isVariableDeclaration(node) && ['hackingGangText', 'combatGangText'].includes(node.name.getText(root))) {
        function gangText(part) {
          if (part.getText(root) === 'props.facName') return '{faction}';
          if (ts.isBinaryExpression(part) && part.operatorToken.kind === ts.SyntaxKind.PlusToken) return gangText(part.left) + gangText(part.right);
          return staticText(part, {});
        }
        add(gangText(node.initializer), node.initializer, { slots: { faction: 'faction' } });
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && /^data\.(title|description|tooltip)$/.test(node.left.getText(root))) expression(node.right);
      ts.forEachChild(node, walk);
    }
    walk(root);
  }
  return { target: TARGET, paths, items: [...items.values()] };
}
