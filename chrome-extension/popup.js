// Popup runs at a fixed 764×528 (via the CSS in popup.html).
// Clicking a game swaps the popup's own body into the "playing" state,
// which hides the menu and reveals an iframe filling the remaining
// space below the toolbar. Everything lives inside the popup — no
// injection into the underlying page, no separate window.
//
// Trade-off users need to know: Chrome auto-closes any extension popup
// when the browser loses focus (e.g. you click on the underlying page,
// switch apps, etc). If you need uninterrupted play, hit the ⤢ button
// to open the game in a full tab.
const SITE = 'https://unlimitedgames.vercel.app';

const GAMES = [
  { id:'snake',           title:'Snake',           emoji:'🐍', url:'/games/snake.html',           c1:'#16a34a', c2:'#0d9488' },
  { id:'2048',            title:'2048',            emoji:'🔢', url:'/games/2048.html',            c1:'#a855f7', c2:'#6d28d9' },
  { id:'tetris',          title:'Tetris',          emoji:'🧱', url:'/games/tetris.html',          c1:'#06b6d4', c2:'#1e40af' },
  { id:'flappy',          title:'Flappy',          emoji:'🐦', url:'/games/flappy.html',          c1:'#facc15', c2:'#ea580c' },
  { id:'breakout',        title:'Breakout',        emoji:'🏓', url:'/games/breakout.html',        c1:'#f43f5e', c2:'#b91c1c' },
  { id:'memory',          title:'Memory',          emoji:'🃏', url:'/games/memory.html',          c1:'#ec4899', c2:'#a21caf' },
  { id:'snake-battle',    title:'Snake Battle',    emoji:'⚔️', url:'/games/snake-battle.html',   c1:'#7c3aed', c2:'#581c87', live:true },
  { id:'arcade-brawl',    title:'Arcade Brawl',    emoji:'🥊', url:'/games/arcade-brawl.html',   c1:'#e11d48', c2:'#b45309', live:true },
  { id:'doorman',         title:'Night Watch',     emoji:'🚪', url:'/games/doorman.html',         c1:'#7f1d1d', c2:'#1c1917' },
  { id:'door-escape',     title:'Find Door',       emoji:'🏃', url:'/games/door-escape.html',     c1:'#4338ca', c2:'#581c87' },
  { id:'downhill',        title:'Downhill',        emoji:'🚵', url:'/games/downhill-brawl.html',  c1:'#15803d', c2:'#b45309' },
  { id:'chess',           title:'Rated Chess',     emoji:'♔', url:'/games/chess.html',            c1:'#d97706', c2:'#292524' },
  { id:'squish',          title:'Squishy',         emoji:'🫧', url:'/games/squish.html',           c1:'#f472b6', c2:'#a855f7' },
  { id:'liars-tavern',    title:"Liar's Tavern",   emoji:'🍻', url:'/games/liars-tavern.html',    c1:'#78350f', c2:'#0c0a09', live:true },
  { id:'hero-brawl',      title:'Hero Brawl',      emoji:'🦸', url:'/games/hero-brawl.html',      c1:'#059669', c2:'#b45309' },
  { id:'potato-bros',     title:'Potato Bros',     emoji:'🥔', url:'/games/potato-bros.html',     c1:'#b45309', c2:'#65a30d' },
  { id:'animal-survival', title:'Animal Survival', emoji:'🦌', url:'/games/animal-survival.html', c1:'#14532d', c2:'#0c0a09', live:true },
];

// ─── Render the grid ───────────────────────────────────────
const grid = document.getElementById('grid');
const frag = document.createDocumentFragment();
for(const g of GAMES){
  const card = document.createElement('div');
  card.className = 'card' + (g.live ? ' live' : '');
  card.style.setProperty('--c1', g.c1);
  card.style.setProperty('--c2', g.c2);
  card.title = g.title + (g.live ? ' (live multiplayer)' : '');
  card.dataset.id = g.id;
  card.innerHTML =
    '<div class="bg"></div>' +
    '<div class="inner">' +
      '<div class="emoji">' + g.emoji + '</div>' +
      '<div class="name">' + g.title + '</div>' +
    '</div>';
  card.addEventListener('click', () => launchGame(g));
  frag.appendChild(card);
}
grid.appendChild(frag);

// ─── Launch / return ──────────────────────────────────────
let currentGame = null;
const iframe    = document.getElementById('gameFrame');
const gameTitle = document.getElementById('gameTitle');

function launchGame(g){
  currentGame = g;
  gameTitle.textContent = '🎮 ' + g.title;
  iframe.src = SITE + g.url;
  document.body.classList.add('playing');
}

function backToMenu(){
  currentGame = null;
  iframe.src = 'about:blank';
  document.body.classList.remove('playing');
}

document.getElementById('back').addEventListener('click', backToMenu);
document.getElementById('close').addEventListener('click', () => window.close());
document.getElementById('newTab').addEventListener('click', () => {
  const url = currentGame ? SITE + currentGame.url : SITE;
  chrome.tabs.create({ url });
  window.close();
});

// Footer links (menu view)
document.querySelectorAll('.ftr a').forEach(a => {
  a.addEventListener('click', () => {
    const url = (a.dataset.action === 'privacy') ? SITE + '/privacy' : SITE + '/';
    chrome.tabs.create({ url });
    window.close();
  });
});
