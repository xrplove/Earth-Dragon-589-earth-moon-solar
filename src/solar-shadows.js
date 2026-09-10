import * as THREE from 'three';
// Analytic sphere/ring occlusion stays stable across the atlas-to-physical scale change.
export function saturnShadow(material,ringMap,isRing){
 const uniforms={ringCenter:{value:new THREE.Vector3()},ringSun:{value:new THREE.Vector3()},ringNormal:{value:new THREE.Vector3(0,1,0)},ringRadius:{value:1},ringTexture:{value:ringMap}};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec3 ringWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','ringWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>');
  shader.fragmentShader='varying vec3 ringWorld;uniform vec3 ringCenter,ringSun,ringNormal;uniform float ringRadius;uniform sampler2D ringTexture;\n'+shader.fragmentShader;
  const shadow=isRing?`
   vec3 towardPlanet=ringCenter-ringWorld;
   float along=dot(towardPlanet,ringSun);
   float miss=length(towardPlanet-along*ringSun)/ringRadius;
   float shade=step(0.0,along)*(1.0-smoothstep(.985,1.025,miss));
   outgoingLight*=1.0-.87*shade;
  `:`
   float denominator=dot(ringSun,ringNormal);
   float rayDistance=dot(ringCenter-ringWorld,ringNormal)/(abs(denominator)<.0001?.0001:denominator);
   float crossingRadius=length(ringWorld+ringSun*rayDistance-ringCenter)/ringRadius;
   float ringU=(crossingRadius-1.24)/1.08;
   float shade=step(0.0,rayDistance)*step(0.0,ringU)*step(ringU,1.0)*texture2D(ringTexture,vec2(clamp(ringU,0.0,1.0),.5)).a;
   outgoingLight*=1.0-.63*shade;
  `;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',shadow+'\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=>isRing?'saturn-ring-shadow-v1':'saturn-surface-shadow-v1';
 return {update(group,sun){uniforms.ringCenter.value.copy(group.position);uniforms.ringSun.value.copy(sun).sub(group.position).normalize();uniforms.ringNormal.value.set(0,1,0).applyQuaternion(group.quaternion);uniforms.ringRadius.value=group.scale.x;}};
}
