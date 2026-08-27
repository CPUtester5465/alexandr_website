/**
 * The site's sounds, synthesized. No assets, no downloads, no credits.
 *
 * Everything routes through one lazily-created AudioContext that only exists
 * after the first user gesture (browsers require it), and everything is a few
 * oscillators with an envelope -- a music box, not a sample library.
 */

let ctx: AudioContext | null = null;
let muted = false;
const muteListeners = new Set<(m: boolean) => void>();

try {
  muted = typeof window !== 'undefined' && window.localStorage?.getItem('ag.muted') === '1';
} catch { /* private browsing */ }

export function isMuted(): boolean { return muted; }

export function setMuted(next: boolean): void {
  muted = next;
  try { window.localStorage?.setItem('ag.muted', next ? '1' : '0'); } catch { /* ok */ }
  for (const l of muteListeners) l(next);
}

export function onMuteChange(l: (m: boolean) => void): () => void {
  muteListeners.add(l);
  return () => { muteListeners.delete(l); };
}

/**
 * iOS will not start audio unless the context is created AND resumed inside a
 * real user gesture. Our sounds fire from the frame loop (walking through a
 * seed is not a gesture), so on mobile nothing ever played -- Tim's report.
 * This one-time unlock hooks the first touch/click anywhere, resumes the
 * context, and removes itself.
 */
export function installAudioUnlock(): void {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    const c = context();
    if (c && c.state !== 'running') void c.resume();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchend', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  frequency: number, start: number, duration: number,
  type: OscillatorType, peak: number
): void {
  if (muted) return;
  const c = context();
  if (!c || c.state !== 'running') return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Picking up a seed: a soft pentatonic pluck, pitch wandering with count. */
export function seedChime(count: number): void {
  const scale = [523, 587, 659, 784, 880]; // C D E G A -- pentatonic, never sour
  tone(scale[count % scale.length], 0, 0.35, 'sine', 0.12);
  tone(scale[count % scale.length] * 2, 0, 0.18, 'sine', 0.04);
}

/** Every tenth seed earns a little chord. Milestones should feel different. */
export function seedCelebration(): void {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.6, 'sine', 0.1));
}

/** Waking a shrine: a low bell -- two detuned partials, long tail. */
export function shrineBell(): void {
  tone(196, 0, 2.2, 'sine', 0.16);
  tone(392.5, 0, 1.6, 'sine', 0.07);
  tone(588, 0.02, 0.9, 'triangle', 0.03);
}

/**
 * A palette, played. Each hex's hue picks a pentatonic degree, its lightness
 * the octave -- so every painting owns a phrase, and no phrase can be sour.
 * Used by the ascent as each world-fragment is strung onto the ribbon.
 */
export function palettePhrase(hexes: string[]): void {
  const scale = [261.6, 293.7, 329.6, 392.0, 440.0]; // C D E G A
  hexes.slice(0, 3).forEach((hex, i) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let hue = 0;
    if (mx !== mn) {
      if (mx === r) hue = ((g - b) / (mx - mn) + 6) % 6;
      else if (mx === g) hue = (b - r) / (mx - mn) + 2;
      else hue = (r - g) / (mx - mn) + 4;
    }
    const degree = Math.floor((hue / 6) * scale.length) % scale.length;
    const octave = (mx + mn) / 2 > 0.55 ? 2 : 1;
    tone(scale[degree] * octave, i * 0.14, 0.5, 'sine', 0.09);
  });
}

/** Planting: earthy thump then a rising sprout. */
export function plantSound(): void {
  tone(110, 0, 0.25, 'sine', 0.18);
  tone(440, 0.18, 0.3, 'sine', 0.07);
  tone(659, 0.32, 0.4, 'sine', 0.08);
}
