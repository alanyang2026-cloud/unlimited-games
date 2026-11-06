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
  { id:'snake',           title:'Snake',           emoji:'🐍', url:'/games/snake.html',           c1:'#16a34a', c2:'#0d9488', nw:480, nh:520, offline:true },
  { id:'2048',            title:'2048',            emoji:'🔢', url:'/games/2048.html',            c1:'#a855f7', c2:'#6d28d9', nw:420, nh:560, offline:true },
  { id:'tetris',          title:'Blocks',          emoji:'🧱', url:'/games/tetris.html',          c1:'#06b6d4', c2:'#1e40af', nw:400, nh:580, offline:true },
  { id:'sky-dodge',       title:'Sky Dodge',       emoji:'🚀', url:'/games/sky-dodge.html',       c1:'#6366f1', c2:'#c026d3', nw:480, nh:600 },
  { id:'breakout',        title:'Brick Buster',    emoji:'💥', url:'/games/breakout.html',        c1:'#f43f5e', c2:'#b91c1c', nw:540, nh:560 },
  { id:'memory',          title:'Memory',          emoji:'🃏', url:'/games/memory.html',          c1:'#ec4899', c2:'#a21caf', nw:520, nh:560, offline:true },
  { id:'snake-battle',    title:'Snake Battle',    emoji:'⚔️', url:'/games/snake-battle.html',   c1:'#7c3aed', c2:'#581c87', live:true, nw:760, nh:540 },
  { id:'arcade-brawl',    title:'Arcade Brawl',    emoji:'🥊', url:'/games/arcade-brawl.html',   c1:'#e11d48', c2:'#b45309', live:true, nw:960, nh:560 },
  { id:'doorman',         title:'Night Watch',     emoji:'🚪', url:'/games/doorman.html',         c1:'#7f1d1d', c2:'#1c1917', nw:1100, nh:660 },
  { id:'door-escape',     title:'Find Door',       emoji:'🏃', url:'/games/door-escape.html',     c1:'#b45309', c2:'#78350f', nw:960, nh:540 },
  { id:'downhill',        title:'Downhill',        emoji:'🚵', url:'/games/downhill-brawl.html',  c1:'#15803d', c2:'#b45309', nw:720, nh:520 },
  { id:'chess',           title:'Rated Chess',     emoji:'♔', url:'/games/chess.html',            c1:'#d97706', c2:'#292524', nw:900, nh:820 },
  { id:'squish',          title:'Squishy',         emoji:'🫧', url:'/games/squish.html',           c1:'#f472b6', c2:'#a855f7', nw:480, nh:640, offline:true },
  { id:'liars-tavern',    title:"Liar's Tavern",   emoji:'🍻', url:'/games/liars-tavern.html',    c1:'#78350f', c2:'#0c0a09', live:true, nw:760, nh:520 },
  { id:'potato-bros',     title:'Potato Bros',     emoji:'🥔', url:'/games/potato-bros.html',     c1:'#b45309', c2:'#65a30d', nw:820, nh:640 },
  { id:'hangman',         title:'Hangman',         emoji:'⚰️', url:'/games/hangman.html',          c1:'#d97706', c2:'#292524', nw:400, nh:620, offline:true },
  { id:'minesweeper',     title:'Minesweeper',     emoji:'💣', url:'/games/minesweeper.html',      c1:'#2d5a2f', c2:'#1a3a1b', nw:420, nh:560, offline:true },
  // Intentionally excluded from the Chrome Web Store build (still ship
  // on unlimitedgames.vercel.app):
  //   • Rail Runner — visual overlap with Subway Surfers
  //   • Overclock — not store-ready yet
  //   • Ninja Hop — not store-ready yet
  //   • Feeding Frenzy — not store-ready yet
];

