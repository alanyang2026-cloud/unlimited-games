// New Tab page — reuses the same game catalog as the popup, but runs
// directly on our own extension page so we can render the overlay
// without needing chrome.scripting.executeScript (which Chrome blocks
// on the default new-tab page).
const SITE = 'https://unlimitedgames.vercel.app';
const FRAME_W = 764, FRAME_H = 528;

const GAMES = [
  { id:'snake',         title:'Snake',         emoji:'🐍', url:'/games/snake.html',           c1:'#16a34a', c2:'#0d9488' },
  { id:'2048',          title:'2048',          emoji:'🔢', url:'/games/2048.html',            c1:'#a855f7', c2:'#6d28d9' },
  { id:'tetris',        title:'Tetris',        emoji:'🧱', url:'/games/tetris.html',          c1:'#06b6d4', c2:'#1e40af' },
  { id:'flappy',        title:'Flappy',        emoji:'🐦', url:'/games/flappy.html',          c1:'#facc15', c2:'#ea580c' },
  { id:'breakout',      title:'Breakout',      emoji:'🏓', url:'/games/breakout.html',        c1:'#f43f5e', c2:'#b91c1c' },
  { id:'memory',        title:'Memory',        emoji:'🃏', url:'/games/memory.html',          c1:'#ec4899', c2:'#a21caf' },
  { id:'snake-battle',  title:'Snake Battle',  emoji:'⚔️', url:'/games/snake-battle.html',   c1:'#7c3aed', c2:'#581c87', live:true },
  { id:'arcade-brawl',  title:'Arcade Brawl',  emoji:'🥊', url:'/games/arcade-brawl.html',   c1:'#e11d48', c2:'#b45309', live:true },
  { id:'doorman',       title:'Night Watch',   emoji:'🚪', url:'/games/doorman.html',         c1:'#7f1d1d', c2:'#1c1917' },
  { id:'door-escape',   title:'Find Door',     emoji:'🏃', url:'/games/door-escape.html',     c1:'#4338ca', c2:'#581c87' },
  { id:'downhill',      title:'Downhill',      emoji:'🚵', url:'/games/downhill-brawl.html',  c1:'#15803d', c2:'#b45309' },
  { id:'chess',         title:'Rated Chess',   emoji:'♔', url:'/games/chess.html',            c1:'#d97706', c2:'#292524' },
  { id:'squish',        title:'Squishy',       emoji:'🫧', url:'/games/squish.html',           c1:'#f472b6', c2:'#a855f7' },
  { id:'liars-tavern',  title:"Liar's Tavern", emoji:'🍻', url:'/games/liars-tavern.html',    c1:'#78350f', c2:'#0c0a09', live:true },
  { id:'hero-brawl',    title:'Hero Brawl',    emoji:'🦸', url:'/games/hero-brawl.html',      c1:'#059669', c2:'#b45309' },
  { id:'potato-bros',   title:'Potato Bros',   emoji:'🥔', url:'/games/potato-bros.html',     c1:'#b45309', c2:'#65a30d' },
  { id:'animal-survival', title:'Animal Survival', emoji:'🦌', url:'/games/animal-survival.html', c1:'#14532d', c2:'#0c0a09', live:true },
];

// ─── Google search ─────────────────────────────────────────
document.getElementById('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  if(!q) return;
  // If it looks like a URL, go directly; otherwise search
  if(/^https?:\/\//i.test(q) || /^[^\s]+\.[a-z]{2,}(\/|$)/i.test(q)){
    const url = /^https?:\/\//i.test(q) ? q : 'https://' + q;
    location.href = url;
  } else {
    location.href = 'https://www.google.com/search?q=' + encodeURIComponent(q);
  }
});

// ─── Render game grid ──────────────────────────────────────
const grid = document.getElementById('grid');
const frag = document.createDocumentFragment();
for(const g of GAMES){
  const card = document.createElement('div');
  card.className = 'card' + (g.live ? ' live' : '');
  card.style.setProperty('--c1', g.c1);
  card.style.setProperty('--c2', g.c2);
  card.title = g.title + (g.live ? ' (live multiplayer)' : '');
  card.innerHTML =
    '<div class="bg"></div>' +
    '<div class="inner">' +
      '<div class="emoji">' + g.emoji + '</div>' +
      '<div class="name">' + g.title + '</div>' +
    '</div>';
  card.addEventListener('click', () => openGame(g));
  frag.appendChild(card);
}
grid.appendChild(frag);

