import{readFileSync}from'node:fs';import assert from'node:assert/strict';
const pkg=JSON.parse(readFileSync('package.json')),lock=JSON.parse(readFileSync('package-lock.json')),text=readFileSync('bitburner-zh-cn.user.js','utf8');
assert.match(pkg.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,'Use a stable semantic version');
assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
assert.ok(text.startsWith('// ==UserScript==\n'));
const header=text.split('// ==/UserScript==')[0],meta=new Map();
for(const m of header.matchAll(/^\/\/ @(\S+)[ \t]*(.*)$/gm)){const values=meta.get(m[1])??[];values.push(m[2].trim());meta.set(m[1],values)}
const homepage='https://github.com/darkrio326/bitburner-zh-cn',raw='https://raw.githubusercontent.com/darkrio326/bitburner-zh-cn/main/bitburner-zh-cn.user.js';
for(const [key,value]of Object.entries({version:pkg.version,namespace:'bitburner-zh-cn-local',homepageURL:homepage,supportURL:homepage+'/issues',updateURL:raw,downloadURL:raw,match:'https://bitburner-official.github.io/*'}))assert.deepEqual(meta.get(key),[value],key);
assert.equal(pkg.repository.url,homepage+'.git');assert.ok(meta.has('noframes'));
assert.ok(!meta.has('require')&&!meta.has('connect')&&!meta.has('resource'),'The script must be self-contained');
assert.deepEqual(meta.get('grant'),['GM_getValue','GM_setValue','GM_registerMenuCommand','GM_unregisterMenuCommand']);
for(const p of ['licenses/MIT.txt','licenses/Bitburner.txt'])assert.ok(text.includes(readFileSync(p,'utf8').replaceAll('*/','* /')),p);
assert.ok(readFileSync('CHANGELOG.md','utf8').includes(`## [${pkg.version}]`));
for(const p of ['README.md','README.en.md']){const body=readFileSync(p,'utf8');assert.ok(body.includes(raw),p+' install URL');assert.ok(body.includes('Commons Clause'),p+' license');assert.ok(body.includes(pkg.version),p+' version');}
assert.ok(!text.includes('localhost:')&&!text.includes('/Users/'),'No local paths in shipped script');
console.log(`Release ${pkg.version}: metadata, embedded licenses, standalone bundle and documentation versions agree`);
