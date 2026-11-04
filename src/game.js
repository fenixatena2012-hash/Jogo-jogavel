import * as THREE from "three";

const canvas=document.querySelector("#game"), overlay=document.querySelector("#overlay"), hud=document.querySelector("#hud");
const renderer=new THREE.WebGLRenderer({canvas,antialias:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6)); renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x87c9f4); scene.fog=new THREE.Fog(0x87c9f4,24,62);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,100);
scene.add(new THREE.HemisphereLight(0xd9efff,0x687044,2));
const sun=new THREE.DirectionalLight(0xfff0d5,1.8); sun.position.set(-12,22,10); scene.add(sun);
const mats={
 grass:new THREE.MeshLambertMaterial({color:0x62a943}),
 dirt:new THREE.MeshLambertMaterial({color:0x8a5937}),
 stone:new THREE.MeshLambertMaterial({color:0x858b91}),
 wood:new THREE.MeshLambertMaterial({color:0x96602f}),
 sand:new THREE.MeshLambertMaterial({color:0xd9c27a}),
 leaves:new THREE.MeshLambertMaterial({color:0x397c35})
};
const types=["grass","dirt","stone","wood","sand"], swatches=["#62a943","#8a5937","#858b91","#96602f","#d9c27a"];
const blocks=new Map(), meshes=new Map(), cube=new THREE.BoxGeometry(1,1,1);
const key=(x,y,z)=>`${x},${y},${z}`;
function save(){try{localStorage.setItem("voxelcraft-world",JSON.stringify([...blocks.entries()]));}catch{}}
function add(x,y,z,type,doSave=true){
 const k=key(x,y,z); if(blocks.has(k))return;
 blocks.set(k,type); const mesh=new THREE.Mesh(cube,mats[type]||mats.grass);
 mesh.position.set(x,y,z); scene.add(mesh); meshes.set(k,mesh); if(doSave)save();
}
function remove(x,y,z){const k=key(x,y,z),m=meshes.get(k);if(!m)return;scene.remove(m);meshes.delete(k);blocks.delete(k);save();}
function heightAt(x,z){return Math.floor(1+Math.sin(x*.31)*1.3+Math.cos(z*.27)*1.1+Math.sin((x+z)*.17)*.8);}
function createWorld(){
 let stored;try{stored=JSON.parse(localStorage.getItem("voxelcraft-world")||"null")}catch{}
 if(Array.isArray(stored)){for(const [k,t] of stored){const [x,y,z]=k.split(",").map(Number);add(x,y,z,t,false)}return}
 for(let x=-14;x<=14;x++)for(let z=-14;z<=14;z++){
  const h=heightAt(x,z);
  for(let y=-2;y<=h;y++)add(x,y,z,y===h?(h<=0?"sand":"grass"):y>=h-2?"dirt":"stone",false);
  if(Math.abs(x)%8===0&&Math.abs(z)%7===0&&Math.random()>.42&&h>0){
   for(let y=1;y<=3;y++)add(x,h+y,z,"wood",false);
   for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=4;dy++)
    if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy-3)<5)add(x+dx,h+dy,z+dz,"leaves",false);
  }
 }
 save();
}
createWorld();

const player={pos:new THREE.Vector3(0,5,7),vel:new THREE.Vector3(),yaw:0,pitch:0,onGround:false};
const keys={};let selected=0, pointerLocked=false;
function cameraUpdate(){camera.position.copy(player.pos);camera.rotation.order="YXZ";camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;}
function renderBar(){
 const bar=document.querySelector("#hotbar");bar.innerHTML="";
 types.forEach((t,i)=>{const el=document.createElement("div");el.className="slot"+(i===selected?" active":"");
 el.innerHTML=`<div class="swatch" style="background:${swatches[i]}"></div>${i+1}`;
 el.addEventListener("pointerdown",e=>{e.preventDefault();selected=i;renderBar()});bar.append(el);});
}
renderBar();
let deferredInstall=null;
const installButton=document.querySelector("#install");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;installButton.style.display="inline-block";});
installButton.addEventListener("click",async()=>{if(!deferredInstall){toast("Use o menu do navegador para instalar");return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;installButton.style.display="none";});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));

async function startGame(){
 overlay.style.display="none";hud.style.display="block";
 try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();if(screen.orientation?.lock)await screen.orientation.lock("landscape");}catch{}
 if(matchMedia("(pointer:fine)").matches)canvas.requestPointerLock?.();
}
document.querySelector("#play").addEventListener("click",startGame);
document.addEventListener("pointerlockchange",()=>{pointerLocked=document.pointerLockElement===canvas;
 if(!pointerLocked&&matchMedia("(pointer:fine)").matches&&hud.style.display==="block"){overlay.style.display="flex";hud.style.display="none";}});
