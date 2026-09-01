import { GAMES } from "@/lib/games";

const GAME_PATHS: Record<string, string> = {
  "snake":         "/games/snake.html",
  "2048":          "/games/2048.html",
  "tetris":        "/games/tetris.html",
  "flappy-bird":   "/games/flappy.html",
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
  "hero-brawl":    "/games/hero-brawl.html",
  "potato-bros":   "/games/potato-bros.html",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
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
        {GAMES.map((game) => (
          <a
            key={game.id}
            href={GAME_PATHS[game.id]}
            className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 aspect-square flex flex-col items-center justify-center"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
              <span className="text-5xl">{game.emoji}</span>
              <span className="text-white font-bold text-base leading-tight">{game.title}</span>
              <span className="text-white/70 text-xs leading-snug">{game.description}</span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-slate-700 text-xs mt-12">
        🇳🇿 Built in New Zealand · {GAMES.length} games · {" "}
        <a href="/privacy" className="hover:text-slate-500 underline underline-offset-2">Privacy</a>
      </p>
    </div>
  );
}
