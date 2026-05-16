/**
 * SnowCanvas — realistic blizzard / mountain-storm snowfall
 *
 * Approach:
 *  • Three pre-baked canvas RenderTextures (soft radial blobs, no geometry draw calls)
 *  • All 360 particles are PIXI.Sprite inside ParticleContainers — maximum GPU batching
 *  • Particle data stored in parallel Float32Arrays — no object allocation per frame
 *  • Fog: 4 large soft ellipses that drift slowly with the wind
 *  • Wind: smooth low-frequency drift + random gust spikes that decay naturally
 *  • Storm bias: wind favours one direction to feel like mountain weather
 */

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// ─── Layer definitions ────────────────────────────────────────────────────────

const LAYERS = [
  // [0] far — tiny, slow, very faint
  { count: 200, r: 1.1, speedY: [0.22, 0.50] as [number,number], speedX: [-0.04, 0.04] as [number,number], alpha: [0.08, 0.24] as [number,number] },
  // [1] mid
  { count: 120, r: 2.0, speedY: [0.50, 1.00] as [number,number], speedX: [-0.08, 0.08] as [number,number], alpha: [0.20, 0.45] as [number,number] },
  // [2] near — larger, faster, brighter
  { count:  60, r: 3.5, speedY: [0.95, 2.10] as [number,number], speedX: [-0.12, 0.12] as [number,number], alpha: [0.42, 0.80] as [number,number] },
];
const TOTAL = LAYERS.reduce((s, l) => s + l.count, 0);

// ─── Wind constants ───────────────────────────────────────────────────────────

const WIND_LERP     = 0.0016;  // smoothing towards target
const WIND_MAX      = 1.4;     // max sustained horizontal push (px/frame at dt=1)
const WIND_INTERVAL = 320;     // frames between target changes
const GUST_CHANCE   = 0.0035;  // per-frame probability
const GUST_MAX      = 3.0;     // peak gust magnitude

// ─── Fog ──────────────────────────────────────────────────────────────────────

const FOG_COUNT  = 4;
const FOG_ALPHA  : [number, number] = [0.028, 0.075];

// ─── Canvas-based soft-blob texture ──────────────────────────────────────────

function makeBlobTexture(radius: number): PIXI.Texture {
  const pad  = 2;
  const size = Math.ceil(radius * 2 + pad * 2);
  const c    = document.createElement("canvas");
  c.width    = size;
  c.height   = size;
  const ctx  = c.getContext("2d")!;
  const cx   = size / 2;

  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, radius + pad * 0.5);
  g.addColorStop(0.00, "rgba(255,255,255,1.0)");
  g.addColorStop(0.30, "rgba(240,248,255,0.80)");
  g.addColorStop(0.65, "rgba(220,236,255,0.28)");
  g.addColorStop(1.00, "rgba(210,230,255,0.00)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return PIXI.Texture.from(c);
}

// ─── Canvas-based fog patch texture ──────────────────────────────────────────

