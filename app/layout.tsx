import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const SITE_URL = "https://unlimitedgames.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Unlimited Games — free browser games, no downloads",
    template: "%s · Unlimited Games",
  },
  description:
    "A growing collection of free browser games: snake, chess, fishing, fighting, a 3D tavern bluffer, and more. No downloads, no logins, just play.",
  applicationName: "Unlimited Games",
  authors: [{ name: "Alan Yang" }],
  creator: "Alan Yang",
  keywords: [
    "free games", "browser games", "html5 games", "snake.io",
    "chess online", "liar's bar", "multiplayer games", "no download",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UG Games",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Unlimited Games",
    title: "Unlimited Games — free browser games",
    description:
      "Snake, chess, fishing, fighting, 3D liar's bar, and more. Free, instant, in your browser.",
    locale: "en_NZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unlimited Games",
    description: "Free browser games — no downloads, just play.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-[#07070d] text-slate-200 antialiased">
        {children}
        {/* Register the service worker for offline / PWA install support */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker
                  .register('/sw.js')
                  .catch(err => console.warn('SW registration failed', err));
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
