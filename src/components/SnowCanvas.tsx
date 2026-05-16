import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlakeLayer = "near" | "mid" | "far";

interface Snowflake {
  gfx: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;           // horizontal velocity
  vy: number;           // vertical velocity
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  layer: FlakeLayer;
  phase: number;        // sine wave offset for swaying
  phaseSpeed: number;   // how fast the sway oscillates
  wobble: number;       // lateral wobble amplitude
  arms: number;         // 6 or 8 crystalline arms
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LAYER_CONFIG: Record<FlakeLayer, {
  count: number;
  sizeRange: [number, number];
  speedRange: [number, number];
  opacityRange: [number, number];
  scale: number;
}> = {
  far:  { count: 60, sizeRange: [1,   3  ], speedRange: [0.3, 0.7 ], opacityRange: [0.15, 0.35], scale: 0.6 },
  mid:  { count: 45, sizeRange: [3,   6  ], speedRange: [0.6, 1.2 ], opacityRange: [0.4,  0.65], scale: 0.8 },
  near: { count: 25, sizeRange: [6,   12 ], speedRange: [1.0, 2.0 ], opacityRange: [0.65, 0.95], scale: 1.0 },
};

const WIND_CHANGE_INTERVAL = 240; // frames between wind shifts
const MAX_WIND = 0.4;
const GUST_PROBABILITY = 0.003; // per frame chance of a sudden gust

// ─── Draw a crystalline snowflake ─────────────────────────────────────────────

function drawCrystalFlake(
  g: PIXI.Graphics,
  size: number,
  arms: number,
  opacity: number,
  layer: FlakeLayer,
) {
  g.clear();

  const armAngle = (Math.PI * 2) / arms;
  const innerRatio = 0.35;
  const branchRatio = 0.55;
  const branchLen = size * 0.32;
  const branchAngle = Math.PI / 5;
  const tipSize = size * 0.12;

  // Glow halo for near/mid flakes
  if (layer !== "far" && size > 4) {
    const glowRadius = size * 1.8;
    const glowAlpha = opacity * 0.15;
    g.circle(0, 0, glowRadius);
    g.fill({ color: 0xd6eeff, alpha: glowAlpha });
  }

  // Draw each arm
  for (let i = 0; i < arms; i++) {
    const angle = armAngle * i - Math.PI / 2;
    const tipX = Math.cos(angle) * size;
    const tipY = Math.sin(angle) * size;
    const innerX = Math.cos(angle) * size * innerRatio;
    const innerY = Math.sin(angle) * size * innerRatio;
    const midX = Math.cos(angle) * size * branchRatio;
    const midY = Math.sin(angle) * size * branchRatio;

    // Main arm
    g.moveTo(0, 0);
    g.lineTo(tipX, tipY);
    g.stroke({ color: 0xeaf4ff, alpha: opacity, width: Math.max(0.6, size * 0.08) });

    // Two branches off the middle of the arm
    for (const sign of [-1, 1]) {
      const bx = Math.cos(angle + sign * branchAngle) * branchLen;
      const by = Math.sin(angle + sign * branchAngle) * branchLen;
      g.moveTo(midX, midY);
      g.lineTo(midX + bx, midY + by);
      g.stroke({ color: 0xd0eaff, alpha: opacity * 0.85, width: Math.max(0.4, size * 0.055) });
    }

    // Tiny branches near inner
    for (const sign of [-1, 1]) {
      const sbx = Math.cos(angle + sign * branchAngle * 1.2) * branchLen * 0.45;
      const sby = Math.sin(angle + sign * branchAngle * 1.2) * branchLen * 0.45;
      g.moveTo(innerX, innerY);
      g.lineTo(innerX + sbx, innerY + sby);
      g.stroke({ color: 0xc8e4ff, alpha: opacity * 0.65, width: Math.max(0.3, size * 0.04) });
    }

    // Tip diamond
    if (size > 3) {
      g.star(tipX, tipY, 4, tipSize, tipSize * 0.4, angle);
      g.fill({ color: 0xffffff, alpha: opacity * 0.9 });
    }
  }

  // Center hex gem
  const centerSize = size * 0.16;
  if (centerSize > 0.5) {
    g.star(0, 0, 6, centerSize, centerSize * 0.5, 0);
    g.fill({ color: 0xffffff, alpha: Math.min(1, opacity * 1.2) });
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SnowCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const app = new PIXI.Application();
    let destroyed = false;
    let flakes: Snowflake[] = [];

    // Wind state
    let windX = 0;
    let targetWindX = 0;
    let windFrame = 0;
    let gustStrength = 0;
    let gustDecay = 0;

    async function init() {
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        powerPreference: "low-power",
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
      });

      if (destroyed || !mountRef.current) return;
      mountRef.current.appendChild(app.canvas);

      const W = window.innerWidth;
      const H = window.innerHeight;

      // Create three containers for depth sorting
      const containers: Record<FlakeLayer, PIXI.Container> = {
        far:  new PIXI.Container(),
        mid:  new PIXI.Container(),
        near: new PIXI.Container(),
      };
      app.stage.addChild(containers.far, containers.mid, containers.near);

      // Spawn flakes for each layer
      for (const [layerKey, cfg] of Object.entries(LAYER_CONFIG) as [FlakeLayer, typeof LAYER_CONFIG[FlakeLayer]][]) {
        for (let i = 0; i < cfg.count; i++) {
          const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);
          const opacity = cfg.opacityRange[0] + Math.random() * (cfg.opacityRange[1] - cfg.opacityRange[0]);
          const arms = Math.random() < 0.75 ? 6 : 8;

          const gfx = new PIXI.Graphics();
          drawCrystalFlake(gfx, size, arms, opacity, layerKey);

          gfx.pivot.set(0, 0);
          gfx.x = Math.random() * W;
          gfx.y = Math.random() * H;
          gfx.scale.set(cfg.scale);

          containers[layerKey].addChild(gfx);

          const flake: Snowflake = {
            gfx,
            x: gfx.x,
            y: gfx.y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: cfg.speedRange[0] + Math.random() * (cfg.speedRange[1] - cfg.speedRange[0]),
            size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.008 * (layerKey === "near" ? 1 : 0.4),
            opacity,
            layer: layerKey,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: 0.01 + Math.random() * 0.015,
            wobble: 0.3 + Math.random() * 0.5,
            arms,
          };

          flakes.push(flake);
        }
      }

