import { mobileCamera, mobileOffset } from './mobile-camera.js';
import { registerNavigation, incomingJourney, finishArrival, leaveWithFrame, beginJourneyUI, journeyUI, prepareJourneyUI, warmJourney } from './page-journey.js';
import * as THREE from 'three';
import {createStarfield} from './starfield.js';



const R=2.55;
export const geographic=(lat,lon,r=R)=>new THREE.Vector3(Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180)*r,Math.sin(lat*Math.PI/180)*r,-Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180)*r);

export function orientation(lat,lon){return new THREE.Quaternion().setFromEuler(new THREE.Euler(lat*Math.PI/180,-lon*Math.PI/180-Math.PI/2,0,'XYZ'));}

export function createScene(canvas,{onReady,onInteract,onView,exposure=1.06,daylight=[-.85,.5,.75],story=false,orbital=false,lunar=false,solar=false}={}) {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:solar});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x030609);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=exposure;
 if(story){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.02,2000);camera.position.set(0,0,10.5);
 const group=new THREE.Group();scene.add(group);
 const light=new THREE.DirectionalLight(0xffefdc,2.65);scene.add(light);if(story){light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-3.5,right:3.5,top:3.5,bottom:-3.5,near:.1,far:18});light.shadow.bias=-.00015;light.shadow.normalBias=.003;}scene.add(new THREE.AmbientLight(0x718bab,.10));
 const sun=new THREE.Vector3(...(story?[-.18,.28,1]:daylight)).normalize();
 const storyFill=new THREE.HemisphereLight(0xe4efff,0x708494,story?.85:0);scene.add(storyFill);let storyNight=false;
 let assetsReady=false,resolveReady;const whenReady=new Promise(resolve=>resolveReady=resolve);
 const manager=new THREE.LoadingManager(()=>{assetsReady=true;resolveReady();onReady?.();});
 manager.onError=url=>{canvas.dataset.assetError=url;};
 const loader=new THREE.TextureLoader(manager);
 function texture(path,color=true){const t=loader.load(path);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
 const day=texture('/textures/earth.jpg'),night=texture('/textures/earth-night.jpg'),bump=texture('/textures/earth-bump.jpg',false),water=texture('/textures/earth-water.png',false),cloudMap=texture('/textures/clouds.png');
 const surface=new THREE.MeshPhongMaterial({map:day,bumpMap:bump,bumpScale:.012,specularMap:water,specular:story?0x142d40:0x426d86,shininess:28,emissiveMap:night,emissive:0xffffff,emissiveIntensity:1.5});
 let attachedLayer=null;
 const sunUniform={value:sun};
 const citiesUniform={value:1};

 // A cool, deliberately exposed night surface keeps geography readable.
 // Both the fill and city emission fade out toward the sunlit hemisphere.
 surface.onBeforeCompile = shader => {
  shader.uniforms.sunDirection = sunUniform;
  shader.uniforms.citiesEnabled=citiesUniform;
  shader.vertexShader = 'varying vec3 globeNormal;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
   #include <begin_vertex>
   globeNormal = normalize(mat3(modelMatrix) * normal);
  `);
  shader.fragmentShader = 'uniform vec3 sunDirection; uniform float citiesEnabled; varying vec3 globeNormal;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
   #include <emissivemap_fragment>
   float warmth = smoothstep(.7, 1.4, (totalEmissiveRadiance.r + .001) / (totalEmissiveRadiance.b + .001));
   vec3 cityLights = vec3(1.0, .67, .33) * pow(max(dot(totalEmissiveRadiance, vec3(.3, .6, .1)) * warmth, 0.0), .60) * 3.1;
   float terrainLuminance = dot(diffuseColor.rgb, vec3(.2126, .7152, .0722));
   vec3 nightSurface = mix(diffuseColor.rgb, vec3(terrainLuminance), .45) * vec3(.16, .24, .38);
   float nightMask = 1.0 - smoothstep(-.18, .12, dot(normalize(globeNormal), sunDirection));
   totalEmissiveRadiance = (cityLights*citiesEnabled + nightSurface) * nightMask;
  `);
 };
 const globe=new THREE.Mesh(new THREE.SphereGeometry(R,160,100),surface);globe.receiveShadow=story;group.add(globe);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(R+.013,128,80),new THREE.MeshPhongMaterial({map:cloudMap,transparent:true,opacity:.84,depthWrite:false,shininess:3,emissiveMap:cloudMap,emissive:0x20344f,emissiveIntensity:.35}));group.add(clouds);
 function atmosphere(radius,outer){return new THREE.Mesh(new THREE.SphereGeometry(radius,100,64),new THREE.ShaderMaterial({uniforms:{sunDirection:sunUniform},vertexShader:'#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 worldNormal;varying vec3 worldPosition;void main(){worldNormal=normalize(mat3(modelMatrix)*normal);worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);\n#include <logdepthbuf_vertex>\n}',fragmentShader:`#include <logdepthbuf_pars_fragment>
uniform vec3 sunDirection;varying vec3 worldNormal;varying vec3 worldPosition;void main(){
#include <logdepthbuf_fragment>
vec3 n=normalize(worldNormal);vec3 v=normalize(cameraPosition-worldPosition);float rim=pow(1.-abs(dot(n,v)),${outer?'4.0':'5.0'});float light=dot(n,sunDirection);float lit=smoothstep(-.4,.8,light);float twilight=exp(-pow(light*4.,2.));vec3 col=mix(vec3(.055,.18,.4),vec3(.15,.51,1.),lit);col=mix(col,vec3(.9,.33,.12),twilight*.22);gl_FragColor=vec4(col,rim*${outer?'.27':'.55'}*(.40+lit*.60));}`,side:outer?THREE.BackSide:THREE.FrontSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));}
 group.add(atmosphere(R+.032,false));group.add(atmosphere(R+.075,true));
 const orbitRing=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:241},(_,i)=>{const a=i/240*Math.PI*2;return new THREE.Vector3(Math.cos(a)*3.05,Math.sin(a)*3.05,0);})),new THREE.LineBasicMaterial({color:0x69818d,transparent:true,opacity:.10}));orbitRing.rotation.set(1.12,.4,-.35);scene.add(orbitRing);
 createStarfield(scene).ready.catch(()=>{});canvas.dataset.starfield='distant-directions';
 let home=true,zoom=0,targetZoom=0,rotation=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let orbitalDistance=12.4,displayDistance=12.4,orbitalFocused=false;
 let targetQ=orientation(17,77);group.quaternion.copy(targetQ);
 let targetSun=sun.clone(),pointer={x:0,y:0},down=null,frame=0,flight=null,cloudOn=true;
 const axisY=new THREE.Vector3(0,1,0),axisX=new THREE.Vector3(1,0,0);
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
 function leaveHome(){onInteract?.();}
 canvas.addEventListener('pointerdown',e=>{if(driver)return;if(e.button!==0)return;leaveHome();rotation=false;flight=null;canvas.setPointerCapture(e.pointerId);down={x:e.clientX,y:e.clientY};canvas.classList.add('dragging');});
 canvas.addEventListener('pointermove',e=>{if(driver)return;pointer={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;const qy=new THREE.Quaternion().setFromAxisAngle(axisY,dx*.0045),qx=new THREE.Quaternion().setFromAxisAngle(axisX,dy*.0045);targetQ.premultiply(qy).premultiply(qx);down={x:e.clientX,y:e.clientY};});
 const end=()=>{down=null;canvas.classList.remove('dragging');};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);

 let pinch=null;canvas.addEventListener('touchstart',e=>{if(driver)return;if(e.touches.length===2){pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);down=null;}},{passive:true});canvas.addEventListener('touchmove',e=>{if(driver)return;if(e.touches.length===2&&pinch){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(orbital)orbitalDistance=THREE.MathUtils.clamp(orbitalDistance*pinch/d,3.6,80);else targetZoom=THREE.MathUtils.clamp(targetZoom+(d-pinch)*.003,0,1);pinch=d;down=null;}},{passive:true});canvas.addEventListener('touchend',()=>pinch=null);
 let driver=null,arrivalStart=null,arrivalTarget=null;
 const clock=new THREE.Clock();const temp=new THREE.Vector3(),world=new THREE.Vector3(),inverse=new THREE.Quaternion();
 function animate(t){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;frame++;
 if(driver){driver(t,dt);group.updateMatrixWorld();camera.updateMatrixWorld();renderer.render(scene,camera);return;}
 if(flight){const p=Math.min(1,(t-flight.start)/flight.duration),ease=p*p*(3-2*p);targetQ.slerpQuaternions(flight.from,flight.to,ease);targetZoom=THREE.MathUtils.lerp(flight.fromZoom??0,flight.zoom,ease)-Math.sin(Math.PI*ease)*.12;if(p===1)flight=null;}
 else if(!orbital&&rotation&&!reduced&&!down){targetQ.premultiply(new THREE.Quaternion().setFromAxisAngle(axisY,dt*.021));}
 group.quaternion.slerp(targetQ,1-Math.exp(-dt*5));zoom+=(targetZoom-zoom)*(1-Math.exp(-dt*3));
 const narrow=innerWidth<760;const x=orbital?(narrow||orbitalFocused?0:orbitalDistance<20?1.45:0):story?(narrow?.15:1.20):home?(narrow?.3:1.95):0;group.position.x+=(x-group.position.x)*(1-Math.exp(-dt*2));group.position.y+=((orbital?(narrow?1.1:.4):story&&narrow?1.25:home&&narrow?.88:.13)-group.position.y)*(1-Math.exp(-dt*2));
 camera.position.z=10.5-zoom*6.65;camera.position.x+=((reduced?0:pointer.x*.06)-camera.position.x)*.04;camera.position.y+=((reduced?0:-pointer.y*.04)-camera.position.y)*.04;camera.lookAt(0,0,0);
 if(orbital){displayDistance+=(orbitalDistance-displayDistance)*(1-Math.exp(-dt*3));camera.position.z=displayDistance*(narrow?1.65:1);camera.lookAt(0,0,0);}
 if(story&&!storyNight)targetSun.copy(camera.position).sub(group.position).normalize().add(new THREE.Vector3(-.16,.25,0)).normalize();
 storyFill.intensity+=((story&&!storyNight?.85:0)-storyFill.intensity)*(1-Math.exp(-dt*3));
 canvas.dataset.lighting=storyNight?'night':'day';
 sun.lerp(targetSun,1-Math.exp(-dt*3)).normalize();light.position.copy(group.position).addScaledVector(sun,10);light.target.position.copy(group.position);light.target.updateMatrixWorld();
 if(!reduced&&!orbital)clouds.rotation.y+=dt*.002;clouds.material.opacity+=(cloudOn?.84-clouds.material.opacity:-clouds.material.opacity)*.07;
 orbitRing.position.copy(group.position);orbitRing.material.opacity=orbital?0:(1-zoom)*.10;
 if(!lunar){const mobileDistance=mobileCamera(camera,{zoom,orbitalDistance:orbital?displayDistance:null});if(mobileDistance!==null){group.position.x=0;group.position.y=0;camera.position.set(0,0,mobileDistance);camera.lookAt(0,0,0);}}
 group.updateMatrixWorld();camera.updateMatrixWorld();
 if(frame%15===0){inverse.copy(group.quaternion).invert();temp.set(0,0,1).applyQuaternion(inverse);onView?.({lat:Math.asin(temp.y)*180/Math.PI,lon:Math.atan2(-temp.z,temp.x)*180/Math.PI,altitude:Math.round((camera.position.z-R)*6371/R),zoom,rotation});}
 attachedLayer?.update(t,dt);
 canvas.dataset.cityLights=citiesUniform.value>0?"on":"off";
 canvas.dataset.cameraDistance=camera.position.z.toFixed(4);
 if(!lunar&&incomingJourney?.pose){
  if(assetsReady&&arrivalStart===null){prepareJourneyUI();arrivalStart=t;arrivalTarget={position:group.position.clone(),camera:camera.position.clone(),quaternion:group.quaternion.clone(),offset:camera.view?.enabled?camera.view.offsetY:0};requestAnimationFrame(finishArrival);}
  const pose=incomingJourney.pose,p=arrivalStart===null?0:THREE.MathUtils.smoothstep((t-arrivalStart)/480,0,1);
  journeyUI(THREE.MathUtils.smootherstep((p-.15)/.85,0,1),p===1);
  if(p<1){mobileOffset(camera,(pose.offset||0)*(1-p)+(arrivalTarget?.offset||0)*p);if(pose.offsetX)camera.setViewOffset(innerWidth,innerHeight,pose.offsetX*(1-p),camera.view?.offsetY||0,innerWidth,innerHeight);group.position.fromArray(pose.position).lerp(arrivalTarget?.position||new THREE.Vector3(),p);group.quaternion.fromArray(pose.quaternion).slerp(arrivalTarget?.quaternion||targetQ,p);camera.position.fromArray(pose.camera).lerp(arrivalTarget?.camera||new THREE.Vector3(0,0,10.5),p);camera.lookAt(0,0,0);group.updateMatrixWorld();camera.updateMatrixWorld();}
 }
 renderer.render(scene,camera);
 }
 group.position.set(innerWidth<760?.3:1.95,innerWidth<760?.88:.13,0);requestAnimationFrame(animate);
 if(!lunar)registerNavigation(async(url,prepared)=>{
  await warmJourney(url);
  prepared();beginJourneyUI(true);
  const fromOffset=camera.view?.enabled?camera.view.offsetY:0;
  const from={position:group.position.clone(),camera:camera.position.clone(),quaternion:group.quaternion.clone()},start=performance.now(),duration=reduced?0:160;
  driver=t=>{journeyUI(reduced?0:1-THREE.MathUtils.smoothstep((t-start)/160,0,1));const p=duration?THREE.MathUtils.smootherstep((t-start)/duration,0,1):1;
   mobileOffset(camera,fromOffset);group.position.copy(from.position);camera.position.copy(from.camera);camera.lookAt(0,0,0);
   light.position.copy(group.position).addScaledVector(sun,10);light.target.position.copy(group.position);light.target.updateMatrixWorld();
   if(p===1){driver=()=>{};const q=group.quaternion.clone().multiply(globe.quaternion);leaveWithFrame(url,renderer,scene,camera,{position:group.position.toArray(),quaternion:q.toArray(),camera:camera.position.toArray(),offset:fromOffset,sun:sun.toArray()});}
  };
 });
 return {
  whenReady,
  createOverlay(factory){return factory({scene,group,camera,renderer,radius:R,sunDirection:sun,hideOrbitRing(){orbitRing.visible=false;},lightFrame(){targetSun.copy(camera.position).sub(group.position).normalize().add(new THREE.Vector3(-.16,.25,0)).normalize();sun.copy(targetSun);light.position.copy(group.position).addScaledVector(sun,10);light.target.position.copy(group.position);light.target.updateMatrixWorld();}});},
  setFrameDriver(fn){driver=fn;},
  setOrbitalTime(seconds){if(orbital){globe.rotation.y=seconds*Math.PI*2/86164.0905;clouds.rotation.y=globe.rotation.y;}},
  setOrbitFocus(on){orbitalFocused=on;},
  trackOrbit(lat,lon){rotation=false;flight=null;targetQ.copy(orientation(lat,lon));},
  frameOrbit(distance){orbitalDistance=THREE.MathUtils.clamp(distance,3.6,80);},
  attachLayer(factory){attachedLayer=factory({scene,group,camera,renderer,radius:R,geographic});return attachedLayer;},
  setCityLights(on){citiesUniform.value=on?1:0;},
  explore(){},
  home(){home=true;targetZoom=0;rotation=true;flight=null;targetQ.copy(orientation(17,77));targetSun.fromArray(daylight).normalize();},
  flyTo(lat,lon,close=.50,duration=3400){home=false;rotation=false;flight={from:group.quaternion.clone(),to:orientation(lat,lon),fromZoom:zoom,zoom:Math.min(close,innerWidth<760?.28:.66),start:performance.now(),duration:reduced?200:duration};},
  zoom(delta){leaveHome();flight=null;if(orbital){orbitalDistance=THREE.MathUtils.clamp(orbitalDistance*Math.exp(-delta*3),3.6,80);return;}targetZoom=THREE.MathUtils.clamp(targetZoom+delta,0,1);},
  setLight(value){const a=(value-12)/12*Math.PI;targetSun.set(Math.sin(a),.32,Math.cos(a)).normalize();},
  mode(name){storyNight=story&&name==='night';if(name==='night')targetSun.set(.35,.15,-1).normalize();if(name==='day')targetSun.fromArray(daylight).normalize();if(name==='sunset')targetSun.set(-1,.15,.08).normalize();},
  setClouds(v){cloudOn=v;},setRotation(v){rotation=v;},setReduced(v){reduced=v;},
  screenshot(){renderer.render(scene,camera);return canvas.toDataURL('image/png');},
  getState(){return {home,zoom,cloudOn,rotation,cameraDistance:camera.position.z};}
 };
}
