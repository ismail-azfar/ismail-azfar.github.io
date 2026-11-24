import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

/* One full-page scene. In the hero the objects float as a cluster inside #stage;
   as you scroll they fly down and dock in the .slot3d beside each project. */
const canvas=document.getElementById('scene'), stage=document.getElementById('stage'), hero=document.querySelector('.hero');
const tip=document.getElementById('tip'), hint=document.getElementById('hint');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!matchMedia('(hover:hover)').matches)hint.textContent='Swipe to spin · tap an object to open its project';

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}
catch(e){document.documentElement.classList.add('no3d');stage.classList.add('fallback');hint.hidden=true;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.environmentIntensity=.35;
const D=15, FOV=32;
const camera=new THREE.PerspectiveCamera(FOV,1,.1,100);camera.position.set(0,0,D);camera.lookAt(0,0,0);

const key=new THREE.DirectionalLight(0xfff1e0,2.6);key.position.set(-6,7,8);scene.add(key);
const fill=new THREE.PointLight(0xff5533,40,30,2);fill.position.set(3,-5,4);scene.add(fill);
const rim=new THREE.DirectionalLight(0x9db4c8,2.2);rim.position.set(6,3,-8);scene.add(rim);
scene.add(new THREE.AmbientLight(0x2a1f2a,1));

const M=(color,o={})=>new THREE.MeshPhysicalMaterial({color,roughness:.38,metalness:.1,clearcoat:.6,clearcoatRoughness:.3,...o});
const C={bone:0xEDE6DA,graphite:0x2B2730,coral:0xFF5533,steel:0x9DB4C8,brass:0xC89B5A,ink:0x17141A};
const mats={bone:M(C.bone),graphite:M(C.graphite,{roughness:.5}),coral:M(C.coral,{roughness:.3}),steel:M(C.steel,{metalness:.6,roughness:.28}),brass:M(C.brass,{metalness:.85,roughness:.32}),ink:M(C.ink,{roughness:.6})};
const box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
const cyl=(rt,rb,h,m,s=40)=>new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s),m);
const sph=(r,m)=>new THREE.Mesh(new THREE.SphereGeometry(r,32,20),m);
const at=(o,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{o.position.set(x,y,z);o.rotation.set(rx,ry,rz);return o;};

const build={
  enigma(){const g=new THREE.Group();
    [-.32,0,.32].forEach((x,i)=>{g.add(at(cyl(.56,.56,.24,i===1?mats.brass:mats.graphite),x,0,0,0,0,Math.PI/2));
      for(let k=0;k<26;k++){const a=k/26*Math.PI*2;g.add(at(box(.2,.05,.05,mats.brass),x,Math.cos(a)*.6,Math.sin(a)*.6,a,0,0));}});
    g.add(at(cyl(.07,.07,1.3,mats.steel),0,0,0,0,0,Math.PI/2));return g;},
  haggle(){const g=new THREE.Group();
    g.add(at(cyl(.5,.5,.1,mats.coral),-.2,.05,0,Math.PI/2.4,0,.2));
    g.add(at(cyl(.5,.5,.1,mats.bone),.22,-.08,.12,Math.PI/2.2,0,-.3));
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(.5,.035,12,48),mats.brass),.22,-.08,.12,Math.PI/2.2-Math.PI/2,0,-.3));return g;},
  early(){const g=new THREE.Group();g.add(at(box(1.2,.08,.6,mats.graphite),0,-.5,0));
    [.25,.45,.7,1].forEach((h,i)=>g.add(at(box(.22,h,.22,i===3?mats.coral:mats.bone),-.42+i*.28,-.46+h/2,0)));return g;},
  rescue(){const g=new THREE.Group();g.add(at(box(.95,.3,.55,mats.steel),0,0,0));g.add(at(box(.4,.18,.4,mats.graphite),-.1,.24,0));
    [[-.32,.3],[.32,.3],[-.32,-.3],[.32,-.3]].forEach(([x,z])=>g.add(at(cyl(.15,.15,.1,mats.ink,24),x,-.15,z,Math.PI/2)));
    g.add(at(sph(.11,mats.coral),.36,.22,0));return g;},
  tilt(){const g=new THREE.Group();[-1,0,1].forEach(i=>g.add(at(box(.6,.88,.025,i===0?mats.coral:mats.bone),i*.26,0,i===0?.04:0,0,0,-i*.32)));return g;},
  spy(){const g=new THREE.Group();let y=0;
    for(let i=0;i<5;i++){const up=[1,1,0,1,1][i],h=.25+((i*37)%5)*.08;y+=up?.12:-.1;const m=up?mats.coral:mats.bone;
      g.add(at(box(.16,h,.16,m),-.5+i*.25,y-.15,0));g.add(at(cyl(.02,.02,h+.3,m,8),-.5+i*.25,y-.15,0));}return g;},
  journal(){const g=new THREE.Group();g.add(at(box(.78,1,.16,mats.bone),.02,0,0));
    g.add(at(box(.84,1.06,.04,mats.graphite),0,0,.1));g.add(at(box(.84,1.06,.04,mats.graphite),0,0,-.1));
    g.add(at(box(.05,1.06,.24,mats.graphite),-.42,0,0));g.add(at(box(.3,.06,.01,mats.coral),.1,.25,.125));return g;},
  cook(){const g=new THREE.Group(),pts=[];
    for(let i=0;i<=16;i++){const a=i/16*Math.PI/2;pts.push(new THREE.Vector2(Math.sin(a)*.6+.001,-Math.cos(a)*.45+.15));}
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts,48),M(C.bone,{side:THREE.DoubleSide})));
    g.add(at(sph(.17,mats.coral),-.15,.03,.05));g.add(at(sph(.14,mats.steel),.18,0,-.08));g.add(at(sph(.12,mats.brass),.02,.05,.22));return g;},
  futureflow(){const g=new THREE.Group();for(let i=0;i<4;i++)g.add(at(box(.3,.18+i*.18,.5,mats.bone),-.45+i*.3,-.4+(.18+i*.18)/2,0));
    g.add(at(sph(.13,mats.coral),.45,.45,0));return g;},
  lumara(){const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.5,0),M(C.steel,{metalness:.7,roughness:.2,flatShading:true})));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.68,1),new THREE.MeshBasicMaterial({color:C.coral,wireframe:true,transparent:true,opacity:.45})));return g;},
  mafia(){const g=new THREE.Group();g.add(at(cyl(.62,.62,.05,mats.graphite,48),0,-.2,0));
    g.add(new THREE.Mesh(new THREE.LatheGeometry([[.001,.32],[.3,.3],[.36,.1],[.38,-.18]].map(([x,y])=>new THREE.Vector2(x,y)),48),mats.graphite));
    g.add(at(cyl(.385,.385,.09,mats.coral,48),0,-.12,0));return g;}
};

