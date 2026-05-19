import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

type Props = {
  imageUrl: string;
  glowColor?: string;
  label?: string;
};

function parseRgba(input: string) {
  const match = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return 0xffffff;

  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);

  return (r << 16) + (g << 8) + b;
}

export default function CaseOpeningCanvas({
  imageUrl,
  glowColor = "rgba(72,157,255,0.35)",
  label = "PIXI.JS CANVAS",
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    let destroyed = false;
    let frame = 0;

    const host = hostRef.current;

    const app = new PIXI.Application();

    async function boot() {
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (destroyed || !hostRef.current) {
        app.destroy(true);
        return;
      }

      host.appendChild(app.canvas);

      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";

      const stage = new PIXI.Container();
      app.stage.addChild(stage);

      const glowHex = parseRgba(glowColor);

      const glow = new PIXI.Graphics();
      const grid = new PIXI.Graphics();
      const particles = new PIXI.Container();
      const caseLayer = new PIXI.Container();
      const labelText = new PIXI.Text({
        text: label,
        style: {
          fill: 0xffffff,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 3,
          alpha: 0.18,
        },
      });

      labelText.anchor.set(0.5, 0);

      stage.addChild(glow);
      stage.addChild(grid);
      stage.addChild(particles);
      stage.addChild(caseLayer);
      stage.addChild(labelText);

      const texture = await PIXI.Assets.load(imageUrl);
      if (destroyed) return;

      const caseSprite = new PIXI.Sprite(texture);
      caseSprite.anchor.set(0.5);
      caseSprite.width = 150;
      caseSprite.height = 150;

      const shadow = new PIXI.Graphics();
      caseLayer.addChild(shadow);
      caseLayer.addChild(caseSprite);

      const particleData: {
        g: PIXI.Graphics;
        x: number;
        y: number;
        r: number;
        speed: number;
        phase: number;
        alpha: number;
      }[] = [];

      for (let i = 0; i < 34; i++) {
        const dot = new PIXI.Graphics();
        const r = Math.random() * 1.8 + 0.6;

        dot.circle(0, 0, r);
        dot.fill({
          color: 0xffffff,
          alpha: Math.random() * 0.18 + 0.06,
        });

        particles.addChild(dot);

        particleData.push({
          g: dot,
          x: Math.random(),
          y: Math.random(),
          r,
          speed: Math.random() * 0.35 + 0.15,
          phase: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.18 + 0.06,
        });
      }

      function drawScene() {
        const w = app.renderer.width / app.renderer.resolution;
        const h = app.renderer.height / app.renderer.resolution;

        frame += 0.016;

        glow.clear();
        glow.circle(w / 2, h * 0.62, Math.max(w, h) * 0.48);
        glow.fill({ color: glowHex, alpha: 0.24 });

        glow.circle(w / 2, h * 0.56, Math.max(w, h) * 0.28);
        glow.fill({ color: glowHex, alpha: 0.14 });

        grid.clear();
        grid.alpha = 0.35;
        grid.stroke({ color: 0xffffff, alpha: 0.035, width: 1 });

        const gridSize = 22;
        for (let x = 0; x < w + gridSize; x += gridSize) {
          grid.moveTo(x, 0);
          grid.lineTo(x, h);
        }
        for (let y = 0; y < h + gridSize; y += gridSize) {
          grid.moveTo(0, y);
          grid.lineTo(w, y);
        }

        labelText.x = w / 2;
        labelText.y = 14;

        caseLayer.x = w / 2;
        caseLayer.y = h * 0.53 + Math.sin(frame * 1.8) * 7;

        caseSprite.rotation = Math.sin(frame * 1.2) * 0.018;
        caseSprite.scale.set(1 + Math.sin(frame * 1.4) * 0.015);

        shadow.clear();
        shadow.ellipse(0, 74, 66, 13);
        shadow.fill({ color: 0x000000, alpha: 0.38 });

        for (const p of particleData) {
          const drift = Math.sin(frame * p.speed + p.phase) * 16;
          p.g.x = p.x * w + drift;
          p.g.y = ((p.y * h + frame * 12 * p.speed) % h);
          p.g.alpha = p.alpha * (0.65 + Math.sin(frame * 2 + p.phase) * 0.35);
        }
      }

      app.ticker.add(drawScene);
    }

    boot();

    return () => {
      destroyed = true;
      app.destroy(true, {
        children: true,
        texture: false,
      });
    };
  }, [imageUrl, glowColor, label]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    />
  );
}
