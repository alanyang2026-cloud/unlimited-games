// Shared inside-iframe helpers for the Chrome-extension popup.
// (1) Esc → tell popup to return to the games menu. If a game defines
//     its own Escape handler (e.g. cancel a password modal, blur a
//     chat input) it should call `e.preventDefault()` — this listener
//     bails whenever the event has already been handled.
// (2) Hide the in-game "← Games" chip (`.hbtn`), because the popup
//     shell already has its own back button and showing two is noisy.
//     The chip stays visible when the game is opened on the standalone
//     site (unlimitedgames.vercel.app/games/...) — the only place a
//     user actually needs it.
(function(){
  if(window.top === window) return; // Only run inside the extension popup iframe

  window.addEventListener('keydown', function(e){
    if(e.key !== 'Escape' || e.defaultPrevented) return;
    if(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    try { window.parent.postMessage({ type: 'ug-back-to-menu' }, '*'); } catch(_){}
  });

  function hideHbtn(){
    document.querySelectorAll('.hbtn').forEach(function(el){ el.style.display = 'none'; });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', hideHbtn, { once: true });
  } else {
    hideHbtn();
  }
})();