// Projects come from the page, so the scene always matches the content
const projects=[...document.querySelectorAll('[data-obj]')].map(el=>({el,key:el.dataset.obj,slot:el.querySelector('.slot3d'),
  title:el.querySelector('h3').textContent.trim(),ctx:(el.querySelector('.ctx')||{}).textContent||''}));
const N=projects.length, R=3.1, golden=Math.PI*(3-Math.sqrt(5));
const objs=[];
projects.forEach((p,i)=>{
  const make=build[p.key];if(!make)return;
  const holder=new THREE.Group(), obj=make();
  obj.traverse(m=>{if(m.isMesh)m.userData.pid=objs.length;});
  const y=1-(i/(N-1))*2, r=Math.sqrt(1-y*y), th=golden*i;
  holder.add(obj);scene.add(holder);
  objs.push({p,holder,obj,base:new THREE.Vector3(Math.cos(th)*r*R*1.15,y*R*.82,Math.sin(th)*r*R),phase:i*1.7,spin:(i%2?1:-1)*(.25+(i%3)*.1),hover:0});
});
const rings=new THREE.Group();scene.add(rings);
const ringMat=new THREE.MeshBasicMaterial({color:C.steel,transparent:true,opacity:.25});
const ring=new THREE.Mesh(new THREE.TorusGeometry(R*1.25,.006,8,160),ringMat);ring.rotation.x=Math.PI/2.15;rings.add(ring);
const ring2=ring.clone();ring2.scale.setScalar(.72);ring2.rotation.set(Math.PI/2.6,.4,0);rings.add(ring2);
const dustGeo=new THREE.BufferGeometry(),dn=260,dp=new Float32Array(dn*3);
for(let i=0;i<dn;i++){dp[i*3]=(Math.random()-.5)*26;dp[i*3+1]=(Math.random()-.5)*16;dp[i*3+2]=(Math.random()-.5)*10-2;}
dustGeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dustMat=new THREE.PointsMaterial({color:0xF2EDE6,size:.03,transparent:true,opacity:.45,depthWrite:false});
const dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);

// Screen pixels -> world units on the z=0 plane (camera is fixed, looking straight at it)
let W=0,H=0,wpp=1;
function size(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w===W&&h===H)return;W=w;H=h;
  renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();wpp=2*D*Math.tan(FOV*Math.PI/360)/H;}
const toWorld=(x,y,v)=>v.set((x-W/2)*wpp,(H/2-y)*wpp,0);

