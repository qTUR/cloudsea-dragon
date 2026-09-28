const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:+(process.argv[2]||2),isMobile:true,hasTouch:true});const pg=await ctx.newPage();
 await pg.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('test/mock-ytgame.js','utf8')}));
 await pg.goto('file://'+path.resolve('dist/yt/index.html'));await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{__cd.S.tut=2;__cd.S.bestZone=5;__cd.S.startZone=3;__cd.S.upg={magnet:3,fire:1,sense:1}});await pg.click('#bPlay');await pg.evaluate(()=>__cd.setBot(true));await pg.waitForTimeout(3000);
 const r=await pg.evaluate(()=>{const t0=performance.now();for(let i=0;i<60;i++)__cd.render();const full=(performance.now()-t0)/60;return {full}});
 console.log(JSON.stringify(r));await b.close()})();
