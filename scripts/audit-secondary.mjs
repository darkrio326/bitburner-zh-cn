// Recheck shipped snapshots and coverage against the pinned, read-only upstream cache.
import{enums,readSource,cityMapCorpus,TARGET}from'./source-corpus.mjs';
import{readFileSync,writeFileSync}from'node:fs';
import{createMatcher}from'../src/matcher.js';
const d=JSON.parse(readFileSync('translations/zh-CN.json')),match=createMatcher(d.entries,d.slotValues);
const ev=enums(),achievements=Object.values(JSON.parse(readSource('src/Achievements/AchievementData.json')).achievements);
const fixture=JSON.parse(readFileSync('tests/fixtures/achievements-v3.0.1.json'));
if(JSON.stringify(achievements)!==JSON.stringify(fixture.entries))throw Error('Achievement fixture differs from target; review before updating.');
const maps=cityMapCorpus(),mapFixture=JSON.parse(readFileSync('tests/fixtures/city-maps-v3.0.1.json'));
if(JSON.stringify(maps)!==JSON.stringify(mapFixture.maps))throw Error('ASCII map fixture differs from target; review before updating.');
const labels=maps.flatMap(m=>[...m.text.matchAll(/\[[^\]\n]+\]/g)].map(x=>x[0]));
const locationNames=Object.values(ev.LocationName),cityNames=Object.values(ev.CityName);
const report={target:TARGET,version:JSON.parse(readFileSync('package.json')).version,entries:d.entries.length,templates:d.entries.filter(e=>e.match==='template').length,achievements:{total:achievements.length,descriptionsMatched:achievements.filter(e=>match(e.Description,'achievements')).length,preservedNames:fixture.preservedNames},locations:{total:locationNames.length,matched:locationNames.filter(n=>match(n,'locations')).length},cities:{total:cityNames.length,matched:cityNames.filter(n=>match(n,'locations')).length},limits:['Source text coverage is not all-branch gameplay acceptance.','City ASCII symbols and protected achievement names stay original.','Secret achievement IDs remain hidden/corrupted according to the game.']};
report.mapLabels={cities:maps.length,unique:new Set(labels).size,total:labels.length,matched:labels.filter(en=>d.mapLabels.some(e=>e.en===en&&e.review.status==='approved')).length};
writeFileSync('docs/city-achievements-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.achievements.total!==report.achievements.descriptionsMatched||report.locations.total!==report.locations.matched||report.cities.total!==report.cities.matched||report.mapLabels.total!==report.mapLabels.matched)process.exitCode=1;
