// End-to-end test of a build with a mock YouTube Playables SDK (or none, for the artifact build).
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),http=require('http');
const dir=process.argv[2]||'dist/yt';const withSdk=!dir.includes('artifact');
function serve(root){return new Promise(r=>{const s=http.createServer((q,res)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'font/woff2'});res.end(d)})});s.listen(0,()=>r(s))})}
const ok=[],bad=[];const check=(c,m)=>{(c?ok:bad).push(m);console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{
 const srv=await serve(path.resolve(dir));const port=srv.address().port;const base='http://localhost:'+port+'/index.html';
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:withSdk?'en-US':'ar-SA'});
 const pg=await ctx.newPage();const errs=[],ext=[];
 pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});pg.on('pageerror',e=>errs.push('pageerror '+e.message));
 let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 if(!withSdk){html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>'}
 await pg.route('**/*',r=>{const u=r.request().url();
  if(u.startsWith('https://www.youtube.com/game_api/v1'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync('test/mock-ytgame.js','utf8')});
  if(u===base)return r.fulfill({contentType:'text/html',body:html});
  if(u.startsWith('http://localhost:'+port))return r.continue();
  ext.push(u);if(!withSdk&&u.includes('fonts.g'))return r.fulfill({contentType:'text/css',body:''});return r.abort()});
 await pg.addInitScript(()=>{window.__ytLang='ar-SA'});
 await pg.goto(base);await pg.waitForTimeout(1500);
 const L=()=>pg.evaluate(()=>window.__ytlog||[]);
 if(withSdk){const lg=await L();check(lg.indexOf('firstFrameReady')>=0&&lg.indexOf('gameReady')>lg.indexOf('firstFrameReady'),'firstFrameReady then gameReady');}
 check(await pg.evaluate(()=>document.documentElement.dir==='rtl'&&__cd.S.lang===null),'default language follows account (ar → RTL)');
 await pg.screenshot({path:'shots/e2e-'+(withSdk?'yt':'art')+'-menu-ar.png'});
 // tutorial run: hold / release by touch
 await pg.click('#bPlay');await pg.waitForTimeout(400);
 check(await pg.evaluate(()=>!document.getElementById('tut').classList.contains('hide')&&__cd.R.tstep===0),'tutorial step 1 (hold) shown with arrow');
 await pg.screenshot({path:'shots/e2e-tut-hold.png'});
 await pg.mouse.move(200,500);await pg.mouse.down();
 for(let i=0;i<40&&await pg.evaluate(()=>__cd.R.tstep)===0;i++)await pg.waitForTimeout(100);
 check(await pg.evaluate(()=>__cd.R.tstep===1),'tutorial step 2 (release) after diving');
 await pg.screenshot({path:'shots/e2e-tut-release.png'});
 await pg.waitForTimeout(300);await pg.mouse.up();
 for(let i=0;i<30&&await pg.evaluate(()=>__cd.R.tstep)===1;i++)await pg.waitForTimeout(100);
 check(await pg.evaluate(()=>__cd.R.tstep===2),'tutorial step 3 (eat lanterns) after leaping');
 await pg.screenshot({path:'shots/e2e-tut-eat.png'});
 await pg.evaluate(()=>__cd.setBot(true));
 for(let i=0;i<60&&await pg.evaluate(()=>__cd.R.tstep)>=0;i++)await pg.waitForTimeout(250);
 check(await pg.evaluate(()=>__cd.R.tstep===-1),'tutorial steps finished');
 // sys pause
 if(withSdk){
  await pg.evaluate(()=>__yt.pause());const x1=await pg.evaluate(()=>__cd.R.x);await pg.waitForTimeout(800);const x2=await pg.evaluate(()=>__cd.R.x);
  const st=await pg.evaluate(()=>({p:__cd.G.sysPaused,ov:!document.getElementById('pauseScr').classList.contains('hide')}));
  check(x1===x2&&st.p&&st.ov,'onPause freezes game and shows pause screen');
  await pg.evaluate(()=>__yt.resume());await pg.waitForTimeout(200);
  check(await pg.evaluate(()=>!__cd.G.sysPaused),'onResume lifts system pause');
  await pg.click('#bRes');await pg.waitForTimeout(300);
  check(await pg.evaluate(()=>!__cd.G.userPaused),'resume button continues run');
 }
 // audio
 await pg.evaluate(()=>{});
 const aud=await pg.evaluate(async()=>{const r={};r.state=window.__cdAudioState?1:0;return r});void aud;
 // wait for run end (bot plays; no revive yet)
 await pg.evaluate(()=>{__cd.R.flame=0.05});
 for(let i=0;i<40&&await pg.evaluate(()=>__cd.G.mode)==='run';i++)await pg.waitForTimeout(150);
 check(await pg.evaluate(()=>__cd.G.mode==='revive'&&!document.getElementById('revive').classList.contains('hide')),'revive offer after flame runs out');
 await pg.screenshot({path:'shots/e2e-revive.png'});
 await pg.click('#bRv');await pg.waitForTimeout(withSdk?500:3800);
 check(await pg.evaluate(()=>__cd.G.mode==='run'&&__cd.R.revived),'rewarded ad revive works');
 if(withSdk)check((await L()).includes('rewarded revive'),'requestRewardedAd("revive") called');
 await pg.evaluate(()=>{__cd.R.flame=0.05});
 for(let i=0;i<40&&await pg.evaluate(()=>__cd.G.mode)!=='results';i++)await pg.waitForTimeout(150);
 check(await pg.evaluate(()=>__cd.G.mode==='results'),'results screen');
 await pg.screenshot({path:'shots/e2e-results.png'});
 const p0=await pg.evaluate(()=>__cd.S.pearls);
 await pg.click('#bDouble');await pg.waitForTimeout(withSdk?400:3800);
 const p1=await pg.evaluate(()=>__cd.S.pearls);
 check(p1>p0,'double pearls rewarded ad adds pearls ('+Math.round(p0)+'→'+Math.round(p1)+')');
 await pg.click('#bCont');await pg.waitForTimeout(700);
 check(await pg.evaluate(()=>__cd.G.mode==='menu'),'back to menu');
 if(withSdk)check(!(await L()).includes('interstitial'),'no interstitial right after tutorial');
 check(await pg.evaluate(()=>__cd.S.tut===1&&!document.getElementById('tut').classList.contains('hide')),'upgrade tip arrow shown');
 await pg.click('#bUp');await pg.waitForTimeout(400);
 await pg.screenshot({path:'shots/e2e-upgrade-tip.png'});
 const buyBtn=await pg.$('[data-buy]:not([disabled])');if(buyBtn){await buyBtn.click();await pg.waitForTimeout(300)}
 check(await pg.evaluate(()=>__cd.S.tut===2&&Object.keys(__cd.S.upg).length>0),'bought first upgrade, tutorial complete');
 await pg.click('#shClose');
 // language switch
 await pg.click('#bLang');await pg.waitForTimeout(200);
 check(await pg.evaluate(()=>document.documentElement.dir==='ltr'&&document.getElementById('bPlay').textContent.includes('Play')),'language button switches to English/LTR');
 await pg.click('#langPick button[data-l="ar"]');await pg.waitForTimeout(200);
 check(await pg.evaluate(()=>document.documentElement.dir==='rtl'&&document.getElementById('bPlay').textContent.includes('العب')),'start-screen picker switches to Arabic/RTL');
 // mute + YT audio setting
 await pg.click('#bSnd');const m1=await pg.evaluate(()=>__cd.S.muted);await pg.click('#bSnd');
 check(m1===true&&await pg.evaluate(()=>__cd.S.muted===false),'mute button toggles');
 if(withSdk){await pg.evaluate(()=>__yt.setAudio(false));await pg.waitForTimeout(300);const g=await pg.evaluate(()=>__cd.audioGain());check(g<0.05,'YouTube audio off silences game (gain '+g.toFixed(3)+')');await pg.evaluate(()=>__yt.setAudio(true));await pg.waitForTimeout(300);check(await pg.evaluate(()=>__cd.audioGain())>0.5,'audio returns when enabled')}
 // play through all areas with the bot, using real UI between runs
 const t0=Date.now();let runs=0;
 while(await pg.evaluate(()=>__cd.S.bestZone)<5&&runs<400){
  runs++;
  await pg.evaluate(()=>{__cd.S.startZone=__cd.S.bestZone});
  await pg.click('#bPlay');
  await pg.evaluate(()=>{__cd.setBot(true);__cd.G.festForce=false;let n=0;while(__cd.G.mode==='run'&&n<27000){__cd.tick(1/30);n++}});
  if(await pg.evaluate(()=>__cd.G.mode==='revive'))await pg.click('#bRvNo');
  await pg.waitForTimeout(50);
  if(await pg.evaluate(()=>__cd.G.mode==='results'))await pg.click('#bCont');
  await pg.waitForTimeout(80);
  if(await pg.evaluate(()=>__cd.G.mode!=='menu')){await pg.waitForTimeout(4000)}
  await pg.evaluate(()=>{for(;;){let best=null;for(const u of __cd.UPG){const l=__cd.S.upg[u.id]||0;if(l>=u.max||__cd.S.bestZone<u.req)continue;const c=__cd.upgCost(u,l);if(c<=__cd.S.pearls&&(!best||c<best.c))best={id:u.id,c}}if(!best)break;__cd.buy(best.id)}});
 }
 const fz=await pg.evaluate(()=>({z:__cd.S.bestZone,best:__cd.S.best,m:__cd.S.mDone,upg:__cd.S.upg}));
 check(fz.z===5,'bot reached the last area (Starfall Deep) in '+runs+' runs, best '+fz.best+' m, missions '+fz.m);
 if(withSdk){const n=(await L()).filter(x=>x==='interstitial').length;check(n<=1+Math.floor((Date.now()-t0)/150000),'interstitials rate-limited ('+n+' in '+Math.round((Date.now()-t0)/1000)+'s)')}
 // screenshot deep zone
 await pg.click('#bPlay');await pg.evaluate(()=>{__cd.setBot(true);for(let i=0;i<150;i++)__cd.tick(1/30)});await pg.waitForTimeout(1500);
 await pg.screenshot({path:'shots/e2e-lastzone.png'});
 // missions / journey / rebirth sheets
 await pg.evaluate(()=>{__cd.R.flame=0.01;__cd.R.revived=true});for(let i=0;i<30&&await pg.evaluate(()=>__cd.G.mode)!=='results';i++)await pg.waitForTimeout(150);
 await pg.click('#bCont');await pg.waitForTimeout(withSdk?600:4200);
 for(const [b,n] of [['#bMis','missions'],['#bJour','journey'],['#bReb','rebirth'],['#bGift','gift']]){await pg.click(b);await pg.waitForTimeout(350);await pg.screenshot({path:'shots/e2e-sheet-'+n+'.png'});await pg.click('#shClose');await pg.waitForTimeout(150)}
 // rebirth via UI (two taps)
 const sc0=await pg.evaluate(()=>__cd.S.scales);await pg.click('#bReb');await pg.waitForTimeout(300);
 if(await pg.$('#bRebGo')){await pg.click('#bRebGo');await pg.click('#bRebGo');await pg.waitForTimeout(withSdk?500:4000)}
 const reb=await pg.evaluate(()=>({s:__cd.S.scales,r:__cd.S.rebirths,z:__cd.S.bestZone}));
 check(reb.s>sc0&&reb.r===1&&reb.z===0,'rebirth grants scales and resets ('+reb.s+' scales)');
 // save / load
 await pg.waitForTimeout(3500);
 const before=await pg.evaluate(()=>JSON.stringify({p:Math.floor(__cd.S.pearls),s:__cd.S.scales,r:__cd.S.rebirths,m:__cd.S.mDone}));
 await pg.reload();await pg.waitForTimeout(1500);
 const after=await pg.evaluate(()=>JSON.stringify({p:Math.floor(__cd.S.pearls),s:__cd.S.scales,r:__cd.S.rebirths,m:__cd.S.mDone}));
 check(before===after,'save + load round trip '+after);
 if(withSdk)check((await L()).includes('loadData'),'loadData used on boot');
 await pg.screenshot({path:'shots/e2e-after-reload.png'});
 check(errs.length===0,'no console errors/warnings '+JSON.stringify(errs.slice(0,5)));
 const extBad=ext.filter(u=>!u.startsWith('https://www.youtube.com/game_api/v1')&&!(u.includes('fonts.g')&&!withSdk));
 check(extBad.length===0,'no network requests besides the SDK'+(withSdk?'':' (and Google Fonts for preview)')+' '+JSON.stringify(extBad.slice(0,3)));
 console.log('\n'+ok.length+' passed, '+bad.length+' failed');
 await b.close();srv.close();process.exit(bad.length?1:0);
})();
