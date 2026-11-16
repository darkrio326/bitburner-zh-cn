import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
const script=readFileSync('bitburner-zh-cn.user.js','utf8');
const fixture=(await build({entryPoints:['tests/fixture.jsx'],bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}})).outputFiles[0].text;
const host='#bitburner-zh-cn-overlay';
test.beforeEach(async({page})=>{
  await page.setContent('<style>body{padding:16px}p{padding:8px}button{padding:8px}main{width:680px}</style><div id="root"></div>');
  await page.evaluate(()=>{
    window.gmValues={};window.gmMenus=new Map();
    window.GM_getValue=(k,d)=>window.gmValues[k]??d;
    window.GM_setValue=(k,v)=>window.gmValues[k]=v;
    window.GM_registerMenuCommand=(n,fn)=>{window.gmMenus.set(n,fn);return n;};
    window.GM_unregisterMenuCommand=n=>window.gmMenus.delete(n);
  });
  await page.addScriptTag({content:fixture});
  await expect(page.locator('h4')).toHaveText('Stats');
  await page.evaluate(()=>{
    window.originalNode=document.getElementById('dynamic').firstChild;
    window.beforeHTML=document.getElementById('root').innerHTML;
  });
  await page.addScriptTag({content:script});
  await expect(page.locator('#dynamic')).toHaveText('常规');
});
test('default direct mode preserves node identity, buttons and exact restoration',async({page})=>{
  await expect(page.locator('h4')).toHaveText('属性');
  expect(await page.evaluate(()=>window.originalNode===document.getElementById('dynamic').firstChild)).toBe(true);
  await page.locator(host).getByRole('button',{name:'中文：开'}).click();
  expect(await page.locator('#root').innerHTML()).toBe(await page.evaluate(()=>window.beforeHTML));
  await page.locator(host).getByRole('button',{name:'中文：关'}).click();
  await page.getByRole('button',{name:'派系',exact:true}).click();
  await expect(page.locator('h4')).toHaveText('派系');
  await expect(page.locator('main')).toContainText('你尚未加入任何派系');
});
test('React rerenders, removes and reuses translated text; latest values win',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(let i=1;i<9;i++){
    await page.evaluate(i=>window.fixture.setTick(i),i);
    await expect(page.locator('#dynamic')).toHaveText(i%2?'技能':'常规');
  }
  await page.evaluate(()=>window.fixture.setShow(false));await expect(page.locator('#dynamic')).toHaveCount(0);
  await page.evaluate(()=>window.fixture.setShow(true));await expect(page.locator('#dynamic')).toHaveText('常规');
  await page.evaluate(()=>window.fixture.setTick(1));await expect(page.locator('#dynamic')).toHaveText('技能');
  await page.locator(host).getByRole('button',{name:'中文：开'}).click();
  await expect(page.locator('#dynamic')).toHaveText('Skills');
  expect(errors).toEqual([]);
});
test('dynamic amounts and game action keep working through repeated translations',async({page})=>{
  await page.getByRole('button',{name:'Hacknet 网络',exact:true}).click();
  await expect(page.locator('h4')).toHaveText('Hacknet 节点');
  await expect(page.locator('#long')).toContainText('去中心化机器网络');
  for(let i=0;i<4;i++){
    await expect(page.locator('#purchase')).toContainText(`购买 Hacknet 节点 - $${i}.000k`);
    await page.locator('#purchase').click();
  }
  await page.locator(host).getByRole('button',{name:'显示：直接'}).click();
  await expect(page.locator('#purchase')).toHaveText('Purchase Hacknet Node - $4.000k');
  await page.locator('#long').hover();
  await expect(page.locator(`${host} section`)).toContainText('去中心化机器网络');
});
test('editor, terminal, identifiers and script logs remain English in direct mode',async({page})=>{
  for(const selector of ['.monaco-editor span','pre','[contenteditable]','#terminal li','code','.react-draggable:not(.fixture-overviewContainer) p'])await expect(page.locator(selector)).toHaveText('General');
  await expect(page.locator('#unmatched')).toHaveText('n00dles home CyberSec NUKE.exe ns.hack() $1.500m');
  await page.getByRole('textbox',{name:'terminal input'}).fill('run foo.js');
  await page.getByRole('textbox',{name:'code editor'}).fill('ns.hack("n00dles")');
  await page.evaluate(()=>window.fixture.setTick(2));
  await expect(page.getByRole('textbox',{name:'terminal input'})).toHaveValue('run foo.js');
  await expect(page.getByRole('textbox',{name:'code editor'})).toHaveValue('ns.hack("n00dles")');
});
test('destroy restores translated nodes but never overwrites fresh game text',async({page})=>{
  await page.evaluate(()=>{
    document.getElementById('dynamic').firstChild.data='Fresh game state';
    window.gmMenus.get('本页完全移除汉化（刷新恢复）')();
  });
  await expect(page.locator('#dynamic')).toHaveText('Fresh game state');
  await expect(page.locator('h4')).toHaveText('Stats');
  await expect(page.locator(host)).toHaveCount(0);
  await page.waitForTimeout(100);await expect(page.locator('#dynamic')).toHaveText('Fresh game state');
});
test('scope changes restore old labels, while overview values and extension hooks stay untouched',async({page})=>{
  await expect(page.locator('.fixture-overviewContainer p')).toHaveText('概览');
  await expect(page.locator('.fixture-overviewContainer span').first()).toHaveText('生命');
  await expect(page.locator('#overview-extra-hook-0')).toHaveText('General');
  await page.evaluate(()=>{window.fixture.setPage('Options');window.fixture.setTick(6);});
  await expect(page.locator('h4')).toHaveText('设置');
  await expect(page.locator('#dynamic')).toHaveText('General');
  await expect(page.getByRole('button',{name:'导出游戏',exact:true})).toBeVisible();
  await expect(page.locator('label')).toContainText('自动执行脚本 + 参数');
  await expect(page.locator('label input')).toHaveValue('General');
  await expect(page.locator('#overview-hp')).toHaveText('6');
  await page.locator(host).getByRole('button',{name:'中文：开'}).click();
  await page.evaluate(()=>window.fixture.setPage('Stats'));
  await expect(page.locator('h4')).toHaveText('Stats');
  await page.waitForTimeout(100);
  await expect(page.locator('h4')).toHaveText('Stats');
  await expect(page.locator('.fixture-overviewContainer p')).toHaveText('Overview');
});
