const C=document.getElementById('c'),ctx=C.getContext('2d');
const NC=document.getElementById('next'),nctx=NC.getContext('2d');
const W=10,H=20,SZ=20;
const COLORS=['#a855f7','#06b6d4','#f59e0b','#22c55e','#f43f5e','#e879f9','#38bdf8'];
const SHAPES=[
  [[1,1,1,1]],                      // I
  [[1,1],[1,1]],                    // O
  [[0,1,0],[1,1,1]],                // T
  [[0,1,1],[1,1,0]],                // S
  [[1,1,0],[0,1,1]],                // Z
  [[1,0,0],[1,1,1]],                // J
  [[0,0,1],[1,1,1]],                // L
];

let board,piece,next,score,level,lines,tid,running=false;

function rand(){return{shape:SHAPES[~~(Math.random()*SHAPES.length)],color:COLORS[~~(Math.random()*COLORS.length)]}}

function newPiece(p){
  const s=p.shape;
  return{shape:s,color:p.color,x:~~(W/2)-~~(s[0].length/2),y:0};
}

function startGame(){
  board=Array.from({length:H},()=>Array(W).fill(null));
  score=0;level=1;lines=0;upui();
  next=rand();piece=newPiece(rand());
  running=true;
  clearInterval(tid);drop();
  document.getElementById('startbtn').textContent='Restart';
}

function drop(){
  tid=setTimeout(()=>{
    if(!running)return;
    if(!move(0,1)){lock();clearLines();spawn();if(!running)return}
    drop();
  },Math.max(80,500-level*40));
}

function move(dx,dy){
  const nx=piece.x+dx,ny=piece.y+dy;
  if(collide(piece.shape,nx,ny))return false;
  piece.x=nx;piece.y=ny;draw();return true;
}

function rotate(){
  const s=piece.shape,rs=s[0].map((_,i)=>s.map(r=>r[i]).reverse());
  if(!collide(rs,piece.x,piece.y))piece.shape=rs;
  draw();
}

function hardDrop(){
  while(move(0,1));lock();clearLines();spawn();
}

function collide(shape,ox,oy){
  return shape.some((row,y)=>row.some((v,x)=>v&&(oy+y>=H||ox+x<0||ox+x>=W||(board[oy+y]&&board[oy+y][ox+x]))));
}

function lock(){
  piece.shape.forEach((row,y)=>row.forEach((v,x)=>{if(v)board[piece.y+y][piece.x+x]=piece.color}));
}

function clearLines(){
  let cleared=0;
  for(let y=H-1;y>=0;y--){
    if(board[y].every(v=>v)){board.splice(y,1);board.unshift(Array(W).fill(null));cleared++;y++}
  }
  if(cleared){
    const pts=[0,100,300,500,800][cleared]*level;
    score+=pts;lines+=cleared;
    level=Math.floor(lines/10)+1;
    upui();
  }
}

function spawn(){
  piece=newPiece(next);next=rand();
  if(collide(piece.shape,piece.x,piece.y)){
    running=false;clearInterval(tid);
    document.getElementById('ov-sc').textContent=score;
    document.getElementById('ov').style.display='flex';
  }
  draw();
}

function upui(){
  document.getElementById('sc').textContent=score;
  document.getElementById('lv').textContent=level;
  document.getElementById('ln').textContent=lines;
}

function draw(){
  ctx.fillStyle='#07070d';ctx.fillRect(0,0,C.width,C.height);
  // grid
  ctx.strokeStyle='#0d0d18';ctx.lineWidth=.5;
  for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(x*SZ,0);ctx.lineTo(x*SZ,H*SZ);ctx.stroke()}
  for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(0,y*SZ);ctx.lineTo(W*SZ,y*SZ);ctx.stroke()}
  // board
  board.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(ctx,x,y,v,SZ)}));
  // ghost
  let gy=piece.y;
  while(!collide(piece.shape,piece.x,gy+1))gy++;
  if(gy!==piece.y)piece.shape.forEach((row,y)=>row.forEach((v,x)=>{
    if(v){ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect((piece.x+x)*SZ+1,(gy+y)*SZ+1,SZ-2,SZ-2)}
  }));
  // piece
  piece.shape.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(ctx,piece.x+x,piece.y+y,piece.color,SZ)}));
  // next
  nctx.fillStyle='#0f0f1a';nctx.fillRect(0,0,80,80);
  const s=next.shape,ox=~~((4-s[0].length)/2),oy=~~((4-s.length)/2);
  s.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(nctx,ox+x,oy+y,COLORS[SHAPES.indexOf(s)%COLORS.length]||next.color,18)}));
}

function drawCell(c,x,y,color,sz){
  c.fillStyle=color;
  c.shadowBlur=6;c.shadowColor=color;
  c.fillRect(x*sz+1,y*sz+1,sz-2,sz-2);
  c.shadowBlur=0;
  c.fillStyle='rgba(255,255,255,.15)';
  c.fillRect(x*sz+1,y*sz+1,sz-2,3);
}

document.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key==='ArrowLeft')move(-1,0);
  else if(e.key==='ArrowRight')move(1,0);
  else if(e.key==='ArrowDown')move(0,1);
  else if(e.key==='ArrowUp'||e.key==='x')rotate();
  else if(e.key===' '){hardDrop();e.preventDefault()}
  else return;
  e.preventDefault();
});

// touch
let ts=null;
document.addEventListener('touchstart',e=>{ts={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()}},{passive:true});
document.addEventListener('touchend',e=>{
  if(!ts||!running)return;
  const dx=e.changedTouches[0].clientX-ts.x,dy=e.changedTouches[0].clientY-ts.y,dt=Date.now()-ts.t;
  if(dt<200&&Math.abs(dx)<15&&Math.abs(dy)<15){rotate();return}
  if(Math.abs(dx)>Math.abs(dy)){if(Math.abs(dx)>20)move(dx>0?1:-1,0)}
  else if(dy>30)dy>80?hardDrop():move(0,1);
},{passive:true});

// initial draw
ctx.fillStyle='#07070d';ctx.fillRect(0,0,C.width,C.height);

// CSP-safe click dispatcher (document-level delegation, works for dynamic buttons too)
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-h]');
  if (!el) return;
  const h = el.getAttribute('data-h');
  if (h === "startGame()") { startGame(); }
  if (h === "startGame();document.getElementById('ov').style.display='none'") { startGame(); document.getElementById('ov').style.display='none'; }
});
