// Pinned game-generated result dialogs. Never executes game code or reads saves.
import ts from 'typescript';
import { readSource, parse, staticText, enums, TARGET } from './source-corpus.mjs';
import { normalize } from '../src/matcher.js';

const paths = [
  'src/Augmentation/AugmentationHelpers.ts', 'src/RedPill.tsx', 'src/Prestige.ts',
  'src/Work/CompanyWork.tsx', 'src/Work/FactionWork.tsx', 'src/Work/GraftingWork.tsx',
  'src/Locations/ui/TravelAgencyRoot.tsx', 'src/PersonObjects/Player/PlayerObjectGeneralMethods.ts',
  'src/Infiltration/Infiltration.ts', 'src/ui/GameRoot.tsx',
];
const slotsByExpression = {
  augmentationList: ['augmentations', 'augmentationLines'],
  'sourceFile.name': ['sourceFile', 'sourceFile'], lvl: ['level', 'integer'],
  to: ['city', 'city'], company: ['company', 'company'],
};
export function dialogCorpus() {
  const items = new Map(), values = enums();
  for (const path of paths) {
    const root = parse(path, readSource(path));
    function add(node, text, slots = {}) {
      if (!text || !/[A-Za-z]{3}/.test(text)) return;
      // Keep the install receipt's line breaks: the captured list is verbatim.
      const en = Object.values(slots).includes('augmentationLines') ? text.trim() : normalize(text);
      if (!items.has(en)) items.set(en, {
        en, scope: /Work\/(Company|Faction)Work/.test(path) ? 'work-result' : path.includes('GraftingWork') ? 'grafting' : 'dialogs',
        ...(Object.keys(slots).length ? { match: 'template', slots } : {}),
        source: { kind: 'supplement', path, target: TARGET, targetLine: root.getLineAndCharacterOfPosition(node.getStart(root)).line + 1, targetExcerpt: node.getText(root) },
      });
    }
    function expression(node, slots) {
      const fixed = staticText(node, values);
      if (fixed !== undefined) return fixed;
      const slot = slotsByExpression[node.getText(root)];
      if (slot) { slots[slot[0]] = slot[1]; return '{' + slot[0] + '}'; }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const a = expression(node.left, slots), b = expression(node.right, slots);
        if (a !== undefined && b !== undefined) return a + b;
      }
      if (ts.isTemplateExpression(node)) {
        let text = node.head.text;
        for (const span of node.templateSpans) {
          const part = expression(span.expression, slots);
          if (part === undefined) return;
          text += part + span.literal.text;
        }
        return text;
      }
    }
    function jsx(node) {
      if (ts.isJsxText(node)) add(node, node.text);
      if (ts.isJsxExpression(node) && node.expression && ts.isConditionalExpression(node.expression)) {
        for (const branch of [node.expression.whenTrue, node.expression.whenFalse]) add(branch, staticText(branch, values));
      }
      ts.forEachChild(node, jsx);
    }
    function walk(node) {
      if (ts.isCallExpression(node) && ['dialogBoxCreate', 'delayedDialog'].includes(node.expression.getText(root)) && node.arguments[0]) {
        const arg = node.arguments[0], slots = {};
        const text = expression(arg, slots);
        if (text !== undefined) add(arg, text, slots);
        else if (ts.isJsxFragment(arg) || ts.isJsxElement(arg)) jsx(arg);
      }
      ts.forEachChild(node, walk);
    }
    walk(root);
  }
  const bitPath = 'src/BitNode/BitNode.tsx', bitRoot = parse(bitPath, readSource(bitPath)), sourceFileNames = [];
  function bitNodes(node) {
    if (ts.isNewExpression(node) && node.expression.getText(bitRoot) === 'BitNode') {
      sourceFileNames.push(`Source-File ${node.arguments[0].getText(bitRoot)}: ${staticText(node.arguments[1], values)}`);
    }
    ts.forEachChild(node, bitNodes);
  }
  bitNodes(bitRoot);
  return { target: TARGET, paths, items: [...items.values()], sourceFileNames };
}
