/**
 * IceDustCanvas
 *
 * Three layered atmospheric systems — all PixiJS v8, zero per-frame allocations:
 *
 *  1. BLIZZARD CLOUDS  — 8 large soft elliptical masses rendered as Sprites with a
 *                        BlurFilter. They drift slowly with the wind, pulse their
 *                        alpha very gently, and give the whole scene a whiteout feel.
 *
 *  2. COLD MIST        — 120 medium semi-transparent oval particles in a
 *                        ParticleContainer. They travel mostly horizontally (wind-
 *                        driven), not downward — mimicking ground-level ice fog
 *                        swirling in a blizzard.
 *
 *  3. ICE DUST GLOW    — 320 sub-pixel to 2 px motes in a ParticleContainer.
 *                        Each one has a tiny sharp core + a wide soft halo baked
 *                        into a single canvas texture. They move fast, chaotically,
 *                        and their alpha pulses — giving the impression of ice
 *                        crystals catching the light and vanishing.
 *
 *  Wind: sustained storm bias (mostly one direction) + random exponential-decay gusts.
 *  All state in Float32Arrays. deltaTime clamped to 3.
 */

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// ─── Wind ─────────────────────────────────────────────────────────────────────

const WIND_LERP     = 0.0012;
const WIND_BASE     = 0.9;    // blizzard is always pushing
const WIND_MAX      = 2.4;
const WIND_INTERVAL = 280;
const GUST_CHANCE   = 0.004;
const GUST_PEAK     = 4.5;

// ─── Ice dust layer ───────────────────────────────────────────────────────────

const DUST_COUNT   = 320;

// speed is mostly horizontal — wind-driven ice motes, slight gravity
const DUST_SPEED_X : [number, number] = [0.4,  1.8 ];
const DUST_SPEED_Y : [number, number] = [0.05, 0.35];
const DUST_ALPHA   : [number, number] = [0.18, 0.90];

// ─── Cold mist layer ──────────────────────────────────────────────────────────

const MIST_COUNT   = 120;
const MIST_SPEED_X : [number, number] = [0.20, 0.80];
const MIST_SPEED_Y : [number, number] = [0.00, 0.12];
const MIST_ALPHA   : [number, number] = [0.04, 0.18];

// ─── Blizzard clouds ──────────────────────────────────────────────────────────

const CLOUD_COUNT  = 8;
const CLOUD_ALPHA  : [number, number] = [0.06, 0.22];

// ─── Texture factories ────────────────────────────────────────────────────────

/**
 * Ice dust mote: tiny bright core + wide soft glow halo.
 * The hard centre makes it feel like a glinting ice crystal.
 */
