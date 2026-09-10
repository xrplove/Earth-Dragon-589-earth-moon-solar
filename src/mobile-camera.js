import * as THREE from 'three';
const frames=new WeakMap(),reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')??{matches:false};
export function mobileStage(){return globalThis.window?.__mobileGlobe||null;}
export function mobileCamera(camera,{radius=2.55,zoom=0,orbitalDistance=null}={}){
 const target=mobileStage();if(!target){if(camera.view?.enabled){camera.clearViewOffset();camera.updateProjectionMatrix();}frames.delete(camera);return null;}
 const now=performance.now(),previous=frames.get(camera),a=reducedMotion.matches?1:1-Math.exp(-Math.min((now-(previous?.time??now))/1000,.1)*10);
 const stage={top:previous?previous.top+(target.top-previous.top)*a:target.top,bottom:previous?previous.bottom+(target.bottom-previous.bottom)*a:target.bottom,time:now};frames.set(camera,stage);
 const available=Math.max(140,stage.bottom-stage.top),diameter=Math.min(innerWidth*.90,available*.90),tan=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
 const distance=radius*Math.sqrt(1+(innerHeight/(diameter*tan))**2);
 camera.setViewOffset(innerWidth,innerHeight,0,innerHeight/2-(stage.top+stage.bottom)/2,innerWidth,innerHeight);
 return orbitalDistance===null?distance*(1-zoom*.56):distance*orbitalDistance/10.5;
}

export function mobileOffset(camera,y){if(y){camera.setViewOffset(innerWidth,innerHeight,0,y,innerWidth,innerHeight);}else if(camera.view?.enabled){camera.clearViewOffset();}}