function makeFogTexture(w: number, h: number): PIXI.Texture {
  const c   = document.createElement("canvas");
  c.width   = w;
  c.height  = h;
  const ctx = c.getContext("2d")!;
  const cx  = w / 2, cy = h / 2;
  const r   = Math.max(w, h) * 0.52;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0.00, "rgba(215,232,255,1.0)");
  g.addColorStop(0.45, "rgba(210,228,255,0.40)");
  g.addColorStop(1.00, "rgba(205,225,255,0.00)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return PIXI.Texture.from(c);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SnowCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const app = new PIXI.Application();
    let destroyed = false;

    async function init() {
      await app.init({
        resizeTo       : window,
        backgroundAlpha: 0,
        antialias      : false,
        powerPreference: "low-power",
        resolution     : Math.min(window.devicePixelRatio, 2),
        autoDensity    : true,
      });

      if (destroyed || !mountRef.current) return;
      mountRef.current.appendChild(app.canvas);

      const W = app.screen.width;
      const H = app.screen.height;

      // ── Fog ───────────────────────────────────────────────────────────────
      const fogContainer = new PIXI.Container();
      app.stage.addChild(fogContainer);

      const fW   = Math.round(W * 1.1);
      const fH   = Math.round(H * 0.50);
      const fogT = makeFogTexture(fW, fH);

      const fogData: { sp: PIXI.Sprite; vx: number; vy: number }[] = [];
      for (let i = 0; i < FOG_COUNT; i++) {
        const sp    = new PIXI.Sprite(fogT);
        sp.anchor.set(0.5);
        sp.x     = W * (0.05 + Math.random() * 0.9);
        sp.y     = H * (0.25 + Math.random() * 0.55);
        sp.alpha = FOG_ALPHA[0] + Math.random() * (FOG_ALPHA[1] - FOG_ALPHA[0]);
        sp.scale.set(
          0.55 + Math.random() * 0.9,
          0.20 + Math.random() * 0.28,
        );
        fogContainer.addChild(sp);
        fogData.push({
          sp,
          vx: (Math.random() - 0.5) * 0.10,
          vy: (Math.random() - 0.5) * 0.03,
        });
      }

      // ── Snow ParticleContainers ───────────────────────────────────────────
      const pContainers = LAYERS.map(() =>
        new PIXI.ParticleContainer(
          600,
          { position: true, alpha: false, tint: false, uvs: false, rotation: false },
          600,
          true,
        )
      );
      for (const pc of pContainers) app.stage.addChild(pc);

      // ── Blob textures (one per layer radius) ──────────────────────────────
      const textures = LAYERS.map(l => makeBlobTexture(l.r));

      // ── Parallel Float32 particle arrays ─────────────────────────────────
      const sprites : PIXI.Sprite[] = [];
      const px      = new Float32Array(TOTAL);
      const py      = new Float32Array(TOTAL);
      const pvx     = new Float32Array(TOTAL);  // base horizontal drift
      const pvy     = new Float32Array(TOTAL);  // fall speed
      const pph     = new Float32Array(TOTAL);  // sway phase
      const pphs    = new Float32Array(TOTAL);  // sway phase speed
      const pwob    = new Float32Array(TOTAL);  // sway amplitude
      const pwm     = new Float32Array(TOTAL);  // wind response multiplier

      let idx = 0;
      for (let li = 0; li < LAYERS.length; li++) {
        const l   = LAYERS[li];
        const tex = textures[li];
        const cnt = l.count;
        for (let i = 0; i < cnt; i++, idx++) {
          const sp = new PIXI.Sprite(tex);
          sp.anchor.set(0.5);
          sp.alpha = l.alpha[0] + Math.random() * (l.alpha[1] - l.alpha[0]);

          px[idx]   = Math.random() * W;
          py[idx]   = Math.random() * H;
          pvx[idx]  = l.speedX[0] + Math.random() * (l.speedX[1] - l.speedX[0]);
          pvy[idx]  = l.speedY[0] + Math.random() * (l.speedY[1] - l.speedY[0]);
          pph[idx]  = Math.random() * Math.PI * 2;
          pphs[idx] = 0.007 + Math.random() * 0.011;
          pwob[idx] = 0.12  + Math.random() * (0.18 + li * 0.14);
          pwm[idx]  = 0.18  + li * 0.35 + Math.random() * 0.10;

          sp.x = px[idx];
          sp.y = py[idx];
          pContainers[li].addChild(sp);
          sprites.push(sp);
        }
      }

      // ── Wind state ────────────────────────────────────────────────────────
      let wind        = 0.25;   // start with a gentle left-to-right mountain wind
      let windTarget  = 0.40;
      let windTimer   = 0;
      let gust        = 0.0;
      let gustDecayR  = 0.022;

      // ── Ticker ────────────────────────────────────────────────────────────
      app.ticker.add((ticker) => {
        const dt   = Math.min(ticker.deltaTime, 3.0);
        const W2   = app.screen.width;
        const H2   = app.screen.height;
        const padX = 8;

        // Wind simulation
        windTimer += dt;
        if (windTimer >= WIND_INTERVAL) {
          windTimer = 0;
          // Mountain storm: 70 % of the time wind keeps same general direction
          const flip = Math.random() < 0.30 ? -1 : 1;
          windTarget = flip * (0.15 + Math.random() * 0.85) * WIND_MAX;
        }
        if (Math.random() < GUST_CHANCE * dt) {
          // Gust aligns with current wind direction
          gust       = Math.sign(windTarget || 1) * (0.3 + Math.random() * 0.7) * GUST_MAX;
          gustDecayR = 0.020 + Math.random() * 0.022;
        }
        gust  *= Math.pow(1 - gustDecayR, dt);
        wind  += (windTarget - wind) * WIND_LERP * dt;
        const totalWind = wind + gust;

        // Fog drift
        for (const f of fogData) {
          f.sp.x += (f.vx + totalWind * 0.05) * dt;
          f.sp.y += f.vy * dt;
          // Wrap horizontally
          const hw = fW * f.sp.scale.x * 0.5;
          if (f.sp.x > W2 + hw) f.sp.x = -hw;
          if (f.sp.x < -hw)     f.sp.x = W2 + hw;
          // Bounce vertically
          if (f.sp.y > H2 * 0.88) f.vy = -Math.abs(f.vy);
          if (f.sp.y < H2 * 0.10) f.vy =  Math.abs(f.vy);
        }

        // Snow particles
        for (let i = 0; i < TOTAL; i++) {
          pph[i] += pphs[i] * dt;

          const nx = px[i] + (pvx[i] + Math.sin(pph[i]) * pwob[i] + totalWind * pwm[i]) * dt;
          const ny = py[i] + pvy[i] * dt;

          // Horizontal wrap
          px[i] = nx > W2 + padX ? -padX : nx < -padX ? W2 + padX : nx;
          // Vertical reset
          if (ny > H2 + padX) {
            py[i] = -padX;
            px[i] = Math.random() * W2;
          } else {
            py[i] = ny;
          }

          sprites[i].x = px[i];
          sprites[i].y = py[i];
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      app.destroy(true);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position     : "fixed",
        inset        : 0,
        pointerEvents: "none",
        zIndex       : 0,
      }}
    />
  );
}
