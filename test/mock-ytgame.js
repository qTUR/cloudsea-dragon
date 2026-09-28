// Mock of the YouTube Playables SDK for local testing
(function(){
 const log=(...a)=>{(window.__ytlog=window.__ytlog||[]).push(a.join(' '))};
 let store=window.__ytStore||'';let audio=true;const cbs={audio:[],pause:[],resume:[]};
 window.ytgame={IN_PLAYABLES_ENV:true,SDK_VERSION:'mock',
  game:{firstFrameReady(){log('firstFrameReady');window.__ff=performance.now()},gameReady(){log('gameReady');window.__gr=performance.now()},
   loadData(){log('loadData');return Promise.resolve(localStorage.getItem('__mockyt')||'')},
   saveData(d){log('saveData',d.length);localStorage.setItem('__mockyt',d);return Promise.resolve()}},
  system:{isAudioEnabled(){return audio},onAudioEnabledChange(cb){cbs.audio.push(cb);return()=>{}},onPause(cb){cbs.pause.push(cb);return()=>{}},onResume(cb){cbs.resume.push(cb);return()=>{}},getLanguage(){return Promise.resolve(window.__ytLang||'en-US')}},
  ads:{requestInterstitialAd(){log('interstitial');return Promise.resolve()},requestRewardedAd(id){log('rewarded',id);return Promise.resolve(true)}},
  engagement:{sendScore(s){log('score',s.value);return Promise.resolve()},openYTContent(){return Promise.resolve()}},
  health:{logError(){log('logError')},logWarning(){log('logWarning')}}};
 window.__yt={setAudio(v){audio=v;cbs.audio.forEach(f=>f(v))},pause(){cbs.pause.forEach(f=>f())},resume(){cbs.resume.forEach(f=>f())}};
})();
