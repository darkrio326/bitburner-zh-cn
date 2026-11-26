import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const script = readFileSync('bitburner-zh-cn.user.js', 'utf8');
const dictionary = JSON.parse(readFileSync('translations/zh-CN.json'));
const fixture = (await build({ entryPoints: ['tests/factions-fixture.jsx'], bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })).outputFiles[0].text;
const toolbar = '#bitburner-zh-cn-overlay';
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1673, height: 900 });
  await page.setContent('<style>body{background:black;color:#0f0;margin:0}</style><div id="root"></div>');
  await page.evaluate(() => {
    window.fixtureErrors = []; window.addEventListener('error', e => window.fixtureErrors.push(e.message));
    window.GM_getValue = (k, v) => v;
    window.GM_registerMenuCommand = (name, fn) => { if (name.includes('完全移除')) window.removeChinese = fn; return name; };
    window.GM_unregisterMenuCommand = () => {};
  });
  await page.addScriptTag({ content: fixture });
  await expect(page.locator('#rep')).toHaveText('1.125');
  await page.evaluate(() => { window.repNode = document.querySelector('#rep').firstChild; window.introNode = document.querySelector('#faction-intro').firstChild; });
  await page.addScriptTag({ content: script });
});
test.afterEach(async ({ page }) => { expect(await page.evaluate(() => window.fixtureErrors)).toEqual([]); });

test('The Black Hand screenshot translates its faction prose, work options and campaign without changing data', async ({ page }) => {
  await expect(page.locator('h4')).toHaveText('The Black Hand');
  await expect(page.locator('#faction-intro')).toContainText('这个世界如此惧怕强势政府');
  await expect(page.locator('h5')).toContainText('特殊行动');
  await expect(page.getByRole('button', { name: '执行组建计划', exact: true })).toBeVisible();
  await expect(page.locator('#work-intro')).toContainText('为你的派系工作');
  await expect(page.locator('#work-intro')).toContainText('积累声望后');
  await expect(page.locator('#donation-limit')).toContainText('解锁捐赠所需人脉为');
  await expect(page.locator('#donation-limit')).toContainText('150.000');
  await expect(page.locator('#donation-limit')).toContainText('The Black Hand');
  for (const [label, work] of [['黑客合约', 'hacking'], ['外勤工作', 'field'], ['安保工作', 'security']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    expect(await page.evaluate(() => window.factionAction)).toEqual({ faction: 'The Black Hand', work });
  }
  await page.evaluate(() => window.factionFixture.setRep('98.765k'));
  await expect(page.locator('#rep')).toHaveText('98.765k');
  expect(await page.evaluate(() => window.repNode === document.querySelector('#rep').firstChild && window.introNode === document.querySelector('#faction-intro').firstChild)).toBe(true);
  await page.getByRole('button', { name: '执行组建计划', exact: true }).click();
  await expect(page.locator('#campaign-message')).toContainText('每次');
  await expect(page.locator('#campaign-message')).toContainText('__Y0U__');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('#campaign-help').hover();
  await expect(page.getByRole('tooltip').filter({ hasText: '一些派系' }).first()).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip').filter({ hasText: '一些派系' }).first()).toBeHidden();
  await page.screenshot({ path: 'output/playwright/faction-after.png', fullPage: true });
  const translated = await page.locator('main').innerText();
  writeFileSync('output/playwright/faction-readback.json', JSON.stringify({ version: '0.8.2', translated, nodePreserved: true, verificationLayer: 'Local source-shaped React/MUI fixture' }, null, 2));
});

test('all known faction headings use faction scope while the identically named augmentation modal keeps its own scope', async ({ page }) => {
  for (const name of dictionary.factionNames.filter(n => !['unknown', 'rumored', 'known'].includes(n))) {
    await page.evaluate(value => window.factionFixture.setName(value), name);
    await expect(page.locator('h4')).toHaveText(name);
    await expect(page.getByRole('button', { name: '黑客合约', exact: true })).toBeVisible();
  }
  await page.evaluate(() => window.factionFixture.setName('The Black Hand'));
  await page.getByRole('button', { name: '购买强化', exact: true }).click();
  await expect(page.getByRole('dialog').locator('h4')).toHaveText('The Black Hand');
  await expect(page.locator('#augmentation-info')).not.toContainText('The Black Hand is a');
  await expect(page.locator('#augmentation-info')).toContainText('手');
  await expect(page.locator('#faction-intro')).toContainText('这个世界');
  await page.getByRole('dialog').getByRole('button', { name: '购买', exact: true }).click();
  expect(await page.evaluate(() => window.augmentationAction)).toBe('The Black Hand');
  await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
  await page.evaluate(() => window.factionFixture.setModal('gang'));
  await expect(page.getByRole('dialog')).toContainText('The Black Hand 是黑客型帮派');
  await expect(page.getByRole('dialog')).toContainText('声望');
  await page.getByRole('dialog').getByRole('button', { name: '创建帮派', exact: true }).click();
  expect(await page.evaluate(() => window.gangAction)).toBe('The Black Hand');
});

test('donation placeholder preserves input and restores English; faction rumor translates only its prose', async ({ page }) => {
  await page.evaluate(() => window.factionFixture.setDonation(true));
  const input = page.locator('#donation');
  await expect(input).toHaveAttribute('placeholder', '捐赠金额');
  await input.fill('123.456e6');
  await page.getByRole('button', { name: '捐赠', exact: true }).click();
  expect(await page.evaluate(() => window.donationAction)).toEqual({ faction: 'The Black Hand', amount: '123.456e6' });
  await page.locator(toolbar).getByText('中文：开', { exact: true }).click();
  await expect(input).toHaveAttribute('placeholder', 'Donation amount');
  await expect(input).toHaveValue('123.456e6');
  await page.locator(toolbar).getByText('中文：关', { exact: true }).click();
  await expect(input).toHaveAttribute('placeholder', '捐赠金额');
  await page.evaluate(() => window.factionFixture.setPage('list'));
  await expect(page.locator('#rumor')).toContainText('准备好后，');
  await expect(page.locator('#rumor')).toContainText('NSA');
  await expect(page.locator('#rumor')).toContainText('希望与你谈谈。');
  await page.evaluate(() => window.removeChinese());
  await expect(page.locator('#rumor')).toHaveText("The NSA would like to have a word with you once you're ready.");
});

test('faction translation survives route changes, hover mode and complete removal', async ({ page }) => {
  await expect(page.locator('#faction-intro')).toContainText('这个世界');
  await page.evaluate(() => window.factionFixture.setPage('stats'));
  await expect(page.getByText('常规', { exact: true })).toBeVisible();
  await page.evaluate(() => window.factionFixture.setPage('faction'));
  await expect(page.locator('#faction-intro')).toContainText('这个世界');
  await page.locator(toolbar).getByText('显示：直接', { exact: true }).click();
  await expect(page.locator('#faction-intro')).toContainText('The world, so afraid');
  await page.locator('#faction-intro').hover();
  await expect(page.locator(toolbar).getByRole('tooltip')).toContainText('这个世界');
  await page.locator(toolbar).getByText('显示：悬停', { exact: true }).click();
  await expect(page.locator('#faction-intro')).toContainText('这个世界');
  await page.evaluate(() => window.removeChinese());
  await expect(page.locator(toolbar)).toHaveCount(0);
  await expect(page.locator('#faction-intro')).toContainText('The world, so afraid');
  await expect(page.getByRole('button', { name: 'Hacking Contracts', exact: true })).toBeVisible();
});
