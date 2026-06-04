export interface Game {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string; // tailwind gradient classes
  controls: string;
}

export const GAMES: Game[] = [
  {
    id: "snake",
    title: "Snake",
    emoji: "🐍",
    description: "Eat food, grow longer, don't crash!",
    color: "from-green-500 to-teal-600",
    controls: "Arrow keys / WASD · Swipe on mobile",
  },
  {
    id: "2048",
    title: "2048",
    emoji: "🔢",
    description: "Slide tiles and combine to reach 2048.",
    color: "from-purple-500 to-violet-700",
    controls: "Arrow keys / WASD · Swipe on mobile",
  },
  {
    id: "tetris",
    title: "Tetris",
    emoji: "🧱",
    description: "Stack blocks and clear lines. Classic!",
    color: "from-cyan-500 to-blue-600",
    controls: "← → Move · ↑ Rotate · Space Hard drop",
  },
  {
    id: "flappy-bird",
    title: "Flappy Bird",
    emoji: "🐦",
    description: "Tap to fly through pipes. Don't crash!",
    color: "from-yellow-400 to-orange-500",
    controls: "Click · Space · Tap",
  },
  {
    id: "breakout",
    title: "Breakout",
    emoji: "🏓",
    description: "Smash all bricks with your ball and paddle.",
    color: "from-rose-500 to-red-600",
    controls: "Mouse / Touch to move paddle · Space to launch",
  },
  {
    id: "memory-match",
    title: "Memory Match",
    emoji: "🃏",
    description: "Flip cards and find all matching pairs.",
    color: "from-pink-500 to-fuchsia-600",
    controls: "Click cards to flip",
  },
  {
    id: "snake-battle",
    title: "Snake Battle",
    emoji: "⚔️",
    description: "Multiplayer snake vs AI bots. Eat, grow, dominate!",
    color: "from-violet-600 to-purple-800",
    controls: "Mouse to steer · Click / Space to boost",
  },
  {
    id: "arcade-brawl",
    title: "Arcade Brawl",
    emoji: "🥊",
    description: "Neon 1v1 fighter. Punch, kick, KO!",
    color: "from-rose-600 to-amber-600",
    controls: "WASD move · J punch · K kick · L super · S block",
  },
  {
    id: "doorman",
    title: "Night Watch",
    emoji: "🚪",
    description: "Verify residents. Spot the imposter. Don't let it in.",
    color: "from-red-900 to-stone-950",
    controls: "Click APPROVE / CLEANER · [B] open resident book",
  },
  {
    id: "door-escape",
    title: "Find the Door",
    emoji: "🏃",
    description: "Tiny stickman, deadly traps, one door per room.",
    color: "from-indigo-700 to-purple-900",
    controls: "WASD / Arrows · Space jump · [R] restart",
  },
  {
    id: "downhill-brawl",
    title: "Downhill Brawl",
    emoji: "🚵",
    description: "Race down the mountain. Dodge, punch, win the trail.",
    color: "from-green-700 to-amber-700",
    controls: "WASD steer · Space / J punch riders · S brake",
  },
  {
    id: "chess",
    title: "Rated Chess",
    emoji: "♔",
    description: "Climb the ELO ladder. AI scales with your rating.",
    color: "from-amber-600 to-stone-800",
    controls: "Click piece to see moves · Click target to play",
  },
  {
    id: "squish",
    title: "Squishy",
    emoji: "🫧",
    description: "Pick a material. Poke, squish, pop. Pure relaxation.",
    color: "from-pink-400 to-purple-500",
    controls: "Click to poke · Click & drag to squish · Try every material",
  },
  {
    id: "liars-tavern",
    title: "Liar's Tavern",
    emoji: "🍻",
    description: "3D bluffing cards. Lie, accuse, spin the revolver — survive.",
    color: "from-amber-900 to-stone-950",
    controls: "Click cards · PLAY / CALL LIAR · Space to fire",
  },
  {
    id: "hero-brawl",
    title: "Hero Brawl",
    emoji: "🦸",
    description: "Pick a hero. Top-down arena shooter. Last brawler wins.",
    color: "from-emerald-600 to-amber-600",
    controls: "WASD move · Mouse aim · Click shoot · Space super",
  },
];

const URL_MAP: Record<string, string> = {
  "snake": "/games/snake.html",
  "2048": "/games/2048.html",
  "tetris": "/games/tetris.html",
  "flappy-bird": "/games/flappy.html",
  "breakout": "/games/breakout.html",
  "memory-match": "/games/memory.html",
  "snake-battle": "/games/snake-battle.html",
  "arcade-brawl": "/games/arcade-brawl.html",
  "doorman": "/games/doorman.html",
  "door-escape": "/games/door-escape.html",
  "downhill-brawl": "/games/downhill-brawl.html",
  "chess": "/games/chess.html",
  "squish": "/games/squish.html",
  "liars-tavern": "/games/liars-tavern.html",
  "hero-brawl": "/games/hero-brawl.html",
};

export function getGameUrl(id: string): string {
  return URL_MAP[id] ?? "";
}

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
