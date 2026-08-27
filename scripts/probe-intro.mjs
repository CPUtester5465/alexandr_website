import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on('console', (m) => console.log('[pg]', m.type(), m.text().slice(0,180)));
p.on('pageerror', (e) => console.log('[ERR]', String(e).slice(0,300)));
await p.goto('http://localhost:3001/');
await p.waitForTimeout(2500);
await p.click('text=touch to begin');
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  // r3f exposes the root store on the canvas element
  const el = document.querySelector('canvas');
  const key = Object.keys(el).find(k => k.startsWith('__r3f')) || '__r3f';
  const store = el.__r3f?.root ?? el[key]?.root;
  const state = store?.getState?.();
  if (!state) return 'no r3f state';
  const out = { bg: String(state.scene.background), cam: state.camera.position.toArray(), meshes: [] };
  state.scene.traverse(o => {
    if (o.isMesh) out.meshes.push({
      t: o.type, geo: o.geometry?.type,
      mat: o.material?.type,
      texW: o.material?.uniforms?.uMap?.value?.image?.width ?? null,
      amt: o.material?.uniforms?.uAmount?.value ?? null,
      pos: o.position.toArray().map(v=>+v.toFixed(1)), visible: o.visible
    });
  });
  return out;
});
console.log(JSON.stringify(info, null, 1).slice(0, 1500));
await b.close();