document.getElementById('fullSite').addEventListener('click', e => {
  e.preventDefault();
  location.href = SITE;
});
document.getElementById('privacy').addEventListener('click', e => {
  e.preventDefault();
  location.href = SITE + '/privacy';
});

// ─── 764×528 game overlay (runs on our own page — no injection) ─
function openGame(game){
  const old = document.getElementById('__ug_overlay');
  if(old) old.remove();

  const url = SITE + game.url;
  let ww = FRAME_W, hh = FRAME_H;
  const maxW = Math.max(360, window.innerWidth  - 40);
  const maxH = Math.max(360, window.innerHeight - 40);
  if(ww > maxW || hh > maxH){
    const scale = Math.min(maxW / ww, maxH / hh);
    ww = Math.floor(ww * scale);
    hh = Math.floor(hh * scale);
  }

  // Backdrop (dimmed layer, click closes)
  const back = document.createElement('div');
  back.id = '__ug_overlay';
  back.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(0,0,0,.72)',
    'backdrop-filter:blur(6px)',
    'z-index:2147483647',
    'display:flex', 'align-items:center', 'justify-content:center',
    'animation:__ug_fadein .18s ease',
  ].join(';');

  // Inject animation once
  if(!document.getElementById('__ug_style')){
    const st = document.createElement('style');
    st.id = '__ug_style';
    st.textContent = '@keyframes __ug_fadein{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(st);
  }

  // Game frame
  const frame = document.createElement('div');
  frame.style.cssText = [
    'width:' + ww + 'px', 'height:' + hh + 'px',
    'background:#07070d',
    'border-radius:12px',
    'box-shadow:0 30px 80px rgba(0,0,0,.6), 0 0 0 1px ' + game.c1,
    'overflow:hidden',
    'display:flex', 'flex-direction:column',
    'position:relative',
  ].join(';');

  // Title bar
  const bar = document.createElement('div');
  bar.style.cssText = [
    'height:34px', 'flex-shrink:0',
    'background:linear-gradient(180deg, #1e1b4b, #0a0612)',
    'color:#fef3c7',
    'display:flex', 'align-items:center',
    'padding:0 10px', 'gap:8px',
    'font-size:12px', 'font-weight:600', 'letter-spacing:.5px',
    'border-bottom:1px solid rgba(168,85,247,.3)',
  ].join(';');
  const titleEl = document.createElement('span');
  titleEl.textContent = '🎮 ' + game.title;
  titleEl.style.cssText = 'flex:1; color:#fef3c7; font-size:13px; font-weight:700';
  bar.appendChild(titleEl);

  function makeBtn(text, bg, tooltip){
    const b = document.createElement('button');
    b.textContent = text;
    b.title = tooltip;
    b.style.cssText = [
      'all:unset', 'cursor:pointer',
      'width:22px', 'height:22px', 'border-radius:4px',
      'background:' + bg, 'color:#fff',
      'font-size:14px', 'font-weight:700', 'line-height:22px',
      'text-align:center',
    ].join(';');
    return b;
  }
  const newTabBtn = makeBtn('⤢', 'rgba(255,255,255,.12)', 'Open in new tab');
  const closeBtn  = makeBtn('×', '#dc2626', 'Close');
  bar.appendChild(newTabBtn);
  bar.appendChild(closeBtn);
  frame.appendChild(bar);

  // Iframe
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.allow = 'autoplay; fullscreen; gamepad; clipboard-read; clipboard-write';
  iframe.style.cssText = 'flex:1; width:100%; border:0; background:#07070d';
  frame.appendChild(iframe);

  back.appendChild(frame);
  document.body.appendChild(back);

  // ── Interactions ──
  function close(){ back.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e){ if(e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', close);
  newTabBtn.addEventListener('click', () => { window.open(url, '_blank'); close(); });
  // Click on backdrop (outside the frame) closes
  back.addEventListener('click', e => { if(e.target === back) close(); });
}
