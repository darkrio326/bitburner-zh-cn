import{test,expect}from'@playwright/test';
import{build}from'esbuild';
import{readFileSync}from'node:fs';
import{createMatcher}from'../src/matcher.js';
const corpus=JSON.parse(readFileSync('tests/fixtures/documentation-v3.0.1.json'));
const dictionary=JSON.parse(readFileSync('translations/zh-CN.json'));
const match=createMatcher(dictionary.entries,dictionary.slotValues);
const fixture=(await build({stdin:{contents:readFileSync('tests/documentation-fixture.jsx','utf8').replace('/* SF_COMPONENTS */[]','['+corpus.sourceFiles.map(e=>e.jsx).join(',')+']'),resolveDir:process.cwd()+'/tests',loader:'jsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}})).outputFiles[0].text;
const script=readFileSync('bitburner-zh-cn.user.js','utf8'),host='#bitburner-zh-cn-overlay';
async function go(page,path){await page.evaluate(p=>window.documentationFixture.doc(p),path);await expect(page.locator('article')).toHaveAttribute('data-path',path)}
const rawCodes=page=>page.locator('article .tss-fixture-code,article pre').allTextContents();
async function overflow(page){return page.locator('main button,[role=dialog] button').evaluateAll(buttons=>buttons.filter(b=>{const box=b.getBoundingClientRect();return box.width&&box.right>innerWidth+1}).map(b=>b.textContent))}
test.beforeEach(async({page})=>{await page.setViewportSize({width:900,height:900});await page.setContent('<style>body{margin:0;background:#09120e;color:#00e878}pre{overflow:auto;max-width:100%}</style><div id="root"></div>');await page.evaluate(()=>{window.fixtureErrors=[];addEventListener('error',e=>window.fixtureErrors.push(e.message));window.GM_getValue=(k,v)=>v;window.GM_registerMenuCommand=(n,fn)=>{if(n.includes('完全移除'))window.removeChinese=fn;return n};window.GM_unregisterMenuCommand=()=>{}});await page.addScriptTag({content:fixture})});
test('all selected Markdown pages translate while code text, links and React navigation remain intact',async({page})=>{
 test.setTimeout(90000);await page.addScriptTag({content:script});await expect(page.locator('article h2')).toHaveText('文档');
 for(const p of corpus.pages){
  await page.locator(host).getByText('中文：开',{exact:true}).click();await go(page,p.path);
  const codes=await rawCodes(page);const english=await page.locator('article').textContent();
  const nodes=await page.locator('article').evaluate(article=>{const w=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);window.fixtureDocNodes=[];let n;while((n=w.nextNode()))if(!n.parentElement.closest('pre,code,span[class*="-code"],math'))window.fixtureDocNodes.push(n);return window.fixtureDocNodes.map(n=>({text:n.data,button:!!n.parentElement.closest('button')}))});
  const expected=nodes.map(n=>{const e=match(n.text,'documentation')??(n.button?match(n.text,'common'):null);return e?n.text.replace(/\S(?:[\s\S]*\S)?/u,()=>e.zh):n.text});
  await page.locator(host).getByText('中文：关',{exact:true}).click();
  const sample=corpus.items.find(e=>e.page===p.path&&dictionary.entries.some(x=>x.en===e.text&&x.scopes.includes('documentation')));
  const translated=dictionary.entries.find(x=>x.en===sample.text&&x.scopes.includes('documentation')).zh;
  await expect(page.locator('article')).toContainText(translated);expect(await rawCodes(page)).toEqual(codes);expect(await overflow(page)).toEqual([]);
  await expect.poll(()=>page.evaluate(()=>window.fixtureDocNodes.map(n=>n.data))).toEqual(expected);
  await page.locator(host).getByText('中文：开',{exact:true}).click();await expect(page.locator('article')).toHaveText(english);await page.locator(host).getByText('中文：关',{exact:true}).click();
 }
 await go(page,'index.md');await page.locator('article').getByRole('button',{name:'终端',exact:true}).click();await expect(page.locator('article h2')).toHaveText('终端');expect(await page.evaluate(()=>window.fixtureLinkClicks)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'返回',exact:true}).click();await expect(page.locator('article h2')).toHaveText('文档');
 await page.getByPlaceholder('Search NS API').fill('ns.getPlayer');await page.getByPlaceholder('Search NS API').press('Enter');expect(await page.evaluate(()=>window.fixtureSearch)).toBe('ns.getPlayer');expect(await page.evaluate(()=>window.fixtureErrors)).toEqual([]);
 await page.screenshot({path:'output/playwright/local-documentation-index.png'});
});
test('Source-File 1–15 descriptions switch, preserve names and numbers, and restore without remounting',async({page})=>{
 await page.evaluate(()=>window.documentationFixture.route('Augmentations'));await page.addScriptTag({content:script});
 for(const sf of corpus.sourceFiles){await page.locator('main .MuiListItemButton-root').filter({hasText:`Source-File ${sf.number}:`}).click();const item=corpus.items.find(e=>e.sf===sf.number);const zh=dictionary.entries.find(e=>e.en===item.text&&e.scopes.includes('augmentations')).zh;await expect(page.locator('#sf-effect')).toContainText(zh);await expect(page.locator('main h6')).toContainText(`Source-File ${sf.number}: ${sf.name}`);}
 await expect(page.locator('#sf-effect')).toContainText('DarkscapeNavigator.exe');await expect(page.locator('#sf-effect')).toContainText('20%');await expect(page.locator('#sf-effect')).toContainText('50%');
 await page.screenshot({path:'output/playwright/local-sourcefile-15.png'});
 await page.locator(host).getByText('中文：开',{exact:true}).click();await expect(page.locator('#sf-effect')).toContainText('Your charisma level increases job salary');await page.locator('main .MuiListItemButton-root').first().click();await expect(page.locator('#sf-effect')).toContainText('32GB');expect(await page.evaluate(()=>window.fixtureErrors)).toEqual([]);
});
test('documentation popup has its own scope, hover reader works, and cleanup retains input and event handlers',async({page})=>{
 await page.evaluate(()=>window.documentationFixture.route('Stats'));await page.addScriptTag({content:script});await expect(page.locator('#outside-doc')).toHaveText('Source-Files are a type of persistent upgrade that is more powerful than');
 await page.getByRole('button',{name:'Help',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('源文件是一种永久升级');
 await page.locator(host).getByText('显示：直接',{exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Source-Files are a type');
 const paragraph=page.getByRole('dialog').locator('p').first();
 await paragraph.getByRole('button',{name:'BitNode',exact:true}).hover();await expect(page.locator(host).locator('section')).toContainText('比特节点');
 // The paragraph's center can hit a nested link after font-dependent wrapping.
 await paragraph.hover({position:{x:5,y:5}});await expect(page.locator(host).locator('section')).toContainText('源文件');
 await page.locator(host).getByText('阅读',{exact:true}).click();await expect(page.locator(host).locator('section[role="region"]')).toBeVisible();await page.keyboard.press('Escape');
 await page.evaluate(()=>window.documentationFixture.popup(false));await page.evaluate(()=>window.documentationFixture.route('Documentation'));await go(page,'basic/terminal.md');await page.getByPlaceholder('Search NS API').fill('ns.hack');await page.evaluate(()=>window.removeChinese());
 await expect(page.locator(host)).toHaveCount(0);await expect(page.locator('[data-bitburner-zh-fit]')).toHaveCount(0);await expect(page.getByPlaceholder('Search NS API')).toHaveValue('ns.hack');await expect(page.locator('article h2')).toHaveText('Terminal');await page.getByRole('button',{name:'Home',exact:true}).click();await expect(page.locator('article h2')).toHaveText('Documentation');
});
test('document prose avoids the overview at 900/1280 and clears its layout on hover and removal',async({page})=>{
 await page.evaluate(()=>{const o=document.createElement('div');o.className='fixture-overviewContainer';o.style.cssText='position:fixed;right:0;top:0;width:180px;height:300px';o.append('Overview');document.body.append(o)});
 await go(page,'help/getting_started.md');await page.addScriptTag({content:script});
 for(const width of [900,1280]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.locator('article').evaluate(p=>p.getBoundingClientRect().right<=document.querySelector('[class*="-overviewContainer"]').getBoundingClientRect().left-10)).toBe(true)}
 await page.locator(host).getByText('显示：直接',{exact:true}).click();await expect(page.locator('[data-bitburner-zh-document]')).toHaveCount(0);expect(await page.locator('article').getAttribute('style')).toBeNull();
 await page.locator(host).getByText('显示：悬停',{exact:true}).click();await expect(page.locator('[data-bitburner-zh-document]')).toHaveCount(1);await page.evaluate(()=>window.removeChinese());await expect(page.locator('[data-bitburner-zh-document]')).toHaveCount(0);expect(await page.locator('article').getAttribute('style')).toBeNull();
});
