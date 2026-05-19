import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Constants — CS:GO rarity palette
// ─────────────────────────────────────────────
const RARITY: Record<string, { hex: number; label: string }> = {
  consumer:   { hex: 0xb0c3d9, label: "Consumer Grade" },
  industrial: { hex: 0x5e98d9, label: "Industrial Grade" },
  milspec:    { hex: 0x4b69ff, label: "Mil-Spec" },
  restricted: { hex: 0x8847ff, label: "Restricted" },
  classified: { hex: 0xd32ce6, label: "Classified" },
  covert:     { hex: 0xeb4b4b, label: "Covert" },
  contraband: { hex: 0xe4ae39, label: "Contraband" },
};

const CARD_W   = 120;
const CARD_H   = 150;
const GAP      = 8;
const STRIDE   = CARD_W + GAP;
const SPIN_LEN = 54;
const WIN_IDX  = 50;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function hexFromRgba(input: string): number {
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return 0xffffff;
  return (Number(m[1]) << 16) | (Number(m[2]) << 8) | Number(m[3]);
}

function pickWeighted(items: ReelItem[]): ReelItem {
  const total = items.reduce((s, i) => s + Number(i.chance || 0), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Number(item.chance || 0);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

// ─────────────────────────────────────────────
// Card builder — called once per card, never per-frame
// ─────────────────────────────────────────────
async function buildCard(
  item: ReelItem,
  x: number,
  y: number,
  destroyed: { v: boolean }
): Promise<PIXI.Container> {
  const rarityData = RARITY[item.rarity] ?? { hex: 0xffffff, label: "" };
  const col = rarityData.hex;

  const card = new PIXI.Container();
  card.x = x;
  card.y = y;

  const shadow = new PIXI.Graphics();
  shadow.roundRect(4, 6, CARD_W, CARD_H, 14);
  shadow.fill({ color: 0x000000, alpha: 0.45 });
  card.addChild(shadow);

  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, CARD_W, CARD_H, 12);
  bg.fill({ color: 0x111318, alpha: 1 });
  card.addChild(bg);

  const tint = new PIXI.Graphics();
  tint.roundRect(0, 0, CARD_W, CARD_H, 12);
  tint.fill({ color: col, alpha: 0.07 });
  card.addChild(tint);

  const border = new PIXI.Graphics();
  border.roundRect(0, 0, CARD_W, CARD_H, 12);
  border.stroke({ color: col, alpha: 0.75, width: 1.5 });
  card.addChild(border);

  const bar = new PIXI.Graphics();
  bar.roundRect(0, 0, CARD_W, 4, 0);
  bar.fill({ color: col, alpha: 1 });
  card.addChild(bar);

  const imgBg = new PIXI.Graphics();
  imgBg.roundRect(12, 14, CARD_W - 24, 76, 8);
  imgBg.fill({ color: 0x070a0e, alpha: 0.7 });
  card.addChild(imgBg);

  const gem = new PIXI.Graphics();
  gem.circle(CARD_W / 2, 52, 18);
  gem.fill({ color: col, alpha: 0.45 });
  gem.circle(CARD_W / 2, 52, 10);
  gem.fill({ color: col, alpha: 0.85 });
  card.addChild(gem);

  if (item.image_url) {
    try {
      const tex = await PIXI.Assets.load(item.image_url);
      if (destroyed.v) return card;
      gem.visible = false;
      const sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.x = CARD_W / 2;
      sprite.y = 52;
      sprite.scale.set(Math.min(72 / tex.width, 60 / tex.height));
      card.addChild(sprite);
    } catch { /* gem stays */ }
  }

  const sep = new PIXI.Graphics();
  sep.rect(12, 96, CARD_W - 24, 1);
  sep.fill({ color: 0xffffff, alpha: 0.06 });
  card.addChild(sep);

  const nameLabel = new PIXI.Text({
    text: item.name,
    style: {
      fill: 0xdce8f5,
      fontFamily: "'Rajdhani', 'Barlow Condensed', 'Arial Narrow', sans-serif",
      fontSize: 11,
      fontWeight: "700",
      align: "center",
      wordWrap: true,
      wordWrapWidth: CARD_W - 16,
      letterSpacing: 0.3,
    },
  });
  nameLabel.anchor.set(0.5, 0);
  nameLabel.x = CARD_W / 2;
  nameLabel.y = 102;
  nameLabel.alpha = 0.9;
  card.addChild(nameLabel);

  const rarLabel = new PIXI.Text({
    text: rarityData.label.toUpperCase(),
    style: {
      fill: col,
      fontFamily: "'Rajdhani', 'Barlow Condensed', 'Arial Narrow', sans-serif",
      fontSize: 8.5,
      fontWeight: "700",
      align: "center",
      letterSpacing: 0.8,
    },
  });
  rarLabel.anchor.set(0.5, 0);
  rarLabel.x = CARD_W / 2;
  rarLabel.y = 131;
  rarLabel.alpha = 0.7;
  card.addChild(rarLabel);

  return card;
}

// ─────────────────────────────────────────────
// Build scanline RenderTexture once — tiled sprite, zero per-frame cost
// ─────────────────────────────────────────────
function makeScanlineTexture(renderer: PIXI.Renderer): PIXI.Texture {
  // 2px tall tile: 1px dark, 1px transparent
  const rt = PIXI.RenderTexture.create({ width: 1, height: 3 });
  const g = new PIXI.Graphics();
  g.rect(0, 0, 1, 1);
  g.fill({ color: 0x000000, alpha: 0.07 });
  renderer.render({ container: g, target: rt });
  g.destroy();
  return rt;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function CaseOpeningCanvas({
  items,
  winner,
  isOpening,
  glowColor = "rgba(72,157,255,0.35)",
  onComplete,
}: Props) {
  const hostRef       = useRef<HTMLDivElement | null>(null);
  const openingRef    = useRef(false);
  const startOpenRef  = useRef<((w: ReelItem) => void) | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!hostRef.current) return;

    const host      = hostRef.current;
    const app       = new PIXI.Application();
    const destroyed = { v: false };

    type AnimState = {
      start: number;
      fromX: number;
      toX: number;
      duration: number;
      winnerItem: ReelItem;
      flashDone: boolean;
    };

    let anim:       AnimState | null = null;
    let idleOffset  = 0;
    const idleSpeed = 0.6;

    // Dimensions cache — updated by ResizeObserver, read in ticker
    let W = host.clientWidth  || 800;
    let H = host.clientHeight || 200;

    async function boot() {
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (destroyed.v) { app.destroy(true); return; }

      host.appendChild(app.canvas);
      app.canvas.style.cssText = "width:100%;height:100%;display:block;";

      const res = app.renderer.resolution;
      W = app.renderer.width  / res;
      H = app.renderer.height / res;

      // ── Layers ─────────────────────────────────────
      const layerAtmo    = new PIXI.Container();
      const layerReel    = new PIXI.Container();
      const layerFades   = new PIXI.Container();
      const layerOverlay = new PIXI.Container();
      app.stage.addChild(layerAtmo, layerReel, layerFades, layerOverlay);

      // ── Reel mask ──────────────────────────────────
      // Drawn once; resized via ResizeObserver
      const reelMask = new PIXI.Graphics();
      reelMask.rect(0, 0, W, H);
      reelMask.fill({ color: 0xffffff });
      layerReel.mask = reelMask;
      app.stage.addChild(reelMask);

      // ════════════════════════════════════════════════
      // ATMOSPHERE — created ONCE, mutated in ticker
      // ════════════════════════════════════════════════

      // 1. Solid background — static, never changes
      const atmoBg = new PIXI.Graphics();
      atmoBg.rect(0, 0, W, H);
      atmoBg.fill({ color: 0x0b0d12, alpha: 1 });
      layerAtmo.addChild(atmoBg);

      // 2. Spotlight circle — static shape, we'll tint it when glowColor changes
      //    Position updated on resize only
      const atmoSpot = new PIXI.Graphics();
      const spotR = Math.max(W, H) * 0.55;
      atmoSpot.circle(0, 0, spotR); // drawn at origin; positioned via x/y
      atmoSpot.fill({ color: hexFromRgba(glowColor), alpha: 0.18 });
      atmoSpot.x = W / 2;
      atmoSpot.y = H * 0.55;
      layerAtmo.addChild(atmoSpot);

      // 3. Floor darkening — static rect, repositioned on resize
      const atmoFloor = new PIXI.Graphics();
      atmoFloor.rect(0, 0, W, H * 0.4);
      atmoFloor.fill({ color: 0x000000, alpha: 0.35 });
      atmoFloor.y = H * 0.6;
      layerAtmo.addChild(atmoFloor);

      // 4. Scanlines — RenderTexture tile, tiled sprite: ZERO per-frame cost
      const scanTex    = makeScanlineTexture(app.renderer as PIXI.Renderer);
      const scanSprite = new PIXI.TilingSprite({ texture: scanTex, width: W, height: H });
      scanSprite.alpha = 1;
      layerAtmo.addChild(scanSprite);

      // ════════════════════════════════════════════════
      // FADES — created ONCE, repositioned on resize
      // ════════════════════════════════════════════════
      const FADE_W = 80;

      const fadeLeft = new PIXI.Graphics();
      fadeLeft.rect(0, 0, FADE_W, H);
      fadeLeft.fill({ color: 0x0b0d12, alpha: 0.82 });
      layerFades.addChild(fadeLeft);

      const fadeRight = new PIXI.Graphics();
      fadeRight.rect(0, 0, FADE_W, H);
      fadeRight.fill({ color: 0x0b0d12, alpha: 0.82 });
      fadeRight.x = W - FADE_W;
      layerFades.addChild(fadeRight);

      // ════════════════════════════════════════════════
      // MARKER — created ONCE, repositioned on resize
      // ════════════════════════════════════════════════
      const ARROW = 14;

      const markerLine = new PIXI.Graphics();
      markerLine.rect(-1, 0, 2, H);
      markerLine.fill({ color: 0xffffff, alpha: 0.55 });
      markerLine.x = W / 2;
      layerOverlay.addChild(markerLine);

      const markerArrowTop = new PIXI.Graphics();
      markerArrowTop.moveTo(-ARROW, 0);
      markerArrowTop.lineTo(ARROW, 0);
      markerArrowTop.lineTo(0, ARROW + 4);
      markerArrowTop.closePath();
      markerArrowTop.fill({ color: 0xffffff, alpha: 0.95 });
      markerArrowTop.x = W / 2;
      layerOverlay.addChild(markerArrowTop);

      const markerArrowBot = new PIXI.Graphics();
      markerArrowBot.moveTo(-ARROW, 0);
      markerArrowBot.lineTo(ARROW, 0);
      markerArrowBot.lineTo(0, -(ARROW + 4));
      markerArrowBot.closePath();
      markerArrowBot.fill({ color: 0xffffff, alpha: 0.95 });
      markerArrowBot.x = W / 2;
      markerArrowBot.y = H;
      layerOverlay.addChild(markerArrowBot);

      // ════════════════════════════════════════════════
      // PULSE RING — single Graphics, .clear() once per frame (1 draw call)
      // ════════════════════════════════════════════════
      const pulseRing = new PIXI.Graphics();
      pulseRing.x = W / 2;
      pulseRing.y = H / 2;
      layerOverlay.addChild(pulseRing);

      // ════════════════════════════════════════════════
      // FLASH OVERLAY — single Graphics, only redrawn when alpha > 0 OR size changed
      // ════════════════════════════════════════════════
      const flashOverlay = new PIXI.Graphics();
      flashOverlay.rect(0, 0, W, H);
      flashOverlay.fill({ color: 0xffffff, alpha: 1 });
      flashOverlay.alpha = 0;
      layerOverlay.addChild(flashOverlay);
      let flashAlpha   = 0;
      let flashSizeW   = W;
      let flashSizeH   = H;

      // ════════════════════════════════════════════════
      // ResizeObserver — reposition all static elements, no ticker involvement
      // ════════════════════════════════════════════════
      const ro = new ResizeObserver(() => {
        const res = app.renderer.resolution;
        W = app.renderer.width  / res;
        H = app.renderer.height / res;

        // bg
        atmoBg.clear();
        atmoBg.rect(0, 0, W, H);
        atmoBg.fill({ color: 0x0b0d12, alpha: 1 });

        // spotlight — redraw at new radius, reposition
        const newR = Math.max(W, H) * 0.55;
        atmoSpot.clear();
        atmoSpot.circle(0, 0, newR);
        atmoSpot.fill({ color: hexFromRgba(glowColor), alpha: 0.18 });
        atmoSpot.x = W / 2;
        atmoSpot.y = H * 0.55;

        // floor
        atmoFloor.clear();
        atmoFloor.rect(0, 0, W, H * 0.4);
        atmoFloor.fill({ color: 0x000000, alpha: 0.35 });
        atmoFloor.y = H * 0.6;

        // scanlines tiling sprite
        scanSprite.width  = W;
        scanSprite.height = H;

        // fades
        fadeLeft.clear();
        fadeLeft.rect(0, 0, FADE_W, H);
        fadeLeft.fill({ color: 0x0b0d12, alpha: 0.82 });

        fadeRight.clear();
        fadeRight.rect(0, 0, FADE_W, H);
        fadeRight.fill({ color: 0x0b0d12, alpha: 0.82 });
        fadeRight.x = W - FADE_W;

        // reel mask
        reelMask.clear();
        reelMask.rect(0, 0, W, H);
        reelMask.fill({ color: 0xffffff });

        // marker
        markerLine.clear();
        markerLine.rect(-1, 0, 2, H);
        markerLine.fill({ color: 0xffffff, alpha: 0.55 });
        markerLine.x = W / 2;

        markerArrowTop.x = W / 2;
        markerArrowBot.x = W / 2;
        markerArrowBot.y = H;

        pulseRing.x = W / 2;
        pulseRing.y = H / 2;

        // flash — mark size dirty so it redraws next frame
        flashSizeW = -1;
      });
      ro.observe(host);

      // ─────────────────────────────────────────
      // Idle reel
      // ─────────────────────────────────────────
      async function renderIdle() {
        layerReel.removeChildren();
        const count = Math.ceil(W / STRIDE) + 6;

        for (let i = 0; i < count; i++) {
          const item = items[i % items.length];
          const card = await buildCard(item, i * STRIDE, H / 2 - CARD_H / 2, destroyed);
          if (!destroyed.v) layerReel.addChild(card);
        }

        idleOffset = 0;
        layerReel.x = -STRIDE * 0.5;
      }

      // ─────────────────────────────────────────
      // Spin reel
      // ─────────────────────────────────────────
      async function buildSpinReel(winnerItem: ReelItem) {
        layerReel.removeChildren();

        const reelItems: ReelItem[] = [];
        for (let i = 0; i < SPIN_LEN; i++) reelItems.push(pickWeighted(items));
        reelItems[WIN_IDX] = winnerItem;

        for (let i = 0; i < reelItems.length; i++) {
          const card = await buildCard(reelItems[i], i * STRIDE, H / 2 - CARD_H / 2, destroyed);
          if (!destroyed.v) layerReel.addChild(card);
        }

        const winCenterX = WIN_IDX * STRIDE + CARD_W / 2;
        const jitter     = (Math.random() - 0.5) * 50;

        anim = {
          start:     performance.now(),
          fromX:     0,
          toX:       W / 2 - winCenterX + jitter,
          duration:  5800,
          winnerItem,
          flashDone: false,
        };
        layerReel.x = 0;
        idleOffset  = 0;
      }

      startOpenRef.current = (w: ReelItem) => void buildSpinReel(w);

      // ════════════════════════════════════════════════
      // TICKER — only animates alpha/position/one-circle, never creates objects
      // ════════════════════════════════════════════════
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;

        // ── Idle drift ──────────────────────────
        if (!anim) {
          idleOffset += idleSpeed * (dt / 2);
          const totalW = items.length * STRIDE;
          if (idleOffset > totalW) idleOffset -= totalW;
          layerReel.x = -STRIDE * 0.5 - idleOffset;
        }

        // ── Spin ────────────────────────────────
        if (anim) {
          const t   = Math.min((performance.now() - anim.start) / anim.duration, 1);
          layerReel.x = anim.fromX + (anim.toX - anim.fromX) * easeOutQuint(t);

          if (t >= 0.95 && !anim.flashDone) {
            anim.flashDone = true;
            flashAlpha = 0.55;
          }

          if (t >= 1) {
            const done = anim.winnerItem;
            anim = null;
            openingRef.current = false;
            onCompleteRef.current?.(done);
          }
        }

        // ── Flash — only .alpha mutation, redraw only when size is dirty ──
        if (flashAlpha > 0) {
          flashAlpha = Math.max(0, flashAlpha - 0.025 * (dt / 2));
          // Redraw fill only if canvas was resized since last draw
          if (flashSizeW !== W || flashSizeH !== H) {
            flashOverlay.clear();
            flashOverlay.rect(0, 0, W, H);
            flashOverlay.fill({ color: 0xffffff, alpha: 1 });
            flashSizeW = W;
            flashSizeH = H;
          }
          flashOverlay.alpha = flashAlpha;
        } else if (flashOverlay.alpha !== 0) {
          flashOverlay.alpha = 0;
        }

        // ── Pulse ring — one .clear() + one circle = 1 draw call/frame ──
        {
          const phase  = (performance.now() / 1800) % 1;
          const pulseR = 6 + phase * 10;
          const pulseA = (1 - phase) * 0.4;
          pulseRing.clear();
          pulseRing.circle(0, 0, pulseR);
          pulseRing.stroke({ color: 0xffffff, alpha: pulseA, width: 1.5 });
        }
      });

      if (items.length) await renderIdle();

      // Cleanup ResizeObserver on destroy
      const origDestroy = app.destroy.bind(app);
      // We handle it in the useEffect cleanup instead
      (app as unknown as { _ro: ResizeObserver })._ro = ro;
    }

    void boot();

    return () => {
      destroyed.v = true;
      openingRef.current = false;
      // Disconnect ResizeObserver if it was attached
      const roRef = (app as unknown as { _ro?: ResizeObserver })._ro;
      if (roRef) roRef.disconnect();
      try { app.destroy(true, { children: true, texture: false }); } catch { /* noop */ }
    };
  }, [items, glowColor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpening || openingRef.current || !items.length) return;
    openingRef.current = true;
    const finalWinner = winner ?? pickWeighted(items);
    startOpenRef.current?.(finalWinner);
  }, [isOpening, winner, items]);

  return (
    <div
      ref={hostRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    />
  );
}
