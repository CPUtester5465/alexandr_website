import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal','--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto('http://localhost:3001/');
await p.waitForTimeout(4200);
await p.screenshot({ path: '/tmp/card.png' });
await b.close(); console.log('ok');
