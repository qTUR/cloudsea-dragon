// screenshots across viewports & languages
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),http=require('http');
const dir=process.argv[2]||'dist/yt';
function serve(root){return new Promise(r=>{const s=http.createServer((q,res)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'font/woff2'});res.end(d)})});s.listen(0,()=>r(s))})}
const VPS={portrait:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},landscape:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2},desktop:{width:1440,height:900,deviceScaleFactor:1}};
(async()=>{
 const srv=await serve(path.resolve(dir));const port=srv.address().port;const b=await chromium.launch();const errs=[];
 for(const lang of (process.argv[3]||'en,ar').split(','))for(const [name,vp] of Object.entries(VPS)){
  const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:vp.deviceScaleFactor,isMobile:!!vp.isMobile,hasTouch:!!vp.hasTouch});
  const pg=await ctx.newPage();pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/*',r=>{const u=r.request().url();if(u.startsWith('https://www.youtube.com/game_api/v1'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync('test/mock-ytgame.js','utf8')});if(u.startsWith('http://localhost:'+port))return r.continue();return r.abort()});
  await pg.addInitScript(([l,sz])=>{window.__ytLang=l;window.__sz=sz;localStorage.setItem('__mockyt',JSON.stringify({tut:2,best:4200,bestZone:3,startZone:window.__sz,pearls:1830,stats:{runs:25,eaten:900},upg:{flame:8,refill:6,luck:5,magnet:2,loop:1,sense:1,shield:1}}))},[lang,{portrait:2,landscape:3,desktop:1}[name]]);
  await pg.goto('http://localhost:'+port+'/index.html');await pg.waitForTimeout(1600);
  await pg.screenshot({path:`shots/${lang}-${name}-menu.png`});
  await pg.click('#bUp');await pg.waitForTimeout(500);await pg.screenshot({path:`shots/${lang}-${name}-upgrades.png`});await pg.click('#shClose');
  await pg.click('#bPlay');
  await pg.evaluate(()=>__cd.setBot(true));await pg.waitForTimeout(7000);
  await pg.screenshot({path:`shots/${lang}-${name}-run.png`});
  await ctx.close();
 }
 console.log('errors',errs);await b.close();srv.close();
})();
