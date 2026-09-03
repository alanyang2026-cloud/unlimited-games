// Shared multiplayer stability helper — dropped into every game that
// uses Firebase realtime for MP. Adds three tiny things without
// touching each game's networking code:
//
//   1. A small floating "connection" chip in the top-right that shows
//      green (< 100ms round-trip), yellow (100-300ms), red (offline or
//      >300ms). Uses Firebase's built-in /.info/connected and a
//      periodic latency ping.
//
//   2. A heartbeat writer that stamps `lastSeen: <server timestamp>`
//      onto whatever player-record ref the game hands us. Complements
//      onDisconnect() (which sometimes doesn't fire when a laptop lid
//      is closed or WiFi flaps).
//
//   3. A tiny "ping" helper for round-trip measurement. It writes a
//      short-lived value to /.ping/<id> and times how long the echo
//      takes.
//
// Usage inside a game:
//   <script src="/mp-stability.js"></script>
//   ...
//   MPStability.attach({
//     db: firebase.database(),
//     myRef: MP.myStateRef,       // ref to this player's own record
//     playerId: MP.playerId,
//   });
//
// It's fine to call attach() again with an updated myRef when the
// player matches into a room — the module tracks whichever ref it's
// been given last.

(function(){
  if (window.MPStability) return;

  const STATE = {
    db: null,
    playerId: null,
    myRef: null,
    connected: false,
    latencyMs: null,
    heartbeatTimer: null,
    pingTimer: null,
    chipEl: null,
    dotEl: null,
    txtEl: null,
  };

  function ensureChip(){
    if (STATE.chipEl) return;
    const chip = document.createElement('div');
    chip.id = 'mp-stability-chip';
    chip.style.cssText = [
      'position:fixed', 'top:8px', 'right:8px', 'z-index:2147483000',
      'padding:4px 10px 4px 8px',
      'background:rgba(15,15,25,.78)',
      'color:#e2e8f0',
      'border-radius:999px',
      'font:600 11px/1 -apple-system,system-ui,sans-serif',
      'letter-spacing:.3px',
      'display:flex', 'align-items:center', 'gap:6px',
      'pointer-events:none',
      'user-select:none',
      'backdrop-filter:blur(4px)',
      'box-shadow:0 2px 8px rgba(0,0,0,.35)',
    ].join(';');
    const dot = document.createElement('span');
    dot.style.cssText = [
      'width:8px', 'height:8px', 'border-radius:50%',
      'background:#64748b',
      'box-shadow:0 0 6px rgba(148,163,184,.6)',
      'transition:background .2s, box-shadow .2s',
    ].join(';');
    const txt = document.createElement('span');
    txt.textContent = '…';
    chip.appendChild(dot);
    chip.appendChild(txt);
    (document.body || document.documentElement).appendChild(chip);
    STATE.chipEl = chip;
    STATE.dotEl = dot;
    STATE.txtEl = txt;
  }

  function paint(){
    if (!STATE.chipEl) return;
    let color, glow, label;
    if (!STATE.connected){
      color = '#ef4444'; glow = 'rgba(239,68,68,.7)';
      label = 'offline';
    } else if (STATE.latencyMs == null){
      color = '#64748b'; glow = 'rgba(148,163,184,.6)';
      label = 'online';
    } else if (STATE.latencyMs < 100){
      color = '#22c55e'; glow = 'rgba(34,197,94,.7)';
      label = STATE.latencyMs + 'ms';
    } else if (STATE.latencyMs < 300){
      color = '#eab308'; glow = 'rgba(234,179,8,.7)';
      label = STATE.latencyMs + 'ms';
    } else {
      color = '#ef4444'; glow = 'rgba(239,68,68,.7)';
      label = STATE.latencyMs + 'ms';
    }
    STATE.dotEl.style.background = color;
    STATE.dotEl.style.boxShadow  = '0 0 6px ' + glow;
    STATE.txtEl.textContent = label;
  }

  function startConnectionWatch(){
    if (!STATE.db) return;
    STATE.db.ref('.info/connected').on('value', snap => {
      STATE.connected = !!snap.val();
      if (!STATE.connected) STATE.latencyMs = null;
      paint();
    });
  }

  function pingOnce(){
    if (!STATE.db || !STATE.connected) return;
    const id = STATE.playerId || ('p' + Math.random().toString(36).slice(2, 8));
    const ref = STATE.db.ref('.ping/' + id);
    const t0 = performance.now();
    ref.set(firebase.database.ServerValue.TIMESTAMP)
      .then(() => {
        const rtt = Math.round(performance.now() - t0);
        STATE.latencyMs = rtt;
        paint();
        // Best-effort cleanup; don't block on this.
        ref.remove().catch(()=>{});
      })
      .catch(() => { /* ignore; next tick will retry */ });
  }

  function startPingLoop(){
    if (STATE.pingTimer) clearInterval(STATE.pingTimer);
    pingOnce();
    STATE.pingTimer = setInterval(pingOnce, 5000);
  }

  function startHeartbeat(){
    if (STATE.heartbeatTimer) clearInterval(STATE.heartbeatTimer);
    const beat = () => {
      const ref = STATE.myRef;
      if (!ref || !STATE.connected) return;
      ref.update({ lastSeen: firebase.database.ServerValue.TIMESTAMP })
        .catch(()=>{});
    };
    beat();
    STATE.heartbeatTimer = setInterval(beat, 3000);
  }

  const MPStability = {
    attach(opts){
      STATE.db = opts.db;
      STATE.playerId = opts.playerId || STATE.playerId;
      if (opts.myRef !== undefined) STATE.myRef = opts.myRef;
      ensureChip();
      startConnectionWatch();
      startPingLoop();
      startHeartbeat();
    },
    // Let a game hide the chip if it needs the top-right corner
    // (e.g. when a modal is open). Pass true to hide, false to show.
    hide(v){
      if (STATE.chipEl) STATE.chipEl.style.display = v ? 'none' : 'flex';
    },
    // Consider a remote player stale if their lastSeen is this many
    // ms old. Games call this on their own player list.
    isStale(lastSeen, thresholdMs){
      const t = typeof lastSeen === 'number' ? lastSeen : 0;
      const age = Date.now() - t;
      return age > (thresholdMs || 10000);
    },
  };

  window.MPStability = MPStability;
})();
