import{test,expect}from'@playwright/test';import{build}from'esbuild';import{readFileSync}from'node:fs';
const script=readFileSync('bitburner-zh-cn.user.js','utf8');
const fixture=(await build({entryPoints:['tests/deep-pages-fixture.jsx'],bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}})).outputFiles[0].text;
const toolbar='#bitburner-zh-cn-overlay';
async function go(page,name){await page.evaluate(name=>window.deepFixture.setPage(name),name)}
export async function buttonOverflow(page,selector='main button'){
 return page.locator(selector).evaluateAll(buttons=>buttons.flatMap(b=>{const r=b.getBoundingClientRect();if(!r.width)return[];const walker=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let n;const failures=[];while((n=walker.nextNode())){if(!n.data.trim())continue;const range=document.createRange();range.selectNodeContents(n);for(const t of range.getClientRects())if(t.left<r.left-1||t.right>r.right+1||t.top<r.top-1||t.bottom>r.bottom+1)failures.push(b.textContent);}return failures;}));
}
test.beforeEach(async({page})=>{
 await page.setViewportSize({width:900,height:780});
 await page.setContent('<style>body{background:#101820;color:#00ff00;font:16px monospace;margin:0}main{margin:20px 20px 20px 250px}button{font:inherit;color:inherit;background:#122020;padding:8px;box-sizing:border-box;border:1px solid #344}p{line-height:1.5}h4{font-size:24px}input{width:95%}</style><div id="root"></div>');
 await page.evaluate(()=>{window.errors=[];window.addEventListener('error',e=>window.errors.push(e.message));window.GM_getValue=(k,v)=>v;window.GM_registerMenuCommand=(name,fn)=>{if(name.includes('完全移除'))window.removeChinese=fn;return name};window.GM_unregisterMenuCommand=()=>{};});
 await page.addScriptTag({content:fixture});await page.addScriptTag({content:script});
});
test('company/faction names resolve by route; bilingual jobs fit narrow panels and retain clicks, disabled state and English restoration',async({page})=>{
 await expect(page.locator('h4')).toHaveText('MegaCorp（巨型企业）');
 await expect(page.locator('#apply')).toContainText('申请软件工程实习生');
 await expect(page.locator('button[disabled]')).toContainText('Chief Technology Officer');
 expect(await buttonOverflow(page)).toEqual([]);
 await page.locator('#apply').click();expect(await page.evaluate(()=>window.deepClicked)).toBe('apply');
 await page.evaluate(()=>window.deepFixture.setValue(4));await expect(page.locator('main')).toContainText('黑客等级达到 1000');
 await page.locator(toolbar).getByRole('button',{name:'中文：开'}).click();
 await expect(page.locator('#apply')).toHaveText('Apply for Software Engineering Intern Job');await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);
 await page.locator(toolbar).getByRole('button',{name:'中文：关'}).click();
 await go(page,'faction');await expect(page.locator('h4')).toHaveText('MegaCorp');await expect(page.locator('main')).toContainText('黑客合约');await expect(page.locator('main')).toContainText('Apply for Software Engineering Intern Job');
 await go(page,'darknet');await expect(page.locator('#generic-pre span')).toHaveText('提示：');await go(page,'company');await expect(page.locator('#generic-pre span')).toHaveText('Hint:');
 expect(await page.evaluate(()=>window.errors)).toEqual([]);
});
test('darknet UI translates while hints, logs, maze, commands and input remain literal across updates and cleanup',async({page})=>{
 await go(page,'darknet');await expect(page.locator('h5').first()).toHaveText('暗网');
 await expect(page.locator('#hints .css-demo-serverDetailsText').first()).toHaveText('提示：');
 await expect(page.locator('#hints')).toContainText('Model: ns.dnet.authenticate()');await expect(page.locator('#hints')).toContainText('Password Dark Net 0123 home');
 const log=await page.locator('#log').innerHTML(),maze=await page.locator('#maze').innerHTML();
 await page.screenshot({path:'output/playwright/local-darknet.png'});
 await expect(page.locator('#submit')).toHaveText('提交密码');
 await expect(page.locator('main')).toContainText('已用 RAM：2.5+1.2/8 GB');
 await page.locator('#password').fill('Dark Net home ns.dnet.authenticate()');await page.locator('#submit').click();
 expect(await page.evaluate(()=>window.deepClicked)).toBe('submit');
 await page.evaluate(()=>window.deepFixture.setValue(77));await expect(page.locator('main')).toContainText('所需魅力： 77');
 expect(await page.locator('#log').innerHTML()).toBe(log);expect(await page.locator('#maze').innerHTML()).toBe(maze);
 await expect(page.locator('#terminal')).toHaveText('Submit Password');await expect(page.locator('.monaco-editor')).toHaveText('Apply for Software Engineering Intern Job');
 await page.evaluate(()=>window.removeChinese());await expect(page.locator(toolbar)).toHaveCount(0);await expect(page.locator('#hints .css-demo-serverDetailsText').first()).toHaveText('Hint:');await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);
 await expect(page.locator('#password')).toHaveValue('Dark Net home ns.dnet.authenticate()');expect(await page.evaluate(()=>window.errors)).toEqual([]);
});
test('grafting confirmations preserve negation and amounts; work/result phrases update after route changes',async({page})=>{
 await go(page,'grafting');await expect(page.locator('h4')).toHaveText('强化移植实验室');
 await expect(page.locator('main')).toContainText('1 小时 2 分钟 3 秒');await expect(page.locator('h6')).toHaveText('NeuroFlux Governor');
 await page.locator('#graft').click();await expect(page.getByRole('dialog')).toContainText('取消移植将 不会 保留进度，已支付的费用也 不会 退还。');
 expect(await buttonOverflow(page)).toEqual([]);await page.screenshot({path:'output/playwright/local-grafting.png'});await page.locator('#cancel').click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await go(page,'work');await expect(page.locator('h6')).toHaveText('你正在 学习计算机科学');await expect(page.locator('main p')).toHaveText('3 秒 已用时');
 await page.locator('#stop').click();await expect(page.getByRole('dialog')).toContainText('持续');await expect(page.getByRole('dialog')).not.toContainText('效力于');
 await page.locator(toolbar).getByRole('button',{name:'显示：直接'}).click();await expect(page.getByRole('dialog')).toContainText('You earned a total of:');await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);
 expect(await page.evaluate(()=>window.errors)).toEqual([]);
});
test('long bilingual headings wrap before the overview and restore their layout on disable and navigation',async({page})=>{
 await expect(page.locator('h4')).toHaveText('MegaCorp（巨型企业）');
 await page.evaluate(()=>{const e=document.createElement('aside');e.className='css-test-overviewContainer';e.style.cssText='position:fixed;right:0;top:0;width:180px;height:250px;background:black';e.textContent='Fixture overview';document.body.append(e);window.deepFixture.setCompanyName('Rothman University');});
 await expect(page.locator('h4')).toHaveText('Rothman University（罗斯曼大学）');
 const right=async()=>page.locator('h4').evaluate(e=>e.getBoundingClientRect().right);
 await expect.poll(right).toBeLessThanOrEqual(708);
 await page.setViewportSize({width:800,height:780});await expect.poll(right).toBeLessThanOrEqual(608);
 await page.locator(toolbar).getByRole('button',{name:'中文：开'}).click();await expect(page.locator('[data-bitburner-zh-heading]')).toHaveCount(0);expect(await page.locator('h4').evaluate(e=>e.style.getPropertyValue('--bitburner-zh-heading-width'))).toBe('');
 await page.locator(toolbar).getByRole('button',{name:'中文：关'}).click();await go(page,'faction');await expect(page.locator('h4')).toHaveText('MegaCorp');await expect(page.locator('[data-bitburner-zh-heading]')).toHaveCount(0);
});
