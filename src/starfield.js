import * as THREE from 'three';
// Catalog directions on the celestial sphere. Translation is deliberately absent:
// even the nearest real stars have negligible parallax on this exploration scale.
export const distantStarProjection=`
 vec3 skyDirection = mat3(viewMatrix) * normalize(position);
 vec4 skyClip = projectionMatrix * vec4(skyDirection * 100.0, 1.0);
 gl_Position = skyClip.xyww;
`;
export function createStarfield(scene){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'#fff');gradient.addColorStop(.2,'#ffffff99');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
 const material=new THREE.PointsMaterial({map:new THREE.CanvasTexture(canvas),size:2.4,sizeAttenuation:false,transparent:true,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending});
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',distantStarProjection);};material.customProgramCacheKey=()=> 'translation-free-starfield-v1';
 const geometry=new THREE.BufferGeometry(),stars=new THREE.Points(geometry,material);stars.name='Distant catalog stars';stars.frustumCulled=false;stars.renderOrder=-100;scene.add(stars);
 const ready=fetch('/data/stars.json').then(r=>{if(!r.ok)throw Error('Star catalog unavailable');return r.json();}).then(data=>{const pos=[],col=[];for(const [,ra,dec,mag,bv] of data.stars){const a=ra*Math.PI/12,d=dec*Math.PI/180;pos.push(Math.cos(d)*Math.cos(a),Math.sin(d),-Math.cos(d)*Math.sin(a));const color=new THREE.Color(bv>.8?0xffd7ac:0xb4d6ff),v=Math.max(.1,Math.min(.65,Math.pow(10,-.13*(mag-1))));col.push(color.r*v,color.g*v,color.b*v);}geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return stars;});
 return {stars,ready};
}
