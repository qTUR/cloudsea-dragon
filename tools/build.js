// Builds: dist/artifact/index.html, dist/yt/ (+ zip), dist/pages/
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/game.html'),'utf8');
const dist=path.join(root,'dist');fs.rmSync(dist,{recursive:true,force:true});
const FONTS=[['arabic',600],['arabic',800],['latin',600],['latin',800]];
const RANGES={arabic:'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EEFF',latin:'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'};
const localFontCss='<style>'+FONTS.map(([s,w])=>`@font-face{font-family:'Baloo Bhaijaan 2';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/baloo-bhaijaan-2-${s}-${w}-normal.woff2) format('woff2');unicode-range:${RANGES[s]}}`).join('')+'</style>';
const gfonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@600;800&display=swap" rel="stylesheet">';
const SDK='<script src="https://www.youtube.com/game_api/v1"></script>';
const META=`<meta name="description" content="Dive deep into a sea of clouds, leap high and feed your dragon's flame. تنين بحر الغيم: غُص عميقًا، واقفز عاليًا، وأشعل اللهب.">
<meta property="og:type" content="website"><meta property="og:title" content="Cloudsea Dragon | تنين بحر الغيم">
<meta property="og:description" content="Dive deep into a sea of clouds, leap high and feed your dragon's flame.">
<meta property="og:image" content="https://qtur.github.io/cloudsea-dragon/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="675"><meta property="og:url" content="https://qtur.github.io/cloudsea-dragon/"><link rel="icon" href="data:,"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2a1640">`;
function minifyHtml(h){ // light, safe whitespace trimming
  return h.split('\n').map(l=>l.replace(/^\s+/,'')).filter(l=>l.length).join('\n');
}
function out(dir,html){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html)}
// artifact
{ // artifact: page content only (host adds doctype/head/body skeleton)
 let a=src.replace('<!--SDK-->','').replace('<!--META-->','').replace('<!--FONTS-->',gfonts);
 const head=a.slice(a.indexOf('<head>')+6,a.indexOf('</head>')).replace(/<meta charset[^>]*>/,'').replace(/<meta name="viewport"[^>]*>/,'');
 const body=a.slice(a.indexOf('<body>')+6,a.lastIndexOf('</body>'));
 out(path.join(dist,'artifact'),minifyHtml(head+'\n'+body));
}
// youtube
const yt=minifyHtml(src.replace('<!--SDK-->',SDK).replace('<!--META-->','').replace('<!--FONTS-->',localFontCss));
out(path.join(dist,'yt'),yt);
fs.mkdirSync(path.join(dist,'yt/fonts'),{recursive:true});
for(const [s,w] of FONTS){const f=`baloo-bhaijaan-2-${s}-${w}-normal.woff2`;fs.copyFileSync(path.join(root,'assets/fonts',f),path.join(dist,'yt/fonts',f))}
execSync('cd '+JSON.stringify(path.join(dist,'yt'))+' && rm -f ../cloudsea-dragon-youtube.zip && zip -X -9 -r -q ../cloudsea-dragon-youtube.zip index.html fonts');
// pages (same as youtube build + meta)
const pages=minifyHtml(src.replace('<!--SDK-->',SDK).replace('<!--META-->',META).replace('<!--FONTS-->',localFontCss));
out(path.join(dist,'pages'),pages);
fs.cpSync(path.join(dist,'yt/fonts'),path.join(dist,'pages/fonts'),{recursive:true});
if(fs.existsSync(path.join(root,'assets/og.png')))fs.copyFileSync(path.join(root,'assets/og.png'),path.join(dist,'pages/og.png'));
fs.writeFileSync(path.join(dist,'pages/.nojekyll'),'');
const sz=f=>fs.statSync(f).size;
console.log('artifact',sz(path.join(dist,'artifact/index.html')),'yt html',yt.length,'zip',sz(path.join(dist,'cloudsea-dragon-youtube.zip')));
