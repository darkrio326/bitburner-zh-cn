import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
test.skip(!process.env.LIVE, 'Opt-in official-site smoke test; uses a fresh isolated browser context.');
test('official v3.0.1: direct Chinese navigation, options, terminal and Monaco remain usable', async ({ page, browser }) => {
  test.setTimeout(90000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://bitburner-official.github.io/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.MuiDrawer-root')).toContainText('Bitburner v3.0.1');
  const priorErrors=errors.length, requests=[];
  page.on('request',r=>requests.push(r.url()));
  await page.addScriptTag({content:readFileSync('bitburner-zh-cn.user.js','utf8')});
  const host=page.locator('#bitburner-zh-cn-overlay'), panel=host.locator('section');
  const nav=name=>page.locator('.MuiDrawer-root').getByRole('button',{name,exact:true});
  mkdirSync('output/playwright',{recursive:true});
  await expect(page.getByText('欢迎来到 Bitburner，一款赛博朋克题材的放置类 RPG！',{exact:false})).toBeVisible();
  await page.screenshot({path:'output/playwright/live-tutorial.png'});
  await page.getByRole('button',{name:'next',exact:true}).click();
  await expect(page.getByText('我们先前往“属性”页面。点击',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'退出教程',exact:true}).click();
  await expect(page.locator('[class*="-overviewContainer"]').getByText('生命',{exact:true})).toBeVisible();
  for(let i=0;i<3;i++){
    await nav('属性').click();
    await expect(page.locator('h4')).toHaveText('属性');
    await expect(page.getByText('入侵成功率',{exact:true})).toBeVisible();
    await page.mouse.move(1100,850);
    if(i===0)await page.screenshot({path:'output/playwright/live-stats.png'});
    await nav('Hacknet 网络').click();
    await expect(page.locator('h4')).toHaveText('Hacknet 节点');
    await expect(page.getByText(/Hacknet 是一个全球性的去中心化机器网络/)).toBeVisible();
    await expect(page.getByRole('button',{name:/购买 Hacknet 节点/})).toBeVisible();
  }
  await page.mouse.move(1100,850);
  await page.screenshot({path:'output/playwright/live-hacknet.png'});
  await nav('运行中的脚本').click();
  await expect(page.getByText(/此页面列出你在所有机器上运行中的脚本/)).toBeVisible();
  await page.getByRole('tab',{name:'最近终止',exact:true}).click();
  await expect(page.getByText('最近终止的脚本列表。',{exact:true})).toBeVisible();
  await nav('创建程序').click();
  await expect(page.getByText('此病毒可以打开 SQL 端口',{exact:true})).toBeVisible();
  await expect(page.getByText('NUKE.exe',{exact:true})).toBeVisible();
  await nav('旅行').click();
  await expect(page.locator('h4')).toHaveText('旅行社');
  await expect(page.getByText(/出发，你可以前往任何其他城市/)).toBeVisible();
  await nav('里程碑').click();
  await expect(page.getByText(/获得 CSEC 的 root 权限/)).toBeVisible();
  await nav('设置').click();
  await expect(page.locator('h4')).toHaveText('设置');
  await expect(page.getByText('删除存档',{exact:true})).toBeVisible();
  await expect(page.getByText('软重置',{exact:true})).toBeVisible();
  await page.mouse.move(1100,850);
  await page.screenshot({path:'output/playwright/live-options.png'});
  await page.getByText('游戏玩法',{exact:true}).click();
  await expect(page.getByText('屏蔽派系邀请',{exact:true})).toBeVisible();
  await host.getByRole('button',{name:'中文：开'}).click();
  await expect(page.locator('h4')).toHaveText('Options');
  await expect(page.getByText('Delete Save',{exact:true})).toBeVisible();
  await host.getByRole('button',{name:'中文：关'}).click();
  await nav('Hacknet 网络').click();
  await host.getByRole('button',{name:'显示：直接'}).click();
  await expect(page.locator('h4')).toHaveText('Hacknet Nodes');
  await page.getByText(/^The Hacknet is a global/).hover();
  await expect(panel).toContainText('去中心化机器网络');
  await host.getByRole('button',{name:'阅读',exact:true}).click();
  await expect(panel).toHaveAttribute('data-pinned','true');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await host.getByRole('button',{name:'显示：悬停'}).click();
  await nav('终端').click();
  const terminal=page.locator('#terminal-input');
  await terminal.fill('help');
  await expect(terminal).toHaveValue('help');
  await expect(panel).toBeHidden();
  await terminal.fill('nano __zh_smoke_unsaved.js');
  await terminal.press('Enter');
  const editor=page.locator('.monaco-editor .view-lines');
  // Monaco uses Chrome EditContext; its IME textarea is not the typing target.
  await expect(editor).toContainText('export');
  await editor.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.type('// General');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ns.hack("n00dles");');
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('General');
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('ns.hack("n00dles");');
  await host.getByRole('button',{name:'中文：开'}).click();
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('ns.hack("n00dles");');
  expect(errors.slice(priorErrors)).toEqual([]);
  writeFileSync('output/playwright/live-summary.json',JSON.stringify({
    game:'v3.0.1 (3162fd2)',userscript:JSON.parse(readFileSync('package.json','utf8')).version,browser:browser.version(),mode:'headless Chrome, isolated fresh context, script injection (no Tampermonkey extension)',
    passed:['tutorial and next button','overview labels','sidebar navigation','Stats/Hacknet repeated switching','Active Scripts tabs','program descriptions and identifiers','Travel','Milestones','Options sections','English restoration','hover mode and pinned reader/Escape','terminal input','Monaco unsaved edit'],
    operations:'Fresh isolated test game only; opened an unsaved editor buffer with nano. Did not save or run code, purchase, import, export, reset, or load a user save.',
    notTested:['Tampermonkey installation and real GM APIs','Firefox','Safari','unlocked Factions/Augmentations on live game','progressed game saves','long-duration/high-load gameplay'],
    pageErrorsAfterInjection:errors.slice(priorErrors),requestsAfterInjection:requests,
  },null,2)+'\n');
});

test('official v3.0.1: city lists and map, achievement expansion and a fresh isolated game reload',async({page,browser})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://bitburner-official.github.io/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.MuiDrawer-root')).toContainText('Bitburner v3.0.1');
 const inject=()=>page.addScriptTag({content:readFileSync('bitburner-zh-cn.user.js','utf8')});
 await inject();
 const host=page.locator('#bitburner-zh-cn-overlay');
 const nav=name=>page.locator('.MuiDrawer-root').getByRole('button',{name,exact:true});
 await page.getByRole('button',{name:'退出教程',exact:true}).click();
 await nav('城市').click();
 const mapLabels=page.locator('#bitburner-zh-cn-map-labels');
 await expect(mapLabels.locator('div[data-source]')).toHaveCount(20);
 await expect(mapLabels.locator('div[data-source="[powerhouse gym]"]')).toHaveText('[力量健身房]');
 const cityMarker=page.locator('[aria-label="Rothman University"]');
 const coordinates=await cityMarker.boundingBox();
 await host.getByRole('button',{name:'中文：开'}).click();
 await expect(mapLabels).toHaveCount(0);
 expect(await cityMarker.boundingBox()).toEqual(coordinates);
 await host.getByRole('button',{name:'中文：关'}).click();
 await expect(mapLabels.locator('div[data-source]')).toHaveCount(20);
 expect(await cityMarker.boundingBox()).toEqual(coordinates);
 await page.mouse.move(1100,850);await page.screenshot({path:'output/playwright/live-city-map.png'});
 await page.locator('[aria-label="Rothman University"]').hover();
 await expect(host.locator('section')).toContainText('Rothman University（罗斯曼大学）');
 await page.locator('[aria-label="Rothman University"]').click();
 await expect(page.locator('h4')).toHaveText('Rothman University（罗斯曼大学）');
 await expect(mapLabels.locator('div[data-source]')).toHaveCount(0);
 await expect(page.locator('button').filter({hasText:'学习计算机科学（免费）'})).toBeVisible();
 await nav('设置').click();
 await page.getByText('界面',{exact:true}).click();
 await page.getByText('禁用 ASCII 艺术',{exact:true}).click();
 await nav('城市').click();
 await expect(page.getByRole('button',{name:'Sector-12 City Hall（第12区市政厅）',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Iron Gym（钢铁健身房）',exact:true}).click();
 await expect(page.locator('h4')).toHaveText('Iron Gym（钢铁健身房）');
 await expect(page.locator('button').filter({hasText:'训练力量'})).toBeVisible();
 await page.getByRole('button',{name:'返回世界',exact:true}).click();
 await page.mouse.move(1100,850);await page.screenshot({path:'output/playwright/live-city.png'});
 await nav('成就').click();
 await expect(page.locator('h4')).toHaveText('成就');
 await page.getByRole('button',{name:/未解锁/}).click();
 await expect(page.getByText('加入 CyberSec。',{exact:true})).toBeVisible();
 await expect(page.getByText('获得 BruteSSH.exe。',{exact:true})).toBeVisible();
 await expect(page.locator('.MuiCollapse-root').filter({hasText:'加入 CyberSec。'})).toHaveClass(/MuiCollapse-entered/);
 await page.mouse.move(1100,850);await page.screenshot({path:'output/playwright/live-achievements.png'});
 await host.getByRole('button',{name:'中文：开'}).click();
 await expect(page.getByText('Join CyberSec.',{exact:true})).toBeVisible();
 await host.getByRole('button',{name:'中文：关'}).click();
 // Save only this new isolated test game's normal UI state, then reload it to
 // exercise the real engine's offline report. Never load a user's browser/save.
 await page.getByRole('button',{name:'save game',exact:true}).click();
 await expect(page.getByText('Game Saved!',{exact:true})).toBeVisible();
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.getByText(/^Offline for/)).toBeVisible();
 await inject();
 const modal=page.locator('.MuiModal-root').filter({hasText:'离线时长'});
 await expect(modal).toContainText('。离线期间：');
 await expect(modal).toContainText('你的脚本获得了');
 await expect(modal).toContainText('你的 Hacknet 节点产出了');
 await expect(modal).toContainText('声望，已分配到你的各个派系');
 await expect(modal).not.toContainText(/seconds|minutes|Offline for|While you were offline/);
 await page.screenshot({path:'output/playwright/live-offline.png'});
 await host.getByRole('button',{name:'中文：开'}).click();
 await expect(page.getByText(/^Offline for/)).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.MuiModal-root')).toHaveCount(0);
 expect(errors).toEqual([]);
 writeFileSync('output/playwright/live-v04-summary.json',JSON.stringify({game:'v3.0.1 (3162fd2)',userscript:JSON.parse(readFileSync('package.json')).version,browser:browser.version(),mode:'headless Chrome injection, no Tampermonkey',passed:['ASCII city map Chinese labels, unchanged marker coordinates, English restoration and hover/click','city list and location navigation','achievement expansion and English restoration','real engine offline report after normal save/reload in a fresh isolated test context','offline English restoration and Escape dismissal'],operations:'Fresh isolated test game only. Changed its ASCII display setting and used its normal save button, then reloaded. No user browser profile/save, game internals, import/export, purchases or code execution.',pageErrors:errors,notTested:['Tampermonkey extension installation','Firefox/Safari','live faction join button with an unlocked user save']},null,2)+'\n');
});

test('official v3.0.1: deep city pages, bilingual employer roles, narrow layout and free-course start/stop',async({page,browser})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://bitburner-official.github.io/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.MuiDrawer-root')).toContainText('Bitburner v3.0.1');
 await page.addScriptTag({content:readFileSync('bitburner-zh-cn.user.js','utf8')});
 const host=page.locator('#bitburner-zh-cn-overlay');
 await page.getByRole('button',{name:'退出教程',exact:true}).click();
 const nav=name=>page.locator('.MuiDrawer-root').getByRole('button',{name,exact:true});
 const visit=async loc=>{await nav('城市').click();await page.locator(`[aria-label="${loc}"]`).click();};
 const geometry=[];
 async function checkLayout(name){
  await page.mouse.move(5,5);
  const items=await page.locator('button[data-bitburner-zh-fit="wrap"]').evaluateAll(buttons=>buttons.filter(b=>b.offsetParent).map(b=>{
   const box=b.getBoundingClientRect(),range=document.createRange(),walk=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let n,overflow=false;
   while((n=walk.nextNode())){if(!n.data.trim())continue;range.selectNodeContents(n);for(const r of range.getClientRects())if(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1)overflow=true;}
   return{text:b.textContent,overflow,outsideViewport:box.right>innerWidth+1,width:box.width,height:box.height};
  }));
  expect(items.length).toBeGreaterThan(0);expect(items.filter(i=>i.overflow||i.outsideViewport)).toEqual([]);const title=page.locator('h4').first(),box=await title.boundingBox(),overview=await page.locator('[class*="-overviewContainer"]').boundingBox();
  if(box&&overview&&box.y<overview.y+overview.height&&box.y+box.height>overview.y)expect(box.x+box.width).toBeLessThanOrEqual(overview.x-10);
  geometry.push({page:name,viewport:page.viewportSize(),buttons:items,title:box,overview});
 }
 for(const width of [1280,900]){
  await page.setViewportSize({width,height:900});
  await visit('MegaCorp');await expect(page.locator('h4')).toHaveText('MegaCorp（巨型企业）');
  await expect(page.getByRole('button',{name:'申请软件工程实习生（Software Engineering Intern）',exact:true})).toBeDisabled();
  await checkLayout('MegaCorp');await page.screenshot({path:`output/playwright/live-company-${width}.png`});
  await visit('The Slums');await expect(page.locator('button').filter({hasText:/Shoplift（顺手牵羊）/})).toBeVisible();
  await expect(page.locator('button').filter({hasText:/Heist（大劫案）/})).toBeVisible();
  const chances=await page.locator('button[data-bitburner-zh-fit="wrap"]').allTextContents();
  await checkLayout('The Slums');
  await host.getByRole('button',{name:'中文：开'}).click();
  await expect(page.locator('button').filter({hasText:/Shoplift \(.+chance of success/})).toBeVisible();
  const english=await page.locator('button').filter({hasText:/chance of success/}).allTextContents();
  expect(english.map(s=>s.match(/[\d.]+%/)[0])).toEqual(chances.filter(s=>s.includes('成功率')).map(s=>s.match(/[\d.]+%/)[0]));
  await host.getByRole('button',{name:'中文：关'}).click();await expect(page.locator('button').filter({hasText:/Shoplift（顺手牵羊）/})).toBeVisible();
  await page.mouse.move(5,5);await page.screenshot({path:`output/playwright/live-slums-${width}.png`});
  await visit('Alpha Enterprises');await expect(page.getByRole('button',{name:'申请软件咨询合同',exact:true})).toBeVisible();await checkLayout('Alpha Enterprises');
  await visit('Rothman University');await expect(page.locator('button').filter({hasText:'学习计算机科学（免费）'})).toBeVisible();await checkLayout('Rothman University');
  await visit('Iron Gym');await expect(page.getByRole('button',{name:/训练力量/})).toBeVisible();await checkLayout('Iron Gym');
 }
 await visit('FoodNStuff');await expect(page.getByRole('button',{name:'申请兼职员工（Part-time Employee）',exact:true})).toBeVisible();await checkLayout('FoodNStuff');
 await visit('MegaCorp');await page.getByRole('button',{name:'潜入公司',exact:true}).click();
 await expect(page.getByText('最高通关层数：',{exact:true})).toBeVisible();
 await expect(page.getByText('所有小游戏均无需使用鼠标。',{exact:true})).toBeVisible();
 await page.screenshot({path:'output/playwright/live-infiltration-intro.png'});
 await page.getByRole('button',{name:'取消',exact:true}).click();
 await visit('Hospital');await expect(page.getByRole('button',{name:/治疗伤口/})).toBeVisible();
 await visit('Sector-12 City Hall');await expect(page.getByText('一名商人正在对职员大吼大叫。你应该稍后再来。',{exact:true})).toBeVisible();
 await visit('Rothman University');await page.locator('button').filter({hasText:'学习计算机科学（免费）'}).click();
 await expect(page.getByText('你正在 学习计算机科学',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'停止上课',exact:true})).toBeVisible();
 await page.mouse.move(5,5);await page.screenshot({path:'output/playwright/live-course-work.png'});
 await page.getByRole('button',{name:'停止上课',exact:true}).click();
 const result=page.locator('.MuiModal-root');await expect(result).toContainText('你总共获得了：');await expect(result).toContainText('后，你总共花费了');await expect(result).not.toContainText('效力于');await expect(result).not.toContainText('for');
 await page.screenshot({path:'output/playwright/live-course-result.png'});
 await host.getByRole('button',{name:'中文：开',includeHidden:true}).click();await expect(result).toContainText('You earned a total of:');await page.keyboard.press('Escape');
 expect(errors).toEqual([]);
 writeFileSync('output/playwright/live-v05-summary.json',JSON.stringify({game:'v3.0.1',userscript:JSON.parse(readFileSync('package.json')).version,browser:browser.version(),mode:'headless Chrome injection, fresh isolated context',passed:['8 accessible Sector-12 location pages','company/faction-name disambiguation','12 crime action labels and exact success percentage preservation','infiltration intro and cancel without starting minigames','button text bounds at 1280 and 900 pixels','start and stop free Computer Science class','course result dialog and English restoration'],operations:'Only normal navigation, opening/cancelling the infiltration introduction, and a free course in a fresh disposable test game. No user save/profile, purchases, gambling, infiltration minigames, password submission, hiring or grafting.',pageErrors:errors,layoutMeasurements:geometry,notTested:['live unlocked grafting/darknet/casino and other cities','Tampermonkey installation and real GM APIs','Firefox/Safari','long-running gameplay']},null,2)+'\n');
});

test('official v3.0.1: documentation navigation, inline code, search and restoration',async({page,browser})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://bitburner-official.github.io/',{waitUntil:'domcontentloaded'});await expect(page.locator('.MuiDrawer-root')).toContainText('Bitburner v3.0.1');
 await page.addScriptTag({content:readFileSync('bitburner-zh-cn.user.js','utf8')});const host=page.locator('#bitburner-zh-cn-overlay');await page.getByRole('button',{name:'退出教程',exact:true}).click();
 await page.locator('.MuiDrawer-root').getByRole('button',{name:'文档',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('文档');
 const lockedBefore=await page.locator('span[style*="cursor: pointer"]').allTextContents();
 await page.getByRole('button',{name:'新手指南',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('编程初学者入门指南');await expect(page.getByText('创建第一个脚本',{exact:true})).toBeVisible();
 for(const width of [900,1280]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.locator('[data-bitburner-zh-document]').evaluate(p=>{const r=p.getBoundingClientRect(),o=document.querySelector('[class*="-overviewContainer"]').getBoundingClientRect();return r.right<=o.left-10})).toBe(true);await page.screenshot({path:`output/playwright/live-beginner-${width}.png`})}
 await page.getByRole('button',{name:'文档首页',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('文档');
 await page.locator('[data-bitburner-zh-document]').getByRole('button',{name:'终端',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('终端');await expect(page.getByText('参数解析',{exact:true})).toBeVisible();
 const codeText=await page.locator('pre,span[class*="-code"]').allTextContents();expect(codeText.join('\n')).toContain('argType.js');expect(codeText.join('\n')).toContain('run foo.js; tail foo.js');
 await host.getByRole('button',{name:'中文：开'}).click();await expect(page.locator('h2').first()).toHaveText('Terminal');expect(await page.locator('pre,span[class*="-code"]').allTextContents()).toEqual(codeText);
 await host.getByRole('button',{name:'中文：关'}).click();await page.getByRole('button',{name:'文档首页',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('文档');
 await page.getByRole('button',{name:'脚本',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('开始之前');await expect(page.getByText('多线程脚本',{exact:true})).toBeVisible();
 const apiSearch=page.getByPlaceholder('Search NS API');await apiSearch.fill('ns.hack');await expect(apiSearch).toHaveValue('ns.hack');await apiSearch.press('Enter');await expect(page.locator('body')).toContainText('NS.hack()');
 await expect(page.locator('pre').first()).toContainText('hack(');
 await page.getByRole('button',{name:'文档首页',exact:true}).click();await expect(page.locator('h2').first()).toHaveText('文档');
 const layout=[];for(const width of [1280,900]){await page.setViewportSize({width,height:900});await page.mouse.move(width-20,850);const overflow=await page.locator('button[data-bitburner-zh-fit]').evaluateAll(bs=>bs.filter(b=>{const r=b.getBoundingClientRect();return r.right>innerWidth+1}).map(b=>b.textContent));expect(overflow).toEqual([]);layout.push({width,overflow});await page.screenshot({path:`output/playwright/live-documentation-${width}.png`})}
 await host.getByRole('button',{name:'显示：直接'}).click();await expect(page.locator('h2').first()).toHaveText('Documentation');await page.getByRole('button',{name:'Source-Files',exact:true}).count().then(n=>expect(n).toBe(0));
 expect(errors).toEqual([]);writeFileSync('output/playwright/live-v07-summary.json',JSON.stringify({game:'v3.0.1',userscript:JSON.parse(readFileSync('package.json')).version,browser:browser.version(),passed:['full beginner guide and code blocks','prose column avoids overview','documentation index','Terminal and Scripts prose','code text unchanged','NS API search Enter and signature','home navigation','English restoration','1280/900 layout'],layout,lockedLinksObserved:lockedBefore.length,operations:'New isolated game; navigation and search only. No user save, unlock, purchase or script execution.',notTested:['real unlocked Source-File page','Tampermonkey installation and automatic update download','all API prose'],pageErrors:errors},null,2)+'\n');
});
