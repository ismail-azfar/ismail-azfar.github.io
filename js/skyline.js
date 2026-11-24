import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

/* GitHub activity as a 3D skyline: one tower per day, a row per weekday, a column per week.
   Data from both accounts, summed per day. */
const USERS=['ismailazfar','ismail-azfar'];
const sec=document.getElementById('activity'), fig=document.getElementById('sky'), canvas=fig.querySelector('canvas');
const tip=document.getElementById('sky-tip'), status=document.getElementById('sky-status');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});

async function load(){
  const res=await Promise.allSettled(USERS.map(u=>fetch(`https://github-contributions-api.jogruber.de/v4/${u}?y=last`).then(r=>{if(!r.ok)throw r.status;return r.json();})));
  const days=new Map();
  res.forEach(r=>{if(r.status!=='fulfilled'||!Array.isArray(r.value.contributions))return;
    r.value.contributions.forEach(c=>days.set(c.date,(days.get(c.date)||0)+(+c.count||0)));});
  if(!days.size)throw new Error('no data');
  return [...days.entries()].sort((a,b)=>a[0]<b[0]?-1:1).map(([date,count])=>({date,count}));
}

function stats(list){
  let total=0,best={count:-1},longest=0,run=0;
  list.forEach(d=>{total+=d.count;if(d.count>best.count)best=d;run=d.count?run+1:0;longest=Math.max(longest,run);});
  let current=0;for(let i=list.length-1;i>=0;i--){if(list[i].count)current++;else if(i<list.length-1)break;}
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('sky-total',total.toLocaleString('en-GB'));set('sky-long',longest+(longest===1?' day':' days'));
  set('sky-best',best.count.toLocaleString('en-GB'));set('sky-best-d',fmt.format(new Date(best.date+'T12:00:00')));
  set('sky-cur',current+(current===1?' day':' days'));
}

function draw(list){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,.1,400);camera.position.set(-30,34,58);
  scene.add(new THREE.HemisphereLight(0xf2ede6,0x1a171c,1.4));
  const sun=new THREE.DirectionalLight(0xfff1e0,2.2);sun.position.set(-20,40,20);scene.add(sun);
  const rim=new THREE.DirectionalLight(0x9db4c8,1.4);rim.position.set(30,10,-30);scene.add(rim);

  // lay days out by week column and weekday row
  const first=new Date(list[0].date+'T12:00:00'), offset=first.getDay();
  const cells=list.map((d,i)=>({...d,col:Math.floor((i+offset)/7),row:(i+offset)%7}));
  const cols=cells[cells.length-1].col+1, max=Math.max(1,...cells.map(c=>c.count));
  const S=1.1, geo=new THREE.BoxGeometry(.86,1,.86);geo.translate(0,.5,0);
  const mat=new THREE.MeshStandardMaterial({roughness:.45,metalness:.15});
  const mesh=new THREE.InstancedMesh(geo,mat,cells.length);
  const m=new THREE.Matrix4(),col=new THREE.Color(),lo=new THREE.Color(0x4A2A2C),hi=new THREE.Color(0xFF5533),empty=new THREE.Color(0x2C2730);
  const heights=cells.map(c=>c.count?.4+Math.pow(c.count/max,.6)*9:.12);
  const grow=reduce?1:0;
  const place=k=>{cells.forEach((c,i)=>{m.makeScale(1,Math.max(.05,heights[i]*k),1);m.setPosition((c.col-cols/2)*S,0,(c.row-3)*S);mesh.setMatrixAt(i,m);});mesh.instanceMatrix.needsUpdate=true;};
  cells.forEach((c,i)=>{col.copy(c.count?lo.clone().lerp(hi,Math.pow(c.count/max,.5)):empty);mesh.setColorAt(i,col);});
  place(grow||.001);scene.add(mesh);
  const ground=new THREE.Mesh(new THREE.BoxGeometry(cols*S+2,.2,7*S+2),new THREE.MeshStandardMaterial({color:0x141116,roughness:.9}));ground.position.y=-.1;scene.add(ground);

  const controls=new OrbitControls(camera,canvas);
  controls.enableZoom=false;controls.enablePan=false;controls.enableDamping=true;
  controls.autoRotate=!reduce;controls.autoRotateSpeed=.5;controls.minPolarAngle=.4;controls.maxPolarAngle=1.25;
  controls.target.set(0,1.5,0);

  const ray=new THREE.Raycaster(),ptr=new THREE.Vector2(-9,-9);let hot=-1;
  canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();ptr.set((e.clientX-b.left)/b.width*2-1,-((e.clientY-b.top)/b.height)*2+1);tip.style.left=(e.clientX-b.left)+'px';tip.style.top=(e.clientY-b.top)+'px';kick();});
  canvas.addEventListener('pointerleave',()=>{ptr.set(-9,-9);kick();});
  controls.addEventListener('change',kick);

  let W=0,H=0;
  const fit=()=>{const w=fig.clientWidth,h=fig.clientHeight;if(w===W&&h===H)return;W=w;H=h;renderer.setSize(W,H,false);camera.aspect=W/H;
    // pull back on narrow screens so the whole year fits
    const d=W<600?110:72;camera.position.setLength(d);camera.updateProjectionMatrix();};
  let k=grow,raf=0,visible=false;
  function frame(){raf=0;fit();
    if(k<1){k=Math.min(1,k+.02);place(1-Math.pow(1-k,3));}
    controls.update();
    ray.setFromCamera(ptr,camera);const hit=ray.intersectObject(mesh)[0];const id=hit?hit.instanceId:-1;
    if(id!==hot){hot=id;if(id>-1){const c=cells[id];tip.querySelector('strong').textContent=c.count+(c.count===1?' contribution':' contributions');
      tip.querySelector('span').textContent=fmt.format(new Date(c.date+'T12:00:00'));}tip.classList.toggle('on',id>-1);canvas.style.cursor=id>-1?'pointer':'grab';}
    renderer.render(scene,camera);
    if(!raf&&visible&&!document.hidden&&(!reduce||k<1))raf=requestAnimationFrame(frame);}
  function kick(){if(!raf)raf=requestAnimationFrame(frame);}
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)kick();}).observe(fig);
  document.addEventListener('visibilitychange',kick);addEventListener('resize',kick);
  kick();
}

let started=false;
new IntersectionObserver(async([e],io)=>{
  if(!e.isIntersecting||started)return;started=true;io.disconnect();
  try{const list=await load();stats(list);status.hidden=true;draw(list);}
  catch(err){status.textContent='GitHub activity couldn’t load right now.';fig.hidden=true;document.getElementById('sky-stats').hidden=true;}
},{rootMargin:'400px'}).observe(sec);
