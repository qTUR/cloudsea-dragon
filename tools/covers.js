// Renders cover images from an in-game scene: 3 sizes x (Arabic title, English title, no text)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),http=require('http');
const root=path.resolve('dist/yt');const outDir=path.resolve('covers');fs.mkdirSync(outDir,{recursive:true});
function serve(r){return new Promise(res=>{const s=http.createServer((q,w)=>{let f=path.join(r,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){w.writeHead(404);w.end();return}w.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'font/woff2'});w.end(d)})});s.listen(0,()=>res(s))})}
(async()=>{const srv=await serve(root);const port=srv.address().port;const b=await chromium.launch();
 const sizes=[['16x9',1920,1080],['1x1',1280,1280],['9x16',1080,1920]];
 for(const [n,w,h] of sizes)for(const v of ['ar','en','notext']){
  const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  await pg.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await pg.goto('http://localhost:'+port+'/index.html');await pg.waitForTimeout(1500);
  await pg.evaluate(()=>document.fonts.ready);
  await pg.evaluate(o=>__cd.stageCover(o),{lang:v==='notext'?'en':v,text:v!=='notext',title:v!=='notext'});
  await pg.waitForTimeout(200);
  const f=path.join(outDir,`cover-${n}-${v}.png`);await pg.screenshot({path:f});await pg.close();console.log(f);
 }
 await b.close();srv.close();})();