      // ─── Ticker ──────────────────────────────────────────────────────────────
      app.ticker.add((ticker) => {
        const dt = Math.min(ticker.deltaTime, 3); // clamp for tab blur spikes
        const W2 = app.screen.width;
        const H2 = app.screen.height;

        // Wind simulation
        windFrame++;
        if (windFrame >= WIND_CHANGE_INTERVAL) {
          windFrame = 0;
          targetWindX = (Math.random() - 0.5) * MAX_WIND * 2;
        }
        // Random gust
        if (Math.random() < GUST_PROBABILITY) {
          gustStrength = (Math.random() - 0.3) * MAX_WIND * 4;
          gustDecay = 0.015 + Math.random() * 0.02;
        }
        gustStrength *= (1 - gustDecay);
        windX += (targetWindX - windX) * 0.003 * dt;
        const totalWind = windX + gustStrength;

        for (const flake of flakes) {
          flake.phase += flake.phaseSpeed * dt;

          // Layer wind multiplier (near flakes are more affected)
          const windMult = flake.layer === "near" ? 1.0 : flake.layer === "mid" ? 0.7 : 0.4;

          flake.x += (flake.vx + Math.sin(flake.phase) * flake.wobble + totalWind * windMult) * dt;
          flake.y += flake.vy * dt;
          flake.rotation += flake.rotationSpeed * dt;

          // Wrap horizontally with margin
          const margin = flake.size * 2;
          if (flake.x > W2 + margin) flake.x = -margin;
          if (flake.x < -margin) flake.x = W2 + margin;

          // Reset when off bottom
          if (flake.y > H2 + flake.size * 2) {
            flake.y = -flake.size * 2;
            flake.x = Math.random() * W2;
            // Slight speed variation on reset
            flake.vy = LAYER_CONFIG[flake.layer].speedRange[0] +
              Math.random() * (LAYER_CONFIG[flake.layer].speedRange[1] - LAYER_CONFIG[flake.layer].speedRange[0]);
          }

          flake.gfx.x = flake.x;
          flake.gfx.y = flake.y;
          flake.gfx.rotation = flake.rotation;
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      flakes = [];
      app.destroy(true);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
