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
// CS:GO rarity palette
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

// ─────────────────────────────────────────────
// Layout constants — wider cards, tighter gap
// ─────────────────────────────────────────────
const CARD_W   = 130;
const CARD_H   = 180;
const GAP      = 6;
const STRIDE   = CARD_W + GAP;
const SPIN_LEN = 60;
const WIN_IDX  = 52;
const FADE_W   = 120;        // wider gradient fade
const BG_COL   = 0x0d0f14;  // true dark

// Card layout zones
const BAR_H    = 3;   // rarity color bar
const RAR_Y    = 7;   // rarity label top
const IMG_Y    = 24;  // image area top
const IMG_H    = 92;  // image area height
const NAME_Y   = IMG_Y + IMG_H + 8; // item name top
const SUB_Y    = NAME_Y + 20;       // subtext top (approx, adjusts with name)

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function hexFromRgba(input: string): number {
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return 0x4b9dff;
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

// Aggressive ease — fast start, very slow finish (like real CS:GO)
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

// ─────────────────────────────────────────────
// Parse item name into weapon + skin parts
// e.g. "AK-47 | Redline" → { weapon: "AK-47", skin: "Redline" }
// Falls back gracefully for items without " | "
// ─────────────────────────────────────────────
function parseItemName(name: string): { weapon: string; skin: string } {
  const idx = name.indexOf(" | ");
  if (idx !== -1) {
    return { weapon: name.slice(0, idx).trim(), skin: name.slice(idx + 3).trim() };
  }
  // No pipe — weapon is full name, skin is empty
  return { weapon: name.trim(), skin: "" };
}

// ─────────────────────────────────────────────
// Card builder
// Layout (top → bottom):
//   [3px rarity bar]
//   [rarity label]        ← RAR_Y
//   [image hero area]     ← IMG_Y … IMG_Y+IMG_H
//   [weapon name — bold]  ← NAME_Y
//   [skin subtext — dim]  ← below name
// ─────────────────────────────────────────────
async function buildCard(
  item: ReelItem,
  x: number,
  y: number,
  destroyed: { v: boolean }
): Promise<PIXI.Container> {
  const rarityData = RARITY[item.rarity] ?? { hex: 0x4b69ff, label: "" };
  const col = rarityData.hex;
  const { weapon, skin } = parseItemName(item.name);

  const card = new PIXI.Container();
  card.x = x;
  card.y = y;

  // ── 1. Background ──────────────────────────
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, CARD_W, CARD_H, 4);
  bg.fill({ color: 0x111419, alpha: 1 });
  card.addChild(bg);

  // Subtle bottom-half rarity wash — fades from nothing to col
  const wash = new PIXI.Graphics();
  wash.roundRect(0, CARD_H * 0.5, CARD_W, CARD_H * 0.5, 4);
  wash.fill({ color: col, alpha: 0.04 });
  card.addChild(wash);

  // ── 2. Top rarity bar ──────────────────────
  const bar = new PIXI.Graphics();
  bar.roundRect(0, 0, CARD_W, BAR_H, 2);
  bar.fill({ color: col, alpha: 1 });
  card.addChild(bar);

  // ── 3. Border ──────────────────────────────
  const border = new PIXI.Graphics();
  border.roundRect(0.5, 0.5, CARD_W - 1, CARD_H - 1, 4);
  border.stroke({ color: col, alpha: 0.28, width: 1 });
  card.addChild(border);

  // ── 4. Rarity label — TOP, right under bar ─
  const rarLabel = new PIXI.Text({
    text: rarityData.label.toUpperCase(),
    style: {
      fill: col,
      // Tight condensed — Rajdhani is perfect here
      fontFamily: "'Rajdhani', 'Barlow Condensed', 'Arial Narrow', sans-serif",
      fontSize: 7.5,
      fontWeight: "700",
      align: "center",
      letterSpacing: 1.8,
    },
  });
  rarLabel.anchor.set(0.5, 0);
  rarLabel.x = CARD_W / 2;
  rarLabel.y = RAR_Y;
  rarLabel.alpha = 0.75;
  card.addChild(rarLabel);

  // ── 5. Image hero area ─────────────────────
  const imgPad  = 8;
  const imgAreaX = imgPad;
  const imgAreaW = CARD_W - imgPad * 2;

  const imgBg = new PIXI.Graphics();
  imgBg.roundRect(imgAreaX, IMG_Y, imgAreaW, IMG_H, 3);
  imgBg.fill({ color: 0x090b0f, alpha: 1 });
  card.addChild(imgBg);

  // Gem placeholder — shown when no image_url or load fails
  const gem = new PIXI.Graphics();
  const gemCX = CARD_W / 2;
  const gemCY = IMG_Y + IMG_H / 2;
  gem.circle(gemCX, gemCY, 22);
  gem.fill({ color: col, alpha: 0.1 });
  gem.circle(gemCX, gemCY, 13);
  gem.fill({ color: col, alpha: 0.65 });
  gem.circle(gemCX - 5, gemCY - 5, 3.5);
  gem.fill({ color: 0xffffff, alpha: 0.35 });
  card.addChild(gem);

  if (item.image_url) {
    try {
      const tex = await PIXI.Assets.load(item.image_url);
      if (destroyed.v) return card;
      gem.visible = false;
      const sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.x = CARD_W / 2;
      sprite.y = IMG_Y + IMG_H / 2;
      // Fill the image area — hero treatment
      const scaleX = imgAreaW / tex.width;
      const scaleY = IMG_H   / tex.height;
      sprite.scale.set(Math.min(scaleX, scaleY) * 0.9);
      card.addChild(sprite);
    } catch { /* gem stays */ }
  }

  // ── 6. Thin divider between image and text ─
  const textTop = IMG_Y + IMG_H + 6;
  const div = new PIXI.Graphics();
  div.rect(imgPad, textTop - 1, imgAreaW, 1);
  div.fill({ color: col, alpha: 0.18 });
  card.addChild(div);

  // ── 7. Weapon name — bold, bright, dominant ─
  // Uses Impact-style weight: tall, condensed, zero ambiguity
  const nameLabel = new PIXI.Text({
    text: weapon.toUpperCase(),
    style: {
      fill: 0xeef2fa,
      fontFamily: "'Rajdhani', 'Barlow Condensed', 'Arial Narrow', sans-serif",
      fontSize: 13,
      fontWeight: "900",
      align: "center",
      wordWrap: true,
      wordWrapWidth: CARD_W - 14,
      letterSpacing: 0.8,
      lineHeight: 15,
    },
  });
  nameLabel.anchor.set(0.5, 0);
  nameLabel.x = CARD_W / 2;
  nameLabel.y = textTop + 2;
  card.addChild(nameLabel);

  // ── 8. Skin subtext — muted, smaller, below ─
  if (skin) {
    const skinLabel = new PIXI.Text({
      text: skin,
      style: {
        fill: 0x8a9ab5,
        fontFamily: "'Rajdhani', 'Barlow Condensed', 'Arial Narrow', sans-serif",
        fontSize: 9,
        fontWeight: "400",
        align: "center",
        wordWrap: true,
        wordWrapWidth: CARD_W - 14,
        letterSpacing: 0.3,
      },
    });
    skinLabel.anchor.set(0.5, 0);
    skinLabel.x = CARD_W / 2;
    // Sit just below the name — nameLabel height is roughly 15–30px
    skinLabel.y = textTop + 2 + Math.min(nameLabel.height, 28) + 2;
    skinLabel.alpha = 0.7;
    card.addChild(skinLabel);
  }

  return card;
}

