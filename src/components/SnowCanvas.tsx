/**
 * SnowCanvas — Realistic mountain blizzard snowfall
 *
 * PixiJS v8 optimised:
 *  • Three ParticleContainers (far / mid / near) using the v8 Particle API
 *    (new Particle({...}), addParticle(), dynamicProperties object format)
 *  • One soft radial-blob canvas texture baked per layer — zero draw calls per frame
 *  • All particle state in flat Float32Arrays — no per-frame object allocation
 *  • Fog layer: 5 large flat-oval Sprites + BlurFilter for atmospheric haze
 *  • Wind: smooth LERP towards a storm-biased target + random exponential-decay gusts
 *  • deltaTime clamped to 3 so tab-blur spikes can't teleport particles
 */

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// ─── Layer config ─────────────────────────────────────────────────────────────

interface LayerDef {
  count:      number;
  radius:     number;
  speedY:     [number, number];
  alpha:      [number, number];
  windFactor: number;
  wobble:     [number, number];
}

const LAYERS: LayerDef[] = [
  // far  — tiny, very faint, barely drift
  { count: 180, radius: 1.2, speedY: [0.18, 0.46], alpha: [0.06, 0.22], windFactor: 0.22, wobble: [0.06, 0.18] },
  // mid
  { count: 110, radius: 2.2, speedY: [0.44, 0.95], alpha: [0.20, 0.44], windFactor: 0.55, wobble: [0.14, 0.32] },
  // near — large, fast, fully wind-blown
  { count:  55, radius: 4.0, speedY: [0.90, 1.95], alpha: [0.45, 0.82], windFactor: 1.00, wobble: [0.28, 0.58] },
];

const TOTAL = LAYERS.reduce((s, l) => s + l.count, 0);

// ─── Wind ─────────────────────────────────────────────────────────────────────

const WIND_LERP     = 0.0014;
const WIND_BASE     = 0.55;   // always blowing — mountain storm in progress
const WIND_MAX      = 1.8;
const WIND_INTERVAL = 300;    // frames between target re-rolls
const GUST_CHANCE   = 0.003;
const GUST_PEAK     = 3.2;

// ─── Fog ──────────────────────────────────────────────────────────────────────

const FOG_COUNT = 5;

// ─── Texture factories ────────────────────────────────────────────────────────

/** Soft radial snow blob baked into a canvas texture */
function makeBlobTex(radius: number): PIXI.Texture {
  const pad  = 3;
  const size = Math.ceil(radius * 2 + pad * 2);
  const c    = document.createElement("canvas");
  c.width    = size;
  c.height   = size;
  const ctx  = c.getContext("2d")!;
  const cx   = size / 2;

  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, radius + pad);
  g.addColorStop(0.00, "rgba(255,255,255,1.00)");
  g.addColorStop(0.25, "rgba(245,251,255,0.88)");
  g.addColorStop(0.60, "rgba(225,242,255,0.30)");
  g.addColorStop(1.00, "rgba(215,238,255,0.00)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return PIXI.Texture.from(c);
}

