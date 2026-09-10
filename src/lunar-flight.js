import * as THREE from 'three';
export const MOON_SCALE=1737.4/6371;
export const MOON_POSITION=new THREE.Vector3(8,-8,44);
export function earthCamera(narrow){return new THREE.Vector3(0,0,narrow?17.325:10.5);}
export function moonCamera(distance,narrow){return MOON_POSITION.clone().add(new THREE.Vector3(narrow?0:-1.15*MOON_SCALE,narrow?-1.25*MOON_SCALE:-.15*MOON_SCALE,distance*MOON_SCALE*(narrow?1.46:1)));}
export function flightPose(progress,narrow,distance=10.8,options={}){
 const p=THREE.MathUtils.smoothstep(progress,0,1),q=1-p;
 const start=options.from?.clone()||earthCamera(narrow),end=options.to?.clone()||moonCamera(distance,narrow);
 const height=Math.max(start.z,end.z)+18;
 const c1=new THREE.Vector3(start.x,start.y,height),c2=new THREE.Vector3(end.x,end.y,height);
 const camera=start.clone().multiplyScalar(q*q*q).addScaledVector(c1,3*q*q*p).addScaledVector(c2,3*q*p*p).addScaledVector(end,p*p*p);
 const fromAim=options.fromAim||new THREE.Vector3(),toAim=options.toAim||MOON_POSITION.clone().add(new THREE.Vector3(narrow?0:-1.15*MOON_SCALE,narrow?-1.25*MOON_SCALE:-.15*MOON_SCALE,0));
 return {camera,aim:fromAim.clone().lerp(toAim,p)};
}
