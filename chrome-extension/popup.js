// Game catalog — mirrors lib/games.ts on the website.
// `w`/`h` is the size of the floating overlay window shown on the
// user's current page when the game is launched.
const SITE = 'https://unlimitedgames.vercel.app';
const GAMES = [
  { id:'snake',         title:'Snake',         emoji:'🐍', url:'/games/snake.html',          c1:'#16a34a', c2:'#0d9488', w:600,  h:660 },
  { id:'2048',          title:'2048',          emoji:'🔢', url:'/games/2048.html',           c1:'#a855f7', c2:'#6d28d9', w:520,  h:720 },
  { id:'tetris',        title:'Tetris',        emoji:'🧱', url:'/games/tetris.html',         c1:'#06b6d4', c2:'#1e40af', w:500,  h:740 },
  { id:'flappy',        title:'Flappy',        emoji:'🐦', url:'/games/flappy.html',         c1:'#facc15', c2:'#ea580c', w:430,  h:680 },
  { id:'breakout',      title:'Breakout',      emoji:'🏓', url:'/games/breakout.html',       c1:'#f43f5e', c2:'#b91c1c', w:720,  h:620 },
  { id:'memory',        title:'Memory',        emoji:'🃏', url:'/games/memory.html',         c1:'#ec4899', c2:'#a21caf', w:640,  h:700 },
  { id:'snake-battle',  title:'Snake Battle',  emoji:'⚔️', url:'/games/snake-battle.html',  c1:'#7c3aed', c2:'#581c87', w:1100, h:760, live:true },
  { id:'arcade-brawl',  title:'Arcade Brawl',  emoji:'🥊', url:'/games/arcade-brawl.html',  c1:'#e11d48', c2:'#b45309', w:1000, h:620, live:true },
  { id:'doorman',       title:'Night Watch',   emoji:'🚪', url:'/games/doorman.html',        c1:'#7f1d1d', c2:'#1c1917', w:900,  h:680 },
  { id:'door-escape',   title:'Find Door',     emoji:'🏃', url:'/games/door-escape.html',    c1:'#4338ca', c2:'#581c87', w:900,  h:680 },
  { id:'downhill',      title:'Downhill',      emoji:'🚵', url:'/games/downhill-brawl.html', c1:'#15803d', c2:'#b45309', w:1000, h:700 },
  { id:'chess',         title:'Rated Chess',   emoji:'♔', url:'/games/chess.html',           c1:'#d97706', c2:'#292524', w:880,  h:780 },
  { id:'squish',        title:'Squishy',       emoji:'🫧', url:'/games/squish.html',          c1:'#f472b6', c2:'#a855f7', w:600,  h:640 },
  { id:'liars-tavern',  title:"Liar's Tavern", emoji:'🍻', url:'/games/liars-tavern.html',   c1:'#78350f', c2:'#0c0a09', w:1080, h:740, live:true },
  { id:'hero-brawl',    title:'Hero Brawl',    emoji:'🦸', url:'/games/hero-brawl.html',     c1:'#059669', c2:'#b45309', w:1100, h:720 },
];

