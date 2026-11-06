// Each difficulty is a list of {word, hint}. Hints are short & vague
// so the game stays guess-it-letter-by-letter, not trivia.
const WORDS = {
  easy: [
    {w:'APPLE',h:'Fruit, crunchy'},
    {w:'TIGER',h:'Big cat'},
    {w:'OCEAN',h:'Water, huge'},
    {w:'CLOCK',h:'Tells time'},
    {w:'PIANO',h:'Keys & keys'},
    {w:'BREAD',h:'Bakery staple'},
    {w:'SNAKE',h:'No legs'},
    {w:'LEMON',h:'Yellow sour'},
    {w:'HOUSE',h:'Where you live'},
    {w:'CLOUD',h:'Sky, white'},
    {w:'TRAIN',h:'Rides on rails'},
    {w:'STARS',h:'Night sky'},
    {w:'GHOST',h:'Spooky sheet'},
    {w:'PIZZA',h:'Round & cheesy'},
    {w:'SMILE',h:'Facial, happy'},
    {w:'ROBOT',h:'Beep boop'},
    {w:'WATER',h:'H2O'},
    {w:'MOUSE',h:'Rodent / clicker'},
    {w:'BRICK',h:'Building block'},
    {w:'CANDY',h:'Sweet treat'},
  ],
  normal: [
    {w:'GUITAR',h:'Six strings'},
    {w:'ROCKET',h:'To the moon'},
    {w:'CASTLE',h:'Royal home'},
    {w:'DRAGON',h:'Breathes fire'},
    {w:'WIZARD',h:'Pointy hat'},
    {w:'PLANET',h:'Orbits a star'},
    {w:'SPIDER',h:'Eight legs'},
    {w:'NINJA',h:'Stealthy warrior'},
    {w:'GARDEN',h:'Flowers & veg'},
    {w:'BRIDGE',h:'Spans a river'},
    {w:'SUNSET',h:'End of day'},
    {w:'VOLCANO',h:'Molten rock'},
    {w:'DOLPHIN',h:'Smart sea mammal'},
    {w:'RAINBOW',h:'After the rain'},
    {w:'MYSTERY',h:'Something unknown'},
    {w:'MAGICAL',h:'Fairy-tale feel'},
    {w:'LIBRARY',h:'Hush — books'},
    {w:'KITCHEN',h:'Room with the stove'},
    {w:'COMPUTER',h:'This machine'},
    {w:'ELEPHANT',h:'Has a trunk'},
  ],
  hard: [
    {w:'SYMPHONY',h:'Orchestra piece'},
    {w:'BUTTERFLY',h:'Was a caterpillar'},
    {w:'JUBILANT',h:'Very joyful'},
    {w:'QUARTZ',h:'Clear crystal'},
    {w:'XYLOPHONE',h:'Wooden-bar instrument'},
    {w:'ZEPHYR',h:'A soft breeze'},
    {w:'OBSIDIAN',h:'Volcanic glass'},
    {w:'KALEIDOSCOPE',h:'Tube of mirrors'},
    {w:'PNEUMONIA',h:'Lung infection'},
    {w:'RHYTHMIC',h:'In perfect time'},
    {w:'QUIZZICAL',h:'A puzzled look'},
    {w:'JAZZ',h:'Smoky-club music'},
    {w:'JIGSAW',h:'Interlocking pieces'},
    {w:'ECCENTRIC',h:'Pleasantly odd'},
    {w:'LABYRINTH',h:'Maze with one path'},
    {w:'TURQUOISE',h:'Blue-green hue'},
    {w:'WHIMSY',h:'Playful notion'},
    {w:'YACHT',h:'Fancy sailing vessel'},
    {w:'ZODIAC',h:'12 star signs'},
    {w:'VELVET',h:'Soft rich fabric'},
  ],
};

const MAX_WRONG = 6;      // 6 body parts → full hangman
let difficulty = 'easy';
let word = '', hint = '', revealed = [], wrong = [], misses = 0;
let score = 0, streak = 0, best = +(localStorage.hangman_best || 0);
let locked = false;       // after win/lose, keys ignored until next round

const canvas = document.getElementById('gal');
const g = canvas.getContext('2d');

function drawGallows(){
  g.clearRect(0,0,canvas.width,canvas.height);
  // Wood posts
  g.strokeStyle = '#4a2510';
  g.lineWidth = 6;
  g.lineCap = 'round';
  // Base
  g.beginPath(); g.moveTo(20,185); g.lineTo(160,185); g.stroke();
  // Upright
  g.beginPath(); g.moveTo(50,185); g.lineTo(50,20); g.stroke();
  // Crossbeam
  g.beginPath(); g.moveTo(46,23); g.lineTo(150,23); g.stroke();
  // Rope
  g.strokeStyle = '#78350f';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(140,25); g.lineTo(140,55); g.stroke();
  // Wood grain detail
  g.strokeStyle = 'rgba(74,37,16,.3)';
  g.lineWidth = 1;
  for(let y = 40; y < 180; y += 18){
    g.beginPath(); g.moveTo(46,y); g.lineTo(54,y); g.stroke();
  }
}

