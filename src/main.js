import {shell,$,bindZoom,reduced} from './exploration-shell.js';
import {createScene} from './scene.js';
const views=[
 {kicker:'01 / OUR HOME PLANET',title:'A world<br> worth exploring.',body:'Clouds, oceans, mountains, and the glow of cities. Turn the Earth in your hands and see our home from a different perspective.'},
 {kicker:'THE PACIFIC',title:'An ocean<br> of blue.',body:'Look across the largest ocean on Earth. Drag to explore its islands and coastlines.',lat:0,lon:-155},
 {kicker:'THE HIMALAYAS',title:'Where continents<br> meet the sky.',body:'Follow the mountain ranges across Asia. Approach the surface to explore the photographic mosaic.',lat:29,lon:85},
 {kicker:'AFTER SUNSET',title:'Another kind<br> of light.',body:'A static night-light composite reveals patterns of human settlement. Adjust the sunlight to find the edge of day.',lat:35,lon:15}
];
const ui=shell({id:'planet',...views[0],chapters:['Whole Earth','Pacific','Himalayas','Night lights'],rangeLabel:'Sunlight',note:'NASA-derived imagery · Illustrative lighting · Drag to rotate · Scroll to zoom',legend:'<span>6,371 km mean radius</span>',sources:'<p>Earth surface, relief, water, and cloud maps use NASA-derived imagery distributed through <a href="https://github.com/turban/webgl-earth" target="_blank" rel="noopener">WebGL Earth</a>. Night imagery is distributed through <a href="https://github.com/vasturiano/three-globe" target="_blank" rel="noopener">three-globe</a>.</p><p>These are static composites, not live weather or observations. Sunlight, cloud motion, terrain shading, and city brightness are adjusted for exploration. The star background uses the HYG catalog, credited to David Nash / Astronomy Nexus under CC BY-SA 4.0.</p><p>See the repository’s CREDITS.md for source links and asset terms.</p>'});
const scene=createScene($('#earth-canvas'),{exposure:1.28,daylight:[-.4,.32,1],onInteract:()=>spin(false)});scene.setReduced(reduced());bindZoom(scene);
function spin(on){scene.setRotation(on);$('.ex-play').setAttribute('aria-pressed',String(on));$('.ex-play').textContent=on?'Ⅱ Pause rotation':'▶ Rotate';}
$('.ex-play').onclick=()=>spin($('.ex-play').getAttribute('aria-pressed')!=='true');
$('#ex-range').value=.5+Math.atan2(-.4,1)/(2*Math.PI);$('#ex-range').oninput=e=>scene.setLight(+e.target.value*24);
document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{const i=+b.dataset.chapter;ui.active(i);ui.copy(String(i),views[i]);$('#ex-range').value=.5+Math.atan2(i===3?.35:-.4,i===3?-1:1)/(2*Math.PI);if(i===0){scene.home();spin(true);}else{scene.flyTo(views[i].lat,views[i].lon,.25);scene.mode(i===3?'night':'day');spin(false);}});
ui.readout('Our home','EARTH · THE THIRD PLANET');spin(!reduced());
try{await scene.whenReady;if($('#earth-canvas').dataset.assetError)throw Error('Earth texture unavailable');ui.ready();}catch(e){ui.status('Some Earth imagery could not load. Reload to try again.');console.error(e);}
