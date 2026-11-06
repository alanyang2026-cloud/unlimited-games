let grid,score,best=0;
const B=document.getElementById('board');

function init(){
  grid=Array.from({length:4},()=>Array(4).fill(0));
  score=0;upsc();add();add();render();
}

function add(){
  const empty=[];
  grid.forEach((r,y)=>r.forEach((v,x)=>{if(!v)empty.push({x,y})}));
  if(!empty.length)return;
  const {x,y}=empty[~~(Math.random()*empty.length)];
  grid[y][x]=Math.random()<.9?2:4;
}

function render(){
  B.innerHTML='';
  grid.forEach(row=>row.forEach(v=>{
    const d=document.createElement('div');
    d.className='cell'+(v?` c${v}`:'');
    d.textContent=v||'';
    if(v)d.classList.add('pop');
    B.appendChild(d);
  }));
}

function upsc(){
  document.getElementById('sc').textContent=score;
  if(score>best){best=score;document.getElementById('bst').textContent=best}
}

function slide(row){
  let r=row.filter(v=>v),changed=false,pts=0;
  for(let i=0;i<r.length-1;i++){
    if(r[i]===r[i+1]){r[i]*=2;pts+=r[i];r.splice(i+1,1);changed=true;i++}
  }
  while(r.length<4)r.push(0);
  return{r,changed,pts};
}

function move(dx,dy){
  let moved=false,pts=0;
  for(let i=0;i<4;i++){
    let row=[];
    for(let j=0;j<4;j++)row.push(dy===0?grid[i][dx<0?j:3-j]:grid[dx===0?j:3-j][i]);
    const {r,changed,pts:p}=slide(row);
    if(changed){moved=true;pts+=p}
    for(let j=0;j<4;j++){
      if(dy===0)grid[i][dx<0?j:3-j]=r[j];
      else grid[dx===0?j:3-j][i]=r[j];
    }
  }
  if(moved){score+=pts;upsc();add();render();checkEnd()}
}

function checkEnd(){
  // win
  if(grid.flat().includes(2048)){end('🎉 You Win!');return}
  // lose
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){
    if(!grid[y][x])return;
    if(x<3&&grid[y][x]===grid[y][x+1])return;
    if(y<3&&grid[y][x]===grid[y+1][x])return;
  }
  end('💀 Game Over');
}

function end(msg){
  document.getElementById('ov-title').textContent=msg;
  document.getElementById('ov-sc').textContent=score;
  document.getElementById('ov').style.display='flex';
}

document.addEventListener('keydown',e=>{
  const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],
           a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]};
  const v=m[e.key];if(!v)return;
  e.preventDefault();move(...v);
});

let tx=0,ty=0;
document.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>20)move(dx>0?1:-1,0);
  else if(Math.abs(dy)>20)move(0,dy>0?1:-1);
},{passive:true});

init();

// CSP-safe click dispatcher (document-level delegation, works for dynamic buttons too)
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-h]');
  if (!el) return;
  const h = el.getAttribute('data-h');
  if (h === "init()") { init(); }
  if (h === "init();document.getElementById('ov').style.display='none'") { init(); document.getElementById('ov').style.display='none'; }
});
