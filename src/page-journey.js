let navigate=null,busy=false;
export function registerNavigation(handler){navigate=handler;}
export const incomingJourney=globalThis.window?.__earthJourney||null;
export function prepareJourneyUI(){
 const root=document.documentElement,active=root.classList.contains('journey-running');
 root.classList.remove('journey-running');root.classList.add('journey-measuring');
 document.querySelectorAll('.world-shell>:not(canvas)').forEach(node=>node.style.setProperty('--journey-base-opacity',getComputedStyle(node).opacity));
 root.classList.remove('journey-measuring');if(active)root.classList.add('journey-running');
}
export function beginJourneyUI(visible=false){
 prepareJourneyUI();
 const root=document.documentElement;root.style.setProperty('--journey-ui',visible?'1':'0');root.classList.add('journey-running');
}
export function journeyUI(value,complete=false){
 const root=document.documentElement;root.style.setProperty('--journey-ui',String(Math.max(0,Math.min(1,value))));
 if(complete){root.classList.remove('journey-running');root.style.removeProperty('--journey-ui');}
}
export function finishArrival(){
 const image=document.querySelector('#journey-frame');if(!image)return;
 image.remove();
}
function headerBridge(){
 const header=document.querySelector('.site-header');if(!header)return '';
 const clone=header.cloneNode(true),originals=[header,...header.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
 const properties=['display','position','align-items','justify-content','flex-direction','gap','font-family','font-size','font-weight','line-height','letter-spacing','color','background','border','border-radius','padding','margin','width','height','text-decoration','box-sizing','white-space','fill','stroke','stroke-width'];
 originals.forEach((node,i)=>{const style=getComputedStyle(node);for(const key of properties)copies[i].style.setProperty(key,style.getPropertyValue(key));copies[i].style.opacity=style.opacity;copies[i].style.animation='none';copies[i].style.transition='none';copies[i].removeAttribute('class');copies[i].removeAttribute('id');copies[i].removeAttribute('data-experience');});
 const rect=header.getBoundingClientRect();Object.assign(clone.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',opacity:'1',pointerEvents:'none'});return clone.outerHTML;
}
export function leaveWithFrame(url,renderer,scene,camera,pose){
 renderer.render(scene,camera);
 try{sessionStorage.setItem('earth-journey',JSON.stringify({to:new URL(url,location.href).pathname,at:Date.now(),pose,header:headerBridge(),image:renderer.domElement.toDataURL('image/jpeg',.94)}));}catch{/* Storage may be disabled; navigation still works. */}
 location.assign(url);
}
globalThis.document?.addEventListener('click',async e=>{
 const link=e.target.closest('a[data-experience]');if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||link.target==='_blank')return;
 const to=new URL(link.href);if(to.pathname===location.pathname||!navigate)return;
 if(!['/moon.html','/solar.html'].includes(to.pathname)&&!['/moon.html','/solar.html'].includes(location.pathname))return;
 e.preventDefault();if(busy)return;busy=true;
 const status=document.createElement('div');status.className='journey-loading';status.setAttribute('role','status');status.textContent='Preparing the journey…';document.body.append(status);
 try{dispatchEvent(new Event('earth:depart'));await navigate(to.href,()=>status.remove());}catch(error){console.error(error);location.assign(to.href);}
});

// A completed departure is frozen for capture. Do not restore that frozen frame
// if the browser puts the old document back from its back/forward cache.
globalThis.addEventListener?.('pageshow',event=>{if(event.persisted&&busy)location.reload();});

// Warm navigation assets while the visitor considers a destination. No scripts execute here.
const warmed=new Map();
const decodedJourneyImages=[];
export function warmJourney(url){
 const path=new URL(url,location.href).pathname;if(warmed.has(path))return warmed.get(path);
 fetch(path).then(r=>r.text()).then(html=>{const doc=new DOMParser().parseFromString(html,'text/html');for(const node of doc.querySelectorAll('script[type=module][src],link[rel=stylesheet]')){const link=document.createElement('link');link.rel=node.tagName==='SCRIPT'?'modulepreload':'preload';if(node.tagName!=='SCRIPT')link.as='style';link.href=node.src||node.href;document.head.append(link);}}).catch(()=>{});
 const assets=path==='/solar.html'?['/data/solar/catalog.json',...[199,299,399,499,599,699,799,899].map(id=>'/data/solar/'+id+'.json')]:[];
 const images=path==='/moon.html'?['/textures/moon/color.jpg','/textures/moon/height.png']:path==='/solar.html'?['mercury','venus','mars','jupiter','saturn','uranus','neptune','sun'].map(name=>'/textures/solar/'+name+'.jpg'):[];
 const task=Promise.all([...assets.map(src=>fetch(src).catch(()=>{})),...images.map(src=>{const image=new Image();decodedJourneyImages.push(image);image.src=src;return image.decode().catch(()=>{});})]);warmed.set(path,task);return task;
}
globalThis.document?.addEventListener('pointerover',e=>{const link=e.target.closest('a[data-experience]');if(link)warmJourney(link.href);},{passive:true});
globalThis.document?.addEventListener('focusin',e=>{const link=e.target.closest('a[data-experience]');if(link)warmJourney(link.href);});
