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

// Each game carries its natural design size (nw / nh). We render the
// iframe at that natural size and CSS-scale the whole element down
// to fit inside the 764×492 game area (528 popup minus 36 title bar)
// so nothing gets cropped, and users still see the full game.
const AVAIL_W = 764, AVAIL_H = 492;

const GAMES = [
  { id:'snake',           title:'Snake',           emoji:'🐍', url:'/games/snake.html',           c1:'#16a34a', c2:'#0d9488', nw:480, nh:520 },
  { id:'2048',            title:'2048',            emoji:'🔢', url:'/games/2048.html',            c1:'#a855f7', c2:'#6d28d9', nw:420, nh:560 },
  { id:'tetris',          title:'Tetris',          emoji:'🧱', url:'/games/tetris.html',          c1:'#06b6d4', c2:'#1e40af', nw:400, nh:580 },
  { id:'flappy',          title:'Flappy',          emoji:'🐦', url:'/games/flappy.html',          c1:'#facc15', c2:'#ea580c', nw:380, nh:540 },
  { id:'breakout',        title:'Breakout',        emoji:'🏓', url:'/games/breakout.html',        c1:'#f43f5e', c2:'#b91c1c', nw:480, nh:640 },
  { id:'memory',          title:'Memory',          emoji:'🃏', url:'/games/memory.html',          c1:'#ec4899', c2:'#a21caf', nw:520, nh:560 },
  { id:'snake-battle',    title:'Snake Battle',    emoji:'⚔️', url:'/games/snake-battle.html',   c1:'#7c3aed', c2:'#581c87', live:true, nw:760, nh:540 },
  { id:'arcade-brawl',    title:'Arcade Brawl',    emoji:'🥊', url:'/games/arcade-brawl.html',   c1:'#e11d48', c2:'#b45309', live:true, nw:720, nh:460 },
  { id:'doorman',         title:'Night Watch',     emoji:'🚪', url:'/games/doorman.html',         c1:'#7f1d1d', c2:'#1c1917', nw:1100, nh:660 },
  { id:'door-escape',     title:'Find Door',       emoji:'🏃', url:'/games/door-escape.html',     c1:'#4338ca', c2:'#581c87', nw:660, nh:500 },
  { id:'downhill',        title:'Downhill',        emoji:'🚵', url:'/games/downhill-brawl.html',  c1:'#15803d', c2:'#b45309', nw:720, nh:520 },
  { id:'chess',           title:'Rated Chess',     emoji:'♔', url:'/games/chess.html',            c1:'#d97706', c2:'#292524', nw:900, nh:820 },
  { id:'squish',          title:'Squishy',         emoji:'🫧', url:'/games/squish.html',           c1:'#f472b6', c2:'#a855f7', nw:480, nh:520 },
  { id:'liars-tavern',    title:"Liar's Tavern",   emoji:'🍻', url:'/games/liars-tavern.html',    c1:'#78350f', c2:'#0c0a09', live:true, nw:760, nh:520 },
  { id:'hero-brawl',      title:'Hero Brawl',      emoji:'🦸', url:'/games/hero-brawl.html',      c1:'#059669', c2:'#b45309', nw:780, nh:520 },
  { id:'potato-bros',     title:'Potato Bros',     emoji:'🥔', url:'/games/potato-bros.html',     c1:'#b45309', c2:'#65a30d', nw:820, nh:640 },
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

  // Render the iframe at the game's natural design size, then
  // CSS-scale it so the whole thing fits inside AVAIL_W × AVAIL_H
  // without any cropping. Center the scaled result in its slot.
  const nw = g.nw || AVAIL_W;
  const nh = g.nh || AVAIL_H;
  const scale = Math.min(AVAIL_W / nw, AVAIL_H / nh, 1);
  iframe.style.width  = nw + 'px';
  iframe.style.height = nh + 'px';
  iframe.style.transform = 'scale(' + scale + ')';
  iframe.style.transformOrigin = 'top left';
  const dispW = nw * scale, dispH = nh * scale;
  iframe.style.marginLeft = Math.max(0, (AVAIL_W - dispW) / 2) + 'px';
  iframe.style.marginTop  = Math.max(0, (AVAIL_H - dispH) / 2) + 'px';

  iframe.src = SITE + g.url;
  document.body.classList.add('playing');
}

function backToMenu(){
  currentGame = null;
  iframe.src = 'about:blank';
  document.body.classList.remove('playing');
}

document.getElementById('back').addEventListener('click', backToMenu);

// If the iframe navigates back to the site homepage (user hit the
// "← Games" link inside a game), the site posts us a message and we
// swap the popup back to the compact game menu — otherwise the user
// would see the full 3-column site homepage inside 764×528 instead
// of our little grid.
window.addEventListener('message', ev => {
  if (ev && ev.data && ev.data.type === 'ug-back-to-menu') backToMenu();
});
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
