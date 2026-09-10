// A single frame bridges same-origin documents; it never changes browser history.
try {
 const raw=sessionStorage.getItem('earth-journey');sessionStorage.removeItem('earth-journey');
 if(raw){const data=JSON.parse(raw);if(data.to===location.pathname&&Date.now()-data.at<30000&&/^data:image\/jpeg;base64,/.test(data.image)){
  window.__earthJourney=data;
  if(data.header){const bridge=document.createElement('div');bridge.id='journey-header';bridge.style.cssText='position:fixed;inset:0;z-index:9998;pointer-events:none';bridge.innerHTML=data.header;document.documentElement.append(bridge);const observer=new MutationObserver(()=>{if(document.querySelector('.world-shell>.site-header')&&!document.querySelector('#journey-frame')){requestAnimationFrame(()=>bridge.remove());observer.disconnect();}});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>{bridge.remove();observer.disconnect();},12000);}
  document.documentElement.classList.add('journey-running');document.documentElement.style.setProperty('--journey-ui','0');const frame=document.createElement('img');frame.id='journey-frame';frame.alt='';frame.src=data.image;frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:fill;z-index:20;background:#030609;pointer-events:none';document.documentElement.append(frame);setTimeout(()=>{if(!frame.isConnected)return;frame.remove();document.documentElement.classList.remove('journey-running');document.documentElement.style.removeProperty('--journey-ui');},12000);
 }}
}catch{/* Storage is optional. */}
