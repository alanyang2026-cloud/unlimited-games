const EMOJIS=['🚀','🎮','⚡','🔥','💎','🌙','🎯','🦋','🌈','🎸','🏆','🍕','🦄','🎪','🎭','🌺'];
let flipped=[],matched=0,moves=0,pairs=0,lock=false,timerVal=0,timerID,started=false;

function startGame(){
  clearInterval(timerID);
  const cols=4,rows=4,total=cols*rows/2;
  const emojis=[...EMOJIS.slice(0,total),...EMOJIS.slice(0,total)].sort(()=>Math.random()-.5);
  const G=document.getElementById('grid');
  G.style.gridTemplateColumns=`repeat(${cols},70px)`;
  G.innerHTML='';
  flipped=[];matched=0;moves=0;pairs=0;lock=false;timerVal=0;started=false;
  upUI();
  emojis.forEach((e,i)=>{
    const card=document.createElement('div');
    card.className='card';
    card.dataset.emoji=e;
    card.innerHTML=`<div class="card-inner"><div class="back">${e}</div><div class="front">?</div></div>`;
    card.addEventListener('click',()=>flip(card));
    G.appendChild(card);
  });
}

function flip(card){
  if(lock||card.classList.contains('flipped')||card.classList.contains('matched'))return;
  if(!started){started=true;timerID=setInterval(()=>{timerVal++;document.getElementById('timer').textContent=timerVal+'s'},1000)}
  card.classList.add('flipped');
  flipped.push(card);
  if(flipped.length===2){
    moves++;upUI();lock=true;
    const [a,b]=flipped;
    if(a.dataset.emoji===b.dataset.emoji){
      a.classList.add('matched');b.classList.add('matched');
      matched++;pairs++;upUI();flipped=[];lock=false;
      if(matched===8){clearInterval(timerID);setTimeout(showWin,300)}
    } else {
      setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');flipped=[];lock=false},900);
    }
  }
}

function upUI(){
  document.getElementById('moves').textContent=moves;
  document.getElementById('pairs').textContent=`${pairs}/8`;
}

function showWin(){
  document.getElementById('win-stats').textContent=`${moves} moves · ${timerVal} seconds`;
  document.getElementById('win').style.display='flex';
}

startGame();

// CSP-safe click dispatcher (document-level delegation, works for dynamic buttons too)
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-h]');
  if (!el) return;
  const h = el.getAttribute('data-h');
  if (h === "startGame()") { startGame(); }
  if (h === "startGame();document.getElementById('win').style.display='none'") { startGame(); document.getElementById('win').style.display='none'; }
});
