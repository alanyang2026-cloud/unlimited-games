# Unlimited Games — Chrome Extension

A tiny browser extension that opens [unlimitedgames.vercel.app](https://unlimitedgames.vercel.app)
in a new tab when you click its toolbar icon. The actual games live on the
website; this package is just the store-listing wrapper.

## Files

| File | Purpose |
|---|---|
| `manifest.json`           | Manifest V3, declares the extension |
| `background.js`           | Service worker — click → open new tab |
| `icons/icon-16/32/48/128.png` | Toolbar + store icons (auto-generated from `public/icons/icon.svg`) |

The extension requests **zero permissions** and **zero host permissions**.
All it can do is open a tab. No data is read from any other site.

## Local testing

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked** and select this `chrome-extension/` folder.
4. The 🎮 icon should appear in the toolbar — click it.

## Publishing to the Chrome Web Store

You'll need a one-time **$5 USD** developer registration fee.

1. **Zip this folder** (everything inside `chrome-extension/`):
   ```sh
   cd chrome-extension
   zip -r ../unlimited-games-extension.zip . -x "README.md" "*.DS_Store"
   ```
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
3. Pay the $5 fee if you haven't already (one-time, per Google account).
4. Click **New item** and upload `unlimited-games-extension.zip`.
5. Fill in the store listing:
   - **Category:** Entertainment or Games
   - **Description:** Use the text from `manifest.json` `description`, or
     expand it for the long-form listing.
   - **Screenshots:** 1280×800 or 640×400. Take a few from the homepage and
     a couple of games — Snake Battle multiplayer and Liar's Tavern look
     impressive. You need at least one.
   - **Promo tile:** 440×280 PNG (optional but recommended).
   - **Privacy policy URL:** <https://unlimitedgames.vercel.app/privacy>
   - **Data usage:** Declare that the extension itself collects nothing.
     The linked website uses Firebase for multiplayer (already disclosed
     in the privacy policy).
6. Submit for review. First-time reviews typically take **1-3 business days**.

## Updating

Bump the `version` in `manifest.json` (e.g. `1.0.0` → `1.0.1`), rebuild
the zip, and upload as a new package version in the dashboard. Reviews
for updates are usually faster.

## Why not a real web app?

Chrome Apps (the "open a packaged web app from the store" category) were
deprecated in 2022. This minimal launcher is the closest replacement that
still gets you a store listing. For a fuller offline experience, the site
itself is a PWA — users can click "Install" in the Chrome address bar.
