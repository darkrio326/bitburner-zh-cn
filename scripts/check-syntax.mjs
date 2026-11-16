import {readdirSync}from'node:fs';
import {execFileSync}from'node:child_process';
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const files=['bitburner-zh-cn.user.js','playwright.config.mjs',...['src','scripts','tests'].flatMap(walk)].filter(p=>/\.(m?js)$/.test(p));
for(const path of files)execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
console.log(`Syntax checked: ${files.length} JavaScript files`);
