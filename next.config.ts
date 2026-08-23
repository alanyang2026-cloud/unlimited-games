import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Allow the games (and our PWA / Chrome extension) to embed
          // any page on this site as an iframe from any origin.  These
          // are public, no-auth pages so framing them is safe.  Modern
          // browsers use CSP frame-ancestors; we drop X-Frame-Options
          // entirely so it doesn't conflict.
          //
          // CSP `*` deliberately excludes non-network schemes (see
          // https://w3c.github.io/webappsec-csp/#match-url-to-source-list)
          // so the Chrome extension popup (chrome-extension://) got a
          // "refused to connect" until we listed the scheme by name.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors * https: chrome-extension:",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
