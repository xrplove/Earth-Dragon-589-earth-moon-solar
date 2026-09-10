import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {createScene,orientation} from './scene.js';
import {saturnShadow} from './solar-shadows.js';
import {mountSolar} from './solar-ui.js';
import {stateAt,velocityAt,orbitEllipse,AU} from './solar-model.js';
import {incomingJourney,beginJourneyUI,journeyUI,finishArrival,registerNavigation,leaveWithFrame} from './page-journey.js';
import {createTextTransition} from './text-transition.js';

import './style.css';

import './solar.css';

mountSolar();
const $=s=>document.querySelector(s),UNIT=1e6,EARTH_RADIUS=.006371;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('#earth-canvas');
beginJourneyUI();
const earth=createScene(canvas,{lunar:true,solar:true});
earth.setRotation(false);
const ctx=earth.createOverlay(context=>context),{scene,camera,renderer}=ctx;
ctx.hideOrbitRing();
camera.near=.00000001;camera.far=100000;camera.updateProjectionMatrix();
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=false;controls.minDistance=.000015;controls.maxDistance=50000;
const earthLights=[];scene.traverse(o=>{if(o.isLight)earthLights.push({light:o,intensity:o.intensity});});
const fill=new THREE.AmbientLight(0xc4d6e6,.7);scene.add(fill);
const sunlight=new THREE.PointLight(0xffefd8,3,0,0);scene.add(sunlight);
const loader=new THREE.TextureLoader(),textures=new Map(),texturePromises=[];
const meshes=new Map(),datasets=new Map(),pending=new Map(),positions=new Map(),visual=new Map(),planetLines=new Map(),trails=new Map(),moonLines=new Map();
let catalog,selected=399,mode='system',time=Date.UTC(2026,0,15),start=Date.UTC(2026,0,1),end=Date.UTC(2027,0,1);
let playing=!reduced(),speed=259200,trueScale=false,atlas=1,paths=true,focusMove=null,origin=new THREE.Vector3(),last=0,ready=false,depart=null,selectionToken=0,lastGuide=-Infinity,lastTrail=-Infinity,arrival=null;
const body=id=>catalog?.bodies.find(b=>b.id===id);
const parentId=()=>body(selected)?.parent===10?selected:body(selected)?.parent;
const point=xyz=>new THREE.Vector3(xyz[0]/UNIT,xyz[2]/UNIT,-xyz[1]/UNIT);
const physical=id=>positions.get(id)||new THREE.Vector3();
const atlasSizes={10:1.05,199:.26,299:.35,399:.38,499:.30,599:.86,699:.75,799:.48,899:.47};
const solarRadius=b=>b.radius/UNIT;
const blendRadius=(info,a=atlas)=>Math.exp(THREE.MathUtils.lerp(Math.log(solarRadius(info)),Math.log(atlasSizes[info.id]||solarRadius(info)),a));
function mapPoint(p,a=atlas){const r=p.length();return r?p.clone().multiplyScalar(Math.exp(THREE.MathUtils.lerp(Math.log(r),Math.log((6+5.7*Math.log1p(r/(AU/UNIT)))),a))/r):p.clone();}
function positionFor(id,a=atlas){const b=body(id);if(!b||b.parent===10)return mapPoint(physical(id),a);let relative=physical(id).clone().sub(physical(b.parent));if(id===301&&incomingJourney?.pose?.moon&&(arrival||focusMove?.entry)){const staged=new THREE.Vector3().fromArray(incomingJourney.pose.moon.position).multiplyScalar(EARTH_RADIUS/2.55);relative=staged.lerp(relative,THREE.MathUtils.smoothstep(a,0,.65));}return mapPoint(physical(b.parent),a).add(relative);}
function centerFor(value=mode,a=atlas){return value==='system'||value==='inner'?new THREE.Vector3():positionFor(value==='moons'?parentId():selected,a);}
const load=id=>{if(datasets.has(id))return Promise.resolve(datasets.get(id));if(!pending.has(id))pending.set(id,fetch('/data/solar/'+id+'.json').then(r=>{if(!r.ok)throw Error('Orbital data unavailable');return r.json();}).then(data=>{datasets.set(id,data);pending.delete(id);return data;}).catch(e=>{pending.delete(id);throw e;}));return pending.get(id);};
function texture(path,color=true){if(textures.has(path))return textures.get(path);let resolve;const promise=new Promise(r=>resolve=r);texturePromises.push(promise);const t=loader.load(path,()=>{renderer.initTexture(t);resolve();},undefined,()=>{$('.solar-status').textContent='A surface map could not load.';resolve();});if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());textures.set(path,t);return t;}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'#fff9df');r.addColorStop(.16,'#ffe4aacc');r.addColorStop(.37,'#ffb94440');r.addColorStop(1,'#ff981100');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const glowMap=glowTexture();
const moonKey=new THREE.DirectionalLight(0xfff4e6,3.4),moonFill=new THREE.AmbientLight(0xb6c8df,.08);moonKey.layers.set(2);moonFill.layers.set(2);camera.layers.enable(2);scene.add(moonKey,moonFill);
function makeBody(info){
 let group,globe;const shadows=[];
 if(info.id===399){group=ctx.group;globe=group.children[0];group.quaternion.copy(orientation(17,77));}
 else{
  group=new THREE.Group();scene.add(group);
  const material=info.id===10?new THREE.MeshBasicMaterial({map:texture('/textures/solar/sun.jpg')}):new THREE.MeshStandardMaterial({map:info.texture?texture(info.texture):null,color:info.texture?0xffffff:info.color,roughness:.92});
  if(info.id===301){material.bumpMap=texture('/textures/moon/height.png',false);material.bumpScale=.007;}
  globe=new THREE.Mesh(new THREE.SphereGeometry(1,128,80),material);group.add(globe);
  if(info.id===699){const geometry=new THREE.RingGeometry(1.24,2.32,192),uv=geometry.attributes.uv,p=geometry.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,(Math.hypot(p.getX(i),p.getY(i))-1.24)/1.08,.5);const ring=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture('/textures/solar/saturn_ring_alpha.png'),side:THREE.DoubleSide,transparent:true,depthWrite:false,roughness:1}));ring.rotation.x=-Math.PI/2;group.add(ring);group.rotation.x=.47;shadows.push(saturnShadow(ring.material,ring.material.map,true),saturnShadow(material,ring.material.map,false));}
 }
 if(info.id===301)group.traverse(o=>o.layers.set(2));
 const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:info.color||0xffe3ad,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));marker.visible=false;scene.add(marker);
 const label=document.createElement('button');label.className='solar-body-label';label.innerHTML=`<i style="background:${info.color||'#e8bd70'}"></i><span>${info.name}</span><small>↗</small>`;label.onclick=()=>info.id===10?setView('inner'):selectBody(info.id);$('#solar-labels').append(label);
 meshes.set(info.id,{group,globe,shadows,marker,label,info,screen:new THREE.Vector2(),hitRadius:0,visible:false});
}
function makeLine(color,width=1,opacity=.2){const geometry=new LineGeometry();geometry.setPositions([0,0,0,0,0,0]);const material=new LineMaterial({color,transparent:true,opacity,linewidth:width,depthWrite:false});const line=new Line2(geometry,material);scene.add(line);return line;}
function linePoints(line,points){line.geometry.setPositions(points.flatMap(p=>p.clone().sub(origin).toArray()));}
function updatePositions(){positions.set(10,new THREE.Vector3());for(const b of catalog.bodies.filter(b=>b.parent===10))positions.set(b.id,point(stateAt(datasets.get(b.id),time)));for(const b of catalog.bodies.filter(b=>b.parent!==10))if(datasets.has(b.id))positions.set(b.id,physical(b.parent).clone().add(point(stateAt(datasets.get(b.id),time))));}
function updateGuides(force=false){
 if(!force&&performance.now()-lastGuide<160)return;lastGuide=performance.now();
 for(const b of catalog.bodies.filter(b=>b.parent===10)){
  if(!planetLines.has(b.id))planetLines.set(b.id,makeLine(b.color,.85,.20));
  const d=datasets.get(b.id),points=orbitEllipse(stateAt(d,time),velocityAt(d,time)).map(p=>mapPoint(point(p)));
  linePoints(planetLines.get(b.id),points);
 }
 for(const [id,line] of moonLines){const b=body(id),d=datasets.get(id),span=b.period*86400000,first=Math.max(start,Math.min(time-span/2,end-span));linePoints(line,Array.from({length:181},(_,i)=>positionFor(b.parent).add(point(stateAt(d,first+span*i/180)))));}
}
function updateTrails(force=false){
 if(!force&&performance.now()-lastTrail<65)return;lastTrail=performance.now();
 for(const b of catalog.bodies.filter(b=>b.parent===10)){
  if(!trails.has(b.id)){const line=makeLine(b.color,2,.85);line.material.vertexColors=true;trails.set(b.id,line);}
  const line=trails.get(b.id),span=Math.min(100,b.period*.16)*86400000,d=datasets.get(b.id),pts=[],colors=[];
  for(let i=0;i<49;i++){const p=i/48;pts.push(mapPoint(point(stateAt(d,Math.max(start,time-span*(1-p))))));const brightness=p*p;colors.push(brightness,brightness,brightness);}
  linePoints(line,pts);line.geometry.setColors(colors);
 }
}
function layout(){const narrow=innerWidth<=760,controlsHeight=$('.solar-controls').offsetHeight,top=narrow?(innerHeight<720?145:210):105,bottom=innerHeight-controlsHeight-40;return {factor:Math.max(innerHeight/Math.max(150,bottom-top),1/camera.aspect),x:narrow?0:-innerWidth*.11,y:innerHeight/2-(top+bottom)/2};}
function desiredDistance(value=mode,a=atlas){const b=body(selected),l=layout();if(value==='body')return solarRadius(b)*(selected===699?6:3.4)*l.factor;let extent;if(value==='system')extent=a>.9?Math.max(...catalog.bodies.filter(b=>b.parent===10).map(b=>positionFor(b.id,a).length()))*1.05:Math.max(...catalog.bodies.filter(b=>b.parent===10).map(b=>positionFor(b.id,a).length()))*1.05;else if(value==='inner')extent=a>.9?12.3:250;else extent=Math.max(solarRadius(body(parentId()))*3,...catalog.bodies.filter(b=>b.parent===parentId()&&datasets.has(b.id)).map(b=>point(stateAt(datasets.get(b.id),time)).length()*1.10));return extent/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*Math.max(l.factor*.76,1/camera.aspect);}
function fit({entry=false,duration=1.1}={}){
 const nextAtlas=(mode==='system'||mode==='inner')&&!trueScale?1:0;
 const currentCenter=controls.target.clone().add(origin),target=centerFor(mode,nextAtlas),from=camera.position.clone().sub(controls.target),distance=desiredDistance(mode,nextAtlas);
 const fromMode=canvas.dataset.view,separation=currentCenter.distanceTo(target);
 const portrait=selected===399?new THREE.Vector3(.28,.15,1):physical(selected).clone().negate().normalize().lerp(new THREE.Vector3(.28,selected===699?.65:.3,1).normalize(),.42);
 const direction=mode==='body'?portrait.normalize():new THREE.Vector3(.12,1.05,1).normalize();
 focusMove={elapsed:0,duration,fromCenter:currentCenter,target,fromDirection:from.clone().normalize(),direction,fromDistance:Math.max(.000001,from.length()),distance,fromAtlas:atlas,nextAtlas,entry,travelLift:mode==='body'&&fromMode==='body'&&separation>distance*10?Math.max(0,Math.log(separation*2/Math.sqrt(from.length()*distance))):0,anchor:entry?(incomingJourney?.pose?.moon?301:399):((mode==='system'||mode==='inner')&&['body','moons'].includes(canvas.dataset.view)?selected:null),fromOffset:{x:camera.view?.offsetX||0,y:camera.view?.offsetY||0}};
 if(focusMove.anchor)focusMove.anchorOffset=currentCenter.clone().sub(positionFor(focusMove.anchor,atlas));
 canvas.dataset.cameraMoving='true';
}
function closeOptions(){$('.solar-options').hidden=true;$('#solar-options').setAttribute('aria-expanded','false');}
function setView(value){closeOptions();mode=value;if(mode==='moons'){speed=parentId()===399?86400:3600;$('#solar-speed').value=String(speed);}if((mode==='system'||mode==='inner')&&speed<86400){speed=259200;$('#solar-speed').value=String(speed);}fit();renderUI();}
function setPlay(value){playing=value;$('#solar-play').setAttribute('aria-pressed',value);$('#solar-play').setAttribute('aria-label',value?'Pause orbital motion':'Play orbital motion');$('#solar-play').textContent=value?'Ⅱ':'▶';$('.solar-live').lastChild.textContent=value?' ORBITS IN MOTION':' TIME PAUSED';}
async function loadMoons(id){const list=catalog.bodies.filter(b=>b.parent===id);await Promise.all(list.map(async b=>{await load(b.id);if(!meshes.has(b.id))makeBody(b);}));if(id!==parentId())return;for(const line of moonLines.values()){scene.remove(line);line.geometry.dispose();line.material.dispose();}moonLines.clear();for(const b of list)moonLines.set(b.id,makeLine(b.color,1,.35));}
async function selectBody(id){
 closeOptions();const token=++selectionToken;selected=id;mode='body';renderUI();
 try{await load(id);if(token!==selectionToken)return;if(!meshes.has(id))makeBody(body(id));updatePositions();fit({duration:1.35});
  if(speed>86400){speed=3600;$('#solar-speed').value='3600';}
  await loadMoons(parentId());if(token!==selectionToken)return;updatePositions();updateGuides(true);renderUI();
 }catch(e){$('.solar-status').textContent='This world could not load. Select it again to retry.';console.error(e);}
}
const copy=createTextTransition($('.solar-copy'),v=>{$('.solar-copy h1').innerHTML=v.title;$('.solar-description').textContent=v.description;$('.solar-facts').innerHTML=v.facts;});
function renderUI(){
 if(!catalog)return;$('.solar').dataset.view=mode;
 const b=body(selected),parent=body(parentId()),moons=catalog.bodies.filter(m=>m.parent===parentId());
 const title=mode==='system'?'Everything<br> in motion.':mode==='inner'?'Our stellar<br> neighborhood.':mode==='moons'?parent.name+'<br>& its moons.':b.name+'.';
 const description=mode==='system'?'Eight worlds. One star. A celestial dance, billions of years in the making.':mode==='inner'?'Four rocky worlds, tracing their own paths around the Sun.':mode==='moons'?'A family of worlds. Watch '+moons.length+' selected moons travel around '+parent.name+'.':b.id===399?'Our home, seen from the outside. Oceans, clouds, and the delicate edge of an atmosphere.':'A world of its own. Drag to turn your view, or explore the space around it.';
 copy(mode+'-'+selected,{title,description,facts:mode==='body'?`<span>MEAN RADIUS<strong>${b.radius.toLocaleString()} km</strong></span><span>ORBITAL PERIOD<strong>${b.period.toLocaleString()} days</strong></span>`:''});
 document.querySelectorAll('[data-planet]').forEach(e=>e.setAttribute('aria-pressed',mode!=='system'&&mode!=='inner'&&+e.dataset.planet===parentId()));
 document.querySelectorAll('[data-view]').forEach(e=>{e.setAttribute('aria-pressed',e.dataset.view===mode);if(e.dataset.view==='moons')e.disabled=!moons.length;});
 $('#solar-moon').innerHTML='<option value="">Explore a moon'+(moons.length?' ('+moons.length+')':' — none')+'</option>'+moons.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');$('#solar-moon').disabled=!moons.length;$('#solar-moon').value=b.parent===10?'':b.id;
 $('#solar-scale').setAttribute('aria-pressed',trueScale);$('#solar-scale').innerHTML=trueScale?'True scale <span>↔ Illustrated scale</span>':'Illustrated scale <span>↔ True scale</span>';$('#solar-scale-mobile').textContent=trueScale?'Switch to illustrated scale':'Switch to true scale';
 $('.solar-key').dataset.physical=String(mode==='body'||mode==='moons');
}
function toggleScale(){trueScale=!trueScale;if(mode==='body'||mode==='moons')mode='system';fit();renderUI();}
$('#solar-scale').onclick=toggleScale;$('#solar-scale-mobile').onclick=toggleScale;
$('#solar-play').onclick=()=>{if(time>=end){time=start;updatePositions();}setPlay(!playing);};
$('#solar-range').oninput=e=>{time=start+(end-start)*+e.target.value;setPlay(false);};
$('#solar-date').onchange=e=>{const t=Date.parse(e.target.value+'T00:00:00Z');if(Number.isFinite(t)){time=Math.max(start,Math.min(end,t));setPlay(false);}};
$('#solar-speed').onchange=e=>speed=+e.target.value;
$('#solar-moon').onchange=e=>{if(e.target.value)selectBody(+e.target.value);};
$('#solar-orbits').onclick=()=>{paths=!paths;$('#solar-orbits').setAttribute('aria-pressed',paths);};
$('#solar-options').onclick=()=>{const panel=$('.solar-options');panel.hidden=!panel.hidden;$('#solar-options').setAttribute('aria-expanded',!panel.hidden);};
$('#nav-science').onclick=()=>$('.solar-sources').showModal();$('.solar-sources button').onclick=()=>$('.solar-sources').close();
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>setView(button.dataset.view);
controls.addEventListener('start',()=>{focusMove=null;if(arrival){arrival=null;journeyUI(1,true);finishArrival();}});
let press=null;
canvas.addEventListener('pointerdown',e=>press={x:e.clientX,y:e.clientY});
canvas.addEventListener('pointerup',e=>{if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return;}press=null;const hit=[...meshes.values()].filter(m=>m.visible&&m.info.id!==10&&(m.info.id!==selected||mode!=='body')).map(m=>({m,d:Math.hypot(m.screen.x-e.clientX,m.screen.y-e.clientY)})).filter(h=>h.d<Math.max(22,h.m.hitRadius)).sort((a,b)=>a.d-b.d)[0];if(hit)selectBody(hit.m.info.id);});
canvas.addEventListener('pointercancel',()=>press=null);
function moveCamera(dt){
 if(focusMove){const m=focusMove;m.elapsed+=dt;const p=reduced()?1:THREE.MathUtils.smootherstep(Math.min(1,m.elapsed/m.duration),0,1);atlas=THREE.MathUtils.lerp(m.fromAtlas,m.nextAtlas,p);const target=centerFor(mode,atlas);let center;
  if(m.anchor){center=positionFor(m.anchor,atlas).addScaledVector(m.anchorOffset,1-p).lerp(target,THREE.MathUtils.smoothstep(p,.65,1));}
  else center=m.fromCenter.clone().lerp(target,THREE.MathUtils.smoothstep(p,0,.38));
  const distance=Math.exp(THREE.MathUtils.lerp(Math.log(m.fromDistance),Math.log(m.distance),p)+Math.sin(Math.PI*p)**2*m.travelLift);const direction=m.fromDirection.clone().lerp(m.direction,p).normalize();origin.copy(center);controls.target.set(0,0,0);camera.position.copy(direction).multiplyScalar(distance);if(p===1)focusMove=null;}
 else{origin.copy(centerFor());}
 controls.enabled=!focusMove&&!depart;
 const l=layout(),blend=focusMove?THREE.MathUtils.smootherstep(focusMove.elapsed/focusMove.duration,0,1):1;camera.setViewOffset(innerWidth,innerHeight,THREE.MathUtils.lerp(focusMove?.fromOffset.x||0,l.x,blend),THREE.MathUtils.lerp(focusMove?.fromOffset.y||0,l.y,blend),innerWidth,innerHeight);controls.update();
}
function renderBodies(dt){
 visual.clear();for(const [id,m] of meshes){const position=positionFor(id);visual.set(id,position);m.group.position.copy(position).sub(origin);const radius=blendRadius(m.info);m.group.scale.setScalar(radius/(id===399?2.55:1));m.group.visible=id===10||m.info.parent===10||(atlas<.01||!!arrival&&!!incomingJourney?.pose?.moon)&&m.info.parent===parentId();if(!reduced())m.globe.rotation.y+=dt*(id===399?.025:.035);}
 const moon=meshes.get(301);if(moon){const moonSun=new THREE.Vector3().fromArray(incomingJourney?.pose?.moon?.sun||[-.813,.3,.582]).normalize();moonKey.position.copy(moon.group.position).addScaledVector(moonSun,10);moonKey.target.position.copy(moon.group.position);moonKey.target.updateMatrixWorld();}
 const earthPosition=meshes.get(399).group.position;
 sunlight.position.copy(origin).negate();for(const shadow of meshes.get(699).shadows)shadow.update(meshes.get(699).group,sunlight.position);
 const earthClose=(mode==='body'&&selected===399)||!!arrival&&atlas<.55;
 fill.intensity=earthClose?.02:.65;sunlight.intensity=earthClose?0:3;
 for(const {light,intensity} of earthLights)light.intensity=earthClose?intensity:0;
 if(earthClose){const sun=new THREE.Vector3().fromArray(incomingJourney?.pose?.sun||[-.85,.5,.75]).normalize();ctx.sunDirection.copy(sun);for(const {light} of earthLights)if(light.isDirectionalLight){light.position.copy(earthPosition).addScaledVector(sun,10);light.target.position.copy(earthPosition);light.target.updateMatrixWorld();}}else ctx.sunDirection.copy(earthPosition).sub(sunlight.position).negate().normalize();
}
function renderLabels(){
 camera.updateMatrixWorld();const boxes=[],l=layout(),controlsTop=$('.solar-controls').getBoundingClientRect().top;
 for(const [id,m] of [...meshes].sort((a,b)=>Number(b[0]===selected)-Number(a[0]===selected))){
  const position=visual.get(id),local=position.clone().sub(origin),p=local.clone().project(camera),depth=-local.clone().applyMatrix4(camera.matrixWorldInverse).z;
  const radius=blendRadius(m.info),px=radius*innerHeight/(Math.max(.000001,depth)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
  const relevant=id===10||mode==='system'&&m.info.parent===10||mode==='inner'&&m.info.parent===10&&id<599||mode==='body'&&(id===selected||id===parentId())||mode==='moons'&&(id===parentId()||m.info.parent===parentId());
  const delta=local.clone().sub(camera.position),distance=delta.length(),ray=delta.clone().normalize();
  const occluded=[...meshes].some(([other,n])=>{if(other===id||!n.group.visible)return false;const d=n.group.position.clone().sub(camera.position),along=d.dot(ray);return along>0&&along<distance&&d.lengthSq()-along*along<blendRadius(n.info)**2;});
  const x=(p.x+1)*innerWidth/2,y=(1-p.y)*innerHeight/2,visible=relevant&&!occluded&&depth>0&&Math.abs(p.x)<.97&&Math.abs(p.y)<.97;
  m.visible=visible;m.screen.set(x,y);m.hitRadius=px/2;
  m.marker.visible=visible&&(id===10||px<8);m.marker.position.copy(local);const size=id===10?radius*7:Math.max(radius*3,depth*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/innerHeight*13);m.marker.scale.setScalar(size);m.marker.material.opacity=id===10?.65:.72;
  const textY=y+Math.max(10,px/2)+8;
  m.label.hidden=!visible||id===selected&&mode==='body'||focusMove&&focusMove.entry||textY<100||textY>controlsTop-15||innerWidth>1000&&x<innerWidth*.32&&y<innerHeight*.7||boxes.some(b=>Math.abs(b.x-x)<64&&Math.abs(b.y-textY)<27);
  if(!m.label.hidden){boxes.push({x,y:textY});m.label.style.left=x+'px';m.label.style.top=textY+'px';}
 }
}
function updateReadout(){const date=new Date(time);$('#solar-date').value=date.toISOString().slice(0,10);$('#solar-clock').textContent=date.toISOString().slice(11,16)+' UTC';$('#solar-range').value=(time-start)/(end-start);$('#solar-distance').textContent=mode==='body'?(physical(selected).length()*UNIT/AU).toFixed(3)+' AU from the Sun':mode==='moons'?catalog.bodies.filter(b=>b.parent===parentId()).length+' selected moons':'01 STAR / 08 PLANETS';canvas.dataset.solarTime=String(time);canvas.dataset.selected=String(selected);canvas.dataset.view=mode;canvas.dataset.cameraMoving=String(!!focusMove||!!arrival);canvas.dataset.camera=JSON.stringify(camera.position.toArray());canvas.dataset.moons=String(catalog.bodies.filter(b=>b.parent===parentId()&&datasets.has(b.id)).length);canvas.dataset.atlas=atlas.toFixed(4);canvas.dataset.earthScreen=JSON.stringify(meshes.get(399).screen.toArray());}
function tick(t,dt){
 if(!ready)return;
 if(playing&&!focusMove&&!arrival&&!depart){time=Math.min(end,time+dt*speed*1000);if(time===end)setPlay(false);}
 updatePositions();moveCamera(dt);renderBodies(dt);
 if(arrival){arrival.elapsed+=dt;const p=reduced()?1:Math.min(1,arrival.elapsed/2.25);journeyUI(THREE.MathUtils.smootherstep((p-.35)/.65,0,1),p===1);if(p===1)arrival=null;}
 if(depart){depart.elapsed+=dt;journeyUI(1-THREE.MathUtils.smoothstep(depart.elapsed/.2,0,1));if(!focusMove){const m=meshes.get(399),scale=2.55/EARTH_RADIUS,position=m.group.position.clone().multiplyScalar(scale),cam=camera.position.clone().multiplyScalar(scale);earth.setFrameDriver(()=>{});leaveWithFrame(depart.url,renderer,scene,camera,{position:position.toArray(),quaternion:m.group.quaternion.clone().multiply(m.globe.quaternion).toArray(),camera:cam.toArray(),offset:camera.view?.offsetY||0,offsetX:camera.view?.offsetX||0,fromSolar:true});return;}}
 updateGuides(!!focusMove);updateTrails(!!focusMove);
 for(const [id,line] of planetLines){line.visible=paths&&(mode==='system'||mode==='inner'&&id<599);line.material.opacity=.20*(focusMove?.entry?THREE.MathUtils.smoothstep(atlas,.15,.85):1);}
 for(const [id,line] of trails)line.visible=(mode==='system'||mode==='inner'&&id<599)&&!focusMove;
 for(const line of moonLines.values())line.visible=paths&&mode==='moons'&&!focusMove;
 renderLabels();updateReadout();
}
earth.setFrameDriver(tick);
registerNavigation(async(url,prepared)=>{prepared();selected=399;mode='body';setPlay(false);trueScale=true;depart={url,elapsed:0};beginJourneyUI(true);fit({duration:1.05});});
try{
 catalog=await (await fetch('/data/solar/catalog.json')).json();
 await Promise.all(catalog.bodies.filter(b=>b.parent===10).map(b=>load(b.id)));
 for(const info of [{id:10,name:'Sun',radius:695700,color:'#ffd487'},...catalog.bodies.filter(b=>b.parent===10)])makeBody(info);
 $('.solar-planets').innerHTML=catalog.bodies.filter(b=>b.parent===10).map(b=>`<button data-planet="${b.id}" aria-pressed="false"><i style="background-image:url(${b.texture})"></i><span>${b.name}</span></button>`).join('');for(const button of document.querySelectorAll('[data-planet]'))button.onclick=()=>selectBody(+button.dataset.planet);
 await Promise.all([earth.whenReady,...texturePromises,loadMoons(399)]);
 await Promise.all(texturePromises);
 updatePositions();renderUI();setPlay(playing);ready=true;arrival={elapsed:0};
 // Recreate the exact Earth frame in the new coordinate system before pulling out.
 const pose=incomingJourney?.pose,scale=EARTH_RADIUS/2.55;
 atlas=0;mode='system';origin.copy(physical(399));
 controls.target.set(0,0,0);
 const sourcePosition=new THREE.Vector3().fromArray(pose?.position||[innerWidth<760?.3:1.95,innerWidth<760?.88:.13,0]);
 camera.position.fromArray(pose?.camera||[0,0,innerWidth<760?17.325:10.5]).sub(sourcePosition).multiplyScalar(scale);
 controls.target.fromArray(pose?.aim||[0,0,0]).sub(sourcePosition).multiplyScalar(scale);if(pose?.moon)meshes.get(301).group.quaternion.fromArray(pose.moon.quaternion);meshes.get(399).group.quaternion.fromArray(pose?.quaternion||orientation(17,77).toArray());
 camera.setViewOffset(innerWidth,innerHeight,pose?.offsetX||0,pose?.offset||0,innerWidth,innerHeight);controls.update();
 renderBodies(0);for(const m of meshes.values())if(m.info.id!==399&&!(pose?.moon&&m.info.id===301)){m.group.visible=false;m.marker.visible=false;}for(const {light,intensity} of earthLights)light.intensity=intensity;fill.intensity=0;sunlight.intensity=0;renderer.render(scene,camera);
 $('.world-shell').classList.add('ready');canvas.dataset.ready='true';finishArrival();
 arrival={elapsed:0};fit({entry:true,duration:2.25});
}catch(error){journeyUI(1,true);finishArrival();$('.solar-status').textContent='The Solar System could not load. Reload to retry.';console.error(error);}
