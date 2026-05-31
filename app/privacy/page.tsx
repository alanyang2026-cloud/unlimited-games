import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Unlimited Games handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <article className="max-w-2xl w-full text-slate-300 leading-relaxed">
        <a href="/" className="text-sm text-purple-400 hover:underline">← Back to games</a>
        <h1 className="text-4xl font-black mt-4 mb-2 text-white">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: May 2026</p>

        <p className="mb-6">
          Unlimited Games is a free browser-based game collection. We try to collect
          as little data as possible. This page explains exactly what does, and does
          not, happen when you play.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">1. No accounts</h2>
        <p className="mb-4">
          You don&apos;t sign up. You don&apos;t log in. We don&apos;t know your real
          name, email, or location. The site has no analytics or advertising trackers.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">2. What is stored locally</h2>
        <p className="mb-4">
          Some games save state to your own browser&apos;s local storage so progress
          persists between visits — chess ratings, fishing upgrades, snake high scores,
          a session-only multiplayer player ID, and the name you type in for
          multiplayer. Nothing in local storage ever leaves your device unless a
          multiplayer game session uses it (see next section). Clearing your browser
          data wipes all of it instantly.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">3. Multiplayer data (Snake Battle, Arcade Brawl, Liar&apos;s Tavern)</h2>
        <p className="mb-4">
          The three multiplayer games use{" "}
          <a className="text-purple-400 underline" href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
            Google Firebase Realtime Database
          </a>{" "}
          to sync game state, player positions, and chat messages between players in
          the same match.
        </p>
        <p className="mb-4">
          While you&apos;re in a match we briefly write to Firebase:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>A random, anonymous player ID generated in your browser (e.g. <code className="text-slate-400 text-sm">p_kxm1a3</code>).</li>
          <li>The display name you typed into the multiplayer prompt (max 12 characters).</li>
          <li>In-game state: your character&apos;s position, score, cards held, and game actions.</li>
          <li>Chat messages you choose to send.</li>
        </ul>
        <p className="mb-4">
          These entries are automatically removed when you close the browser tab (via
          Firebase&apos;s <code className="text-slate-400 text-sm">onDisconnect</code> handler) or at the end of the match.
          Chat history is also capped — we keep only the last 40 messages per room.
        </p>
        <p className="mb-4">
          Your IP address is visible to Google Firebase as part of any network request
          to their service. Google&apos;s handling of that is covered by their privacy
          policy linked above.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">4. Hosting</h2>
        <p className="mb-4">
          The site is hosted on{" "}
          <a className="text-purple-400 underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            Vercel
          </a>
          . Vercel sees standard web request metadata (IP, user agent, requested URL)
          like every web host does, but we don&apos;t use Vercel Analytics or any
          third-party traffic tracker.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">5. Children</h2>
        <p className="mb-4">
          The site is suitable for general audiences. Because we don&apos;t collect any
          personal information, parents/guardians of children under 13 can let them
          play without an account or signup. The only user-generated content is chat
          messages in multiplayer modes — those messages are visible to other players
          in the same room and we have no moderation. Please supervise younger players
          who choose to use chat.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">6. Cookies</h2>
        <p className="mb-4">
          We don&apos;t use cookies. Firebase&apos;s SDK may use small amounts of
          local storage internally to manage its own connection state.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-3">7. Contact</h2>
        <p className="mb-4">
          Questions, deletion requests, or anything else: email <a className="text-purple-400 underline" href="mailto:alanyang2026@gmail.com">alanyang2026@gmail.com</a>.
        </p>

        <p className="text-sm text-slate-500 mt-12">
          Built in New Zealand 🇳🇿
        </p>
      </article>
    </main>
  );
}
