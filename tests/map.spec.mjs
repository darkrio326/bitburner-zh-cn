import{test,expect}from'@playwright/test';import{build}from'esbuild';import{readFileSync}from'node:fs';
const script=readFileSync('bitburner-zh-cn.user.js','utf8');
const fixture=(await build({entryPoints:['tests/map-fixture.jsx'],bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}})).outputFiles[0].text;
const corpus=JSON.parse(readFileSync('tests/fixtures/city-maps-v3.0.1.json'));
const overlay='#bitburner-zh-cn-map-labels',toolbar='#bitburner-zh-cn-overlay';
const markers=p=>p.locator('#city-map [aria-label]');
async function markerRects(page){return markers(page).evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect(),map=document.getElementById('city-map').getBoundingClientRect();return {name:e.getAttribute('aria-label'),x:r.x-map.x,y:r.y-map.y,width:r.width,height:r.height}}))}
async function geometry(page,label){return page.evaluate(label=>{
 const walker=document.createTreeWalker(document.getElementById('city-map'),NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){const start=n.data.indexOf(label);if(start<0)continue;const r=document.createRange();r.setStart(n,start);r.setEnd(n,start+label.length);const a=r.getBoundingClientRect(),box=[...document.getElementById('bitburner-zh-cn-map-labels').shadowRoot.querySelectorAll('div')].find(b=>b.dataset.source===label),b=box.getBoundingClientRect(),span=box.firstChild.getBoundingClientRect();return {dx:Math.abs(a.x-b.x),dy:Math.abs(a.y-b.y),dw:Math.abs(a.width-b.width),fits:span.width<=b.width+0.1,clip:box.style.clipPath,background:getComputedStyle(box).backgroundColor,color:getComputedStyle(box).color};}
 },label)}
test.beforeEach(async({page})=>{
 await page.setContent('<style>body{margin:12px;background:#101820}button{padding:6px}</style><div id="root"></div>');
 await page.evaluate(()=>{window.GM_getValue=(k,v)=>v;window.mapErrors=[];window.addEventListener('error',e=>window.mapErrors.push(e.message));window.GM_registerMenuCommand=(label,fn)=>{if(label.includes('完全移除'))window.removeChinese=fn;return label};window.GM_unregisterMenuCommand=()=>{};});
 await page.addScriptTag({content:fixture});
 await expect(page.locator('#city-map p')).not.toHaveCount(0);
});
test('all six ASCII maps get Chinese label overlays without changing their text, markup, number of markers or click coordinates',async({page})=>{
 await page.addScriptTag({content:script});
 for(const map of corpus.maps){
  await page.locator(toolbar).getByRole('button',{name:'中文：开'}).click();
  await page.evaluate(city=>window.mapFixture.setCity(city),map.city);
  await expect(page.locator('#city-map')).toHaveText(map.text.split('\n').join(''));
  const markup=await page.locator('#city-map').innerHTML(),before=await markerRects(page);
  await page.locator(toolbar).getByRole('button',{name:'中文：关'}).click();
  const count=[...map.text.matchAll(/\[[^\]\n]+\]/g)].length;
  await expect(page.locator(overlay+' div[data-source]')).toHaveCount(count);
  expect(await page.locator('#city-map').innerHTML()).toBe(markup);
  expect(await markerRects(page)).toEqual(before);
  expect((await page.locator(overlay+' div[data-source]').allTextContents()).join('')).toMatch(/[\u3400-\u9fff]/u);
 }
 await markers(page).first().click();
 expect(await page.evaluate(()=>window.mapClick)).toBe(await markers(page).first().getAttribute('aria-label'));
 expect(await page.evaluate(()=>window.mapErrors)).toEqual([]);
});
test('labels fit the original rectangles and track scrolling, font resizing and clipped containers without covering modals',async({page})=>{
 await page.addScriptTag({content:script});
 await expect(page.locator(overlay+' div[data-source="[powerhouse gym]"]')).toBeVisible();
 let g=await geometry(page,'[powerhouse gym]');expect(g.dx).toBeLessThan(0.1);expect(g.dy).toBeLessThan(0.1);expect(g.dw).toBeLessThan(0.1);expect(g.fits).toBe(true);expect(g.background).toBe('rgb(16, 24, 32)');expect(g.color).toBe('rgb(0, 255, 0)');
 await page.evaluate(()=>window.mapFixture.setFont(20));
 await expect.poll(async()=>{const g=await geometry(page,'[powerhouse gym]');return Math.max(g.dx,g.dy,g.dw)}).toBeLessThan(0.1);
 await page.locator('#map-scroll').evaluate(e=>{e.style.width='500px';e.scrollLeft=160;e.scrollTop=20});
 await expect.poll(async()=>{const g=await geometry(page,'[powerhouse gym]');return Math.max(g.dx,g.dy)}).toBeLessThan(0.1);
 await expect.poll(async()=>(await geometry(page,'[powerhouse gym]')).clip).not.toBe('inset(0px)');
 expect((await geometry(page,'[powerhouse gym]')).fits).toBe(true);
 await page.locator('#toggle-modal').click();
 expect(await page.evaluate(()=>document.elementFromPoint(200,100).closest('#modal-cover')!==null)).toBe(true);
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.locator('#map-scroll').evaluate(e=>{e.scrollLeft=0;e.scrollTop=0;e.style.width='950px'});
 await page.evaluate(()=>window.mapFixture.setFont(16));
 await page.screenshot({path:'output/playwright/local-city-map.png'});
});
test('hover/disabled/destroy modes remove label overlays, navigation prunes them, and code/terminal remain original',async({page})=>{
 await page.addScriptTag({content:script});
 await expect(page.locator(overlay+' div[data-source]')).toHaveCount(20);
 await expect(page.locator('pre')).toHaveText('[powerhouse gym]');await expect(page.locator('#terminal')).toHaveText('[world stock exchange]');
 await page.locator(toolbar).getByRole('button',{name:'显示：直接'}).click();
 await expect(page.locator(overlay)).toHaveCount(0);
 await expect(page.locator('#city-map')).toContainText('[powerhouse gym]');
 await page.locator(toolbar).getByRole('button',{name:'显示：悬停'}).click();
 await expect(page.locator(overlay+' div[data-source]')).toHaveCount(20);
 await page.evaluate(()=>window.mapFixture.setVisible(false));
 await expect(page.locator(overlay+' div[data-source]')).toHaveCount(0);
 await page.evaluate(()=>window.mapFixture.setVisible(true));
 await expect(page.locator(overlay+' div[data-source]')).toHaveCount(20);
 await page.evaluate(()=>window.removeChinese());
 await expect(page.locator(overlay)).toHaveCount(0);await expect(page.locator(toolbar)).toHaveCount(0);
 expect(await page.evaluate(()=>window.mapErrors)).toEqual([]);
});
