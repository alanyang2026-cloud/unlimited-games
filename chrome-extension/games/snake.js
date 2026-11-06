const C=document.getElementById('c'),ctx=C.getContext('2d');
const SZ=20,W=20,H=20;
C.width=W*SZ;C.height=H*SZ;
let sn,dir,nd,food,sc,best=0,tid,alive=false;

function start(){
  document.getElementById('ov').style.display='none';
  sn=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir={x:1,y:0};nd={x:1,y:0};sc=0;upsc();placeFood();alive=true;
  clearInterval(tid);tid=setInterval(tick,110);
}

function placeFood(){
  do{food={x:~~(Math.random()*W),y:~~(Math.random()*H)}}
  while(sn.some(s=>s.x===food.x&&s.y===food.y));
}

function tick(){
  dir=nd;
  const h={x:sn[0].x+dir.x,y:sn[0].y+dir.y};
  if(h.x<0||h.x>=W||h.y<0||h.y>=H||sn.some(s=>s.x===h.x&&s.y===h.y)){over();return}
  sn.unshift(h);
  if(h.x===food.x&&h.y===food.y){sc+=10;upsc();placeFood();if(sc%100===0){clearInterval(tid);tid=setInterval(tick,Math.max(55,110-sc/2))}}
  else sn.pop();
  draw();
}

function draw(){
  ctx.fillStyle='#020f04';ctx.fillRect(0,0,C.width,C.height);
  // dots — subtle grid pattern
  ctx.fillStyle='#052e0f';
  for(let x=0;x<W;x++)for(let y=0;y<H;y++){ctx.fillRect(x*SZ+SZ/2-1,y*SZ+SZ/2-1,2,2)}
  // food — glowing amber apple
  ctx.shadowBlur=16;ctx.shadowColor='#fbbf24';ctx.fillStyle='#fbbf24';
  ctx.beginPath();ctx.arc(food.x*SZ+SZ/2,food.y*SZ+SZ/2,SZ/2-2,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // snake — bright green head, fading trail
  sn.forEach((s,i)=>{
    const t=i/sn.length;
    ctx.fillStyle=i===0?'#4ade80':`hsl(${140-t*10},${75-t*20}%,${55-t*20}%)`;
    ctx.shadowBlur=i===0?18:0;ctx.shadowColor='#22c55e';
    rr(s.x*SZ+1,s.y*SZ+1,SZ-2,SZ-2,4);
    ctx.shadowBlur=0;
  });
  // eyes
  const h=sn[0];ctx.fillStyle='white';
  const off=SZ/2;
  const e=dir.x!==0?[[off,off-4],[off,off+4]]:[[off-4,off],[off+4,off]];
  const ex=dir.x>0?4:dir.x<0?-4:0,ey=dir.y>0?4:dir.y<0?-4:0;
  [[off+ex+(dir.y?-3:0),off+ey+(dir.x?-3:0)],[off+ex+(dir.y?3:0),off+ey+(dir.x?3:0)]].forEach(([ex2,ey2])=>{
    ctx.beginPath();ctx.arc(h.x*SZ+ex2,h.y*SZ+ey2,2.5,0,Math.PI*2);ctx.fill();
  });
}

function rr(x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();ctx.fill();
}

function over(){
  clearInterval(tid);alive=false;
  if(sc>best){best=sc;document.getElementById('bst').textContent=best}
  const ov=document.getElementById('ov');
  ov.innerHTML=`<h2>💀 Game Over</h2><p class="big">Score: <b>${sc}</b></p><p class="big">Best: <b style="color:#f59e0b">${best}</b></p><button class="btn" onclick="start()">Play Again</button>`;
  ov.style.display='flex';
}
function upsc(){document.getElementById('sc').textContent=sc}

document.addEventListener('keydown',e=>{
  const m={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
           w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
  const n=m[e.key];if(!n)return;
  if(n.x!==-dir.x||n.y!==-dir.y)nd=n;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
});

// touch
let tx=0,ty=0;
document.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>Math.abs(dy)){nd=dx>0?{x:1,y:0}:{x:-1,y:0}}
  else{nd=dy>0?{x:0,y:1}:{x:0,y:-1}}
},{passive:true});

// CSP-safe click dispatcher (replaces inline onclick=)
(() => {
  document.querySelectorAll('[data-h]').forEach(el => {
    const h = el.getAttribute('data-h');
    if (h === "start()") el.addEventListener('click', () => { start(); });
  });
})();
