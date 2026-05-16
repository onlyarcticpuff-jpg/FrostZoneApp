import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

type Snowflake = PIXI.Graphics & {
  speed: number;
  drift: number;
  size: number;
};

export default function SnowCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const app = new PIXI.Application();

    let destroyed = false;
    let flakes: Snowflake[] = [];

    async function init() {
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        powerPreference: "low-power",
      });

      if (destroyed || !mountRef.current) return;

      mountRef.current.appendChild(app.canvas);

      const width = window.innerWidth;
      const height = window.innerHeight;

      flakes = Array.from({ length: 90 }).map(() => {
        const size = Math.random() * 2.8 + 0.8;

        const flake = new PIXI.Graphics() as Snowflake;
        flake.circle(0, 0, size);
        flake.fill({
          color: 0xffffff,
          alpha: Math.random() * 0.55 + 0.25,
        });

        flake.x = Math.random() * width;
        flake.y = Math.random() * height;
        flake.speed = Math.random() * 0.55 + 0.25;
        flake.drift = Math.random() * 0.45 + 0.1;
        flake.size = size;

        app.stage.addChild(flake);
        return flake;
      });

      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime;

        for (const flake of flakes) {
          flake.y += flake.speed * delta;
          flake.x += Math.sin(flake.y * 0.012) * flake.drift * delta;

          if (flake.y > window.innerHeight + 10) {
            flake.y = -10;
            flake.x = Math.random() * window.innerWidth;
          }
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      app.destroy(true);
    };
  }, []);

  return <div className="snow-canvas" ref={mountRef} />;
}