document.addEventListener("mousemove",e=>{if(!pointerLocked)return;player.yaw-=e.movementX*.0022;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch-e.movementY*.0022));});
document.addEventListener("keydown",e=>{keys[e.code]=true;if(e.code.startsWith("Digit")){const n=Number(e.code.slice(5))-1;if(n>=0&&n<5){selected=n;renderBar();}}});
document.addEventListener("keyup",e=>keys[e.code]=false);
const ray=new THREE.Raycaster();ray.far=6;
function aimed(){ray.setFromCamera(new THREE.Vector2(0,0),camera);const hits=ray.intersectObjects([...meshes.values()],false);return hits[0]||null;}
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity=0,900);}
function mine(){const h=aimed();if(!h)return;const p=h.object.position;remove(p.x,p.y,p.z);toast("Bloco minerado");}
function place(){const h=aimed();if(!h)return;const p=h.object.position,n=h.face.normal,x=p.x+n.x,y=p.y+n.y,z=p.z+n.z;
 if(Math.abs(x-player.pos.x)<.9&&Math.abs(z-player.pos.z)<.9&&Math.abs(y-player.pos.y)<1.8)return;
 add(x,y,z,types[selected]);toast("Bloco colocado");}
document.addEventListener("mousedown",e=>{if(!pointerLocked)return;if(e.button===0)mine();if(e.button===2)place();});
document.addEventListener("contextmenu",e=>e.preventDefault());
document.querySelector("#mine").addEventListener("pointerdown",e=>{e.preventDefault();mine();});
document.querySelector("#place").addEventListener("pointerdown",e=>{e.preventDefault();place();});
function jump(){if(player.onGround){player.vel.y=8;player.onGround=false;}}
document.querySelector("#jump").addEventListener("pointerdown",e=>{e.preventDefault();jump();});
function solid(x,y,z){return blocks.has(key(Math.floor(x),Math.floor(y),Math.floor(z)));}
function collision(pos){const r=.27;for(const x of [pos.x-r,pos.x+r])for(const z of [pos.z-r,pos.z+r])for(const y of [pos.y-.85,pos.y-.12])if(solid(x,y,z))return true;return false;}

// Touch joystick
const base=document.querySelector("#stickBase"),knob=document.querySelector("#stick");
let stick={x:0,y:0,id:null};
base.addEventListener("pointerdown",e=>{e.preventDefault();stick.id=e.pointerId;base.setPointerCapture(e.pointerId);moveStick(e);});
base.addEventListener("pointermove",e=>{if(e.pointerId===stick.id)moveStick(e);});
function moveStick(e){const r=base.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),max=38;if(len>max){dx=dx/len*max;dy=dy/len*max;}stick.x=dx/max;stick.y=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`;}
function resetStick(e){if(e.pointerId===stick.id){stick={x:0,y:0,id:null};knob.style.transform="translate(0,0)";}}
base.addEventListener("pointerup",resetStick);base.addEventListener("pointercancel",resetStick);
// Drag right half to look around
const look=document.querySelector("#lookArea");let lookId=null,lastX=0,lastY=0;
look.addEventListener("pointerdown",e=>{if(lookId!==null)return;lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;look.setPointerCapture(e.pointerId);});
look.addEventListener("pointermove",e=>{if(e.pointerId!==lookId)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;player.yaw-=dx*.005;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch-dy*.005));});
function endLook(e){if(e.pointerId===lookId)lookId=null;}look.addEventListener("pointerup",endLook);look.addEventListener("pointercancel",endLook);

let previous=performance.now();
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.04);previous=now;
 if(hud.style.display==="block"){
  const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0)-stick.y;
  const side=(keys.KeyD?1:0)-(keys.KeyA?1:0)+stick.x;
  const speed=keys.ShiftLeft?8:5;
  const fwd=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  const right=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
  const move=fwd.multiplyScalar(forward).add(right.multiplyScalar(side));if(move.length()>1)move.normalize();move.multiplyScalar(speed*dt);
  let next=player.pos.clone();next.x+=move.x;if(!collision(next))player.pos.x=next.x;
  next.copy(player.pos);next.z+=move.z;if(!collision(next))player.pos.z=next.z;
  if(keys.Space)jump();player.vel.y-=22*dt;next.copy(player.pos);next.y+=player.vel.y*dt;
  if(!collision(next)){player.pos.y=next.y;player.onGround=false;}else{if(player.vel.y<0)player.onGround=true;player.vel.y=0;}
  if(player.pos.y< -12){player.pos.set(0,6,7);player.vel.set(0,0,0);}cameraUpdate();
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
