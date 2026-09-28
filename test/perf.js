const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2.5,isMobile:true,hasTouch:true});const pg=await ctx.newPage();
 await pg.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('test/mock-ytgame.js','utf8')}));
 await pg.goto('file://'+path.resolve('dist/yt/index.html'));await pg.waitForTimeout(1200);
 const cdp=await ctx.newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate:+(process.argv[2]||4)});
 await pg.evaluate(()=>{__cd.S.tut=2;__cd.S.bestZone=5;__cd.S.startZone=+(window.__z||3);__cd.S.upg={magnet:3,fire:1,sense:1,glide:2}});await pg.click('#bPlay');await pg.evaluate(()=>__cd.setBot(true));
 await pg.waitForTimeout(2000);
 const r=await pg.evaluate(()=>new Promise(res=>{const d=[];let l=performance.now();function f(t){d.push(t-l);l=t;if(d.length<300)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);res({avg:d.reduce((a,b)=>a+b)/d.length,p95:d[Math.floor(d.length*0.95)],dpr:devicePixelRatio})}}requestAnimationFrame(f)}));
 console.log('cpu x'+(process.argv[2]||4),JSON.stringify(r));await b.close()})();
