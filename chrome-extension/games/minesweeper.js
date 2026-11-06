const DIFFS = {
  easy:   { cols:9,  rows:9,  mines:10 },
  normal: { cols:16, rows:16, mines:40 },
  hard:   { cols:30, rows:16, mines:99 },
};
let difficulty = 'easy';
let grid = [];        // 2D array of {mine, rev, flag, adj}
let cols, rows, mines;
let started = false, dead = false, won = false, flagMode = false;
let revealed = 0;     // non-mine cells revealed
let flags = 0;
let timerId = null, timeVal = 0;

const boardEl = document.getElementById('board');
const faceEl = document.getElementById('face');
const minesEl = document.getElementById('mines');
const timerEl = document.getElementById('timer');

function pad3(n){ return String(Math.max(0, Math.min(999, n))).padStart(3, '0'); }

function newGame(){
  const d = DIFFS[difficulty];
  cols = d.cols; rows = d.rows; mines = d.mines;
  grid = Array.from({length: rows}, () =>
    Array.from({length: cols}, () => ({ mine:false, rev:false, flag:false, adj:0 }))
  );
  started = false; dead = false; won = false;
  revealed = 0; flags = 0; timeVal = 0;
  clearInterval(timerId); timerId = null;
  faceEl.textContent = '🙂';
  render();
  updateHUD();
}

// Mines are placed AFTER the first click so the first click can't lose.
function placeMines(safeC, safeR){
  let placed = 0;
  while(placed < mines){
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if(grid[r][c].mine) continue;
    // Keep the first-click cell and its 8 neighbors mine-free so the
    // opening move always has room to flood-fill a chunk open.
    if(Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    grid[r][c].mine = true;
    placed++;
  }
  // Compute adjacency counts
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      if(grid[r][c].mine) continue;
      let n = 0;
      for(let dr = -1; dr <= 1; dr++){
        for(let dc = -1; dc <= 1; dc++){
          const nr = r+dr, nc = c+dc;
          if(nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) n++;
        }
      }
      grid[r][c].adj = n;
    }
  }
}

function render(){
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const cell = grid[r][c];
      const b = document.createElement('button');
      b.className = 'cell';
      b.dataset.r = r; b.dataset.c = c;
      if(cell.rev){
        b.classList.add('rev');
        if(cell.mine){
          b.classList.add('mine');
          if(cell.exploded) b.classList.add('exploded');
          b.textContent = '💣';
        } else if(cell.adj > 0){
          b.classList.add('n' + cell.adj);
          b.textContent = cell.adj;
        }
      } else if(cell.flag){
        b.classList.add('flag');
        b.textContent = '🚩';
        if(dead && !cell.mine) b.classList.add('wrong');
      }
      b.addEventListener('click', onClick);
      b.addEventListener('contextmenu', onRight);
      boardEl.appendChild(b);
    }
  }
}

function updateHUD(){
  minesEl.textContent = pad3(mines - flags);
  timerEl.textContent = pad3(timeVal);
}

function onClick(e){
  if(dead || won) return;
  const r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c;
  if(flagMode) return toggleFlagAt(r, c);
  reveal(r, c);
}
function onRight(e){
  e.preventDefault();
  if(dead || won) return;
  const r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c;
  toggleFlagAt(r, c);
}

function toggleFlagAt(r, c){
  const cell = grid[r][c];
  if(cell.rev) return;
  cell.flag = !cell.flag;
  flags += cell.flag ? 1 : -1;
  render();
  updateHUD();
}

function reveal(r, c){
  const cell = grid[r][c];
  if(cell.rev || cell.flag) return;
  if(!started){
    started = true;
    placeMines(c, r);
    timerId = setInterval(() => { timeVal++; updateHUD(); }, 1000);
  }
  if(cell.mine){
    cell.rev = true; cell.exploded = true;
    return explode();
  }
  // Flood fill via BFS when adj === 0
  const stack = [[r, c]];
  while(stack.length){
    const [cr, cc] = stack.pop();
    const cur = grid[cr][cc];
    if(cur.rev || cur.flag || cur.mine) continue;
    cur.rev = true;
    revealed++;
    if(cur.adj === 0){
      for(let dr = -1; dr <= 1; dr++){
        for(let dc = -1; dc <= 1; dc++){
          if(dr === 0 && dc === 0) continue;
          const nr = cr+dr, nc = cc+dc;
          if(nr >= 0 && nr < rows && nc >= 0 && nc < cols) stack.push([nr, nc]);
        }
      }
    }
  }
  if(revealed === rows * cols - mines) return victory();
  render();
}

function explode(){
  dead = true;
  clearInterval(timerId);
  // Reveal every mine (so the player sees what blew up / what they missed)
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      if(grid[r][c].mine) grid[r][c].rev = true;
    }
  }
  faceEl.textContent = '😵';
  render();
  setTimeout(() => showOv('💥 Boom!', 'You hit a mine.', true), 600);
}

function victory(){
  won = true;
  clearInterval(timerId);
  // Auto-flag the remaining unflagged mines (standard victory courtesy)
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      if(grid[r][c].mine && !grid[r][c].flag){ grid[r][c].flag = true; flags++; }
    }
  }
  faceEl.textContent = '😎';
  render();
  updateHUD();

  const key = 'mines_best_' + difficulty;
  const best = +(localStorage[key] || 0);
  let msg = `Cleared in ${timeVal}s · ${mines} mines`;
  if(!best || timeVal < best){
    localStorage[key] = timeVal;
    msg = `🏆 New best! Cleared in ${timeVal}s (was ${best || '—'}s)`;
  } else {
    msg += ` · Best: ${best}s`;
  }
  setTimeout(() => showOv('🎉 Swept!', msg, false), 400);
}

function showOv(title, msg, lose){
  document.getElementById('ov-title').textContent = title;
  document.getElementById('ov-title').className = lose ? 'lose' : '';
  document.getElementById('ov-msg').textContent = msg;
  document.getElementById('ov').classList.add('show');
}
function hideOv(){ document.getElementById('ov').classList.remove('show'); }

function toggleFlag(){
  flagMode = !flagMode;
  const btn = document.getElementById('mode');
  btn.textContent = '🚩 Flag Mode: ' + (flagMode ? 'ON' : 'OFF');
  btn.classList.toggle('flag-mode', flagMode);
}

document.getElementById('diff').addEventListener('click', e => {
  if(e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#diff button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  difficulty = e.target.dataset.d;
  newGame();
});

// Feedback: brief "😮" while clicking on the board
boardEl.addEventListener('mousedown', e => {
  if(!dead && !won && e.button === 0 && e.target.classList.contains('cell') && !e.target.classList.contains('rev') && !e.target.classList.contains('flag'))
    faceEl.textContent = '😮';
});
boardEl.addEventListener('mouseup', () => {
  if(!dead && !won) faceEl.textContent = '🙂';
});
boardEl.addEventListener('mouseleave', () => {
  if(!dead && !won) faceEl.textContent = '🙂';
});

newGame();

// CSP-safe click dispatcher (replaces inline onclick=)
addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-h]').forEach(el => {
    const h = el.getAttribute('data-h');
    if (h === "newGame()") el.addEventListener('click', () => { newGame(); });
    if (h === "toggleFlag()") el.addEventListener('click', () => { toggleFlag(); });
    if (h === "hideOv();newGame()") el.addEventListener('click', () => { hideOv(); newGame(); });
  });
});
