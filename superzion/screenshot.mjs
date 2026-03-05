import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 960, height: 540 });
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle0' });

// Wait for Phaser to render menu
await new Promise(r => setTimeout(r, 2000));

// Press SPACE to start the game
await page.keyboard.press('Space');
await new Promise(r => setTimeout(r, 1500));

// Press SPACE again to dismiss controls overlay
await page.keyboard.press('Space');
await new Promise(r => setTimeout(r, 1500));

await page.screenshot({ path: 'screenshot.png', fullPage: false });
console.log('Screenshot saved to screenshot.png');
await browser.close();
