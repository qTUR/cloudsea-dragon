const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const pg=await ctx.newPage();
 await pg.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('test/mock-ytgame.js','utf8')}));
 await pg.goto('file://'+path.resolve('dist/yt/index.html'));await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{__cd.S.tut=2;__cd.S.bestZone=5;__cd.S.startZone=3;__cd.S.upg={magnet:3,fire:1,sense:1}});await pg.click('#bPlay');await pg.evaluate(()=>__cd.setBot(true));await pg.waitForTimeout(3000);
 const cdp=await ctx.newCDPSession(pg);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:100});await cdp.send('Profiler.start');
 await pg.evaluate(()=>{for(let i=0;i<150;i++)__cd.render()});
 const {profile}=await cdp.send('Profiler.stop');
 const self={};const byId={};profile.nodes.forEach(n=>byId[n.id]=n);
 const dt={};profile.samples.forEach((s,i)=>{dt[s]=(dt[s]||0)+(profile.timeDeltas[i]||0)});
 for(const n of profile.nodes){const k=n.callFrame.functionName+':'+n.callFrame.lineNumber;self[k]=(self[k]||0)+(dt[n.id]||0)}
 Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,18).forEach(([k,v])=>console.log((v/1000).toFixed(1)+'ms',k));
 await b.close()})();
