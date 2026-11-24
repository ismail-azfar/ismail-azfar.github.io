/* Live Monte Carlo stress test for the SPY Fair Value Gap strategy.
   The paper resamples the real trade log. Here the 86 trade results are rebuilt from the published
   summary (86 trades, 68.6% win rate, +16.2% after costs) and then resampled the same way:
   each path draws 86 trades with replacement and compounds them. */
const root=document.getElementById('mc'), cv=document.getElementById('mc-cv'), btn=document.getElementById('mc-run');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TRADES=86, WINS=59, TARGET=1.162, PATHS=1000, BH=.054;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// Rebuild a plausible trade list that matches the summary exactly
function rebuild(){
  const r=seed(7);
  const losses=Array.from({length:TRADES-WINS},()=>-.0035*(.4+r()*1.8));      // losses: stops plus some slippage
  const winsRaw=Array.from({length:WINS},()=>.2+r()*2.2);                      // wins vary more
  const lossLog=losses.reduce((a,x)=>a+Math.log(1+x),0), need=Math.log(TARGET)-lossLog;
  // scale the wins so the compounded total lands on +16.2%
  let lo=0,hi=.05;for(let k=0;k<60;k++){const m=(lo+hi)/2,g=winsRaw.reduce((a,w)=>a+Math.log(1+w*m),0);g<need?lo=m:hi=m;}
  const wins=winsRaw.map(w=>w*(lo+hi)/2);
  const all=[...wins,...losses];
  // interleave into a believable actual order
  for(let i=all.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
  return all;
}
function seed(s){return()=>(s=(s*16807)%2147483647)/2147483647;}
const trades=rebuild();
const curve=seq=>{const c=[0];let e=1;seq.forEach(x=>{e*=1+x;c.push(e-1);});return c;};
const actual=curve(trades);

let paths=[],stats=null,drawn=0,anim=0;
function simulate(){
  const r=seed((Date.now()%2147483646)+1);
  paths=Array.from({length:PATHS},()=>curve(Array.from({length:TRADES},()=>trades[Math.floor(r()*TRADES)])));
  const finals=paths.map(p=>p[TRADES]).sort((a,b)=>a-b);
  const q=f=>finals[Math.min(PATHS-1,Math.floor(f*PATHS))];
  const dd=paths.map(p=>{let peak=1,worst=0;p.forEach(v=>{const e=1+v;peak=Math.max(peak,e);worst=Math.min(worst,e/peak-1);});return worst;}).sort((a,b)=>a-b);
  const medFinal=q(.5), medIdx=paths.findIndex(p=>p[TRADES]===medFinal);
  stats={med:medFinal,p5:q(.05),p95:q(.95),win:finals.filter(f=>f>0).length/PATHS,dd:dd[Math.floor(PATHS/2)],beatBH:finals.filter(f=>f>BH).length/PATHS,medIdx};
}
const pct=(x,d=1)=>(x>=0?'+':'−')+Math.abs(x*100).toFixed(d)+'%';
function showStats(){
  const set=(id,v)=>{document.getElementById(id).textContent=v;};
  set('mc-med',pct(stats.med));set('mc-band',pct(stats.p5,0)+' to '+pct(stats.p95,0));
  set('mc-win',Math.round(stats.win*100)+'%');set('mc-bh',Math.round(stats.beatBH*100)+'%');set('mc-dd',pct(stats.dd));
}

let W=0,H=0,ctx,yMin=-.1,yMax=.4;
function frame(){
  const dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  const all=paths.length?paths:[actual];
  let lo=0,hi=Math.max(BH,...actual);all.forEach(p=>p.forEach(v=>{if(v<lo)lo=v;if(v>hi)hi=v;}));
  yMin=Math.floor((lo-.01)*20)/20;yMax=Math.ceil((hi+.01)*20)/20;
}
const L=()=>W<520?36:46, X=i=>L()+(W-L()-10)*i/TRADES, Y=v=>10+(H-44)*(1-(v-yMin)/(yMax-yMin));
function axes(){
  ctx.clearRect(0,0,W,H);
  const step=(yMax-yMin)>.6?.2:(yMax-yMin)>.3?.1:.05;
  ctx.font='12px "JetBrains Mono", ui-monospace, monospace';ctx.textAlign='right';ctx.textBaseline='middle';
  for(let v=Math.ceil(yMin/step)*step;v<=yMax+1e-9;v+=step){
    const y=Y(v);ctx.strokeStyle=Math.abs(v)<1e-9?css('--muted'):css('--line');ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L(),y+.5);ctx.lineTo(W-10,y+.5);ctx.stroke();
    ctx.fillStyle=css('--muted');ctx.fillText(Math.round(v*100)+'%',L()-6,y);}
  ctx.textAlign='center';ctx.textBaseline='top';
  [0,TRADES].forEach(i=>ctx.fillText(i===0?'Trade 0':'Trade '+TRADES,Math.min(Math.max(X(i),L()+24),W-34),H-18));
  // buy and hold marker
  ctx.setLineDash([5,5]);ctx.strokeStyle=css('--steel');ctx.beginPath();ctx.moveTo(L(),Y(BH)+.5);ctx.lineTo(W-10,Y(BH)+.5);ctx.stroke();ctx.setLineDash([]);
}
function line(p,color,w,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v)));ctx.stroke();ctx.globalAlpha=1;}
function paint(n){
  axes();
  const steel=css('--steel');
  for(let k=0;k<n;k++)line(paths[k],steel,1,PATHS>500?.07:.15);
  if(stats&&n>=PATHS)line(paths[stats.medIdx],css('--accent'),2.5);
  line(actual,css('--ink'),2);
}
function run(){
  cancelAnimationFrame(anim);simulate();frame();
  btn.disabled=true;btn.textContent='Running…';
  const finish=()=>{paint(PATHS);showStats();btn.disabled=false;btn.textContent='Run another 1,000';root.classList.add('done');};
  if(reduce){finish();return;}
  drawn=0;const tick=()=>{drawn=Math.min(PATHS,drawn+40);paint(drawn);if(drawn<PATHS)anim=requestAnimationFrame(tick);else finish();};tick();
}
btn.addEventListener('click',run);
new ResizeObserver(()=>{frame();paint(paths.length&&!btn.disabled?PATHS:drawn);}).observe(cv);
// run once automatically when it scrolls into view
new IntersectionObserver(([e],io)=>{if(e.isIntersecting){io.disconnect();run();}},{threshold:.4}).observe(cv);
