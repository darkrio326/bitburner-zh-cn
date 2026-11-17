import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { createMatcher } from '../src/matcher.js';

const dictionary = JSON.parse(readFileSync('translations/zh-CN.json', 'utf8'));
const candidates = JSON.parse(readFileSync('translations/candidates.json', 'utf8')).candidates;
const ids = new Set();
for (const entry of dictionary.entries) {
  if (ids.has(entry.id)) throw new Error(`Duplicate id ${entry.id}`);
  ids.add(entry.id);
  if (!entry.review?.note || !entry.source?.targetLine) throw new Error(`Missing review/source ${entry.id}`);
  if (entry.source.kind === 'pr-diff') {
    const candidate = candidates.find(c => c.id === entry.id);
    if (!candidate?.targetVerified || candidate.en !== entry.en || JSON.stringify(candidate.source) !== JSON.stringify(entry.source)) {
      throw new Error(`Source verification failed: ${entry.id}`);
    }
  }
}
createMatcher(dictionary.entries, dictionary.slotValues); // Reject conflicts and invalid templates.
for (const label of dictionary.mapLabels ?? []) {
  if (label.review?.status !== 'approved' || !label.source?.targetLine || !label.source.targetExcerpt?.includes(label.en)) {
    throw new Error(`Unverified city map label: ${label.en}`);
  }
}
const license = readFileSync('licenses/Bitburner.txt', 'utf8');
const ownLicense = readFileSync('licenses/MIT.txt', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;
const homepage = pkg.repository.url.replace(/\.git$/, '');
const raw = homepage.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/main/bitburner-zh-cn.user.js';
const banner = `// ==UserScript==
// @name         Bitburner 简体中文汉化
// @namespace    bitburner-zh-cn-local
// @version      ${version}
// @homepageURL  ${homepage}
// @supportURL   ${homepage}/issues
// @updateURL    ${raw}
// @downloadURL  ${raw}
// @description  官方网页版 v3.0.1 简体中文；直接显示/悬停模式，保留命令、编辑器与存档，可恢复英文。
// @match        https://bitburner-official.github.io/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @license      MIT for independent code; Apache-2.0 with Commons Clause for bundled game text (see embedded notices)
// ==/UserScript==

/*
 * Independent userscript with reversible Text.data translation and hover overlay.
 * Translation excerpts adapted and reviewed from
 * Bitburner (Daniel Y Xie and contributors), PR #3068 by FRzhuizhu.
 * https://github.com/bitburner-official/bitburner-src/pull/3068
 * Modifications: selected v3.0.1 strings, terminology review, scoped hover matching.
 * This is an unofficial companion, not an upstream localization release.
 * Full provenance: ${homepage}/blob/main/translations/zh-CN.json
 * Independent code license (does not relicense bundled game text):
${ownLicense.replaceAll('*/', '* /')}
 * Bitburner and derivative translation license:
 * Upstream license follows:
${license.replaceAll('*/', '* /')}
*/`;
const result = await build({
  entryPoints: ['src/entry.js'], bundle: true, format: 'iife', target: ['chrome100', 'firefox102'],
  write: false, banner: { js: banner }, legalComments: 'inline',
  plugins: [{ name: 'compact-dictionary', setup(b) {
    b.onLoad({ filter: /zh-CN\.json$/ }, () => ({ loader: 'json', contents: JSON.stringify({
      factionNames: dictionary.factionNames, locationNames: dictionary.locationNames,
      augmentationNames: dictionary.augmentationNames, slotValues: dictionary.slotValues,
      documentationHeadings: dictionary.documentationHeadings,
      mapLabels: dictionary.mapLabels,
      entries: dictionary.entries.filter(e => e.review.status === 'approved').map(e => ({
        id: e.id, en: e.en, zh: e.zh, scopes: e.scopes, segment: e.segment, inline: e.inline, selector: e.selector,
        match: e.match, slots: e.slots, line: e.line, lineBlock: e.lineBlock, attribute: e.attribute,
        review: { status: e.review.status }, source: { kind: e.source.kind, path: e.source.path,
          target: e.source.target, targetLine: e.source.targetLine, pr: e.source.pr, head: e.source.head, line: e.source.next?.line },
      })),
    }) }));
  } }],
});
const output = result.outputFiles[0].text;
if (process.argv.includes('--check')) {
  if (readFileSync('bitburner-zh-cn.user.js', 'utf8') !== output) throw new Error('Userscript is stale. Run npm run build.');
} else writeFileSync('bitburner-zh-cn.user.js', output);
console.log(`Userscript ${Buffer.byteLength(output)} bytes; ${dictionary.entries.length} reviewed entries.`);
