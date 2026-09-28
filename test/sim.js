// Progress simulation: a bot player plays runs, buys upgrades, and we log when each area is first reached.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await pg.goto('file://'+path.resolve('dist/yt/index.html'));await pg.waitForTimeout(800);
 const res=await pg.evaluate(async(opts)=>{
  const C=__cd;C.G.festForce=false;C.G.bot=true;C.G.botSkill=opts.skill;Object.assign(C.CFG,opts.cfg.cfg||{});(opts.cfg.burn||[]).forEach((v,i)=>C.ZONES[i].burn=v);(opts.cfg.start||[]).forEach((v,i)=>C.ZONES[i].start=v);(opts.cfg.mult||[]).forEach((v,i)=>C.ZONES[i].mult=v);if(opts.cfg.bk)C.UPG.forEach(u=>u.base=Math.round(u.base*opts.cfg.bk));for(const k in (opts.cfg.g||{})){C.UPG.find(u=>u.id===k).g=opts.cfg.g[k]}
  let S=C.S;S.tut=2;S.lang='en';
  const log=[],zoneT={0:0};let simT=0,runs=0,rebT=null;const OVER=12;
  const MAXT=opts.maxT;
  while(simT<MAXT){
   S=C.S;S.startZone=S.bestZone;
   C.G.mode='menu';C.startGame();runs++;let rt=0;
   while(C.G.mode==='run'&&rt<900){C.tick(1/20);rt+=1/20;
    if(C.S.bestZone>0&&zoneT[C.S.bestZone]==null)zoneT[C.S.bestZone]=simT+rt;}
   if(C.G.mode==='revive'){C.endRun()}
   simT+=rt+OVER;
   // buy greedily: cheapest affordable, repeat
   for(;;){let best=null;for(const u of C.UPG){const l=S.upg[u.id]||0;if(l>=u.max||S.bestZone<u.req)continue;const c=C.upgCost(u,l);if(c<=S.pearls&&(!best||c<best.c))best={id:u.id,c}}if(!best)break;C.buy(best.id)}
   if(runs%25===0||runs<4)log.push({t:Math.round(simT),run:runs,len:Math.round(rt),dist:Math.round(C.R.dist),best:S.best,zone:S.bestZone,pearls:Math.round(S.pearls),up:JSON.stringify(S.upg),mis:S.mDone});
   if(opts.rebirth&&S.bestZone>=4&&rebT==null){rebT=simT;log.push({rebirth:C.rebGain(),t:simT});C.doRebirth();Object.keys(zoneT).forEach(k=>{if(k>0)zoneT['r'+k]=zoneT[k];});for(let k=1;k<6;k++)delete zoneT[k]}
   if(S.bestZone>=5&&!opts.rebirth)break;
   if(opts.rebirth&&rebT!=null&&S.bestZone>=5)break;
  }
  return {log,zoneT,runs,simT};
 },{maxT:+(process.argv[2]||14400),rebirth:process.argv[3]==='reb',skill:+(process.argv[4]||0.5),cfg:JSON.parse(process.argv[5]||'{}')});
 for(const l of res.log)console.log(JSON.stringify(l));
 console.log('ZONE FIRST REACHED (min):',Object.entries(res.zoneT).map(([k,v])=>k+':'+(v/60).toFixed(1)).join('  '),' runs',res.runs,' total',(res.simT/60).toFixed(1),'min');
 await b.close();
})();
