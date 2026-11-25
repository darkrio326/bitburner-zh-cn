import ts from 'typescript';
import assert from 'node:assert/strict';
import { readSource, parse, staticText, deepPageCorpus, TARGET } from './source-corpus.mjs';

// Explicit UI contracts, including complete multiline work descriptions. Values
// are constrained by source enums or existing dictionary names, never wildcards.
export function advancedDynamicCorpus() {
  const cache = new Map(), items = [], choices = [];
  function source(path) {
    if (!cache.has(path)) {
      const text = readSource(path), root = parse(path, text), nodes = [];
      function visit(n) { nodes.push(n); ts.forEachChild(n, visit); }
      visit(root); cache.set(path, { root, nodes });
    }
    return cache.get(path);
  }
  function provenance(path, node) {
    const { root } = source(path);
    return { kind: 'supplement', path, target: TARGET, targetLine: root.getLineAndCharacterOfPosition(node.getStart(root)).line + 1, targetExcerpt: node.getText(root) };
  }
  function literal(path, prefix) {
    const { root, nodes } = source(path);
    const node = nodes.find(n => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) && (n.text ?? n.head?.text)?.startsWith(prefix));
    assert.ok(node, path + ': ' + prefix);
    return { node, root };
  }
  function add(path, prefix, text, scope, extra = {}) {
    const { node } = literal(path, prefix);
    items.push({ text: text ?? staticText(node, {}), scope, source: provenance(path, node), ...extra });
  }
  function enumItems(path, name) {
    const declaration = source(path).nodes.find(n => ts.isEnumDeclaration(n) && n.name.text === name);
    assert.ok(declaration, name);
    return declaration.members.map(n => ({ key: n.name.getText(source(path).root), value: n.initializer.text, source: provenance(path, n.initializer) }));
  }
  const go = enumItems('src/Go/Enums.ts', 'GoOpponent');
  const publicOpponents = go.filter(e => e.key !== 'w0r1d_d43m0n');
  const searchPath = 'src/Go/ui/GoSubnetSearch.tsx';
  const optionNode = source(searchPath).nodes.find(n => ts.isTemplateExpression(n) && n.getText().includes('opponentDetails[faction].description'));
  for (const opponent of publicOpponents) {
    const path = 'src/Go/Constants.ts';
    const object = source(path).nodes.find(n => ts.isPropertyAssignment(n) && ts.isComputedPropertyName(n.name) && n.name.expression.getText() === `GoOpponent.${opponent.key}`);
    const description = object.initializer.properties.find(n => ts.isPropertyAssignment(n) && n.name.getText() === 'description').initializer;
    items.push({ text: `${opponent.value} (${description.text})`, scope: 'go', source: { ...provenance(searchPath, optionNode), related: [opponent.source, provenance(path, description)] } });
  }
  const blade = [...enumItems('src/Bladeburner/Enums.ts', 'BladeburnerGeneralActionName'), ...enumItems('src/Bladeburner/Enums.ts', 'BladeburnerContractName'), ...enumItems('src/Bladeburner/Enums.ts', 'SpecialBladeburnerActionTypeForSleeve')];
  for (const entry of [...blade, ...enumItems('src/Work/Enums.ts', 'UniversityClassType'), ...enumItems('src/Crime/Enums.ts', 'CrimeType')]) choices.push({ text: entry.value, scope: 'sleeves', source: entry.source });
  const slotValues = {
    goOpponent: publicOpponents.map(e => e.value),
    bladeAction: blade.map(e => e.value),
    crimeWork: deepPageCorpus().crimes.map(e => e.work),
    sleeveWork: ['Hacking Contracts', 'Field Work', 'Security Work'],
  };
  const sleeve = 'src/PersonObjects/Sleeve/ui/SleeveElem.tsx';
  for (const prefix of ['This sleeve is currently idle.', 'This sleeve is currently supporting', 'This sleeve is currently set to focus', 'This sleeve is currently set to synchronize']) add(sleeve, prefix, undefined, 'sleeves');
  add(sleeve, 'This sleeve is currently working your job at ', 'This sleeve is currently working your job at {company}', 'sleeves', { slots: { company: 'company' } });
  for (const activity of ['working out', 'studying']) add(sleeve, 'This sleeve is currently ', `This sleeve is currently ${activity} at {location}`, 'sleeves', { slots: { location: 'location' }, source: provenance(sleeve, source(sleeve).nodes.find(n => ts.isTemplateExpression(n) && n.head.text === 'This sleeve is currently ')) });
  add(sleeve, 'This sleeve is currently doing ', 'This sleeve is currently doing {work} for {faction}.', 'sleeves', { slots: { work: 'sleeveWork', faction: 'faction' } });
  add(sleeve, 'This sleeve is currently attempting to perform ', 'This sleeve is currently attempting to perform {action}.', 'sleeves', { slots: { action: 'bladeAction' }, line: true, lineBlock: true });
  add(sleeve, 'This sleeve is currently attempting ', 'This sleeve is currently attempting {crime} (Success Rate: {chance}%).', 'sleeves', { slots: { crime: 'crimeWork', chance: 'number' }, line: true, lineBlock: true, source: provenance(sleeve, source(sleeve).nodes.find(n => ts.isTemplateExpression(n) && n.head.text === 'This sleeve is currently attempting ')) });
  add(sleeve, 'Estimated success chance: ', 'Estimated success chance: {chance}%', 'sleeves', { slots: { chance: 'number' }, line: true });
  add(sleeve, 'Estimated success chance: ', 'Estimated success chance: {min}% ~ {max}%', 'sleeves', { slots: { min: 'number', max: 'number' }, line: true });
  add(sleeve, 'Tasks Completed: ', 'Tasks Completed: {count}', 'sleeves', { slots: { count: 'number' }, line: true });
  add(sleeve, 'Progress: ', 'Progress: {progress}%', 'sleeves', { slots: { progress: 'number' }, line: true });
  for (const [i, text] of literal(sleeve, 'This sleeve is currently attempting to infiltrate').node.text.trim().split('\n').entries()) add(sleeve, 'This sleeve is currently attempting to infiltrate', text, 'sleeves', { line: true, ...(i === 0 ? { lineBlock: true } : {}) });
  const model = 'src/PersonObjects/Sleeve/Sleeve.ts';
  add(model, 'The "Disable Sleeves', undefined, 'sleeves');
  add(model, 'You must reduce the sleeve shock', 'You must reduce the sleeve shock to 0. The current shock is {shock}.', 'sleeves', { slots: { shock: 'number' } });
  add(model, 'You must have at least ', 'You must have at least {money}.', 'sleeves', { slots: { money: 'money' } });
  add(model, 'This sleeve already has ', 'This sleeve already has "{augmentation}" augmentation.', 'sleeves', { slots: { augmentation: 'augmentation' } });
  // Effect() returns these literal patterns; the UI substitutes only the number.
  const effectPath = 'src/CotMG/FragmentType.ts';
  for (const n of source(effectPath).nodes.filter(n => ts.isReturnStatement(n) && n.expression && ts.isStringLiteral(n.expression))) {
    const text = n.expression.text;
    items.push({ text, scope: 'stanek', source: provenance(effectPath, n.expression) });
    if (text.includes('x%')) items.push({ text: text.replace(/[-+]?x%/, '{value}%'), scope: 'stanek', slots: { value: 'number' }, source: provenance(effectPath, n.expression) });
  }
  const inspectorPath = 'src/CotMG/ui/FragmentInspector.tsx';
  const boosterNode = source(inspectorPath).nodes.find(n => ts.isTemplateExpression(n) && n.getText().includes('adjacent fragment power'));
  items.push({ text: '{power}x adjacent fragment power', scope: 'stanek', slots: { power: 'number' }, source: provenance(inspectorPath, boosterNode) });
  const board = 'src/Go/ui/GoGameboardWrapper.tsx';
  for (const prefix of ['Currently showing a past board state.', 'It is not your turn to play.', 'The game is complete,', 'The opponent passes their turn;', 'Place a router to begin!', 'View Final Score', 'Waiting for opponent']) add(board, prefix, undefined, 'go');
  add(board, 'Score: Black: ', 'Score: Black: {black} White: {white}', 'go', { slots: { black: 'number', white: 'number' } });
  for (const name of ['End Game', 'Pass Turn']) {
    add(board, name, name, 'go');
    for (const color of ['Black', 'White']) add(board, name, `${name} (${color})`, 'go');
  }
  const score = 'src/Go/ui/GoScoreModal.tsx';
  for (const prefix of ['Black wins!', 'You win!', 'White wins!']) add(score, prefix, undefined, 'go');
  add(score, 'Winner: ', 'Winner: {opponent}', 'go', { slots: { opponent: 'goOpponent' } });
  add('src/Go/ui/GoScoreSummaryTable.tsx', 'You', undefined, 'go');
  const challenge = 'src/Go/ui/GoTutorialChallenge.tsx';
  for (const prefix of ["Hit 'Reset' to try again", 'Invalid move: You cannot']) add(challenge, prefix, undefined, 'go');
  for (const e of enumItems('src/Go/Enums.ts', 'GoValidity').filter(e => e.key !== 'valid')) items.push({ text: 'Invalid move: ' + e.value, scope: 'go', source: e.source });
  return { target: TARGET, items, choices, slotValues, publicOpponents };
}
