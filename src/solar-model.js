export const AU=149597870.7;
export const SOLAR_GM=132712440018;
export function stateAt(data,time){
 const f=Math.max(0,Math.min(data.states.length-1,(time-data.start)/data.step)),i=Math.min(data.states.length-2,Math.floor(f)),u=f-i,a=data.states[i],b=data.states[i+1],dt=data.step/1000;
 const h00=2*u*u*u-3*u*u+1,h10=u*u*u-2*u*u+u,h01=-2*u*u*u+3*u*u,h11=u*u*u-u*u;
 return [0,1,2].map(k=>h00*a[k]+h10*dt*a[k+3]+h01*b[k]+h11*dt*b[k+3]);
}
export function velocityAt(data,time){const f=Math.max(0,Math.min(data.states.length-1,(time-data.start)/data.step)),i=Math.min(data.states.length-2,Math.floor(f)),u=f-i,a=data.states[i],b=data.states[i+1],dt=data.step/1000;return [0,1,2].map(k=>((6*u*u-6*u)*a[k]+(3*u*u-4*u+1)*dt*a[k+3]+(-6*u*u+6*u)*b[k]+(3*u*u-2*u)*dt*b[k+3])/dt);}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],scale=(v,s)=>v.map(x=>x*s),norm=v=>scale(v,1/Math.hypot(...v));
// Instantaneous two-body reference ellipse. Dated positions use JPL vectors instead.
export function orbitEllipse(r,v,count=256){const h=cross(r,v),ecc=cross(v,h).map((x,i)=>x/SOLAR_GM-r[i]/Math.hypot(...r)),e=Math.hypot(...ecc),p=dot(h,h)/SOLAR_GM,a=norm(e>1e-9?ecc:r),b=cross(norm(h),a);return Array.from({length:count+1},(_,i)=>{const t=i/count*Math.PI*2,d=p/(1+e*Math.cos(t));return a.map((x,k)=>d*(x*Math.cos(t)+b[k]*Math.sin(t)));});}
export function moonWindow(body,data,time){const length=Math.min(body.period*86400000,data.step*(data.states.length-1)),start=Math.max(data.start,Math.min(time-length/2,data.start+data.step*(data.states.length-1)-length));return Array.from({length:201},(_,i)=>stateAt(data,start+length*i/200));}