/** Wide flat fog-patch oval baked into a canvas texture */
function makeFogTex(w: number, h: number): PIXI.Texture {
  const c   = document.createElement("canvas");
  c.width   = w;
  c.height  = h;
  const ctx = c.getContext("2d")!;
  const cx  = w / 2;
  const cy  = h / 2;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
  g.addColorStop(0.00, "rgba(218,234,255,1.00)");
  g.addColorStop(0.40, "rgba(212,230,255,0.38)");
  g.addColorStop(1.00, "rgba(208,228,255,0.00)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.48, h * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
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
      // v8 BlurFilter — strength replaces blur, quality stays the same
      fogContainer.filters = [new PIXI.BlurFilter({ strength: 22, quality: 2 })];
      app.stage.addChild(fogContainer);

      const fW   = Math.round(W * 1.3);
      const fH   = Math.round(H * 0.40);
      const fogT = makeFogTex(fW, fH);

      interface FogEntry { sp: PIXI.Sprite; vx: number; vy: number }
      const fogEntries: FogEntry[] = [];

      for (let i = 0; i < FOG_COUNT; i++) {
        const sp = new PIXI.Sprite(fogT);
        sp.anchor.set(0.5);
        sp.x     = W * (0.05 + Math.random() * 0.9);
        sp.y     = H * (0.28 + Math.random() * 0.52); // lower half / valley
        sp.alpha = 0.022 + Math.random() * 0.060;
        sp.scale.set(
          0.65 + Math.random() * 1.15,  // wide
          0.16 + Math.random() * 0.24,  // flat
        );
        fogContainer.addChild(sp);
        fogEntries.push({
          sp,
          vx: (Math.random() - 0.25) * 0.09, // slight storm-direction bias
          vy: (Math.random() - 0.5)  * 0.020,
        });
      }

      // ── ParticleContainers (v8) ───────────────────────────────────────────
      // v8 API: constructor takes an options object with `dynamicProperties`
      const pContainers = LAYERS.map(() =>
        new PIXI.ParticleContainer({
          dynamicProperties: {
            position: true,   // updated every frame
            rotation: false,  // static — saves GPU upload bandwidth
            scale   : false,
            color   : false,
          },
        })
      );
      for (const pc of pContainers) app.stage.addChild(pc);

      // One blob texture shared by all particles in each layer
      const textures = LAYERS.map(l => makeBlobTex(l.radius));

      // ── Flat state arrays (avoids GC pressure in hot loop) ────────────────
      const particles = new Array<PIXI.Particle>(TOTAL);
      const px        = new Float32Array(TOTAL);
      const py        = new Float32Array(TOTAL);
      const pvy       = new Float32Array(TOTAL);  // fall speed
      const pph       = new Float32Array(TOTAL);  // sway phase
      const pphs      = new Float32Array(TOTAL);  // sway phase speed
      const pwob      = new Float32Array(TOTAL);  // sway amplitude
      const pwf       = new Float32Array(TOTAL);  // wind multiplier

      let idx = 0;
      for (let li = 0; li < LAYERS.length; li++) {
        const l   = LAYERS[li];
        const tex = textures[li];

        for (let i = 0; i < l.count; i++, idx++) {
          const alpha = l.alpha[0] + Math.random() * (l.alpha[1] - l.alpha[0]);

          // v8 Particle — lightweight, no scene-graph overhead
          const p = new PIXI.Particle({
            texture : tex,
            x       : Math.random() * W,
            y       : Math.random() * H,
            anchorX : 0.5,
            anchorY : 0.5,
            alpha,
          });

          // v8: addParticle() instead of addChild()
          pContainers[li].addParticle(p);
          particles[idx] = p;

          px[idx]   = p.x;
          py[idx]   = p.y;
          pvy[idx]  = l.speedY[0] + Math.random() * (l.speedY[1] - l.speedY[0]);
          pph[idx]  = Math.random() * Math.PI * 2;
          pphs[idx] = 0.006 + Math.random() * 0.012;
          pwob[idx] = l.wobble[0] + Math.random() * (l.wobble[1] - l.wobble[0]);
          pwf[idx]  = l.windFactor;
        }
      }

      // ── Wind state ────────────────────────────────────────────────────────
      let wind       = WIND_BASE;
      let windTarget = WIND_BASE * 1.4;
      let windTimer  = 0;
      let gust       = 0.0;
      let gustDecay  = 0.022;

      // ── Ticker ────────────────────────────────────────────────────────────
      app.ticker.add((ticker) => {
        const dt  = Math.min(ticker.deltaTime, 3.0);
        const W2  = app.screen.width;
        const H2  = app.screen.height;
        const pad = 6;

        // Wind
        windTimer += dt;
        if (windTimer >= WIND_INTERVAL) {
          windTimer = 0;
          // 75 % of the time keep same direction — feels like a sustained storm
          const flip = Math.random() < 0.25 ? -1 : 1;
          windTarget = flip * (WIND_BASE + Math.random() * (WIND_MAX - WIND_BASE));
        }
        if (Math.random() < GUST_CHANCE * dt) {
          gust      = Math.sign(windTarget || 1) * (0.4 + Math.random()) * GUST_PEAK;
          gustDecay = 0.018 + Math.random() * 0.024;
        }
        gust *= Math.pow(1 - gustDecay, dt);
        wind += (windTarget - wind) * WIND_LERP * dt;
        const totalWind = wind + gust;

        // Fog drift
        for (const f of fogEntries) {
          f.sp.x += (f.vx + totalWind * 0.045) * dt;
          f.sp.y += f.vy * dt;

          const hw = fW * f.sp.scale.x * 0.5;
          if (f.sp.x >  W2 + hw) f.sp.x = -hw;
          if (f.sp.x < -hw)      f.sp.x = W2 + hw;
          // Soft vertical bounce so fog stays in the mid-lower region
          if (f.sp.y > H2 * 0.90) f.vy = -Math.abs(f.vy) * 0.85;
          if (f.sp.y < H2 * 0.08) f.vy =  Math.abs(f.vy) * 0.85;
        }

        // Snow particles — hot path, zero allocations
        for (let i = 0; i < TOTAL; i++) {
          pph[i] += pphs[i] * dt;

          let nx = px[i] + (Math.sin(pph[i]) * pwob[i] + totalWind * pwf[i]) * dt;
          let ny = py[i] + pvy[i] * dt;

          if (nx >  W2 + pad) nx = -pad;
          if (nx < -pad)      nx = W2 + pad;

          if (ny > H2 + pad) {
            ny = -pad;
            nx = Math.random() * W2;
          }

          px[i] = nx;
          py[i] = ny;

          particles[i].x = nx;
          particles[i].y = ny;
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
