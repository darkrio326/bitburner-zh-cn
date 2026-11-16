// Candidate extraction only. Never promotes an entry to approved.
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const repo = '.cache/upstream';
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 20e6 });
const base = '2dc5ab15a1d8a7acf50021cf32ea4108a4b672e7';
const head = 'b68cee85d4c507f8902ff5d0701641dc1edf59c7';
const target = '3162fd2590e221eadd0c0fbd46151913f7c4c41c';
const normalize = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const files = git('diff', '--name-only', base, head).trim().split('\n').filter(p =>
  /^src\/(Gang|Bladeburner|Corporation)\/.*\.tsx?$/.test(p) ||
  /^(src\/(Sidebar\/ui|Faction\/ui|Hacknet\/ui|Augmentation\/ui|GameOptions\/ui|Locations\/ui|Company\/ui|Programs\/ui|StockMarket\/ui|Milestones\/ui|Achievements)\/.*\.tsx|src\/(Augmentation\/(Augmentations|Augmentation|CircadianModulator)|Faction\/FactionJoinCondition|Programs\/Programs|Milestones\/Milestones)\.ts|src\/engine\.tsx|src\/Faction\/FactionInfo\.tsx|src\/ui\/(CharacterStats\.tsx|WorkInProgressRoot\.tsx|ActiveScripts\/.*\.tsx|InteractiveTutorial\/.*\.tsx|React\/(ConfirmationModal|FavorInfo|ReputationInfo|Overview|CharacterOverview)\.tsx))$/.test(p));

function literals(path, source) {
  const root = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = new Map();
  function staticValue(n) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n)) return n.text;
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const a = staticValue(n.left), b = staticValue(n.right);
      if (a !== undefined && b !== undefined) return a + b;
    }
  }
  function walk(n, slot) {
    const value = staticValue(n);
    if (value !== undefined) {
      const start = n.getStart(root), end = n.getEnd();
      out.set(slot, { text: normalize(value), line: root.getLineAndCharacterOfPosition(start).line + 1,
        endLine: root.getLineAndCharacterOfPosition(end).line + 1, excerpt: source.slice(start, end) });
      return;
    }
    let i = 0;
    ts.forEachChild(n, child => { walk(child, `${slot}/${i++}`); });
  }
  walk(root, '');
  return out;
}
function changedLines(patch) {
  const old = new Set(), next = new Set();
  let a = 0, b = 0;
  for (const line of patch.split('\n')) {
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)/);
    if (hunk) { a = +hunk[1]; b = +hunk[2]; continue; }
    if (line.startsWith('---') || line.startsWith('+++')) continue;
    if (line.startsWith('-')) old.add(a++);
    else if (line.startsWith('+')) next.add(b++);
    else if (line.startsWith(' ')) { a++; b++; }
  }
  return { old, next };
}
const intersects = (entry, lines) => [...lines].some(n => n >= entry.line && n <= entry.endLine);
const candidates = [];
mkdirSync('translations', { recursive: true });
for (const path of files) {
  const enSource = git('show', `${base}:${path}`), zhSource = git('show', `${head}:${path}`);
  const targetSource = git('show', `${target}:${path}`);
  const en = literals(path, enSource), zh = literals(path, zhSource), targetLiterals = [...literals(path, targetSource).values()];
  const changed = changedLines(git('diff', '--unified=0', base, head, '--', path));
  for (const [slot, old] of en) {
    const next = zh.get(slot);
    if (!next || old.text === next.text || !/[A-Za-z]/.test(old.text) || !/[\u3400-\u9fff]/.test(next.text)) continue;
    if (!intersects(old, changed.old) || !intersects(next, changed.next)) continue;
    const original = targetLiterals.find(item => item.text === old.text);
    const id = createHash('sha256').update(`${path}\0${old.text}\0${next.text}`).digest('hex').slice(0, 12);
    candidates.push({ id, en: old.text, zh: next.text, status: 'pending', targetVerified: !!original,
      source: { kind: 'pr-diff', pr: 3068, path, base, head, target, old, next, targetLine: original?.line ?? null,
        targetExcerpt: original?.excerpt ?? null } });
  }
}
writeFileSync('translations/candidates.json', JSON.stringify({ schemaVersion: 1, base, head, target, candidates }, null, 2) + '\n');
console.log(`${candidates.length} candidates; ${candidates.filter(x => x.targetVerified).length} have exact v3.0.1 source text. All pending review.`);
