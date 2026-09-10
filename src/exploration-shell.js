
import './style.css';

import './exploration.css';
import { siteHeader } from './site-header.js';
import { createTextTransition } from './text-transition.js';
export const $=s=>document.querySelector(s);
export const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function shell({id,kicker,title,body,chapters,rangeLabel,note,sources,legend=''}){
 document.querySelector('#app').innerHTML=`<main class="world-shell exploration ${id}"><canvas id="earth-canvas" tabindex="0" aria-label="Interactive ${id} globe. Drag to rotate; use the named controls to explore."></canvas><div class="veil"></div>${siteHeader(id)}<div class="ex-status" role="status">Preparing your view…</div><section class="ex-copy"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${body}</p></section><aside class="ex-readout"><strong></strong><span></span></aside><div class="ex-extra"><button id="ex-in" aria-label="Zoom in">+</button><button id="ex-out" aria-label="Zoom out">−</button></div><aside class="ex-detail" hidden></aside><section class="ex-dock" aria-label="Exploration controls"><div class="ex-dock-top"><div class="ex-chapters">${chapters.map((c,i)=>`<button data-chapter="${i}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><button class="ex-play" aria-pressed="false">▶ Play</button></div><div class="ex-range-row"><label for="ex-range">${rangeLabel}</label><input id="ex-range" type="range" min="0" max="1" step=".0001" value="0"></div><div class="ex-bottom"><span class="ex-note">${note}</span><div class="ex-legend">${legend}</div></div></section><dialog class="ex-dialog"><button class="ex-close" aria-label="Close sources">✕</button><h2>Behind the view.</h2>${sources}</dialog></main>`;
 const transition=createTextTransition($('.ex-copy'),v=>{$('.ex-copy .eyebrow').textContent=v.kicker;$('.ex-copy h1').innerHTML=v.title;$('.ex-copy p').textContent=v.body;});
 transition('intro',{kicker,title,body});
 $('#nav-science').onclick=()=>$('.ex-dialog').showModal();$('.ex-dialog .ex-close').onclick=()=>$('.ex-dialog').close();
 return {copy:(key,v)=>transition(key,v),status:text=>$('.ex-status').textContent=text,readout:(big,small)=>{$('.ex-readout strong').textContent=big;$('.ex-readout span').textContent=small;},active:i=>document.querySelectorAll('button[data-chapter]').forEach((b,j)=>b.setAttribute('aria-pressed',i===j)),ready:()=>{$('.world-shell').classList.add('ready');$('.ex-status').textContent='';}};
}
export function playback(onFrame){let playing=false,last=0;const button=$('.ex-play');function set(v){playing=v;button.setAttribute('aria-pressed',v);button.textContent=v?'Ⅱ Pause':'▶ Play';}button.onclick=()=>set(!playing);document.addEventListener('visibilitychange',()=>last=0);function tick(t){const dt=last?Math.min((t-last)/1000,.05):0;last=t;if(!document.hidden)onFrame(dt,playing,set);requestAnimationFrame(tick);}requestAnimationFrame(tick);return set;}
export function bindZoom(scene){$('#ex-in').onclick=()=>scene.zoom(.08);$('#ex-out').onclick=()=>scene.zoom(-.08);}
