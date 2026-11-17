import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { createMatcher } from '../src/matcher.js';
const corpus = JSON.parse(readFileSync('tests/fixtures/supplement-v071-v3.0.1.json'));
const dictionary = JSON.parse(readFileSync('translations/zh-CN.json'));
const match = createMatcher(dictionary.entries, dictionary.slotValues);
const records = '[' + corpus.hashes.map(e => `{name:${JSON.stringify(e.name)},desc:(${e.desc}),effect:${e.effect ? '(' + e.effect + ')' : 'null'}}`).join(',') + ']';
const fixture = (await build({ stdin: { contents: readFileSync('tests/supplement-fixture.jsx', 'utf8').replace('/* HASH_RECORDS */[]', records), resolveDir: process.cwd() + '/tests', loader: 'tsx' }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })).outputFiles[0].text;
const script = readFileSync('bitburner-zh-cn.user.js', 'utf8'), host = '#bitburner-zh-cn-overlay';
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.setContent('<style>body{margin:0;background:#080808;color:#00e878}pre{white-space:pre-wrap}</style><div id="root"></div>');
  await page.evaluate(() => {
    window.supplementErrors = []; addEventListener('error', e => window.supplementErrors.push(e.message));
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_registerMenuCommand = (name, fn) => { if (name.includes('完全移除')) window.removeChinese = fn; return name; };
    window.GM_unregisterMenuCommand = () => {};
  });
  await page.addScriptTag({ content: fixture });
});

test('all hash upgrade descriptions and effects translate while names, quantities and local handlers remain intact', async ({ page }) => {
  await expect(page.locator('[data-upgrade]')).toHaveCount(11);
  const original = await page.locator('[data-upgrade]').allTextContents();
  const money = await page.locator('.fixture-money').allTextContents();
  const nodes = await page.locator('[data-upgrade]').evaluateAll(roots => {
    window.hashTextNodes = [];
    for (const root of roots) { const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = walk.nextNode())) window.hashTextNodes.push(n); }
    return window.hashTextNodes.map(n => ({ text: n.data, button: !!n.parentElement.closest('button') }));
  });
  const expected = nodes.map(n => { const item = match(n.text, 'hacknet') ?? (n.button ? match(n.text, 'common') : null); return item ? n.text.replace(/\S(?:[\s\S]*\S)?/u, () => item.zh) : n.text; });
  await page.addScriptTag({ content: script });
  await expect.poll(() => page.evaluate(() => window.hashTextNodes.map(n => n.data))).toEqual(expected);
  expect(await page.locator('[data-name]').allTextContents()).toEqual(corpus.hashes.map(e => e.name));
  expect(await page.locator('.fixture-money').allTextContents()).toEqual(money);
  await expect(page.locator('[data-upgrade="Improve Studying"] [data-effect]')).toHaveText('学习经验增益： 40%');
  await page.locator('[data-name]').first().click(); expect(await page.evaluate(() => window.supplementCopied)).toBe('Sell for Money');
  await page.locator('[data-upgrade="Improve Studying"]').getByRole('button', { name: '购买', exact: true }).click();
  expect(await page.evaluate(() => window.supplementAction)).toEqual({ action: 'hash', name: 'Improve Studying', level: 2 });
  await page.locator(host).getByRole('button', { name: '中文：开' }).click();
  expect(await page.locator('[data-upgrade]').allTextContents()).toEqual(original);
  await page.evaluate(() => window.supplement.setLevel(3));
  await expect(page.locator('[data-upgrade="Improve Studying"] [data-effect]')).toHaveText('Improves studying by 60%');
  const updatedEnglish = await page.locator('[data-upgrade]').allTextContents();
  await page.locator(host).getByRole('button', { name: '中文：关' }).click();
  await expect(page.locator('[data-upgrade="Improve Studying"] [data-effect]')).toHaveText('学习经验增益： 60%');
  await expect(page.locator('[data-upgrade="Exchange for Corporation Research"] [data-effect]')).toContainText('3,000');
  await page.evaluate(() => window.removeChinese());
  expect(await page.locator('[data-upgrade]').allTextContents()).toEqual(updatedEnglish);
  expect(await page.evaluate(() => window.supplementErrors)).toEqual([]);
});