// ─── Ordering ──────────────────────────────────────────────
// Classics surface first (except for 🔥 hot games, which jump ahead
// once markHotGames resolves). Keep the source-order within each
// bucket so popup.js stays diff-friendly.
const CLASSIC_IDS = new Set([
  'snake', '2048', 'tetris', 'memory', 'hangman',
  'minesweeper', 'breakout', 'chess', 'feeding-frenzy',
]);
function rank(id, hotSet){
  if(hotSet && hotSet.has(id)) return 0;
  if(CLASSIC_IDS.has(id)) return 1;
  return 2;
}
function sortedGames(hotSet){
  return [...GAMES]
    .map((g, i) => ({ g, i, r: rank(g.id, hotSet) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(x => x.g);
}

// ─── Render the grid ───────────────────────────────────────
const grid = document.getElementById('grid');
const frag = document.createDocumentFragment();
for(const g of sortedGames(null)){
  // Use a real <button> so Tab / Enter / Space "just work" for
  // keyboard users, no custom key handling needed.
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card' + (g.live ? ' live' : '');
  card.style.setProperty('--c1', g.c1);
  card.style.setProperty('--c2', g.c2);
  card.title = g.title + (g.live ? ' (live multiplayer)' : '');
  card.dataset.id = g.id;
  card.setAttribute('aria-label', g.title + (g.live ? ' — live multiplayer' : ''));
  card.innerHTML =
    '<div class="bg"></div>' +
    '<div class="inner">' +
      '<div class="emoji">' + g.emoji + '</div>' +
      '<div class="name">' + g.title + '</div>' +
    '</div>' +
    '<span class="hotTag">🔥 HOT</span>';
  card.addEventListener('click', () => launchGame(g));
  frag.appendChild(card);
}
grid.appendChild(frag);

// Decorate the top-3 most-clicked games with the 🔥 badge AND float
// them to the front of the grid. Runs async after render so a slow /
// missing Firebase can never block the menu from showing.
(async function markHotGames(){
  try {
    if(!window.UGHot) return;
    const hot = await window.UGHot.getHotGames(3);
    const ids = new Set(hot.map(h => h.id));
    if(!ids.size) return;
    // Re-rank cards by [hot, classic, other] and reinsert in new order
    const cards = Array.from(grid.querySelectorAll('.card'));
    cards.sort((a, b) => {
      const ra = rank(a.dataset.id, ids), rb = rank(b.dataset.id, ids);
      if(ra !== rb) return ra - rb;
      return cards.indexOf(a) - cards.indexOf(b);  // stable
    });
    for(const card of cards){
      if(ids.has(card.dataset.id)) card.classList.add('hot');
      grid.appendChild(card);  // moves to end in sorted order
    }
  } catch(_){ /* ignore — the UI stays functional without badges */ }
})();

// Give the first card focus on load so keyboard users can immediately
// arrow / tab / Enter into a game without clicking first.
const firstCard = grid.querySelector('.card');
if(firstCard) firstCard.focus();

// ─── Launch / return ──────────────────────────────────────
let currentGame = null;
const iframe    = document.getElementById('gameFrame');
const gameTitle = document.getElementById('gameTitle');

function launchGame(g){
  currentGame = g;
  gameTitle.textContent = '🎮 ' + g.title;

  // Fire-and-forget click tracking for the 🔥 hot-games ranker. Never
  // await — must not delay the actual launch even by a frame.
  if(window.UGHot) window.UGHot.trackClick(g.id);

  // Let the iframe fill the entire game pane and defer to each game's
  // own responsive CSS for its layout. Every game has viewport meta +
  // flex-centered content + max-width:100vw on canvases, so they size
  // themselves correctly at 764×492 without the extra outer scale that
  // used to leave big black gutters on portrait titles.
  iframe.style.width  = '100%';
  iframe.style.height = '100%';
  iframe.style.transform = 'none';
  iframe.style.marginLeft = '0';
  iframe.style.marginTop = '0';

  // Offline-capable games load from the extension's bundled copy;
  // everything else iframes the Vercel site as before.
  if(g.offline){
    const basename = g.url.replace('/games/', '');
    iframe.src = 'games/' + basename;
  } else {
    iframe.src = SITE + g.url;
  }
  document.body.classList.add('playing');
  // Hand keyboard focus to the iframe as soon as it loads so users
  // don't have to click into the game before arrow keys / space work.
  const onLoad = () => {
    iframe.removeEventListener('load', onLoad);
    try { iframe.focus(); } catch(_){}
  };
  iframe.addEventListener('load', onLoad);
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
// of our little grid. Games also post this message when the user
// presses Esc inside them (see public/games/_esc-back.js).
window.addEventListener('message', ev => {
  if (ev && ev.data && ev.data.type === 'ug-back-to-menu') backToMenu();
});

// Popup-level Escape: if the popup shell itself has focus (menu view,
// or right after a game closes) Esc closes the current game or the
// whole popup. When the iframe has focus, the game's copy of
// _esc-back.js catches Esc and posts us `ug-back-to-menu` instead.
window.addEventListener('keydown', ev => {
  if (ev.key !== 'Escape' || ev.defaultPrevented) return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) return;
  if (currentGame) { ev.preventDefault(); backToMenu(); }
  else { ev.preventDefault(); window.close(); }
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

// Promo row — invite + rate. Both soft prompts: no auto-popups, no
// recurring nags; the user only sees them if they look at the footer.
const STORE_URL = 'https://chromewebstore.google.com/detail/nmkkimkicjgjighhnlffpnbjcahliido';

function showToast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._tid);
  showToast._tid = setTimeout(() => t.classList.remove('show'), 1800);
}

document.getElementById('inviteBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(STORE_URL);
    showToast('Link copied — send it to a friend!');
  } catch(_){
    // Clipboard denied — just open the store page they can share from
    chrome.tabs.create({ url: STORE_URL });
    window.close();
  }
});

document.getElementById('rateBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: STORE_URL + '/reviews' });
  window.close();
});
