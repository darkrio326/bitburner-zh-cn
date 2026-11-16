// Read-only, pinned source inspection. Never executes game code or reads a save.
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
export const TARGET = '3162fd2590e221eadd0c0fbd46151913f7c4c41c';
export const readSource = (path, revision = TARGET) => execFileSync('git', ['-C', '.cache/upstream', 'show', `${revision}:${path}`], { encoding: 'utf8', maxBuffer: 20e6 });
export const parse = (path, source) => ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
export function enums() {
  const result = {};
  for (const area of ['Augmentation','Faction','Programs','Locations','Company','Literature','Message','Work','Crime']) {
    const path = `src/${area}/Enums.ts`;
    const root = parse(path, readSource(path));
    for (const node of root.statements) if (ts.isEnumDeclaration(node)) {
      result[node.name.text] = Object.fromEntries(node.members.filter(m => m.initializer && ts.isStringLiteral(m.initializer)).map(m => [m.name.getText(root), m.initializer.text]));
    }
  }
  return result;
}
export function staticText(node, enumValues) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return enumValues[node.expression.getText()]?.[node.name.text];
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const a = staticText(node.left, enumValues), b = staticText(node.right, enumValues);
    return a === undefined || b === undefined ? undefined : a+b;
  }
  if (ts.isTemplateExpression(node)) {
    let text = node.head.text;
    for (const span of node.templateSpans) {
      const value = staticText(span.expression, enumValues);
      if (value === undefined) return;
      text += value + span.literal.text;
    }
    return text;
  }
}
export function augmentationCorpus(enumValues = enums()) {
  const out = [];
  for (const path of ['src/Augmentation/Augmentations.ts','src/Augmentation/CircadianModulator.ts']) {
    const source = readSource(path), root = parse(path, source);
    function walk(node) {
      if (ts.isPropertyAssignment(node) && ['info','stats'].includes(node.name.getText(root))) {
        const parentName = node.parent.parent.name;
        const name = parentName && ts.isComputedPropertyName(parentName) ? staticText(parentName.expression, enumValues) : enumValues.AugmentationName.UnstableCircadianModulator;
        const text = staticText(node.initializer, enumValues);
        out.push({name,field:node.name.getText(root),text:text ?? null,source:{kind:'supplement',path,target:TARGET,targetLine:root.getLineAndCharacterOfPosition(node.initializer.getStart(root)).line+1,targetExcerpt:node.initializer.getText(root)}});
      }
      ts.forEachChild(node, walk);
    }
    walk(root);
  }
  return out;
}

export function cityMapCorpus(enumValues = enums()) {
  const path = 'src/Locations/Locations.ts', text = readSource(path), root = parse(path, text), out = [];
  function walk(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) && node.left.name.text === 'asciiArt' &&
        ts.isElementAccessExpression(node.left.expression) && ts.isNoSubstitutionTemplateLiteral(node.right)) {
      out.push({ city: staticText(node.left.expression.argumentExpression, enumValues), text: node.right.text,
        source: {kind:'supplement',path,target:TARGET,targetLine:root.getLineAndCharacterOfPosition(node.right.getStart(root)).line+1,targetExcerpt:node.right.getText(root)} });
    }
    ts.forEachChild(node, walk);
  }
  walk(root);
  return out;
}

export function deepPageCorpus(enumValues = enums()) {
  const jobs = [], crimes = [];
  const jobPath = 'src/Company/data/CompanyPositionsMetadata.ts';
  const jobRoot = parse(jobPath, readSource(jobPath));
  function jobWalk(node) {
    if (ts.isPropertyAssignment(node) && ts.isComputedPropertyName(node.name) && ts.isObjectLiteralExpression(node.initializer)) {
      const name = staticText(node.name.expression, enumValues);
      if (Object.values(enumValues.JobName).includes(name)) {
        const fields = Object.fromEntries(node.initializer.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText(jobRoot), staticText(p.initializer, enumValues)]));
        jobs.push({name, apply: fields.applyText ?? `Apply for ${name} Job`, hired: fields.hiredText ?? `Congratulations, you are now employed as a ${name}`});
      }
    }
    ts.forEachChild(node, jobWalk);
  }
  jobWalk(jobRoot);
  const crimePath = 'src/Crime/Crimes.ts', crimeRoot = parse(crimePath, readSource(crimePath));
  function crimeWalk(node) {
    if (ts.isNewExpression(node) && node.expression.getText(crimeRoot) === 'Crime') {
      const [work, tooltip, name] = node.arguments;
      crimes.push({name:staticText(name,enumValues),work:staticText(work,enumValues),tooltip:staticText(tooltip,enumValues)});
    }
    ts.forEachChild(node, crimeWalk);
  }
  crimeWalk(crimeRoot);
  return {target:TARGET, sources:[jobPath,crimePath,'src/Company/CompanyPosition.ts','src/Work/Enums.ts','src/Crime/Enums.ts'], jobs, crimes};
}
