import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const script = readFileSync('bitburner-zh-cn.user.js', 'utf8');
const fixture = (await build({ entryPoints: ['tests/dialog-fixture.jsx'], bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })).outputFiles[0].text;
const toolbar = '#bitburner-zh-cn-overlay';
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1104, height: 510 });
  await page.setContent('<style>body{background:black;color:#0f0;margin:0}</style><div id="root"></div>');
  await page.evaluate(() => {
    window.fixtureErrors = []; window.addEventListener('error', e => window.fixtureErrors.push(e.message));
    window.GM_getValue = (k, v) => v;
    window.GM_registerMenuCommand = (name, fn) => { if (name.includes('完全移除')) window.removeChinese = fn; return name; };
    window.GM_unregisterMenuCommand = () => {};
  });
  await page.addScriptTag({ content: fixture });
  await page.evaluate(() => { window.installNode = document.querySelector('#alert-message').firstChild; });
  await page.addScriptTag({ content: script });
});
test.afterEach(async ({ page }) => { expect(await page.evaluate(() => window.fixtureErrors)).toEqual([]); });

test('screenshot installation receipt translates over Terminal and preserves list, node and close behavior', async ({ page }) => {
  await expect(page.locator('#alert-message')).toContainText('科学家为你施行麻醉');
  await expect(page.locator('#alert-message')).toContainText('你在家中醒来');
  const before = await page.evaluate(() => ({ text: window.dialogFixture.original, names: window.dialogFixture.names }));
  const after = await page.locator('#alert-message').innerText();
  expect(after.split('\n').slice(1, -1)).toEqual(before.text.split('\n').slice(1, -1));
  expect(await page.evaluate(() => window.installNode === document.querySelector('#alert-message').firstChild)).toBe(true);
  await expect(page.locator('#terminal')).toHaveText(before.text);
  for (const width of [900, 1104, 1280]) {
    await page.setViewportSize({ width, height: 510 });
    expect(await page.getByRole('dialog').evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1104, height: 510 });
  await page.screenshot({ path: 'output/playwright/install-dialog-after.png' });
  writeFileSync('output/playwright/install-dialog-readback.json', JSON.stringify({ translated: after, preservedNames: before.names, nodePreserved: true }, null, 2) + '\n');
  await page.getByRole('button', { name: 'Close popup', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('install receipt follows React updates and restores exact English through hover, disable and removal', async ({ page }) => {
  await expect(page.locator('#alert-message')).toContainText('科学家');
  await page.evaluate(() => window.dialogFixture.install(['Neurotrainer II', 'NeuroFlux Governor - 9']));
  await expect(page.locator('#alert-message')).toContainText('NeuroFlux Governor - 9');
  await expect(page.locator('#alert-message')).toContainText('你在家中醒来');
  await page.locator(toolbar).getByText('显示：直接', { exact: true }).click();
  await expect(page.locator('#alert-message')).toContainText('You slowly drift');
  await page.locator('#alert-message').hover();
  await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('科学家');
  await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('NeuroFlux Governor - 9');
  await page.locator(toolbar).getByText('显示：悬停', { exact: true }).click();
  await expect(page.locator('#alert-message')).toContainText('你在家中醒来');
  await page.locator(toolbar).getByText('中文：开', { exact: true }).click();
  await expect(page.locator('#alert-message')).toHaveText('You slowly drift to sleep as scientists put you under in order to install the following Augmentations:\nNeurotrainer II\nNeuroFlux Governor - 9\n\nYou wake up in your home...you feel different...');
  await page.locator(toolbar).getByText('中文：关', { exact: true }).click();
  await expect(page.locator('#alert-message')).toContainText('科学家');
  await page.evaluate(() => window.removeChinese());
  await expect(page.locator(toolbar)).toHaveCount(0);
  await expect(page.locator('#alert-message')).toContainText('You wake up in your home');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('work and grafting outcome scopes survive page changes and preserve reputation, names and warnings', async ({ page }) => {
  await page.evaluate(() => window.dialogFixture.show('company'));
  await expect(page.locator('#alert-outer')).toContainText('你已结束');
  await expect(page.locator('#alert-outer')).toContainText('MegaCorp');
  await page.evaluate(() => { window.dialogFixture.setValue('98.765k'); window.dialogFixture.setRoute('Stats'); });
  await expect(page.locator('#alert-outer')).toContainText('98.765k');
  await expect(page.locator('#alert-outer')).toContainText('该公司的声望');
  await page.evaluate(() => window.dialogFixture.show('faction'));
  await expect(page.locator('#alert-outer')).toContainText('你在该派系的声望');
  await expect(page.locator('#alert-outer')).toContainText('CyberSec');
  await page.evaluate(() => window.dialogFixture.show('grafted'));
  await expect(page.locator('#alert-outer')).toContainText('你已完成移植');
  await expect(page.locator('#alert-outer')).toContainText('感觉有些不对劲');
  await page.evaluate(() => window.dialogFixture.show('cancelled'));
  await expect(page.locator('#alert-outer')).toContainText('花费的资金不会退还');
  await expect(page.locator('#alert-outer')).toContainText('Neurotrainer II');
  await page.locator(toolbar).getByText('中文：开', { exact: true }).click();
  await expect(page.locator('#alert-outer')).toContainText('Your money was not returned to you.');
});

test('source-file award reuses existing effects; fixed reset and travel dialogs translate without exposing unknown text', async ({ page }) => {
  await page.evaluate(() => window.dialogFixture.show('sourcefile'));
  await expect(page.locator('#alert-outer')).toContainText('获得了一份 Source-File');
  await expect(page.locator('#alert-outer')).toContainText('32GB');
  await expect(page.locator('#alert-outer')).not.toContainText('This Source-File lets the player');
  await expect(page.locator('#alert-outer')).toContainText('Source-File 1: Source Genesis');
  await expect(page.locator('code')).toHaveText("ns.hack('n00dles')");
  for (const [en, zh] of [['Soft Reset!', '软重置！'], ['You are now in Aevum!', '你现在位于 Aevum！'], ['You have not purchased any Augmentations to install!', '你还没有购买任何可供安装的强化！']]) {
    await page.evaluate(text => window.dialogFixture.show(text), en);
    await expect(page.locator('#alert-message')).toHaveText(zh);
  }
  await page.evaluate(() => window.dialogFixture.show('A user script says: You are now in Aevum!'));
  await expect(page.locator('#alert-message')).toHaveText('A user script says: You are now in Aevum!');
});
