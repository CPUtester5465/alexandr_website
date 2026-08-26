// Screenshot loop for the smooth painterly study.
//
// Headless SwiftShader renders this scene at about one frame a second, so
// walking anywhere by simulated input takes minutes. Instead: teleport the
// player through the dev debug handle, let the streamer catch up, and shoot.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3002/#poppy';
const prefix = process.argv[3] ?? 'study-walk';

const browser = await chromium.launch({
  args: ['--use-angle=metal', '--enable-gpu']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
if (process.env.REDUCED === '1') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  console.log('emulating prefers-reduced-motion');
}

page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error' || /THREE\.|shader/i.test(text)) {
    console.log(`[console:${msg.type()}]`, text.slice(0, 400));
  }
});
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 400)));

async function stats(label) {
  const s = await page.evaluate(() => {
    const d = window.__studyDebug;
    if (!d) return null;
    return {
      camera: d.camera.position.toArray().map((v) => +v.toFixed(1)),
      player: d.controlState.playerPosition.toArray().map((v) => +v.toFixed(1))
    };
  });
  console.log(label, JSON.stringify(s));
}

async function fps() {
  return page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      if (performance.now() - start < 1000) requestAnimationFrame(tick);
      else resolve(frames);
    };
    requestAnimationFrame(tick);
  }));
}

async function teleport(x, z, heading) {
  await page.evaluate(([tx, tz, th]) => {
    const d = window.__studyDebug;
    const y = d.field.heightAt(tx, tz) + 1.38;
    d.controlState.playerPosition.set(tx, y, tz);
    d.controlState.heading = th;
    d.controlState.cameraYaw = th + Math.PI;
    d.controlState.inputYaw = d.controlState.cameraYaw;
  }, [x, z, heading]);
}

await page.goto(url);
await page.waitForTimeout(8000);
console.log('fps:', await fps());
await stats('arrival:');
await page.screenshot({ path: `${prefix}-a.png` });

// Out into the meadow, looking deeper in.
await teleport(30, -140, Math.PI);
await page.waitForTimeout(12000);
await stats('meadow:');
await page.screenshot({ path: `${prefix}-b.png` });

// A hero framing: stand back from a real poppy site, facing it.
const hero = await page.evaluate(() => {
  const d = window.__studyDebug;
  const sites = d.poppies(-120, -220, 40, -60);
  if (!sites.length) return null;
  const f = sites[Math.floor(sites.length / 2)];
  return { x: f.x, z: f.z, stem: f.stem };
});
console.log('hero site:', JSON.stringify(hero));
if (hero) {
  // Stand 30 units south of the flower, facing north toward it.
  await teleport(hero.x, hero.z + 30, Math.PI);
  await page.waitForTimeout(14000);
  await stats('hero:');
  await page.screenshot({ path: `${prefix}-c.png` });
}

await browser.close();
