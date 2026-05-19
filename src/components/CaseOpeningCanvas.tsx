import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export type ReelItem = {
  id: string;
  name: string;
  rarity: string;
  chance: number;
  image_url?: string;
};

type Props = {
  items: ReelItem[];
  winner?: ReelItem | null;
  isOpening: boolean;
  glowColor?: string;
  onComplete?: (winner: ReelItem) => void;
};

const RARITY_COLOR: Record<string, number> = {
  consumer: 0xb0c3d9,
  industrial: 0x5e98d9,
  milspec: 0x4b69ff,
  restricted: 0x8847ff,
  classified: 0xd32ce6,
  covert: 0xeb4b4b,
  contraband: 0xe4ae39,
};

function rgbaToHex(input: string) {
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return 0xffffff;
  return (Number(m[1]) << 16) + (Number(m[2]) << 8) + Number(m[3]);
}

function pickWeighted(items: ReelItem[]) {
  const total = items.reduce((sum, item) => sum + Number(item.chance || 0), 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= Number(item.chance || 0);
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

export default function CaseOpeningCanvas({
  items,
  winner,
  isOpening,
  glowColor = "rgba(72,157,255,0.35)",
  onComplete,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const openingRef = useRef(false);
  const startOpeningRef = useRef<((winnerItem: ReelItem) => void) | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!hostRef.current) return;

    let destroyed = false;
    const host = hostRef.current;
    const app = new PIXI.Application();

    const cardW = 104;
    const cardH = 132;
    const gap = 10;
    const stride = cardW + gap;

    let animation: null | {
      start: number;
      fromX: number;
      toX: number;
      duration: number;
      winnerItem: ReelItem;
    } = null;

   const makeText = (text: string, size: number) => {
  return new PIXI.Text(text, {
    fill: 0xffffff,
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: size,
    align: "center",
    wordWrap: true,
    wordWrapWidth: cardW - 16,
  });
};

    const drawCard = async (item: ReelItem, x: number, y: number) => {
      const card = new PIXI.Container();
      card.x = x;
      card.y = y;

      const rarity = RARITY_COLOR[item.rarity] ?? 0xffffff;

      const bg = new PIXI.Graphics();
      bg.roundRect(0, 0, cardW, cardH, 18);
      bg.fill({ color: 0x161616, alpha: 1 });
      bg.stroke({ color: rarity, alpha: 0.85, width: 2 });
      card.addChild(bg);

      const glow = new PIXI.Graphics();
      glow.roundRect(0, 0, cardW, cardH, 18);
      glow.fill({ color: rarity, alpha: 0.12 });
      card.addChild(glow);

      const strip = new PIXI.Graphics();
      strip.roundRect(10, 10, cardW - 20, 5, 5);
      strip.fill({ color: rarity, alpha: 1 });
      card.addChild(strip);

      const imageBox = new PIXI.Graphics();
      imageBox.roundRect(13, 22, cardW - 26, 64, 14);
      imageBox.fill({ color: 0x050505, alpha: 0.45 });
      imageBox.stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
      card.addChild(imageBox);

      const fallbackGem = new PIXI.Graphics();
      fallbackGem.circle(cardW / 2, 54, 15);
      fallbackGem.fill({ color: rarity, alpha: 0.55 });
      card.addChild(fallbackGem);

      if (item.image_url) {
        try {
          const tex = await PIXI.Assets.load(item.image_url);
          if (destroyed) return card;

          const sprite = new PIXI.Sprite(tex);
          sprite.anchor.set(0.5);
          sprite.x = cardW / 2;
          sprite.y = 54;

          const scale = Math.min(70 / tex.width, 56 / tex.height);
          sprite.scale.set(scale);
          card.addChild(sprite);
        } catch {
          // fallback gem stays
        }
      }

      const name = makeText(item.name, 10, "800");
      name.anchor.set(0.5, 0);
      name.x = cardW / 2;
      name.y = 94;
      name.alpha = 0.92;
      card.addChild(name);

      const chance = makeText(`${item.chance}%`, 9, "900");
      chance.anchor.set(0.5, 0);
      chance.x = cardW / 2;
      chance.y = 116;
      chance.alpha = 0.45;
      card.addChild(chance);

      return card;
    };

    async function boot() {
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      host.appendChild(app.canvas);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";

      const atmosphere = new PIXI.Graphics();
      const reel = new PIXI.Container();
      const marker = new PIXI.Graphics();
      const fadeLeft = new PIXI.Graphics();
      const fadeRight = new PIXI.Graphics();

      app.stage.addChild(atmosphere);
      app.stage.addChild(reel);
      app.stage.addChild(marker);
      app.stage.addChild(fadeLeft);
      app.stage.addChild(fadeRight);

      async function renderIdle() {
        reel.removeChildren();

        const w = app.renderer.width / app.renderer.resolution;
        const h = app.renderer.height / app.renderer.resolution;
        const visibleCount = Math.ceil(w / stride) + 4;

        for (let i = 0; i < visibleCount; i++) {
          const item = items[i % items.length];
          const card = await drawCard(item, i * stride, h / 2 - cardH / 2);
          if (!destroyed) reel.addChild(card);
        }

        reel.x = -stride * 0.5;
      }

      async function buildOpeningReel(winnerItem: ReelItem) {
        reel.removeChildren();

        const w = app.renderer.width / app.renderer.resolution;
        const h = app.renderer.height / app.renderer.resolution;

        const reelItems: ReelItem[] = [];
        for (let i = 0; i < 54; i++) reelItems.push(pickWeighted(items));

        const winnerIndex = 50;
        reelItems[winnerIndex] = winnerItem;

        for (let i = 0; i < reelItems.length; i++) {
          const card = await drawCard(reelItems[i], i * stride, h / 2 - cardH / 2);
          if (!destroyed) reel.addChild(card);
        }

        const center = w / 2;
        const winnerCenterX = winnerIndex * stride + cardW / 2;
        const randomOffsetInsideCard = (Math.random() - 0.5) * 42;

        animation = {
          start: performance.now(),
          fromX: 0,
          toX: center - winnerCenterX + randomOffsetInsideCard,
          duration: 5600,
          winnerItem,
        };

        reel.x = 0;
      }

      startOpeningRef.current = (winnerItem: ReelItem) => {
        void buildOpeningReel(winnerItem);
      };

      const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

      app.ticker.add(() => {
        const w = app.renderer.width / app.renderer.resolution;
        const h = app.renderer.height / app.renderer.resolution;
        const glow = rgbaToHex(glowColor);

        atmosphere.clear();
        atmosphere.rect(0, 0, w, h);
        atmosphere.fill({ color: 0x0d0d0d, alpha: 1 });
        atmosphere.circle(w / 2, h * 0.62, Math.max(w, h) * 0.5);
        atmosphere.fill({ color: glow, alpha: 0.22 });

        marker.clear();
        marker.rect(w / 2 - 1.5, 18, 3, h - 36);
        marker.fill({ color: 0xffffff, alpha: 0.68 });
        marker.moveTo(w / 2 - 11, 12);
        marker.lineTo(w / 2 + 11, 12);
        marker.lineTo(w / 2, 27);
        marker.closePath();
        marker.fill({ color: 0xffffff, alpha: 0.95 });

        fadeLeft.clear();
        fadeLeft.rect(0, 0, 58, h);
        fadeLeft.fill({ color: 0x0d0d0d, alpha: 0.74 });

        fadeRight.clear();
        fadeRight.rect(w - 58, 0, 58, h);
        fadeRight.fill({ color: 0x0d0d0d, alpha: 0.74 });

        if (animation) {
          const now = performance.now();
          const t = Math.min((now - animation.start) / animation.duration, 1);
          const eased = easeOutQuint(t);

          reel.x = animation.fromX + (animation.toX - animation.fromX) * eased;

          if (t >= 1) {
            const done = animation.winnerItem;
            animation = null;
            openingRef.current = false;
            onCompleteRef.current?.(done);
          }
        }
      });

      if (items.length) await renderIdle();
    }

    void boot();

    return () => {
      destroyed = true;
      openingRef.current = false;
      app.destroy(true, { children: true, texture: false });
    };
  }, [items, glowColor]);

  useEffect(() => {
    if (!isOpening || openingRef.current || !items.length) return;

    openingRef.current = true;
    const finalWinner = winner ?? pickWeighted(items);
    startOpeningRef.current?.(finalWinner);
  }, [isOpening, winner, items]);

  return (
    <div
      ref={hostRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
