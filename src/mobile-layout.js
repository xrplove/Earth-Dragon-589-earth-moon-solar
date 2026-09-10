import './mobile-layout.css';
const media=matchMedia('(max-width:760px)');
export function mobileLayout(page){
 const root=document.querySelector('.world-shell');let panel=null,moved=[],observer=null,lastStageAction=-Infinity;
 const specs=Object.fromEntries(['planet','moon'].map(id=>[id,{copy:'.ex-copy',actions:['.ex-play','#ex-in','#ex-out'],body:['.ex-dock','.ex-readout','.ex-extra','.ex-detail'],context:()=>id==='planet'?'Our home planet':'Our celestial companion'}]));const spec=specs[page];
 // Move the live controls with return markers so listeners and desktop layout survive resizing.
 function move(selector,to){const node=root.querySelector(selector);if(!node)return;const marker=document.createComment('mobile layout return');node.before(marker);moved.push({node,marker});to.append(node);}
 function state(value){if(!panel)return;panel.dataset.state=value;panel.querySelector('#mobile-panel-toggle').setAttribute('aria-expanded',value==='open');panel.querySelector('#mobile-panel-toggle').textContent=value==='open'?'Back to globe ↓':'View controls ↑';panel.querySelector('#mobile-focus').textContent=value==='focus'?'Show controls':'Clear view';panel.querySelector('#mobile-focus').setAttribute('aria-pressed',value==='focus');panel.querySelector('.mobile-panel-body').inert=value!=='open';measure();}
 function measure(){if(!panel)return;const base=panel.dataset.state==='focus'?68:Math.min(300,Math.max(272,innerHeight*.29));root.style.setProperty('--mobile-peek',base+'px');window.__mobileGlobe={top:Math.max(80,document.querySelector('.site-header').getBoundingClientRect().bottom+8),bottom:innerHeight-base};}
 function mount(){
  if(panel||!spec)return;root.classList.add('mobile-observatory');panel=document.createElement('section');panel.className='mobile-panel';panel.setAttribute('aria-label','View and globe controls');panel.dataset.state='peek';panel.innerHTML='<div class="mobile-panel-heading"><span class="mobile-context"></span><button id="mobile-focus">Clear view</button></div><div class="mobile-summary"></div><div class="mobile-actions"></div><button id="mobile-panel-toggle" aria-expanded="false" aria-controls="mobile-panel-body">View controls ↑</button><div id="mobile-panel-body" class="mobile-panel-body"></div>';root.append(panel);
  move(spec.copy,panel.querySelector('.mobile-summary'));spec.actions.forEach(s=>move(s,panel.querySelector('.mobile-actions')));spec.body.forEach(s=>move(s,panel.querySelector('.mobile-panel-body')));
  panel.querySelector('#mobile-panel-toggle').onclick=()=>state(panel.dataset.state==='open'?'peek':'open');panel.querySelector('#mobile-focus').onclick=()=>state(panel.dataset.state==='focus'?'peek':'focus');
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.state==='open'){state('peek');panel.querySelector('#mobile-panel-toggle').focus();}});
  panel.addEventListener('click',e=>{if(e.target.closest('button[data-chapter]')){lastStageAction=performance.now();state('peek');}});
  const context=panel.querySelector('.mobile-context');const update=()=>{const text=spec.context();if(context.textContent!==text)context.textContent=text;};update();
  observer=new MutationObserver(records=>{update();for(const r of records)if(r.type==='attributes'&&r.attributeName==='hidden'&&r.target.matches('.ex-detail')&&!r.target.hidden&&performance.now()-lastStageAction>100){state('open');requestAnimationFrame(()=>r.target.scrollIntoView({block:'nearest',behavior:'smooth'}));}});observer.observe(panel,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});state('peek');
 }
 function unmount(){if(!panel)return;observer?.disconnect();for(const {node,marker} of moved.reverse()){marker.replaceWith(node);}moved=[];panel.remove();panel=null;root.classList.remove('mobile-observatory');root.style.removeProperty('--mobile-peek');delete window.__mobileGlobe;}
 function sync(){media.matches?mount():unmount();}media.addEventListener('change',sync);addEventListener('resize',measure);sync();
}
