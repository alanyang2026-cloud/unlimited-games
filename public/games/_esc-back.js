// Shared inside-iframe Esc handler for the Chrome-extension popup.
// If a game defines its own Escape handler (e.g. cancel a password
// modal, blur a chat input) it should call `e.preventDefault()` —
// this listener bails whenever the event has already been handled.
// Otherwise it tells the popup to return to the games menu.
(function(){
  if(window.top === window) return; // Only meaningful inside the extension popup iframe
  window.addEventListener('keydown', function(e){
    if(e.key !== 'Escape' || e.defaultPrevented) return;
    if(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    try { window.parent.postMessage({ type: 'ug-back-to-menu' }, '*'); } catch(_){}
  });
})();
