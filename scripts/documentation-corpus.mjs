// Pinned source inspection only; this never imports game code or reads a save.
import ts from 'typescript';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { execFileSync } from 'node:child_process';
import { readSource, parse, enums, staticText, TARGET } from './source-corpus.mjs';
import { normalize } from '../src/matcher.js';
const prefix='src/Documentation/doc/en/';
export const guidePaths=['index.md','help/getting_started.md',...['stats','terminal','hacking','scripts','servers','ram','hacknet_nodes','augmentations','companies','factions','crimes','infiltration','programs','reputation','stockmarket','world','codingcontracts','autocomplete'].map(n=>'basic/'+n+'.md'),...['sourcefiles','bitnodes','intelligence','sleeves','grafting','stanek','hacknetservers','bladeburners','gang','corporations'].map(n=>'advanced/'+n+'.md'),'programming/learn.md','programming/offlineandbonustime.md','programming/game_frozen.md'];
export function documentationCorpus(){
 const items=[], pages=[], headings=new Set(), values=enums();
 const add=(text,source,scope,extra={})=>{text=normalize(text);if(/[A-Za-z]/.test(text))items.push({text,source,scope,...extra});};
 const bitPath='src/BitNode/BitNode.tsx',bitRoot=parse(bitPath,readSource(bitPath));
 const provenance=(path,root,n)=>({kind:'supplement',path,target:TARGET,targetLine:root.getLineAndCharacterOfPosition(n.getStart(root)).line+1,targetExcerpt:n.getText(root)});
 const sourceFiles=[];
 function walk(n,sf){
  if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(bitRoot)==='code')return;
  if(ts.isJsxText(n))add(n.text,provenance(bitPath,bitRoot,n),'augmentations',{sf});
  ts.forEachChild(n,c=>walk(c,sf));
 }
 function scan(n){
  if(ts.isNewExpression(n)&&n.expression.getText(bitRoot)==='BitNode'){
   const number=Number(n.arguments[0].getText(bitRoot));
   const name=staticText(n.arguments[1],values);
   sourceFiles.push({number,name,jsx:n.arguments[4].getText(bitRoot),source:provenance(bitPath,bitRoot,n.arguments[4])});
   walk(n.arguments[4],number);
  }
  ts.forEachChild(n,scan);
 }
 scan(bitRoot);
 for(const path of ['src/Augmentation/ui/SourceFiles.tsx','src/Documentation/ui/DocumentationRoot.tsx']){
  const root=parse(path,readSource(path));
  function walkUI(n){if(ts.isJsxText(n))add(n.text,provenance(path,root,n),path.includes('SourceFiles')?'augmentations':'documentation');ts.forEachChild(n,walkUI)}walkUI(root);
 }
 const processor=unified().use(remarkParse).use(remarkGfm);
 for(const rel of guidePaths){
  const path=prefix+rel,markdown=readSource(path),tree=processor.parse(markdown);
  pages.push({path:rel,markdown});
  function walkMd(n){
   if(n.type==='text')add(n.value,{kind:'supplement',path,target:TARGET,targetLine:n.position.start.line,targetExcerpt:markdown.slice(n.position.start.offset,n.position.end.offset)},'documentation',{page:rel});
   if(n.type==='heading')headings.add(normalize(n.children.map(x=>x.value??'').join('')));
   if(['code','inlineCode','html'].includes(n.type))return;
   for(const c of n.children??[])walkMd(c);
  }walkMd(tree);
 }
 // All h1 titles allow a markdown help popup to be recognized independently of
 // the selected game page. They do not reveal or translate locked links.
 const paths=execFileSync('git',['-C','.cache/upstream','ls-tree','-r','--name-only',TARGET,prefix],{encoding:'utf8'}).trim().split('\n');
 for(const path of paths){for(const m of readSource(path).matchAll(/^# (.+)$/gm))headings.add(m[1]);}
 return {target:TARGET,items,pages,sourceFiles,headings:[...headings],enums:values};
}
