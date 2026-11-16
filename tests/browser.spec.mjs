import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
const script=readFileSync('bitburner-zh-cn.user.js','utf8');
const fixture=(await build({entryPoints:['tests/fixture.jsx'],bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}})).outputFiles[0].text;
const host='#bitburner-zh-cn-overlay';
const panel=page=>page.locator(`${host} section`);

test.beforeEach(async({page})=>{
  await page.setContent('<style>body{font:16px sans-serif;background:#111;color:#ddd}aside{display:flex;gap:8px}main{margin:24px;width:680px}p{padding:8px}button{padding:8px}textarea,input{display:block;margin:10px}</style><div id="root"></div>');
  await page.evaluate(()=>{
    window.gmValues={mode:'hover'};window.gmMenus=new Map();
    window.GM_getValue=(k,d)=>window.gmValues[k]??d;
    window.GM_setValue=(k,v)=>window.gmValues[k]=v;
    window.GM_registerMenuCommand=(name,callback)=>{window.gmMenus.set(name,callback);return name;};
    window.GM_unregisterMenuCommand=id=>window.gmMenus.delete(id);
    window.observers=[];
    const NativeObserver=window.MutationObserver;
    window.MutationObserver=class extends NativeObserver {
      constructor(fn){super(fn);if(window.trackUserscriptObservers)window.observers.push(this);this.active=false;}
      observe(...args){this.active=true;return super.observe(...args);}
      disconnect(){this.active=false;return super.disconnect();}
    };
  });
  await page.addScriptTag({content:fixture});
  await expect(page.locator('h4')).toHaveText('Stats');
  await page.addScriptTag({content:`window.trackUserscriptObservers=true;\n${script}\nwindow.trackUserscriptObservers=false;`});
});

