// Pinned, read-only corpus for Gang, Bladeburner and Corporation UI.
// Parse source expressions; never import or execute game code or access a save.
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readSource, parse, staticText, TARGET } from './source-corpus.mjs';
import { normalize } from '../src/matcher.js';
const areas = ['Gang','Bladeburner','Corporation'];
export function managementCorpus() {
  const enums = {};
  for (const path of ['src/Bladeburner/Enums.ts','src/Corporation/Enums.ts','src/Locations/Enums.ts','src/Faction/Enums.ts']) {
    const root = parse(path, readSource(path));
    for (const n of root.statements) if (ts.isEnumDeclaration(n)) enums[n.name.text] = Object.fromEntries(
      n.members.filter(m => m.initializer && ts.isStringLiteral(m.initializer)).map(m => [m.name.getText(root),m.initializer.text]));
  }
  const descriptions = [], ui = [], identifiers = Object.values(enums).flatMap(Object.values);
  const paths = execFileSync('git',['-C','.cache/upstream','ls-tree','-r','--name-only',TARGET,...areas.map(a=>'src/'+a)],{encoding:'utf8'}).trim().split('\n');
  const dataFiles = ['src/Gang/data/tasks.ts', ...['GeneralActions','Contracts','Operations','BlackOperations','Skills'].map(n=>'src/Bladeburner/data/'+n+'.ts'),
    'src/Corporation/ResearchMap.ts', ...['IndustryData','CorporationUnlocks','CorporationUpgrades'].map(n=>'src/Corporation/data/'+n+'.ts')];
  for (const path of paths.filter(p => /\/ui\/.*\.tsx$/.test(p) || dataFiles.includes(p))) {
    const source = readSource(path), root = parse(path,source), scope = path.split('/')[1].toLowerCase();
    const provenance = n => ({kind:'supplement',path,target:TARGET,targetLine:root.getLineAndCharacterOfPosition(n.getStart(root)).line+1,targetExcerpt:n.getText(root)});
    function walk(n) {
      if (dataFiles.includes(path) && ts.isPropertyAssignment(n)) {
        if (['desc','description','successScaling','warning'].includes(n.name.getText(root))) {
          const nameNode = n.parent.properties?.find(p => ts.isPropertyAssignment(p) && p.name.getText(root)==='name');
          let name = nameNode && staticText(nameNode.initializer,enums);
          if (!name && ts.isPropertyAssignment(n.parent.parent)) name = n.parent.parent.name.getText(root);
          const text = staticText(n.initializer,enums);
          if (text) descriptions.push({scope,name,field:n.name.getText(root),text,source:provenance(n.initializer)});
          if (name) identifiers.push(name);
        }
      }
      if (path.includes('/ui/')) {
        let text;
        if (ts.isJsxText(n)) text=n.text;
        else if (ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)) {
          const p=n.parent;
          if (ts.isJsxAttribute(p)&&['label','title'].includes(p.name.getText(root)) ||
              ts.isJsxExpression(p)&&!ts.isJsxAttribute(p.parent) ||
              ts.isArrayLiteralExpression(p)&&p.elements[0]===n ||
              ts.isCallExpression(p)&&p.arguments.includes(n)&&p.expression.getText(root)==='dialogBoxCreate') text=n.text;
        }
        if (text && /[A-Za-z]/.test(text)) {
          text=normalize(text.replaceAll('&nbsp;',' ').replaceAll('&gt;','>'));
          if (text) ui.push({scope,text,source:provenance(n)});
        }
      }
      ts.forEachChild(n,walk);
    }
    walk(root);
  }
  return {target:TARGET,ui,descriptions,identifiers:[...new Set(identifiers)]};
}
