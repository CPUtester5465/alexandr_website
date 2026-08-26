// Split the post pipeline live: disable the EffectPass and force the
// RenderPass to screen, to find which pass loses the world.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3002/#poppy';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 300)));

await page.goto(url);
await page.waitForTimeout(7000);

const info = await page.evaluate(() => {
  const c = window.__studyComposer;
  if (!c) return null;
  return {
    passes: c.passes.map((p) => ({
      name: p.name, enabled: p.enabled, renderToScreen: p.renderToScreen
    })),
    multisampling: c.multisampling,
    inputBuffer: c.inputBuffer
      ? { w: c.inputBuffer.width, h: c.inputBuffer.height,
          depth: !!c.inputBuffer.depthBuffer, type: c.inputBuffer.texture.type }
      : null
  };
});
console.log('composer:', JSON.stringify(info));

// Pass 1: RenderPass straight to screen.
await page.evaluate(() => {
  const c = window.__studyComposer;
  for (let i = 1; i < c.passes.length; i++) c.passes[i].enabled = false;
  c.passes[0].renderToScreen = true;
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'study-probe-renderpass.png' });
console.log('saved study-probe-renderpass.png');

// Pass 2: restore, and instead neutralise the effects but keep the pass.
await page.evaluate(() => {
  const c = window.__studyComposer;
  c.passes[0].renderToScreen = false;
  for (let i = 1; i < c.passes.length; i++) c.passes[i].enabled = true;
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'study-probe-full.png' });
console.log('saved study-probe-full.png');

await browser.close();
