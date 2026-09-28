const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),http=require('http');
const dir=process.argv[2]||'dist/yt';const lang=process.argv[3]||'en-US';
function serve(root){return new Promise(r=>{const s=http.createServer((q,res)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.woff2')?'font/woff2':'application/octet-stream'});res.end(d)})});s.listen(0,()=>r(s))})}
(async()=>{
 const srv=await serve(path.resolve(dir));const port=srv.address().port;
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const pg=await ctx.newPage();const errs=[],reqs=[];
 pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+': '+m.text())});pg.on('pageerror',e=>errs.push('pageerror: '+e.message));
 await pg.route('**/*',r=>{const u=r.request().url();reqs.push(u);if(u.startsWith('https://www.youtube.com/game_api/v1'))return r.fulfill({contentType:'text/javascript',body:fs.readFileSync('test/mock-ytgame.js','utf8')});if(u.startsWith('http://localhost:'+port))return r.continue();return r.abort()});
 await pg.addInitScript(l=>{window.__ytLang=l},lang);
 await pg.goto('http://localhost:'+port+'/index.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'shots/smoke-menu.png'});
 await pg.click('#bPlay');await pg.waitForTimeout(600);
 await pg.screenshot({path:'shots/smoke-tut1.png'});
 const box={x:195,y:500};
 for(let i=0;i<14;i++){await pg.mouse.move(box.x,box.y);await pg.mouse.down();await pg.waitForTimeout(700);await pg.mouse.up();await pg.waitForTimeout(900);if(i==2)await pg.screenshot({path:'shots/smoke-run.png'})}
 const st=await pg.evaluate(()=>({mode:__cd.G.mode,dist:__cd.R.dist,eaten:__cd.R.eaten,flame:__cd.R.flame,log:window.__ytlog}));
 console.log(JSON.stringify(st));
 await pg.screenshot({path:'shots/smoke-late.png'});
 console.log('errors',errs);console.log('external',reqs.filter(u=>!u.startsWith('http://localhost')));
 await b.close();srv.close();
})();