test('stock order labels preserve Select values, quantities, symbols and source-shaped row layout', async ({ page }) => {
  await page.evaluate(() => window.supplement.setRoute('Stocks'));
  await page.addScriptTag({ content: script });
  await expect(page.getByRole('combobox', { name: 'order type' })).toHaveText('市价单');
  await page.getByRole('textbox', { name: 'quantity' }).fill('12.50');
  for (const [english, chinese] of [['Limit Order', '限价单'], ['Stop Order', '止损单'], ['Market Order', '市价单']]) {
    await page.getByRole('combobox', { name: 'order type' }).click();
    await page.getByRole('option', { name: chinese, exact: true }).click();
    await page.getByRole('button', { name: '购买', exact: true }).click();
    expect(await page.evaluate(() => window.supplementAction)).toEqual({ action: 'Buy', order: english, position: 'L', quantity: '12.50', symbol: 'ECP' });
  }
  for (const order of corpus.orders) await expect(page.locator(`[data-order="${order.value}"]`)).toContainText(match(order.value, 'stocks').zh);
  expect(await page.locator('[data-order] [data-number]').allTextContents()).toEqual(Array(4).fill('12,345'));
  expect(await page.locator('.fixture-money').allTextContents()).toEqual(Array(4).fill('$123.45'));
  for (const width of [900, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.locator('#stock-controls').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  }
  await page.locator(host).getByRole('button', { name: '显示：直接' }).click();
  await expect(page.getByRole('combobox', { name: 'order type' })).toHaveText('Market Order');
  await expect(page.getByRole('textbox', { name: 'quantity' })).toHaveValue('12.50');
  await expect(page.locator('#terminal')).toHaveText("Market Order ns.hacknet.spendHashes('Sell for Money') Neurotrainer I");
  expect(await page.evaluate(() => window.supplementErrors)).toEqual([]);
});

test('augmentation receipt, shared labels and filter placeholder translate without changing input or game-supplied attributes', async ({ page }) => {
  await page.evaluate(() => window.supplement.setRoute('Shop'));
  await page.addScriptTag({ content: script });
  const filter = page.getByRole('textbox', { name: 'augmentation filter' });
  await expect(filter).toHaveAttribute('placeholder', '筛选强化');
  await expect(page.getByText('声望：', { exact: true })).toBeVisible();
  await expect(page.getByText('人脉：', { exact: true })).toBeVisible();
  await expect(page.locator('#shop-rep')).toHaveText('3.683k'); await expect(page.locator('#shop-favor')).toHaveText('0.000');
  await expect(page.locator('#editor-filter')).toHaveAttribute('placeholder', 'Filter augmentations');
  await filter.fill('Neurotrainer'); await expect(page.locator('#filtered-augs')).toHaveText('Neurotrainer I');
  await page.locator('#purchase-fixture').click();
  expect(await page.evaluate(() => window.supplementAction)).toEqual({ action: 'purchase', augmentation: 'Neurotrainer I', filter: 'Neurotrainer' });
  const receipt = page.locator('#purchase-receipt');
  await expect(receipt).toHaveText('你已购买 Neurotrainer I。其效果只有在安装后才会生效。要安装强化，请前往左侧导航菜单中的“强化”页面。现在继续购买其他强化的价格会更高。');
  for (const width of [900, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.getByRole('dialog').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  }
  await page.screenshot({ path: 'output/playwright/local-augmentation-receipt-v071.png' });
  await page.getByRole('dialog').getByRole('button', { name: /Close|关闭/, exact: true }).click();
  await page.locator(host).getByRole('button', { name: '显示：直接' }).click();
  await expect(filter).toHaveAttribute('placeholder', 'Filter augmentations'); await expect(filter).toHaveValue('Neurotrainer');
  await page.locator(host).getByRole('button', { name: '显示：悬停' }).click();
  await expect(filter).toHaveAttribute('placeholder', '筛选强化');
  await page.evaluate(() => window.supplement.setPlaceholder('A fresh game hint'));
  await expect(filter).toHaveAttribute('placeholder', 'A fresh game hint');
  await page.evaluate(() => window.supplement.setPlaceholder('Filter augmentations'));
  await expect(filter).toHaveAttribute('placeholder', '筛选强化');
  await page.evaluate(() => window.supplement.setRoute('Stats'));
  await expect(page.locator('#unrelated-filter')).toHaveAttribute('placeholder', 'Filter augmentations');
  await page.evaluate(() => window.supplement.setRoute('Shop'));
  await expect(filter).toHaveAttribute('placeholder', '筛选强化');
  await filter.fill('BitWire'); await expect(page.locator('#filtered-augs')).toHaveText('BitWire');
  await page.evaluate(() => window.removeChinese());
  await expect(filter).toHaveAttribute('placeholder', 'Filter augmentations'); await expect(filter).toHaveValue('BitWire');
  await expect(page.locator('#editor-filter')).toHaveValue("ns.hack('home')");
  expect(await page.evaluate(() => window.supplementErrors)).toEqual([]);
});
