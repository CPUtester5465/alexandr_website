/**
 * The site's sounds, synthesized. No assets, no downloads, no credits.
 *
 * Everything routes through one lazily-created AudioContext that only exists
 * after the first user gesture (browsers require it), and everything is a few
 * oscillators with an envelope -- a music box, not a sample library.
 */

let ctx: AudioContext | null = null;

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
  const c = context();
  if (!c) return;
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

/** Planting: earthy thump then a rising sprout. */
export function plantSound(): void {
  tone(110, 0, 0.25, 'sine', 0.18);
  tone(440, 0.18, 0.3, 'sine', 0.07);
  tone(659, 0.32, 0.4, 'sine', 0.08);
}
