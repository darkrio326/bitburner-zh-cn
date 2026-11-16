import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createMatcher,normalize}from'../src/matcher.js';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),c=JSON.parse(readFileSync('tests/fixtures/management-v3.0.1.json')),match=createMatcher(d.entries,d.slotValues);
test('all pinned management UI fragments and 146 description fields match only within their module',()=>{
 const retained=new Set(['=> x','(x','>','AdVert.Inc','-','/s)','Market-TA.I','Market-TA.II']);
 for(const x of c.ui)if(!retained.has(x.text))assert.ok(match(x.text,x.scope),x.text);
 assert.equal(c.descriptions.length,146);
 for(const x of c.descriptions)for(const text of x.text.split(/<br\s*\/?\s*>/i).map(normalize).filter(Boolean))assert.ok(match(text,x.scope),x.name);
 for(const[s,scope]of [['Recruit Gang Member','gang'],['Contracts remaining:','bladeburner'],['Issue New Shares','corporation']]){assert.ok(match(s,scope));assert.equal(match(s,'unknown'),null);}
});
test('management dynamic templates retain exact numbers, known names and formula spelling',()=>{
 for(const[en,scope,value]of [['Buy (1.234e12)','corporation','1.234e12'],['Limit Material Production (999.999m)','corporation','999.999m'],['Limit Production (2,345.678)','corporation','2,345.678'],['Demand: 0.001','corporation','0.001'],['[Effective Gain: 1.250m / sec]','gang','1.250m'],['On cooldown for 123 hour(s)','corporation','123'],['You will gain 2.500k reputation with CyberSec with this bribe.','corporation','CyberSec']])assert.ok(match(en,scope)?.zh.includes(value),en);
 for(const s of ['Buy (MP+10)','Buy (NaN)','Buy (1.234e12) extra','On cooldown for whatever hour(s)','You will gain 2.500k reputation with MyFaction with this bribe.','MAX','MP*5','PROD-1','ns.corporation.sellProduct()'])assert.equal(match(s,'corporation'),null,s);
 for(const s of ['Operation Titan',"Blade's Intuition",'Investigation','start op "Investigation"'])assert.equal(match(s,'bladeburner'),null,s);
 const titan=c.descriptions.find(x=>x.name==='Operation Titan');assert.ok(match(titan.text,'bladeburner').zh.includes('Titan Laboratories'));assert.ok(!match(titan.text,'bladeburner').zh.includes('NetLink Technologies'));
});
test('reviewed corporation fragments preserve quantity/price order, negation and formula tokens',()=>{
 const sentence=['You bought',' 1.000m ','shares for',' $2.500b.'].map(t=>match(t,'corporation')?.zh??t).join('');assert.equal(sentence,'你回购了 1.000m 股，总金额为 $2.500b.');
 assert.equal(match('Enter the amount of','corporation').zh,'请输入以下材料的购买数量：');
 for(const en of ["If the sell amount is set to 0, then the material will not be sold. If the sell price is set to 0, then the material will be discarded.","This limit applies only to output; it does not affect input consumption."])assert.ok(match(en,'corporation').zh.includes('不'));
 for(const e of d.entries.filter(e=>e.scopes.includes('corporation')&&/\b(PROD-1|PROD-5|MP\*5|MP\+10|EINV-20)\b/.test(e.en)))for(const token of e.en.match(/PROD-1|PROD-5|MP\*5|MP\+10|EINV-20/g))assert.ok(e.zh.includes(token),e.id);
});
