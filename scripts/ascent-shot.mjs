import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal','--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', (e) => console.log('[ERR]', String(e).slice(0,250)));
await p.goto('http://localhost:3001/');
await p.waitForTimeout(2500);
await p.click('text=touch to begin');
await p.waitForTimeout(3200 + 4600 + 1800);  // dive + splat + into ascent
await p.screenshot({ path: '/tmp/asc-1.png' });
await p.waitForTimeout(3200);
await p.screenshot({ path: '/tmp/asc-2.png' });
await p.waitForTimeout(3200);
await p.screenshot({ path: '/tmp/asc-3.png' });
await p.waitForTimeout(4000);
await p.screenshot({ path: '/tmp/asc-4-hub.png' });
await b.close(); console.log('ascent walked');