// ─ Injected into the page: builds the floating game window ─────
// This whole function ships across as a string to the host page, so
// it cannot reference anything from the popup scope. Everything it
// needs is passed in via args.
function injectGameOverlay(url, title, w, h, accent){
  // Tear down any previous overlay first so re-launching is clean
  const old = document.getElementById('__ug_overlay');
  if(old) old.remove();

  // Cap to viewport with margin
  const maxW = Math.max(360, window.innerWidth  - 60);
  const maxH = Math.max(360, window.innerHeight - 80);
  const ww = Math.min(w, maxW);
  const hh = Math.min(h, maxH);

  const ov = document.createElement('div');
  ov.id = '__ug_overlay';
  ov.style.cssText = [
    'all: initial',
    'position: fixed',
    'top: ' + Math.max(20, (window.innerHeight - hh)/2) + 'px',
    'left: ' + Math.max(20, (window.innerWidth - ww)/2) + 'px',
    'width: ' + ww + 'px',
    'height: ' + hh + 'px',
    'z-index: 2147483647',
    'background: #07070d',
    'border-radius: 12px',
    'box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px ' + accent,
    'overflow: hidden',
    'font-family: -apple-system, system-ui, "Segoe UI", sans-serif',
  ].join(';');

  // Title bar (drag handle + close + open-in-tab buttons)
  const bar = document.createElement('div');
  bar.style.cssText = [
    'all: initial',
    'position: absolute', 'top: 0', 'left: 0', 'right: 0', 'height: 34px',
    'background: linear-gradient(180deg, #1e1b4b, #0a0612)',
    'color: #fef3c7', 'display: flex', 'align-items: center',
    'padding: 0 10px', 'gap: 8px', 'cursor: move', 'user-select: none',
    'font-family: -apple-system, system-ui, sans-serif',
    'font-size: 12px', 'font-weight: 600', 'letter-spacing: .5px',
    'border-bottom: 1px solid rgba(168,85,247,.3)',
  ].join(';');

  const titleEl = document.createElement('span');
  titleEl.textContent = '🎮 ' + title;
  titleEl.style.cssText = 'all: initial; flex: 1; color: #fef3c7; font-family: inherit; font-size: 13px; font-weight: 700';
  bar.appendChild(titleEl);

  function makeBtn(text, bg, tooltip){
    const b = document.createElement('button');
    b.textContent = text;
    b.title = tooltip;
    b.style.cssText = [
      'all: initial', 'cursor: pointer',
      'width: 22px', 'height: 22px', 'border-radius: 4px',
      'background: ' + bg, 'color: #fff',
      'font-family: -apple-system, system-ui, sans-serif',
      'font-size: 14px', 'font-weight: 700', 'line-height: 22px',
      'text-align: center', 'display: inline-block',
    ].join(';');
    return b;
  }
  const newTabBtn = makeBtn('⤢', 'rgba(255,255,255,.12)', 'Open in new tab');
  const closeBtn  = makeBtn('×',  '#dc2626', 'Close');
  bar.appendChild(newTabBtn);
  bar.appendChild(closeBtn);
  ov.appendChild(bar);

  // The actual game
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.allow = 'autoplay; fullscreen; gamepad; clipboard-read; clipboard-write';
  frame.style.cssText = [
    'all: initial', 'position: absolute',
    'top: 34px', 'left: 0', 'width: 100%', 'height: calc(100% - 34px)',
    'border: 0', 'background: #07070d',
  ].join(';');
  ov.appendChild(frame);

  // Resize handle (bottom-right)
  const grip = document.createElement('div');
  grip.style.cssText = [
    'all: initial', 'position: absolute',
    'right: 0', 'bottom: 0',
    'width: 18px', 'height: 18px',
    'cursor: nwse-resize',
    'background: linear-gradient(135deg, transparent 50%, rgba(168,85,247,.6) 50%)',
  ].join(';');
  ov.appendChild(grip);

  document.documentElement.appendChild(ov);

  // ── Wire up interactions ──────────────────────────────────
  closeBtn.addEventListener('click', () => ov.remove());

  newTabBtn.addEventListener('click', () => {
    window.open(url, '_blank', 'noopener');
    ov.remove();
  });

  // Drag the overlay around by the title bar
  let drag = null;
  bar.addEventListener('mousedown', e => {
    if(e.target === closeBtn || e.target === newTabBtn) return;
    drag = { x: e.clientX, y: e.clientY,
             ox: parseInt(ov.style.left, 10), oy: parseInt(ov.style.top, 10) };
    e.preventDefault();
  });
  // Resize via the grip
  let resize = null;
  grip.addEventListener('mousedown', e => {
    resize = { x: e.clientX, y: e.clientY, w: ov.offsetWidth, h: ov.offsetHeight };
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if(drag){
      ov.style.left = Math.max(0, Math.min(window.innerWidth-100, drag.ox + e.clientX - drag.x)) + 'px';
      ov.style.top  = Math.max(0, Math.min(window.innerHeight-60, drag.oy + e.clientY - drag.y)) + 'px';
    }
    if(resize){
      ov.style.width  = Math.max(360, resize.w + e.clientX - resize.x) + 'px';
      ov.style.height = Math.max(360, resize.h + e.clientY - resize.y) + 'px';
    }
  });
  window.addEventListener('mouseup', () => { drag = null; resize = null; });

  // Esc closes
  function onKey(e){ if(e.key === 'Escape'){ ov.remove(); window.removeEventListener('keydown', onKey); } }
  window.addEventListener('keydown', onKey);
}

// ─ Popup-side glue ─────────────────────────────────────────
async function launchGame(card){
  const url = SITE + card.dataset.url;
  const w = +card.dataset.w;
  const h = +card.dataset.h;
  const title = card.dataset.title;
  const accent = card.dataset.accent;

  // Find the current tab; some chrome:// pages don't allow injection,
  // in which case fall back to a popup window so the user still gets
  // to play.
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab || !tab.id || /^(chrome|chrome-extension|edge|about|chrome-search):/i.test(tab.url || '')){
      throw new Error('Cannot inject into this page');
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectGameOverlay,
      args: [url, title, w, h, accent],
    });
    window.close();
  } catch(err) {
    // Fallback — open a sized popup window
    chrome.windows.create({
      url, type: 'popup',
      width: Math.min(w, (screen.availWidth || 1280) - 60),
      height: Math.min(h, (screen.availHeight || 800) - 80),
    });
    window.close();
  }
}

// ─ Render the grid ────────────────────────────────────────
const grid = document.getElementById('grid');
const frag = document.createDocumentFragment();
for(const g of GAMES){
  const card = document.createElement('div');
  card.className = 'card' + (g.live ? ' live' : '');
  card.style.setProperty('--c1', g.c1);
  card.style.setProperty('--c2', g.c2);
  card.dataset.url = g.url;
  card.dataset.w = g.w;
  card.dataset.h = g.h;
  card.dataset.title = g.title;
  card.dataset.accent = g.c1;
  card.title = g.title + (g.live ? ' (live multiplayer)' : '');
  card.innerHTML =
    '<div class="bg"></div>' +
    '<div class="inner">' +
      '<div class="emoji">' + g.emoji + '</div>' +
      '<div class="name">' + g.title + '</div>' +
    '</div>';
  frag.appendChild(card);
}
grid.appendChild(frag);

grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if(card) launchGame(card);
});

// Footer links — these are website pages (not games), open as normal tabs
document.querySelectorAll('.ftr a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const url = (a.dataset.action === 'privacy') ? SITE + '/privacy' : SITE + '/';
    chrome.tabs.create({ url });
    window.close();
  });
});
