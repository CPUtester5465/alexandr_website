import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveDimension, fastTravelTo } from '../../../state/dimensionState';
import { useWayHome } from '../../../state/hubState';
import { controlState } from '../../../state/controlState';
import { groundHeightAt } from '../../../world/terrain';
import { travelTo } from '../../../state/worldState';
import { BLOCK } from '../../../world/voxel';
import { structuresIn } from '../../../world/chunk';

/**
 * A map of the world you are standing in, and a way to cross it.
 *
 * Needed because the dimensions stopped having edges. A world you can walk
 * across in six seconds needs no map; one that goes on forever needs one, or
 * every journey out is a journey back.
 *
 * The map is drawn from the same height function that builds the terrain, so it
 * cannot disagree with the ground -- there is no second source of truth to drift.
 * It is rendered once when opened rather than every frame: it is a map, not a
 * radar, and sampling forty thousand columns sixty times a second to show a
 * picture nobody is moving through would be absurd.
 *
 * PROVISIONAL STYLING.
 */

/** Blocks per map pixel. Two keeps the sample count sane and the shape legible. */
const SCALE = 2;
/** Half-width of the map, in pixels, so it covers +/-400 blocks. */
const HALF = 100;

const WorldMap: React.FC = () => {
  const spec = useActiveDimension();
  const home = useWayHome();
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centre = useRef({ x: 0, z: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spec) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Freeze the centre on open. A map that recentres while you read it is a
    // compass with extra steps.
    centre.current = {
      x: controlState.playerPosition.x,
      z: controlState.playerPosition.z
    };

    const image = ctx.createImageData(HALF * 2, HALF * 2);
    const palette = spec.palette.map((hex) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    }));

    let lowest = Infinity;
    let highest = -Infinity;
    const heights = new Float32Array(HALF * 2 * HALF * 2);
    for (let py = 0; py < HALF * 2; py++) {
      for (let px = 0; px < HALF * 2; px++) {
        const worldX = centre.current.x + (px - HALF) * SCALE * BLOCK;
        const worldZ = centre.current.z + (py - HALF) * SCALE * BLOCK;
        const h = groundHeightAt(worldX, worldZ);
        heights[px + py * HALF * 2] = h;
        if (h < lowest) lowest = h;
        if (h > highest) highest = h;
      }
    }

    const span = Math.max(1, highest - lowest);
    for (let i = 0; i < heights.length; i++) {
      // Height into the painting's own palette, dark low to pale high. The map
      // is made of his colours for the same reason the world is.
      const t = (heights[i] - lowest) / span;
      const slot = Math.min(palette.length - 1, Math.floor(t * palette.length));
      const c = palette[slot] ?? { r: 128, g: 128, b: 128 };
      const shade = 0.55 + t * 0.45;
      image.data[i * 4] = c.r * shade;
      image.data[i * 4 + 1] = c.g * shade;
      image.data[i * 4 + 2] = c.b * shade;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    // Landmarks: the structures are the only things out there worth steering by.
    const minB = Math.floor((centre.current.x - HALF * SCALE * BLOCK) / BLOCK);
    const maxB = Math.ceil((centre.current.x + HALF * SCALE * BLOCK) / BLOCK);
    const minBz = Math.floor((centre.current.z - HALF * SCALE * BLOCK) / BLOCK);
    const maxBz = Math.ceil((centre.current.z + HALF * SCALE * BLOCK) / BLOCK);
    const accent = spec.palette[2] ?? '#ffffff';
    ctx.fillStyle = accent;
    for (const s of structuresIn(spec, minB, minBz, maxB, maxBz)) {
      const px = HALF + (s.bx * BLOCK - centre.current.x) / (SCALE * BLOCK);
      const py = HALF + (s.bz * BLOCK - centre.current.z) / (SCALE * BLOCK);
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  }, [spec]);

  useEffect(() => {
    if (open) draw();
  }, [open, draw]);

  // Close on escape, because a full-screen overlay that traps you is rude.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!spec) return null;

  const toWorld = (clientX: number, clientY: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * HALF * 2;
    const py = ((clientY - rect.top) / rect.height) * HALF * 2;
    return {
      x: centre.current.x + (px - HALF) * SCALE * BLOCK,
      z: centre.current.z + (py - HALF) * SCALE * BLOCK
    };
  };

  const markerStyle = (worldX: number, worldZ: number): React.CSSProperties => ({
    position: 'absolute',
    left: `${((HALF + (worldX - centre.current.x) / (SCALE * BLOCK)) / (HALF * 2)) * 100}%`,
    top: `${((HALF + (worldZ - centre.current.z) / (SCALE * BLOCK)) / (HALF * 2)) * 100}%`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  });

  return (
    <>
      <div
        className="fixed z-30 flex gap-2"
        style={{
          right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)'
        }}
      >
        {/* Leaving must not require finding the doorway or opening anything.
            Wherever you have wandered to, one tap is the way out. */}
        <button
          type="button"
          onClick={() => travelTo('hub', 0x6B4E31, spec.slug)}
          style={{
            padding: '9px 15px', minHeight: '40px', borderRadius: '999px',
            background: 'rgba(138, 90, 51, 0.85)', color: '#EDE6D2',
            fontSize: '12px', letterSpacing: '0.06em'
          }}
        >
          Hub
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: '9px 15px', minHeight: '40px', borderRadius: '999px',
            background: 'rgba(26, 20, 16, 0.72)', color: '#EDE6D2',
            fontSize: '12px', letterSpacing: '0.06em'
          }}
        >
          Map
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(16, 12, 9, 0.92)', padding: '20px' }}
        >
          <div style={{ color: '#EDE6D2', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{spec.title.en}</div>
            <div style={{ fontSize: '13px', opacity: 0.65 }}>{spec.title.ru}</div>
            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '6px',
                          textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Tap anywhere to travel there
            </div>
          </div>

          <div style={{ position: 'relative', width: 'min(78vw, 62vh)', aspectRatio: '1' }}>
            <canvas
              ref={canvasRef}
              width={HALF * 2}
              height={HALF * 2}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const target = toWorld(e.clientX, e.clientY, rect);
                fastTravelTo(target.x, target.z);
                setOpen(false);
              }}
              style={{
                width: '100%', height: '100%',
                imageRendering: 'pixelated',
                borderRadius: '6px',
                border: '1px solid rgba(237, 230, 210, 0.25)',
                cursor: 'crosshair'
              }}
            />

            {/* Him, and the way out. */}
            <div style={{ ...markerStyle(controlState.playerPosition.x, controlState.playerPosition.z),
                          width: '11px', height: '11px', borderRadius: '999px',
                          background: '#EDE6D2', border: '2px solid #1A1410' }} />
            {home && (
              <div style={{ ...markerStyle(home.x, home.z),
                            width: '13px', height: '13px',
                            background: '#8A5A33', border: '2px solid #EDE6D2' }} />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => { travelTo('hub', 0x6B4E31, spec.slug); setOpen(false); }}
              style={{
                padding: '11px 18px', minHeight: '44px', borderRadius: '10px',
                background: '#8A5A33', color: '#EDE6D2', fontSize: '13px', fontWeight: 600
              }}
            >
              Back to the hub
            </button>
            {home && (
              <button
                type="button"
                onClick={() => { fastTravelTo(home.x, home.z - 9); setOpen(false); }}
                style={{
                  padding: '11px 18px', minHeight: '44px', borderRadius: '10px',
                  background: 'rgba(237, 230, 210, 0.14)', color: '#EDE6D2', fontSize: '13px'
                }}
              >
                To the doorway
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                padding: '11px 18px', minHeight: '44px', borderRadius: '10px',
                background: 'transparent', color: 'rgba(237, 230, 210, 0.7)', fontSize: '13px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WorldMap;
