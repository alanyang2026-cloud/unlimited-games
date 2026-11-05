// Tracks per-game clicks to Firebase Realtime Database and reads back
// the top-N games over a rolling 7-day window for the 🔥 badge.
//
// Schema:  /gameClicks/<gameId>/<YYYY-MM-DD>: count
//
// Race conditions on the read-modify-write for the daily counter are
// tolerated — we only need rough popularity for the badge, not exact
// analytics. Firebase security rules on gameClicks must allow public
// reads and increments (the same way this project's multiplayer games
// already write to /rooms etc. without auth).
(function (global) {
  const DB = 'https://unlimited-games-522cb-default-rtdb.asia-southeast1.firebasedatabase.app';
  const WINDOW_DAYS = 7;

  function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function lastNDates(n) {
    const out = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  // Fire-and-forget increment. Silent on failure so a dead Firebase
  // can never block a game launch or the UI.
  async function trackClick(gameId) {
    if (!gameId) return;
    const url = `${DB}/gameClicks/${encodeURIComponent(gameId)}/${today()}.json`;
    try {
      const cur = await fetch(url).then(r => r.ok ? r.json() : 0);
      await fetch(url, {
        method: 'PUT',
        body: JSON.stringify((Number(cur) || 0) + 1),
      });
    } catch (_) { /* network failure or rules refusal — ignore */ }
  }

  // Returns [{id, count}, ...] sorted by last-7-day click count,
  // descending, capped at `limit`. Returns [] on error.
  async function getHotGames(limit) {
    limit = Math.max(1, Math.min(10, limit || 3));
    try {
      const data = await fetch(`${DB}/gameClicks.json`).then(r => r.ok ? r.json() : null);
      if (!data) return [];
      const dates = lastNDates(WINDOW_DAYS);
      const scores = [];
      for (const gameId of Object.keys(data)) {
        const days = data[gameId] || {};
        let sum = 0;
        for (const d of dates) sum += Number(days[d] || 0);
        if (sum > 0) scores.push({ id: gameId, count: sum });
      }
      scores.sort((a, b) => b.count - a.count);
      return scores.slice(0, limit);
    } catch (_) {
      return [];
    }
  }

  global.UGHot = { trackClick, getHotGames };
})(typeof window !== 'undefined' ? window : globalThis);
