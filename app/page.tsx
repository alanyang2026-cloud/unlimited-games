"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { GAMES, CLASSIC_IDS } from "@/lib/games";

const GAME_PATHS: Record<string, string> = {
  "snake":         "/games/snake.html",
  "2048":          "/games/2048.html",
  "tetris":        "/games/tetris.html",
  "sky-dodge":     "/games/sky-dodge.html",
  "breakout":      "/games/breakout.html",
  "memory-match":  "/games/memory.html",
  "snake-battle":  "/games/snake-battle.html",
  "arcade-brawl":  "/games/arcade-brawl.html",
  "doorman":       "/games/doorman.html",
  "door-escape":   "/games/door-escape.html",
  "downhill-brawl":"/games/downhill-brawl.html",
  "chess":         "/games/chess.html",
  "squish":        "/games/squish.html",
  "liars-tavern":  "/games/liars-tavern.html",
  "potato-bros":   "/games/potato-bros.html",
  "rail-runner":   "/games/rail-runner.html",
  "overclock":     "/games/overclock.html",
  "ninja-hop":     "/games/ninja-hop.html",
  "hangman":       "/games/hangman.html",
  "minesweeper":   "/games/minesweeper.html",
  "feeding-frenzy":"/games/feeding-frenzy.html",
};

// Window global exposed by /public/hot.js
declare global {
  interface Window {
    UGHot?: {
      trackClick: (id: string) => Promise<void>;
      getHotGames: (limit?: number) => Promise<Array<{ id: string; count: number }>>;
    };
  }
}

export default function HomePage() {
  const [hotIds, setHotIds] = useState<Set<string>>(new Set());

  // Fetch the top-3 hot games once the browser loads /hot.js.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Wait up to ~2s for UGHot to appear on the window
      for (let i = 0; i < 20 && !window.UGHot; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      if (cancelled || !window.UGHot) return;
      const top = await window.UGHot.getHotGames(3);
      if (cancelled) return;
      setHotIds(new Set(top.map(g => g.id)));
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Render order: 🔥 hot games first, then classics, then everything
  // else. Within each bucket, keep the original lib/games.ts order so
  // adjacent edits in that file still control fine-grained placement.
  const orderedGames = useMemo(() => {
    const rank = (id: string) => {
      if (hotIds.has(id)) return 0;
      if (CLASSIC_IDS.has(id)) return 1;
      return 2;
    };
    return [...GAMES]
      .map((g, i) => ({ g, i, r: rank(g.id) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map(x => x.g);
  }, [hotIds]);

  const handleClick = (id: string) => {
    // Don't await — the browser will keep the request in flight even
    // after the navigation starts.
    if (typeof window !== "undefined" && window.UGHot) {
      window.UGHot.trackClick(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Loads /public/hot.js and exposes window.UGHot */}
      <Script src="/hot.js" strategy="afterInteractive" />

      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tight mb-3">
          <span className="text-white">Unlimited </span>
          <span className="text-purple-400" style={{ textShadow: "0 0 30px rgba(168,85,247,0.5)" }}>
            Games
          </span>
        </h1>
        <p className="text-slate-500 text-base">Pick a game and start playing — no downloads needed.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full max-w-2xl">
        {orderedGames.map((game) => {
          const isHot = hotIds.has(game.id);
          return (
            <a
              key={game.id}
              href={GAME_PATHS[game.id]}
              onClick={() => handleClick(game.id)}
              className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 aspect-square flex flex-col items-center justify-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                <span className="text-5xl">{game.emoji}</span>
                <span className="text-white font-bold text-base leading-tight">{game.title}</span>
                <span className="text-white/70 text-xs leading-snug">{game.description}</span>
              </div>
              {isHot && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-red-600/90 backdrop-blur-sm border border-red-300/50 shadow-lg shadow-red-600/50 hot-badge">
                  <span className="text-sm leading-none">🔥</span>
                  <span className="text-[10px] font-black text-white tracking-wider uppercase">Hot</span>
                </div>
              )}
            </a>
          );
        })}
      </div>

      <p className="text-slate-700 text-xs mt-12">
        🇳🇿 Built in New Zealand · {GAMES.length} games · {" "}
        <a href="/privacy" className="hover:text-slate-500 underline underline-offset-2">Privacy</a>
      </p>

      <style jsx>{`
        .hot-badge {
          animation: hot-pulse 1.4s ease-in-out infinite;
        }
        @keyframes hot-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(220, 38, 38, 0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 20px rgba(220, 38, 38, 0.9); }
        }
      `}</style>

      {/*
        When this homepage is loaded inside our Chrome-extension popup
        (user hit a game's "← Games" link, which navigates the iframe
        to `/`), tell the parent popup to swap back to its own compact
        game menu instead of showing the site homepage inside 764×528.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (window.self !== window.top) {
              try { window.parent.postMessage({ type: 'ug-back-to-menu' }, '*'); } catch(_){}
            }
          `,
        }}
      />
    </div>
  );
}