function makeIceDustTex(coreR: number): PIXI.Texture {
  const haloR = coreR * 6;
  const size  = Math.ceil(haloR * 2 + 2);
  const c     = document.createElement("canvas");
  c.width     = size;
  c.height    = size;
  const ctx   = c.getContext("2d")!;
  const cx    = size / 2;

  // Wide cyan-tinted halo
  const halo = ctx.createRadialGradient(cx, cx, 0, cx, cx, haloR);
  halo.addColorStop(0.00, "rgba(210,240,255,0.55)");
  halo.addColorStop(0.35, "rgba(195,232,255,0.18)");
  halo.addColorStop(1.00, "rgba(185,225,255,0.00)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Sharp bright core
  const core = ctx.createRadialGradient(cx, cx, 0, cx, cx, coreR + 1);
  core.addColorStop(0.00, "rgba(255,255,255,1.00)");
  core.addColorStop(0.50, "rgba(235,248,255,0.80)");
  core.addColorStop(1.00, "rgba(220,242,255,0.00)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  return PIXI.Texture.from(c);
}

/**
 * Cold mist particle: wide, very soft pale-blue oval —
 * looks like a breath of frozen air.
 */
function makeMistTex(w: number, h: number): PIXI.Texture {
  const c   = document.createElement("canvas");
  c.width   = w;
  c.height  = h;
  const ctx = c.getContext("2d")!;
  const cx  = w / 2;
  const cy  = h / 2;
  const r   = Math.max(w, h) * 0.52;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0.00, "rgba(225,240,255,1.00)");
  g.addColorStop(0.45, "rgba(215,235,255,0.30)");
  g.addColorStop(1.00, "rgba(210,232,255,0.00)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.49, h * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();

  return PIXI.Texture.from(c);
}

/**
 * Blizzard cloud: very large, extremely soft, near-white oval —
 * like a mass of wind-driven snow obscuring visibility.
 */
function makeCloudTex(w: number, h: number): PIXI.Texture {
  const c   = document.createElement("canvas");
  c.width   = w;
  c.height  = h;
  const ctx = c.getContext("2d")!;
  const cx  = w / 2;
  const cy  = h / 2;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.58);
  g.addColorStop(0.00, "rgba(240,247,255,1.00)");
  g.addColorStop(0.30, "rgba(232,244,255,0.55)");
  g.addColorStop(0.70, "rgba(225,240,255,0.12)");
  g.addColorStop(1.00, "rgba(220,238,255,0.00)");
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

      // ── 1. Blizzard cloud layer ────────────────────────────────────────────
      // Behind everything, blurred heavily for a volumetric whiteout feel
      const cloudContainer = new PIXI.Container();
      cloudContainer.filters = [new PIXI.BlurFilter({ strength: 40, quality: 3 })];
      app.stage.addChild(cloudContainer);

      const cW = Math.round(W  * 1.4);
      const cH = Math.round(H  * 0.55);
      const cloudTex = makeCloudTex(cW, cH);

      interface CloudEntry { sp: PIXI.Sprite; vx: number; vy: number; pulsePhase: number; baseAlpha: number }
      const cloudEntries: CloudEntry[] = [];

      for (let i = 0; i < CLOUD_COUNT; i++) {
        const sp = new PIXI.Sprite(cloudTex);
        sp.anchor.set(0.5);
        sp.x = W * Math.random();
        sp.y = H * (0.1 + Math.random() * 0.8);
        const baseAlpha = CLOUD_ALPHA[0] + Math.random() * (CLOUD_ALPHA[1] - CLOUD_ALPHA[0]);
        sp.alpha = baseAlpha;
        sp.scale.set(
          0.7 + Math.random() * 1.4,   // wide
          0.22 + Math.random() * 0.35, // flat bands
        );
        cloudContainer.addChild(sp);
        cloudEntries.push({
          sp,
          vx: (0.04 + Math.random() * 0.08) * (Math.random() < 0.8 ? 1 : -1),
          vy: (Math.random() - 0.5) * 0.015,
          pulsePhase: Math.random() * Math.PI * 2,
          baseAlpha,
        });
      }

      // ── 2. Cold mist ParticleContainer ────────────────────────────────────
      // Slightly blurred container for softness
      const mistContainer = new PIXI.ParticleContainer({
        dynamicProperties: { position: true, rotation: false, scale: false, color: false },
      });
      // Wrap in a regular Container to apply blur
      const mistWrapper = new PIXI.Container();
      mistWrapper.filters = [new PIXI.BlurFilter({ strength: 8, quality: 2 })];
      mistWrapper.addChild(mistContainer);
      app.stage.addChild(mistWrapper);

      // Several mist textures at varied sizes for natural variety
      const mistTextures = [
        makeMistTex(Math.round(W * 0.22), Math.round(H * 0.10)),
        makeMistTex(Math.round(W * 0.32), Math.round(H * 0.14)),
        makeMistTex(Math.round(W * 0.15), Math.round(H * 0.07)),
      ];

      const mistParticles = new Array<PIXI.Particle>(MIST_COUNT);
      const mpx  = new Float32Array(MIST_COUNT);
      const mpy  = new Float32Array(MIST_COUNT);
      const mvx  = new Float32Array(MIST_COUNT);
      const mvy  = new Float32Array(MIST_COUNT);
      const mph  = new Float32Array(MIST_COUNT); // sway phase
      const mphs = new Float32Array(MIST_COUNT);
      const mwf  = new Float32Array(MIST_COUNT); // wind factor

      for (let i = 0; i < MIST_COUNT; i++) {
        const alpha = MIST_ALPHA[0] + Math.random() * (MIST_ALPHA[1] - MIST_ALPHA[0]);
        const tex   = mistTextures[Math.floor(Math.random() * mistTextures.length)];
        const p = new PIXI.Particle({ texture: tex, x: Math.random() * W, y: Math.random() * H, anchorX: 0.5, anchorY: 0.5, alpha });
        mistContainer.addParticle(p);
        mistParticles[i] = p;
        mpx[i]  = p.x;
        mpy[i]  = p.y;
        mvx[i]  = MIST_SPEED_X[0] + Math.random() * (MIST_SPEED_X[1] - MIST_SPEED_X[0]);
        mvy[i]  = (Math.random() - 0.5) * MIST_SPEED_Y[1];
        mph[i]  = Math.random() * Math.PI * 2;
        mphs[i] = 0.003 + Math.random() * 0.006;
        mwf[i]  = 0.30 + Math.random() * 0.55;
      }

      // ── 3. Ice dust ParticleContainer ─────────────────────────────────────
      // No blur — we want these to feel sharp and glinting
      const dustContainer = new PIXI.ParticleContainer({
        dynamicProperties: { position: true, rotation: false, scale: false, color: false },
      });
      app.stage.addChild(dustContainer);

      // Three sizes of dust mote
      const dustTextures = [
        makeIceDustTex(0.5),
        makeIceDustTex(0.9),
        makeIceDustTex(1.4),
      ];

      const dustParticles = new Array<PIXI.Particle>(DUST_COUNT);
      const dpx   = new Float32Array(DUST_COUNT);
      const dpy   = new Float32Array(DUST_COUNT);
      const dvx   = new Float32Array(DUST_COUNT);
      const dvy   = new Float32Array(DUST_COUNT);
      const dph   = new Float32Array(DUST_COUNT); // alpha pulse phase
      const dphs  = new Float32Array(DUST_COUNT); // pulse speed
      const dba   = new Float32Array(DUST_COUNT); // base alpha
      const dwf   = new Float32Array(DUST_COUNT); // wind factor

      for (let i = 0; i < DUST_COUNT; i++) {
        const baseAlpha = DUST_ALPHA[0] + Math.random() * (DUST_ALPHA[1] - DUST_ALPHA[0]);
        const tex = dustTextures[Math.floor(Math.random() * dustTextures.length)];
        const p = new PIXI.Particle({ texture: tex, x: Math.random() * W, y: Math.random() * H, anchorX: 0.5, anchorY: 0.5, alpha: baseAlpha });
        dustContainer.addParticle(p);
        dustParticles[i] = p;
        dpx[i]  = p.x;
        dpy[i]  = p.y;
        // Mostly horizontal — ice dust is swept sideways in a blizzard
        dvx[i]  = DUST_SPEED_X[0] + Math.random() * (DUST_SPEED_X[1] - DUST_SPEED_X[0]);
        dvy[i]  = (Math.random() < 0.5 ? 1 : -1) * (DUST_SPEED_Y[0] + Math.random() * (DUST_SPEED_Y[1] - DUST_SPEED_Y[0]));
        dph[i]  = Math.random() * Math.PI * 2;
        dphs[i] = 0.025 + Math.random() * 0.055; // fast pulse — glinting effect
        dba[i]  = baseAlpha;
        dwf[i]  = 0.60 + Math.random() * 0.80; // dust is very wind-responsive
      }

      // ── Wind state ────────────────────────────────────────────────────────
      let wind       = WIND_BASE;
      let windTarget = WIND_BASE * 1.3;
      let windTimer  = 0;
      let gust       = 0.0;
      let gustDecay  = 0.020;

      // ── Ticker ────────────────────────────────────────────────────────────
      app.ticker.add((ticker) => {
        const dt  = Math.min(ticker.deltaTime, 3.0);
        const W2  = app.screen.width;
        const H2  = app.screen.height;
        const pad = 8;

        // Wind
        windTimer += dt;
        if (windTimer >= WIND_INTERVAL) {
          windTimer = 0;
          const flip = Math.random() < 0.20 ? -1 : 1; // 80% same direction
          windTarget = flip * (WIND_BASE + Math.random() * (WIND_MAX - WIND_BASE));
        }
        if (Math.random() < GUST_CHANCE * dt) {
          gust      = Math.sign(windTarget || 1) * (0.5 + Math.random()) * GUST_PEAK;
          gustDecay = 0.016 + Math.random() * 0.026;
        }
        gust *= Math.pow(1 - gustDecay, dt);
        wind += (windTarget - wind) * WIND_LERP * dt;
        const W_ = wind + gust; // total wind this frame

        // ── Cloud drift + gentle alpha pulse ──────────────────────────────
        for (const cl of cloudEntries) {
          cl.pulsePhase += 0.004 * dt;
          cl.sp.alpha    = cl.baseAlpha * (0.80 + 0.20 * Math.sin(cl.pulsePhase));
          cl.sp.x       += (cl.vx + W_ * 0.055) * dt;
          cl.sp.y       += cl.vy * dt;

          const hw = cW * cl.sp.scale.x * 0.5;
          if (cl.sp.x >  W2 + hw) cl.sp.x = -hw;
          if (cl.sp.x < -hw)      cl.sp.x = W2 + hw;
          if (cl.sp.y > H2 * 0.95) cl.vy = -Math.abs(cl.vy) * 0.8;
          if (cl.sp.y < H2 * 0.05) cl.vy =  Math.abs(cl.vy) * 0.8;
        }

        // ── Cold mist ─────────────────────────────────────────────────────
        for (let i = 0; i < MIST_COUNT; i++) {
          mph[i] += mphs[i] * dt;

          let nx = mpx[i] + (mvx[i] + Math.sin(mph[i]) * 0.12 + W_ * mwf[i]) * dt;
          let ny = mpy[i] + mvy[i] * dt;

          if (nx >  W2 + pad) { nx = -pad; ny = Math.random() * H2; }
          if (nx < -pad)      { nx = W2 + pad; ny = Math.random() * H2; }
          if (ny > H2 + pad)    ny = -pad;
          if (ny < -pad)        ny = H2 + pad;

          mpx[i] = nx; mpy[i] = ny;
          mistParticles[i].x = nx;
          mistParticles[i].y = ny;
        }

        // ── Ice dust glow — with alpha pulse ──────────────────────────────
        for (let i = 0; i < DUST_COUNT; i++) {
          dph[i] += dphs[i] * dt;

          // Glint: alpha pulses between 20 % and 100 % of base
          dustParticles[i].alpha = dba[i] * (0.20 + 0.80 * (0.5 + 0.5 * Math.sin(dph[i])));

          let nx = dpx[i] + (dvx[i] + W_ * dwf[i]) * dt;
          let ny = dpy[i] + dvy[i] * dt;

          // Dust wraps in all directions — blizzard fills the whole screen
          if (nx >  W2 + pad) { nx = -pad; ny = Math.random() * H2; }
          if (nx < -pad)      { nx = W2 + pad; ny = Math.random() * H2; }
          if (ny >  H2 + pad) { ny = -pad; }
          if (ny < -pad)      { ny = H2 + pad; }

          dpx[i] = nx; dpy[i] = ny;
          dustParticles[i].x = nx;
          dustParticles[i].y = ny;
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