function drawBody(parts){
  // Draws the first N body parts (0 to 6).
  g.strokeStyle = '#1a1a1a';
  g.fillStyle = '#1a1a1a';
  g.lineWidth = 3;
  g.lineCap = 'round';
  // 1 head
  if(parts >= 1){
    g.beginPath(); g.arc(140,70,15,0,Math.PI*2); g.stroke();
    // Sad-face when fully hanged
    if(parts === MAX_WRONG){
      g.fillStyle = '#1a1a1a';
      g.beginPath(); g.arc(135,68,1.6,0,Math.PI*2); g.fill();
      g.beginPath(); g.arc(145,68,1.6,0,Math.PI*2); g.fill();
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(133,78); g.quadraticCurveTo(140,74,147,78); g.stroke();
    }
  }
  g.strokeStyle = '#1a1a1a'; g.lineWidth = 3;
  // 2 body
  if(parts >= 2){ g.beginPath(); g.moveTo(140,85); g.lineTo(140,135); g.stroke(); }
  // 3 left arm
  if(parts >= 3){ g.beginPath(); g.moveTo(140,100); g.lineTo(122,120); g.stroke(); }
  // 4 right arm
  if(parts >= 4){ g.beginPath(); g.moveTo(140,100); g.lineTo(158,120); g.stroke(); }
  // 5 left leg
  if(parts >= 5){ g.beginPath(); g.moveTo(140,135); g.lineTo(125,165); g.stroke(); }
  // 6 right leg
  if(parts >= 6){ g.beginPath(); g.moveTo(140,135); g.lineTo(155,165); g.stroke(); }
}

function render(){
  drawGallows();
  drawBody(misses);
  document.getElementById('word').textContent = revealed.join(' ');
  document.getElementById('wrong').textContent = wrong.length ? 'Missed: ' + wrong.join(' ') : '';
  document.getElementById('hint').textContent = 'Clue: ' + hint;
  document.getElementById('sc').textContent = score;
  document.getElementById('st').textContent = streak;
  document.getElementById('bst').textContent = best;
}

function buildKbd(){
  const kb = document.getElementById('kbd');
  kb.innerHTML = '';
  const rows = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  for(const row of rows){
    const r = document.createElement('div');
    r.className = 'kbd-row';
    for(const ch of row){
      const b = document.createElement('button');
      b.className = 'key';
      b.textContent = ch;
      b.addEventListener('click', () => guess(ch));
      r.appendChild(b);
    }
    kb.appendChild(r);
  }
}

function newRound(){
  const pool = WORDS[difficulty];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  word = pick.w;
  hint = pick.h;
  revealed = word.split('').map(() => '_');
  wrong = [];
  misses = 0;
  locked = false;
  // Reset keyboard visual state
  document.querySelectorAll('.key').forEach(k => {
    k.classList.remove('used','good','bad');
    k.disabled = false;
  });
  render();
}

function guess(letter){
  if(locked) return;
  const key = [...document.querySelectorAll('.key')].find(k => k.textContent === letter);
  if(!key || key.classList.contains('used')) return;
  key.classList.add('used');
  key.disabled = true;

  if(word.includes(letter)){
    // Fill every occurrence
    for(let i = 0; i < word.length; i++){
      if(word[i] === letter) revealed[i] = letter;
    }
    key.classList.add('good');
    if(!revealed.includes('_')) return win();
  } else {
    wrong.push(letter);
    misses++;
    key.classList.add('bad');
    if(misses >= MAX_WRONG) return lose();
  }
  render();
}

function win(){
  locked = true;
  // Reward: 10 base + 2 per unused life + difficulty bonus
  const bonus = {easy:0, normal:5, hard:10}[difficulty];
  const earned = 10 + (MAX_WRONG - misses) * 2 + bonus;
  score += earned;
  streak++;
  if(score > best){ best = score; localStorage.hangman_best = best; }
  render();
  showOv('🎉 Saved!', `+${earned} points · ${MAX_WRONG - misses} lives left`);
}

function lose(){
  locked = true;
  streak = 0;
  render();
  showOv('💀 Hanged!', 'The word was:', true);
}

function showOv(title, msg, lose){
  document.getElementById('ov-title').textContent = title;
  document.getElementById('ov-title').className = lose ? 'lose' : '';
  document.getElementById('ov-msg').textContent = msg;
  document.getElementById('ov-word').textContent = word.split('').join(' ');
  document.getElementById('ov').classList.add('show');
}
function hideOv(){ document.getElementById('ov').classList.remove('show'); }

// Physical keyboard input
addEventListener('keydown', e => {
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  if(k.length === 1 && k >= 'A' && k <= 'Z') guess(k);
  if(e.key === 'Enter' && locked){ hideOv(); newRound(); }
});

// Difficulty switcher
document.getElementById('diff').addEventListener('click', e => {
  if(e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#diff button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  difficulty = e.target.dataset.d;
  streak = 0;
  newRound();
});

buildKbd();
newRound();

// CSP-safe click dispatcher (replaces inline onclick=)
addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-h]').forEach(el => {
    const h = el.getAttribute('data-h');
    if (h === "newRound()") el.addEventListener('click', () => { newRound(); });
    if (h === "hideOv();newRound()") el.addEventListener('click', () => { hideOv(); newRound(); });
  });
});