test('hover uses an independent shadow layer and leaves React markup unchanged',async({page})=>{
  const before=await page.locator('#root').innerHTML();
  await page.locator('#dynamic').hover();
  await expect(panel(page)).toContainText('常规');
  expect(await page.locator('#root').innerHTML()).toBe(before);
  expect(await page.locator(host).evaluate(el=>el.parentElement===document.body&&!document.getElementById('root').contains(el))).toBe(true);
  await page.locator('#unmatched').hover();await expect(panel(page)).toBeHidden();
});
test('React updates existing text and mounts new pages without rescanning or reinjection',async({page})=>{
  await page.locator('#dynamic').hover();await expect(panel(page)).toContainText('常规');
  await page.evaluate(()=>window.fixture.setTick(1));await expect(panel(page)).toContainText('技能');
  await page.evaluate(()=>window.fixture.setShow(false));await expect(panel(page)).toBeHidden();
  await page.getByRole('button',{name:'Factions',exact:true}).click();
  await page.getByText('Your Factions',{exact:true}).hover();await expect(panel(page)).toContainText('你的派系');
  await page.evaluate(()=>window.fixture.setPage('CyberSec'));
  await page.getByRole('button',{name:'Hacking Contracts',exact:true}).hover();await expect(panel(page)).toContainText('黑客合约');
  await page.locator('h4').hover();await expect(panel(page)).toBeHidden();
  await page.getByRole('button',{name:'Augmentations',exact:true}).click();
  await page.getByText('Purchased Augmentations',{exact:true}).hover();await expect(panel(page)).toContainText('已购买的强化');
  await page.locator('#aug-description').hover();await expect(panel(page)).toContainText('嵌入大脑的小型脑部植入体');
});
test('long prose, inline values, pointer passthrough and delayed rich tooltips',async({page})=>{
  await page.locator('#tooltip-trigger').hover();
  await expect(panel(page)).toContainText('显示你当前的倍率');
  await page.getByRole('button',{name:'Hacknet',exact:true}).click();
  await page.locator('#long').hover();await expect(panel(page)).toContainText('去中心化机器网络');
  await page.locator('#purchase').hover();await expect(panel(page)).toContainText('购买 Hacknet 节点 - $0.000k');
  await page.locator('#purchase').click();await expect(page.locator('#purchase')).toContainText('$1.000k');
  expect(await panel(page).evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
});
test('inputs, editor, code, editable areas and terminal stay untouched',async({page})=>{
  for(const selector of ['input','.monaco-editor span','pre','[contenteditable]','#terminal li','code','.react-draggable:not(.fixture-overviewContainer) p']) {
    await page.locator(selector).hover();await expect(panel(page)).toBeHidden();
  }
  await page.getByRole('textbox',{name:'terminal input'}).fill('run hello.js');
  await page.getByRole('textbox',{name:'code editor'}).fill('await ns.hack("n00dles");');
  await expect(page.getByRole('textbox',{name:'terminal input'})).toHaveValue('run hello.js');
  await expect(page.getByRole('textbox',{name:'code editor'})).toHaveValue('await ns.hack("n00dles");');
});
test('disable cancels pending work and observers; re-enable and complete removal clean up',async({page})=>{
  await page.locator('#dynamic').hover();
  await page.locator(host).getByRole('button',{name:'中文：开',exact:true}).click();
  await expect(panel(page)).toBeHidden();
  expect(await page.evaluate(()=>window.observers.every(o=>!o.active))).toBe(true);
  expect(await page.evaluate(()=>window.gmValues.enabled)).toBe(false);
  await page.locator('#dynamic').hover();await page.waitForTimeout(250);await expect(panel(page)).toBeHidden();
  await page.locator(host).getByRole('button',{name:'中文：关',exact:true}).click();
  await page.locator('#dynamic').hover();await expect(panel(page)).toContainText('常规');
  await page.addScriptTag({content:script});await expect(page.locator(host)).toHaveCount(1);
  await page.evaluate(()=>window.gmMenus.get('本页完全移除汉化（刷新恢复）')());
  await expect(page.locator(host)).toHaveCount(0);
  expect(await page.evaluate(()=>window.observers.every(o=>!o.active)&&window.gmMenus.size===0)).toBe(true);
  await page.evaluate(()=>window.fixture.setTick(1));await expect(page.locator('#dynamic')).toHaveText('Skills');
});
test('reading panel pins last result and Escape dismisses without consuming the key',async({page})=>{
  await page.locator('#dynamic').hover();await expect(panel(page)).toContainText('常规');
  await page.locator(host).getByRole('button',{name:'阅读',exact:true}).click();
  await expect(panel(page)).toBeVisible();
  expect(await panel(page).getAttribute('data-pinned')).toBe('true');
  await page.keyboard.press('Escape');await expect(panel(page)).toBeHidden();
});

test('unrelated rapid React updates do not retrigger translation reads',async({page})=>{
  await page.evaluate(()=>{
    window.translationReads=0;
    const walk=document.createTreeWalker.bind(document);
    document.createTreeWalker=(...args)=>{window.translationReads++;return walk(...args);};
  });
  await page.locator('#dynamic').hover();await expect(panel(page)).toContainText('常规');
  const baseline=await page.evaluate(()=>window.translationReads);
  await page.evaluate(()=>{
    const container=document.createElement('div');document.getElementById('root').append(container);
    for(let i=0;i<1000;i++)container.append(document.createTextNode(String(i)));
  });
  await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.translationReads)).toBe(baseline);
  await page.mouse.move(1000,600);
  expect(await page.evaluate(()=>window.observers.every(o=>!o.active))).toBe(true);
});

test('saved disabled preference starts with no translation observers; pagehide tears down',async({page})=>{
  await page.evaluate(()=>window.gmMenus.get('本页完全移除汉化（刷新恢复）')());
  await page.evaluate(()=>window.gmValues.enabled=false);
  await page.addScriptTag({content:script});
  await expect(page.locator(host).getByRole('button',{name:'中文：关'})).toBeVisible();
  await page.locator('#dynamic').hover();await page.waitForTimeout(250);await expect(panel(page)).toBeHidden();
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
  await expect(page.locator(host)).toHaveCount(0);
  expect(await page.evaluate(()=>window.gmMenus.size)).toBe(0);
});
