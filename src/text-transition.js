// Keep a single latest destination. A settled headline must never replay because
// metadata changed or because a stale request survived a rapid scroll reversal.
export function createTextTransition(container, apply) {
 let shown=null, latest=null, running=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 async function animate(frames,options) {
  const animation=container.animate(frames,options);
  try {await animation.finished;} catch { /* A canceled animation must not strand the queue. */ }
  return animation;
 }
 async function drain() {
  if(running)return;
  running=true;
  try {
   while(latest&&latest.key!==shown) {
    const outgoing=reduced()?null:await animate(
     [{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],
     {duration:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
    // Input may have returned to the visible headline during the fade-out.
    const next=latest;
    if(next.key!==shown){apply(next.value);shown=next.key;}
    outgoing?.cancel();
    if(!reduced())await animate(
     [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],
     {duration:520,easing:'cubic-bezier(.16,1,.3,1)'});
   }
  } finally {running=false;}
 }
 return (key,value)=>{
  latest={key,value};
  if(shown===null){apply(value);shown=key;return;}
  if(key!==shown&&!running)void drain();
 };
}
