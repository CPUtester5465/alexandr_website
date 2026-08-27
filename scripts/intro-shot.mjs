import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error' || /intro|splat|Spark/i.test(m.text())) console.log('[pg]', m.text().slice(0, 200)); });
await page.goto('http://localhost:3001/');   // no hash -> intro
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/intro-1-paper.png' });
await page.click('text=touch to begin');
await page.waitForTimeout(1700);              // mid-dive
await page.screenshot({ path: '/tmp/intro-2-dive.png' });
await page.waitForTimeout(2600);              // into the splat
await page.screenshot({ path: '/tmp/intro-3-splat.png' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/intro-4-mid.png' });
await page.waitForTimeout(4000);              // should be in the hub
await page.screenshot({ path: '/tmp/intro-5-hub.png' });
await browser.close();
console.log('done');
