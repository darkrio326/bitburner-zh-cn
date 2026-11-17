import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const script = readFileSync('bitburner-zh-cn.user.js', 'utf8');
const fixture = (await build({ entryPoints: ['tests/work-timer-fixture.jsx'], bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })).outputFiles[0].text;
const host = '#bitburner-zh-cn-overlay';
test.beforeEach(async ({ page }) => {
  await page.setContent('<style>body{background:#080808;color:#00e878;margin:20px}main{max-width:900px}input{margin-top:20px}</style><div id="root"></div>');
  await page.evaluate(() => {
    window.workErrors = []; addEventListener('error', event => window.workErrors.push(event.message));
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_registerMenuCommand = (name, fn) => { if (name.includes('完全移除')) window.removeChinese = fn; return name; };
    window.GM_unregisterMenuCommand = () => {};
  });
  await page.addScriptTag({ content: fixture });
  await page.addScriptTag({ content: script });
  await expect(page.locator('#elapsed')).toHaveText('2 小时 22 分钟 47 秒 已用时');
  await expect(page.locator('#remaining')).toHaveText('1 分钟 1 秒 剩余时间');
});

test('work timers remain Chinese in every animation frame while React updates seconds and crosses time boundaries', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const elapsed = document.getElementById('elapsed'), remaining = document.getElementById('remaining');
    const elapsedNode = elapsed.firstChild, remainingNode = remaining.firstChild, labelNode = elapsed.lastChild;
    // Exact formatter outputs at second/minute/hour/day transitions, committed at game-cycle cadence.
    const cases = [
      ['2 hours 22 minutes 48 seconds', '2 小时 22 分钟 48 秒', '1 minute 0 seconds', '1 分钟 0 秒'],
      ['59 seconds', '59 秒', '1 minute 0 seconds', '1 分钟 0 秒'],
      ['1 minute 0 seconds', '1 分钟 0 秒', '59 seconds', '59 秒'],
      ['59 minutes 59 seconds', '59 分钟 59 秒', '1 hour 0 seconds', '1 小时 0 秒'],
      ['1 hour 0 seconds', '1 小时 0 秒', '59 minutes 59 seconds', '59 分钟 59 秒'],
      ['23 hours 59 minutes 59 seconds', '23 小时 59 分钟 59 秒', '1 second', '1 秒'],
      ['1 day 0 seconds', '1 天 0 秒', '0 seconds', '0 秒'],
      ['1 day 1 second', '1 天 1 秒', '2 hours 22 minutes 47 seconds', '2 小时 22 分钟 47 秒'],
    ];
    let expected = [elapsed.textContent, remaining.textContent], frames = 0, updates = 0, done = false;
    const incorrectFrames = [], numberChanges = [];
    const observeFrame = () => {
      frames++;
      const actual = [elapsed.textContent, remaining.textContent];
      if (actual.some((text, i) => text !== expected[i])) incorrectFrames.push({ actual, expected: [...expected] });
      if (!done) requestAnimationFrame(observeFrame);
    };
    requestAnimationFrame(observeFrame);
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (updates === cases.length) { clearInterval(interval); done = true; requestAnimationFrame(resolve); return; }
        const [en, zh, remainingEn, remainingZh] = cases[updates++];
        expected = [zh + ' 已用时', remainingZh + ' 剩余时间'];
        window.workTimerFixture.update({ elapsed: en, remaining: remainingEn });
        numberChanges.push([en, remainingEn]);
      }, 200);
    });
    return { frames, updates, incorrectFrames, numberChanges, sameNodes: elapsed.firstChild === elapsedNode && remaining.firstChild === remainingNode && elapsed.lastChild === labelNode, terminal: document.getElementById('terminal').textContent };
  });
  mkdirSync('output/playwright', { recursive: true });
  writeFileSync('output/playwright/work-timer-frames.json', JSON.stringify(result, null, 2));
  expect(result.updates).toBe(8); expect(result.frames).toBeGreaterThan(30);
  expect(result.incorrectFrames).toEqual([]); expect(result.sameNodes).toBe(true);
  expect(result.terminal).toBe('1 day 1 second elapsed');
  expect(await page.evaluate(() => window.workErrors)).toEqual([]);
});

test('timer updates preserve current values through disable, hover, navigation and complete removal', async ({ page }) => {
  const update = values => page.evaluate(values => window.workTimerFixture.update(values), values);
  await page.getByLabel('Untouched input').fill('ns.sleep(200); home');
  await update({ elapsed: '59 seconds', remaining: '1 second' });
  await expect(page.locator('#elapsed')).toHaveText('59 秒 已用时');
  await page.locator(host).getByRole('button', { name: '中文：开' }).click();
  await expect(page.locator('#elapsed')).toHaveText('59 seconds elapsed');
  await update({ elapsed: '1 minute 0 seconds', remaining: '0 seconds' });
  await expect(page.locator('#elapsed')).toHaveText('1 minute 0 seconds elapsed');
  await page.locator(host).getByRole('button', { name: '中文：关' }).click();
  await expect(page.locator('#elapsed')).toHaveText('1 分钟 0 秒 已用时');
  await page.locator(host).getByRole('button', { name: '显示：直接' }).click();
  await update({ elapsed: '1 hour 0 seconds', remaining: '1 minute 1 second' });
  await expect(page.locator('#elapsed')).toHaveText('1 hour 0 seconds elapsed');
  await page.locator('#elapsed').hover();
  await expect(page.locator(host).locator('section')).toContainText('1 小时 0 秒');
  await page.locator(host).getByRole('button', { name: '显示：悬停' }).click();
  await expect(page.locator('#elapsed')).toHaveText('1 小时 0 秒 已用时');
  await page.locator('#stop').click(); await expect(page.locator('h4')).toHaveText('属性');
  await update({ elapsed: '2 seconds', remaining: '3 seconds' });
  await expect(page.locator('#elapsed')).toHaveText('2 seconds elapsed');
  await page.evaluate(() => window.workTimerFixture.route('Work'));
  await expect(page.locator('#elapsed')).toHaveText('2 秒 已用时');
  // Remove immediately after a fresh game write, before any deferred batch could run.
  await page.evaluate(() => { window.workTimerFixture.update({ elapsed: '4 seconds', remaining: '5 seconds' }); window.removeChinese(); });
  await expect(page.locator(host)).toHaveCount(0);
  await expect(page.locator('#elapsed')).toHaveText('4 seconds elapsed');
  await update({ elapsed: '6 seconds', remaining: '7 seconds' });
  await expect(page.locator('#elapsed')).toHaveText('6 seconds elapsed');
  await expect(page.getByLabel('Untouched input')).toHaveValue('ns.sleep(200); home');
  expect(await page.evaluate(() => window.workErrors)).toEqual([]);
});