// Interaction lives on #stage (the hero area); the canvas itself never takes pointer events
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2(-9,-9);
let rotY=0,rotX=.15,velY=reduce?0:.0025,drag=null,moved=0,hot=-1,par={x:0,y:0},blend=0;
const setPtr=e=>{ptr.set(e.clientX/W*2-1,-(e.clientY/H)*2+1);};
function pick(){if(blend>.25)return -1;ray.setFromCamera(ptr,camera);const hit=ray.intersectObjects(objs.map(o=>o.obj),true)[0];return hit?hit.object.userData.pid:-1;}
stage.addEventListener('pointerdown',e=>{setPtr(e);drag={x:e.clientX,y:e.clientY};moved=0;stage.setPointerCapture(e.pointerId);wake();});
stage.addEventListener('pointermove',e=>{setPtr(e);const b=stage.getBoundingClientRect();
  par.x=((e.clientX-b.left)/b.width)*2-1;par.y=((e.clientY-b.top)/b.height)*2-1;
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);
    velY=dx*.0006;rotY+=dx*.006;rotX=Math.max(-.6,Math.min(.8,rotX+dy*.004));drag={x:e.clientX,y:e.clientY};hint.style.opacity=0;}
  wake();});
stage.addEventListener('pointerup',()=>{if(drag&&moved<6){const id=pick();if(id>-1)open(objs[id].p);}drag=null;});
stage.addEventListener('pointercancel',()=>{drag=null;});
stage.addEventListener('pointerleave',()=>{ptr.set(-9,-9);par.x=par.y=0;wake();});
function open(p){const el=p.el;
  if(el.hidden)document.querySelector('.filters [data-f="all"]').click();
  el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}
window.__open3d=key=>{const o=objs.find(o=>o.p.key===key);if(o)open(o.p);};

const v=new THREE.Vector3(),cpos=new THREE.Vector3(),spos=new THREE.Vector3(),eul=new THREE.Euler(),q=new THREE.Quaternion();
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
const clock=new THREE.Clock();let t=0;
function render(){
  size();
  const dt=Math.min(clock.getDelta(),.05);if(!reduce)t+=dt;
  // scroll blend: 0 = cluster in the hero, 1 = every object docked in its section
  const heroEnd=hero.offsetTop+hero.offsetHeight;
  blend=Math.max(0,Math.min(1,scrollY/(heroEnd*.85)));
  const idle=reduce?0:(hot>-1?.0004:.0025)*Math.sign(velY||1);
  if(!drag){rotY+=velY*60*dt;rotX+=(.15-rotX)*.02;velY+=(idle-velY)*(hot>-1?.12:.02);}
  eul.set(rotX*.5+par.y*.12,rotY+par.x*.25,0);q.setFromEuler(eul);
  // where the cluster sits on screen, and how big
  const r=stage.getBoundingClientRect();
  toWorld(r.left+r.width/2,r.top+r.height/2,cpos);
  const cs=Math.min(r.height*wpp/7.6,r.width*wpp/8.8);
  rings.position.copy(cpos);rings.quaternion.copy(q);rings.scale.setScalar(cs);
  ringMat.opacity=.25*(1-ease(blend*2));dustMat.opacity=.45*(1-blend*.7);
  hot=drag?-1:pick();stage.classList.toggle('hot',hot>-1);
  if(hot>-1&&hint.style.opacity!=='0')hint.style.opacity=0;
  objs.forEach((o,i)=>{
    o.hover+=((i===hot?1:0)-o.hover)*.15;
    v.copy(o.base).applyQuaternion(q).multiplyScalar(cs).add(cpos);
    const slot=o.p.slot, shown=slot&&slot.offsetParent!==null;
    let b=ease(blend*1.25-i*.025);
    let s=cs*(1+o.hover*.3);
    if(shown){const sr=slot.getBoundingClientRect();toWorld(sr.left+sr.width/2,sr.top+sr.height/2,spos);
      v.lerp(spos,b);s+=((sr.width*wpp)/1.35-s)*b;}
    else{v.y-=b*18;}
    o.holder.position.copy(v);o.holder.scale.setScalar(s);
    o.holder.visible=shown||b<.95;
    o.obj.position.y=Math.sin(t*.9+o.phase)*.12*(1-b*.5);
    o.obj.rotation.y+=reduce?0:o.spin*dt*(1+o.hover*3);o.obj.rotation.x=Math.sin(t*.5+o.phase)*.25;
    o.holder.lookAt(camera.position);
  });
  dust.rotation.y=t*.01;
  renderer.render(scene,camera);
  if(hot>-1){const o=objs[hot];o.holder.getWorldPosition(v).project(camera);
    const sr=stage.getBoundingClientRect();
    tip.style.left=((v.x+1)/2*W)+'px';tip.style.top=((-v.y+1)/2*H)+'px';
    tip.querySelector('strong').textContent=o.p.title;tip.querySelector('span').textContent=o.p.ctx;tip.classList.add('on');}
  else tip.classList.remove('on');
}
// Run continuously while the tab is visible; with reduced motion, draw only when something changes
let raf=0;
function frame(){raf=0;render();if(!reduce&&!document.hidden)raf=requestAnimationFrame(frame);}
function wake(){if(!raf)raf=requestAnimationFrame(frame);}
addEventListener('scroll',wake,{passive:true});addEventListener('resize',wake);
document.addEventListener('visibilitychange',wake);
document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>setTimeout(wake,30)));
new ResizeObserver(wake).observe(document.body);
wake();
