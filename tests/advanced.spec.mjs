import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
const script = readFileSync('bitburner-zh-cn.user.js', 'utf8');
const fixture = (await build({ entryPoints: ['tests/advanced-fixture.jsx'], bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })).outputFiles[0].text;
const toolbar = '#bitburner-zh-cn-overlay';
const navigate = (page, name) => page.evaluate(name => window.advancedFixture.setPage(name), name);
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.setContent('<style>body{margin:0;background:#09120e;color:#00e878}pre{max-width:100%;overflow:auto}</style><div id="root"></div>');
  await page.evaluate(() => {
    window.fixtureErrors = [];
    window.addEventListener('error', e => window.fixtureErrors.push(e.message));
    window.GM_getValue = (k, v) => v;
    window.GM_registerMenuCommand = (name, fn) => { if (name.includes('完全移除')) window.removeChinese = fn; return name; };
    window.GM_unregisterMenuCommand = () => {};
  });
  await page.addScriptTag({ content: fixture });
  await page.addScriptTag({ content: script });
});
test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.fixtureErrors)).toEqual([]);
  await expect(page.locator('#api')).toHaveText('ns.sleeve.setToBladeburnerAction(0, "Tracking"); ns.stanek.chargeFragment(1, 2); ns.go.makeMove(1, 2)');
  await expect(page.locator('.katex')).toHaveText('sqrt(power) * 1.1');
});

test('sleeve tasks, multiline live values and tooltip retain underlying parameters', async ({ page }) => {
  await expect(page.locator('#work-desc')).toContainText('空闲');
  await page.locator('#task').click();
  await page.getByRole('option', { name: 'Perform Bladeburner Actions（Bladeburner 行动）', exact: true }).click();
  expect(await page.evaluate(() => window.selectedTask)).toBe('Perform Bladeburner Actions');
  await page.getByRole('button', { name: '设置任务', exact: true }).click();
  expect(await page.evaluate(() => window.submittedTask)).toBe('Perform Bladeburner Actions');
  await expect(page.locator('#work-desc')).toContainText('进度：12.50%');
  await page.evaluate(() => { window.originalWorkNode = document.querySelector('#work-desc').firstChild; window.advancedFixture.update('98.76'); });
  await expect(page.locator('#work-desc')).toContainText('进度：98.76%');
  expect(await page.evaluate(() => window.originalWorkNode === document.querySelector('#work-desc').firstChild)).toBe(true);
  await expect(page.locator('#work-desc')).toContainText('Tracking');
  await expect(page.locator('#work-desc')).toContainText('65.1% ~ 78.9%');
  await page.locator('#augment-tip').hover();
  await expect(page.getByRole('tooltip').filter({ hasText: '12.500' })).toContainText('冲击');
  await page.mouse.move(880, 850);
  await page.screenshot({ path: 'output/playwright/local-sleeves.png' });
  await page.locator(toolbar).getByText('中文：开', { exact: true }).click();
  await expect(page.locator('#work-desc')).toContainText('Progress: 98.76%');
  await expect(page.locator('#task')).toHaveText('Perform Bladeburner Actions');
});

test('sleeve FAQ, hover and complete removal restore original open dialog', async ({ page }) => {
  await page.getByRole('button', { name: '常见问题', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('克隆体');
  await page.locator(toolbar).getByText('显示：直接', { exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('How do Duplicate Sleeves work?');
  await page.getByRole('dialog').locator('p').hover();
  await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('克隆体');
  await page.evaluate(() => window.removeChinese());
  await expect(page.locator(toolbar)).toHaveCount(0);
  await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toContainText('Duplicate Sleeves');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Covenant sleeve dialog recognizes its own scope and preserves memory input', async ({ page }) => {
  await navigate(page, 'The Covenant');
  await expect(page.getByRole('dialog')).toContainText('永久');
  await expect(page.getByRole('dialog')).toContainText('The Covenant');
  await expect(page.getByRole('dialog')).toContainText('$100.000t');
  await page.locator('#memory').fill('123');
  await page.locator('#purchase-memory').click();
  expect(await page.evaluate(() => window.memoryAmount)).toBe('123');
  await page.locator(toolbar).getByText('中文：开', { exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Purchase an additional Sleeve.');
  await expect(page.locator('#memory')).toHaveValue('123');
});

test('Stanek help, signed effects and destructive-action warning translate without changing handlers', async ({ page }) => {
  await navigate(page, "Stanek's Gift");
  await expect(page.locator('#effect')).toHaveText('hack() 效果 +12.500%');
  await page.evaluate(() => window.advancedFixture.update('-9.250'));
  await expect(page.locator('#effect')).toHaveText('hack() 效果 -9.250%');
  await page.getByRole('button', { name: '删除', exact: true }).click();
  expect(await page.evaluate(() => window.fragmentAction)).toEqual({ x: 1, y: 2, rotation: 3 });
  await page.locator('#stanek-info').click();
  await expect(page.locator('#stanek-help')).toContainText('加入');
  await expect(page.locator('#stanek-help')).toContainText('NeuroFlux Governor');
  await page.getByRole('dialog').getByRole('button').click();
  await page.getByRole('button', { name: '清空网格', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('所有');
  await expect(page.getByRole('dialog')).toContainText('丢失');
  for (const width of [900, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.getByRole('dialog').evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: 'output/playwright/local-stanek-warning.png' });
});

test('IPvGO tabs, opponent choice, score and help preserve identifiers and game callbacks', async ({ page }) => {
  await navigate(page, 'IPvGO Subnet');
  await expect(page.locator('#score')).toHaveText('得分：黑方 12，白方 6.5');
  await page.getByRole('button', { name: '寻找新子网', exact: true }).click();
  await page.locator('#opponent').click();
  await page.getByRole('option', { name: 'Netburners（简单 AI）', exact: true }).click();
  await page.locator('#search-subnet').click();
  expect(await page.evaluate(() => window.goSelection)).toEqual({ opponent: 'Netburners', size: 5 });
  await page.getByRole('button', { name: '跳过回合（黑方）', exact: true }).click();
  expect(await page.evaluate(() => window.goAction)).toBe('passTurn');
  await page.evaluate(() => window.advancedFixture.update('21'));
  await expect(page.locator('#score')).toHaveText('得分：黑方 21，白方 6.5');
  await page.getByRole('button', { name: '查看最终得分', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('胜者：Netburners');
  await expect(page.getByRole('dialog')).toContainText('数子法');
  await page.getByRole('dialog').getByRole('button').click();
  await page.getByRole('tab', { name: '玩法说明', exact: true }).click();
  await expect(page.locator('#go-rules')).toContainText('开放端口');
  await expect(page.locator('#guide')).toHaveAttribute('href', 'https://example.com/guide');
  await page.screenshot({ path: 'output/playwright/local-go-rules.png' });
  await page.getByRole('tab', { name: '历史', exact: true }).click();
  await expect(page.locator('main')).toContainText('占领节点：');
  await expect(page.locator('main')).toContainText('1,234');
});
