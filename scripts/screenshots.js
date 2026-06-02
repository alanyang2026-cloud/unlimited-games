// Generate Chrome-Web-Store-compliant screenshots of the live site.
//   - 1280×800 (Chrome Store's max accepted size)
//   - 24-bit PNG, no alpha channel
//   - Saves to ~/Desktop/UG-screenshots/
//
//  Run:  node scripts/screenshots.js
//
// Notes:
//   * We pull from the LIVE deployed site (no need to run dev server).
//   * Each shot waits a beat for animations to settle.
//   * Where useful we navigate past menus to capture in-game footage.

const puppeteer = require('puppeteer');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SITE = 'https://unlimitedgames.vercel.app';
const OUT  = path.join(os.homedir(), 'Desktop', 'UG-screenshots');
const W = 1280, H = 800;

const SHOTS = [
  { name: '1-home',         url: SITE + '/',                          wait: 800 },
  { name: '2-liars-tavern', url: SITE + '/games/liars-tavern.html',   wait: 2000, click: '.title button' },
  { name: '3-snake-battle', url: SITE + '/games/snake-battle.html',   wait: 1500, click: '.btn.bn' },
  { name: '4-arcade-brawl', url: SITE + '/games/arcade-brawl.html',   wait: 1500 },
  { name: '5-chess',        url: SITE + '/games/chess.html',          wait: 1200 },
];

(async () => {
  if(!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });

  for(const shot of SHOTS){
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    console.log('→', shot.name, shot.url);
    try {
      await page.goto(shot.url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch(e){
      console.warn('  load timeout, continuing anyway');
    }
    // Optionally click into the game (most launchers have a start button)
    if(shot.click){
      try {
        await page.evaluate(sel => {
          const el = document.querySelector(sel);
          if(el) el.click();
        }, shot.click);
      } catch(e){ /* ignore */ }
    }
    // Wait for animations / 3D scene to settle
    await new Promise(r => setTimeout(r, shot.wait));

    const file = path.join(OUT, shot.name + '.png');
    // 24-bit PNG: turn omitBackground off and set a solid bg so there's no alpha
    await page.evaluate(() => { document.documentElement.style.background = '#07070d'; });
    await page.screenshot({
      path: file,
      type: 'png',
      omitBackground: false,
      fullPage: false,
      clip: { x: 0, y: 0, width: W, height: H },
    });
    console.log('  ✓', file);
    await page.close();
  }

  await browser.close();

  // Strip alpha channel for Chrome Store compliance (sharp 24-bit PNG)
  try {
    const sharp = require('sharp');
    for(const shot of SHOTS){
      const file = path.join(OUT, shot.name + '.png');
      const buf = await sharp(file)
        .flatten({ background: { r: 7, g: 7, b: 13 } })  // matte over dark bg, removes alpha
        .png({ palette: false, compressionLevel: 9 })
        .toBuffer();
      fs.writeFileSync(file, buf);
    }
    console.log('\n✓ Alpha stripped from all screenshots.');
  } catch(e){
    console.warn('Could not strip alpha:', e.message);
  }
  console.log('\nAll done. Upload from:', OUT);
})();