// ─────────────────────────────────────────────
// Scanline tile — subtle, barely visible
// ─────────────────────────────────────────────
function makeScanlineTexture(renderer: PIXI.Renderer): PIXI.Texture {
  const rt = PIXI.RenderTexture.create({ width: 1, height: 4 });
  const g  = new PIXI.Graphics();
  g.rect(0, 0, 1, 1);
  g.fill({ color: 0x000000, alpha: 0.05 });
  renderer.render({ container: g, target: rt });
  g.destroy();
  return rt;
}

// ─────────────────────────────────────────────
// Side fade gradient — solid BG_COL → transparent
// (simulates a real CSS linear-gradient mask)
// ─────────────────────────────────────────────
function drawFade(
  g: PIXI.Graphics,
  w: number,
  h: number,
  fromLeft: boolean,
  steps = 32
) {
  g.clear();
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = fromLeft
      ? Math.pow(1 - t, 2.2)   // left: opaque → transparent
      : Math.pow(t,     2.2);  // right: transparent → opaque
    const x = fromLeft ? (t * w) - (w / steps) : (i / steps) * w;
    g.rect(x, 0, w / steps + 1, h);
    g.fill({ color: BG_COL, alpha: a });
  }
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
      start:      number;
      fromX:      number;
      toX:        number;
      duration:   number;
      winnerItem: ReelItem;
      flashDone:  boolean;
    };

    let anim:      AnimState | null = null;
    let idleOffset = 0;
    const idleSpeed = 0.5;

    let W = host.clientWidth  || 800;
    let H = host.clientHeight || 200;

    async function boot() {
      await app.init({
        resizeTo:    host,
        backgroundAlpha: 0,
        antialias:   true,
        autoDensity: true,
        resolution:  Math.min(window.devicePixelRatio || 1, 2),
      });

      if (destroyed.v) { app.destroy(true); return; }

      host.appendChild(app.canvas);
      app.canvas.style.cssText = "width:100%;height:100%;display:block;";

      W = host.clientWidth;
      H = host.clientHeight;

      // ── Layers ─────────────────────────────
      const layerAtmo    = new PIXI.Container();
      const layerReel    = new PIXI.Container();
      const layerFades   = new PIXI.Container();
      const layerOverlay = new PIXI.Container();
      app.stage.addChild(layerAtmo, layerReel, layerFades, layerOverlay);

      // ── Reel mask ──────────────────────────
      const reelMask = new PIXI.Graphics();
      reelMask.rect(0, 0, W, H);
      reelMask.fill({ color: 0xffffff });
      layerReel.mask = reelMask;
      app.stage.addChild(reelMask);

      // ═══════════════════════════════════════
      // ATMOSPHERE
      // ═══════════════════════════════════════

      // Solid BG
      const atmoBg = new PIXI.Graphics();
      atmoBg.rect(0, 0, W, H);
      atmoBg.fill({ color: BG_COL, alpha: 1 });
      layerAtmo.addChild(atmoBg);

      // Radial spotlight — very subtle, centered
      const glowHex = hexFromRgba(glowColor);
      const atmoSpot = new PIXI.Graphics();
      const spotR = Math.max(W, H) * 0.6;
      atmoSpot.circle(0, 0, spotR);
      atmoSpot.fill({ color: glowHex, alpha: 0.12 });
      atmoSpot.x = W / 2;
      atmoSpot.y = H / 2;
      layerAtmo.addChild(atmoSpot);

      // Scanlines
      const scanTex    = makeScanlineTexture(app.renderer as PIXI.Renderer);
      const scanSprite = new PIXI.TilingSprite({ texture: scanTex, width: W, height: H });
      scanSprite.alpha = 0.8;
      layerAtmo.addChild(scanSprite);

      // ═══════════════════════════════════════
      // SIDE FADES — gradient (not flat rect)
      // ═══════════════════════════════════════
      const fadeLeft  = new PIXI.Graphics();
      const fadeRight = new PIXI.Graphics();

      drawFade(fadeLeft,  FADE_W, H, true);
      drawFade(fadeRight, FADE_W, H, false);
      fadeRight.x = W - FADE_W;

      layerFades.addChild(fadeLeft, fadeRight);

      // ═══════════════════════════════════════
      // MARKER — clean CS:GO style
      // Single hairline + two small corner brackets, no arrows
      // ═══════════════════════════════════════
      const BRKT = 10;  // bracket arm length
      const markerGroup = new PIXI.Container();
      markerGroup.x = W / 2;
      layerOverlay.addChild(markerGroup);

      function buildMarker(g: PIXI.Graphics, h: number) {
        g.clear();

        // Center hairline — thin, slightly warm white
        g.rect(-1, 0, 2, h);
        g.fill({ color: 0xffdd88, alpha: 0.9 });

        // Top bracket
        g.rect(-BRKT, 0, BRKT * 2, 2);     // horizontal arm
        g.fill({ color: 0xffdd88, alpha: 0.9 });

        // Bottom bracket
        g.rect(-BRKT, h - 2, BRKT * 2, 2); // horizontal arm
        g.fill({ color: 0xffdd88, alpha: 0.9 });
      }

      const markerG = new PIXI.Graphics();
      buildMarker(markerG, H);
      markerGroup.addChild(markerG);

      // ═══════════════════════════════════════
      // PULSE RING — at marker center
      // ═══════════════════════════════════════
      const pulseRing = new PIXI.Graphics();
      pulseRing.x = 0;
      pulseRing.y = H / 2;
      markerGroup.addChild(pulseRing);

      // ═══════════════════════════════════════
      // FLASH OVERLAY
      // ═══════════════════════════════════════
      const flashOverlay = new PIXI.Graphics();
      flashOverlay.rect(0, 0, W, H);
      flashOverlay.fill({ color: 0xffffff, alpha: 1 });
      flashOverlay.alpha = 0;
      layerOverlay.addChild(flashOverlay);
      let flashAlpha = 0;
      let flashSizeW = W;
      let flashSizeH = H;

      // ═══════════════════════════════════════
      // RESIZE OBSERVER
      // ═══════════════════════════════════════
      const ro = new ResizeObserver(() => {
        W = host.clientWidth;
        H = host.clientHeight;

        atmoBg.clear();
        atmoBg.rect(0, 0, W, H);
        atmoBg.fill({ color: BG_COL, alpha: 1 });

        const newR = Math.max(W, H) * 0.6;
        atmoSpot.clear();
        atmoSpot.circle(0, 0, newR);
        atmoSpot.fill({ color: glowHex, alpha: 0.12 });
        atmoSpot.x = W / 2;
        atmoSpot.y = H / 2;

        scanSprite.width  = W;
        scanSprite.height = H;

        drawFade(fadeLeft,  FADE_W, H, true);
        drawFade(fadeRight, FADE_W, H, false);
        fadeRight.x = W - FADE_W;

        reelMask.clear();
        reelMask.rect(0, 0, W, H);
        reelMask.fill({ color: 0xffffff });

        markerGroup.x = W / 2;
        buildMarker(markerG, H);
        pulseRing.y = H / 2;

        flashSizeW = -1; // force redraw
      });
      ro.observe(host);

      // ─────────────────────────────────────
      // Idle reel
      // ─────────────────────────────────────
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

      // ─────────────────────────────────────
      // Spin reel
      // ─────────────────────────────────────
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
        const jitter     = (Math.random() - 0.5) * 40;

        anim = {
          start:     performance.now(),
          fromX:     0,
          toX:       W / 2 - winCenterX + jitter,
          duration:  6200,
          winnerItem,
          flashDone: false,
        };
        layerReel.x = 0;
        idleOffset  = 0;
      }

      startOpenRef.current = (w: ReelItem) => void buildSpinReel(w);

      // ═══════════════════════════════════════
      // TICKER
      // ═══════════════════════════════════════
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;

        // Idle drift
        if (!anim) {
          idleOffset += idleSpeed * (dt / 2);
          const totalW = items.length * STRIDE;
          if (idleOffset > totalW) idleOffset -= totalW;
          layerReel.x = -STRIDE * 0.5 - idleOffset;
        }

        // Spin animation
        if (anim) {
          const t     = Math.min((performance.now() - anim.start) / anim.duration, 1);
          layerReel.x = anim.fromX + (anim.toX - anim.fromX) * easeOutQuint(t);

          if (t >= 0.97 && !anim.flashDone) {
            anim.flashDone = true;
            flashAlpha = 0.45;
          }

          if (t >= 1) {
            const done = anim.winnerItem;
            anim = null;
            openingRef.current = false;
            onCompleteRef.current?.(done);
          }
        }

        // Flash decay
        if (flashAlpha > 0) {
          flashAlpha = Math.max(0, flashAlpha - 0.022 * (dt / 2));
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

        // Pulse ring — only visible when spinning
        if (anim || flashAlpha > 0) {
          const phase  = (performance.now() / 1400) % 1;
          const pulseR = 4 + phase * 16;
          const pulseA = (1 - phase) * 0.55;
          pulseRing.clear();
          pulseRing.circle(0, 0, pulseR);
          pulseRing.stroke({ color: 0xffdd88, alpha: pulseA, width: 1.5 });
        } else {
          if (pulseRing.alpha !== 0) {
            pulseRing.clear();
          }
        }
      });

      if (items.length) await renderIdle();

      (app as unknown as { _ro: ResizeObserver })._ro = ro;
    }

    void boot();

    return () => {
      destroyed.v = true;
      openingRef.current = false;
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
      style={{
        position: "relative",
        width: "100%",
        height: "240px",
        overflow: "hidden",
        // Crisp border — rarity bar will sit right at the top of cards,
        // the outer container stays neutral
        borderRadius: 6,
        backgroundColor: "#0d0f14",
        // Clean inset border — no box shadow bleeding out
        outline: "1px solid rgba(255,255,255,0.07)",
        outlineOffset: "-1px",
      }}
    >
      <div
        ref={hostRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
