import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
const script=readFileSync('bitburner-zh-cn.user.js','utf8');
const fixture=(await build({entryPoints:['tests/management-fixture.jsx'],bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}})).outputFiles[0].text;
const toolbar='#bitburner-zh-cn-overlay';
async function navigate(page,name){await page.evaluate(name=>window.managementFixture.setPage(name),name)}
async function noOverflow(page){return page.locator('main button,[role="dialog"] button').evaluateAll(buttons=>buttons.flatMap(b=>{const r=b.getBoundingClientRect();if(!r.width)return[];const walk=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let n;const errors=[];while((n=walk.nextNode())){if(!n.data.trim())continue;const range=document.createRange();range.selectNodeContents(n);for(const t of range.getClientRects())if(t.left<r.left-1||t.right>r.right+1||t.top<r.top-1||t.bottom>r.bottom+1||t.right>innerWidth+1)errors.push(b.textContent);}return errors;}));}
test.beforeEach(async({page})=>{
 await page.setViewportSize({width:900,height:900});
 await page.setContent('<style>body{margin:0;background:#09120e;color:#00e878}pre{overflow:auto;max-width:100%}button,input{font-family:monospace}</style><div id="root"></div>');
 await page.evaluate(()=>{window.fixtureErrors=[];window.addEventListener('error',e=>window.fixtureErrors.push(e.message));window.GM_getValue=(k,v)=>v;window.GM_registerMenuCommand=(name,fn)=>{if(name.includes('完全移除'))window.removeChinese=fn;return name};window.GM_unregisterMenuCommand=()=>{};});
 await page.addScriptTag({content:fixture});await page.addScriptTag({content:script});
});
test('Gang navigation, MUI task selection, dynamic stats and name input retain handlers and identifiers',async({page})=>{
 await expect(page.getByRole('tab',{name:'管理',exact:true})).toBeVisible();await expect(page.locator('#task-desc')).toContainText('战斗属性');
 await expect(page.locator('.MuiListItemText-primary')).toHaveText('Management');
 await page.locator('#gang-task').click();await page.getByRole('option',{name:'Territory Warfare',exact:true}).click();
 expect(await page.evaluate(()=>window.fixtureAction)).toBe('Territory Warfare');await expect(page.locator('#task-desc')).toContainText('可能会在冲突中死亡');
 await page.evaluate(()=>window.managementFixture.update('9.876e12'));await expect(page.locator('main')).toContainText('9.876e12');
 await page.locator('#recruit-open').click();await expect(page.getByRole('dialog')).toContainText('起一个名字');await expect(page.getByRole('dialog').getByRole('button',{name:'招募',exact:true})).toBeDisabled();
 await page.getByPlaceholder('unique name').fill('Recruit');await page.getByPlaceholder('unique name').press('Enter');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.MuiListItemText-primary').last()).toHaveText('Recruit');
 await page.getByRole('tab',{name:'装备',exact:true}).click();await expect(page.locator('main h5')).toHaveText('Management (Territory Warfare)');await expect(page.locator('main')).toContainText('已购买的升级');
 await page.getByRole('tab',{name:'地盘',exact:true}).click();await page.getByRole('checkbox').check();await expect(page.locator('main')).toContainText('100.000%');
 expect(await noOverflow(page)).toEqual([]);expect(await page.evaluate(()=>window.fixtureErrors)).toEqual([]);
 await expect.poll(async()=>page.locator('main .MuiTabs-root').evaluate(root=>{const a=root.querySelector('[aria-selected=true]').getBoundingClientRect(),b=root.querySelector('.MuiTabs-indicator').getBoundingClientRect();return Math.max(Math.abs(a.left-b.left),Math.abs(a.width-b.width));})).toBeLessThan(1);await page.mouse.move(880,850);await page.screenshot({path:'output/playwright/local-gang-territory.png'});
});
test('Gang ascension modal preserves colliding member names in direct and hover translation',async({page})=>{
 await page.getByRole('button',{name:'飞升',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('作为回报， Management 将获得');
 await page.locator(toolbar).getByText('显示：直接',{exact:true}).click();await expect(page.getByRole('dialog')).toContainText('In return, Management will gain');
 await page.getByRole('dialog').locator('p').first().hover();await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('Management');await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('永久');
 await page.locator(toolbar).getByText('中文：开',{exact:true}).click();await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);await expect(page.getByRole('dialog')).toContainText('Hacking: x1.000 => x1.250');
});
test('Bladeburner actions, tabs, team input and console command/history remain functional',async({page})=>{
 await navigate(page,'Bladeburner');await expect(page.getByRole('tab',{name:'常规',exact:true})).toBeVisible();await expect(page.locator('#blade-desc')).toContainText('专业训练中心');await expect(page.locator('main')).toContainText('所需时间： 30 秒');
 await expect(page.locator('#blade-logs')).toHaveText('Bladeburner ConsoleStartSkill Points:');
 await page.locator('#blade-action').click();expect(await page.evaluate(()=>window.fixtureAction)).toBe('start');await expect(page.locator('#blade-action')).toHaveText('停止');await page.locator('#blade-action').click();expect(await page.evaluate(()=>window.fixtureAction)).toBe('stop');
 await page.locator('#blade-command').fill('start op "Investigation"');await page.locator('#blade-command').press('Enter');await expect(page.locator('#blade-logs')).toContainText('> start op "Investigation"');await page.locator('#blade-command').press('ArrowUp');await expect(page.locator('#blade-command')).toHaveValue('start op "Investigation"');
 await page.getByRole('tab',{name:'行动',exact:true}).click();await expect(page.locator('#blade-desc')).toContainText('失败不会损失生命值');await page.locator('#team-open').click();await expect(page.getByRole('dialog')).toContainText('可能损失团队成员');await page.getByPlaceholder('Team size').fill('17');await page.getByPlaceholder('Team size').press('Enter');expect(await page.evaluate(()=>window.fixtureTeam)).toBe('17');await expect(page.locator('#team-open')).toContainText('17');
 await page.getByRole('tab',{name:'黑色行动',exact:true}).click();await expect(page.locator('#action-name')).toHaveText('Operation Titan');await expect(page.locator('#blade-desc')).toContainText('Titan Laboratories');await expect(page.locator('#blade-desc')).not.toContainText('NetLink Technologies');
 await page.evaluate(()=>window.managementFixture.update('9.876k'));await expect(page.locator('main')).toContainText('9.876k');expect(await noOverflow(page)).toEqual([]);expect(await page.evaluate(()=>window.fixtureErrors)).toEqual([]);
 await expect.poll(async()=>page.locator('main .MuiTabs-root').evaluate(root=>{const a=root.querySelector('[aria-selected=true]').getBoundingClientRect(),b=root.querySelector('.MuiTabs-indicator').getBoundingClientRect();return Math.max(Math.abs(a.left-b.left),Math.abs(a.width-b.width));})).toBeLessThan(1);await page.screenshot({path:'output/playwright/local-bladeburner.png'});
});
test('Corporation player names stay literal while overview labels and investment sentence order translate',async({page})=>{
 await navigate(page,'Corporation');await expect(page.locator('main')).toContainText('总资金：');await expect(page.getByRole('tab',{name:'Sell Shares',exact:true})).toBeVisible();await expect(page.getByRole('tab',{name:'Research',exact:true})).toBeVisible();await expect(page.getByRole('tab',{name:'Expand',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'出售股份',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'寻找投资者',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('一家投资公司提出购买 100.000m 股（占 10% 的公司股权)');await expect(page.getByRole('dialog').locator('b')).toHaveText('Sell Shares');
 await page.getByRole('button',{name:'忽略',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.evaluate(()=>window.managementFixture.update('$9.876e15'));await expect(page.locator('main')).toContainText('$9.876e15');
 expect(await noOverflow(page)).toEqual([]);await page.screenshot({path:'output/playwright/local-corporation-overview.png'});
});
test('Corporation products, formulas, switches and portal dialogs preserve names and entered values',async({page})=>{
 await navigate(page,'Corporation');await page.getByRole('tab',{name:'Research',exact:true}).click();await expect(page.locator('main')).toContainText('办公空间');await expect(page.locator('#product-name')).toHaveText('Research: 12.500 (2.500/s)');await expect(page.locator('#warehouse-name-table td').first()).toHaveText('Total Funds:');await expect(page.locator('#unlock-name')).toHaveText('Export');await expect(page.locator('#buy-dynamic')).toHaveText('购买（1.250m）');await expect(page.locator('#limit-dynamic')).toHaveText('限制产量（2.500k）');
 await page.getByRole('button',{name:'雇用员工',exact:true}).click();expect(await page.evaluate(()=>window.fixtureAction)).toBe('hire');await page.getByRole('checkbox').check();await expect(page.getByRole('checkbox')).toBeChecked();
 await page.evaluate(()=>window.managementFixture.rename('Confirm'));await expect(page.locator('#product-name')).toContainText('Confirm:');await page.locator('#sell-open').click();await expect(page.locator('#sell-prose')).toContainText('Confirm');await expect(page.getByRole('dialog')).toContainText("MP*5");
 await page.getByPlaceholder('Sell amount').fill('PROD-1');await page.getByPlaceholder('Sell price').fill('MP*5');await page.getByRole('dialog').getByRole('button',{name:'确认',exact:true}).click();expect(await page.evaluate(()=>window.fixtureSale)).toEqual({amount:'PROD-1',price:'MP*5',name:'Confirm'});
 expect(await noOverflow(page)).toEqual([]);await page.screenshot({path:'output/playwright/local-corporation-900.png'});
 await page.setViewportSize({width:1280,height:900});expect(await noOverflow(page)).toEqual([]);await page.screenshot({path:'output/playwright/local-corporation-1280.png'});
 await expect(page.locator('#raw-code')).toHaveText('ns.corporation.sellProduct("Research", "Sector-12", "Sell Shares", "MAX", "MP*5")');expect(await page.evaluate(()=>window.fixtureErrors)).toEqual([]);
});
test('management scope changes, hover reader and full cleanup restore English and retain open input',async({page})=>{
 await navigate(page,'Corporation');await page.getByRole('tab',{name:'Research',exact:true}).click();await page.locator('#sell-open').click();await page.getByPlaceholder('Sell price').fill('MP+10');
 await page.locator(toolbar).getByText('显示：直接',{exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Enter the maximum amount of Research');await page.locator('#sell-prose').hover();await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('Research');await expect(page.locator(toolbar).locator('section[role=tooltip]')).toContainText('最大数量');
 await page.locator(toolbar).getByText('阅读',{exact:true}).click();await expect(page.locator(toolbar).locator('section[role=region]')).toBeVisible();const r=await page.locator(toolbar).locator('section[role=region]').boundingBox();expect(r.x+r.width).toBeLessThanOrEqual(900);
 await page.evaluate(()=>window.removeChinese());await expect(page.locator(toolbar)).toHaveCount(0);await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);await expect(page.getByPlaceholder('Sell price')).toHaveValue('MP+10');await expect(page.getByRole('dialog')).toContainText('Enter the maximum amount of Research');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await navigate(page,'Bladeburner');await expect(page.getByRole('tab',{name:'General',exact:true})).toBeVisible();expect(await page.evaluate(()=>window.fixtureErrors)).toEqual([]);
});
test('corporation creation dialog is recognized from City Hall without a Corporation sidebar selection',async({page})=>{
 await page.evaluate(()=>{
   for(const e of document.querySelectorAll('.fixture-active'))e.classList.remove('fixture-active');
   const modal=document.createElement('div');modal.className='MuiModal-root';modal.setAttribute('role','dialog');modal.style.cssText='position:fixed;left:260px;right:20px;top:20px;background:#13251a;padding:15px';
   const p=document.createElement('p');p.append('Would you like to start a corporation? This will require ',Object.assign(document.createElement('span'),{textContent:'$150.000b'}),' for registration and initial funding.');
   const input=document.createElement('input');input.placeholder='Corporation Name';input.value='Research';
   const b=document.createElement('button');b.append('Self-Fund (',Object.assign(document.createElement('span'),{textContent:'$150.000b'}),')');b.disabled=true;modal.append(p,input,b);document.body.append(modal);
 });
 await expect(page.getByRole('dialog')).toContainText('要创办一家企业吗');await expect(page.getByRole('dialog')).toContainText('作为注册费用和启动资金');await expect(page.getByRole('dialog').getByRole('button')).toContainText('自筹资金');await expect(page.getByRole('dialog').getByRole('button')).toBeDisabled();await expect(page.getByPlaceholder('Corporation Name')).toHaveValue('Research');
 await page.locator(toolbar).getByText('中文：开',{exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Would you like to start a corporation?');await expect(page.getByPlaceholder('Corporation Name')).toHaveValue('Research');
});
