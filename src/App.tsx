import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  Wallet, Gem, Shield, Sparkles, Snowflake,
  UserRound, TrendingUp, ArrowUpRight, ArrowDownRight,
  Layers, Loader2, ImageOff, BadgeCheck, AtSign, Gift,
  FlaskConical, ShoppingBag, Tag, Star, Zap, Send,
} from "lucide-react";
import TonIcon from "./assets/icons/ton.svg";
import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";

declare global { interface Window { Telegram?: any; } }

type Tab = "home" | "vault" | "drops" | "track" | "profile";

function shortenAddress(a: string) {
  return a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "";
}

/* ─── TON price ──────────────────────────────────────────────── */
function useTonPrice() {
  const [price, setPrice]   = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true"
        );
        const d = await r.json();
        if (dead) return;
        const c = d["the-open-network"];
        setPrice(c.usd);
        setChange(c.usd_24h_change);
      } catch { if (!dead) setError(true); }
      finally   { if (!dead) setLoading(false); }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  return { price, change, loading, error };
}

/* ─── TONAPI NFT collections ─────────────────────────────────────
   Loose filter: requires a name (≥2 chars) + at least one preview image.
   Drops only blatant scam keywords. Shows up to 6 results.
──────────────────────────────────────────────────────────────── */
interface NftCollection {
  address: string;
  name: string;
  coverImage: string | null;
  ownerCount: number | null;
  kind: "gift" | "username" | "verified";
}

const TONAPI_KEY = import.meta.env.VITE_TONAPI_KEY || "";

const SCAM_KEYWORDS = ["airdrop", "giveaway", "claim now", "presale", "rug pull", "honeypot"];

function isLikelyLegit(c: any): boolean {
  const name: string = (c.metadata?.name ?? "").trim();
  if (!name || name.length < 2) return false;
  if (!c.previews?.length) return false;
  const low = name.toLowerCase();
  if (SCAM_KEYWORDS.some((kw) => low.includes(kw))) return false;
  return true;
}

function inferKind(c: any): "gift" | "username" | "verified" {
  const name: string = (c.metadata?.name ?? "").toLowerCase();
  if (name.includes("username") || name.includes("fragment") || name.includes(".ton") || name.includes("number")) return "username";
  if (name.includes("gift") || name.includes("sticker") || name.includes("emoji") || name.includes("premium") || name.includes("loot")) return "gift";
  return "verified";
}

function useTonApiCollections() {
  const [items, setItems]     = useState<NftCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (TONAPI_KEY) headers["Authorization"] = `Bearer ${TONAPI_KEY}`;

        const r = await fetch(
          "https://tonapi.io/v2/nfts/collections?limit=100",
          { headers }
        );
        if (!r.ok) throw new Error(`TONAPI ${r.status}`);
        const d = await r.json();
        if (dead) return;
        const raw: any[] = d?.nft_collections ?? [];
        const filtered = raw
          .filter(isLikelyLegit)
          .slice(0, 6)
          .map((c) => ({
            address:    c.address,
            name:       c.metadata?.name ?? c.address.slice(0, 8),
            coverImage: c.previews?.find((p: any) => p.resolution === "500x500")?.url
                        ?? c.previews?.[0]?.url
                        ?? null,
            ownerCount: c.owner_count ?? null,
            kind:       inferKind(c),
          }));
        setItems(filtered);
      } catch { if (!dead) setError(true); }
      finally  { if (!dead) setLoading(false); }
    }
    load();
    return () => { dead = true; };
  }, []);

  return { items, loading, error };
}

/* ─── GlassCard ──────────────────────────────────────────────── */
function GlassCard({
  children,
  accent = "rgba(255,255,255,0.45)",
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`gc ${className}`}
      style={{ "--gc-accent": accent, ...style } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* ─── NftKindBadge ───────────────────────────────────────────── */
function NftKindBadge({ kind }: { kind: "gift" | "username" | "verified" }) {
  if (kind === "gift") return (
    <span className="nft-badge nft-badge--gift"><Gift size={8} strokeWidth={2.5} /> Gift</span>
  );
  if (kind === "username") return (
    <span className="nft-badge nft-badge--username"><AtSign size={8} strokeWidth={2.5} /> Name</span>
  );
  return (
    <span className="nft-badge nft-badge--verified"><Gem size={8} strokeWidth={2.5} /> NFT</span>
  );
}

/* ─── LAB gift listings (static curated) ────────────────────── */
interface GiftListing {
  id: string;
  emoji: string;
  name: string;
  rarity: string;
  price: string;
  badge: string;
  badgeCls: string;
}

const LAB_GIFTS: GiftListing[] = [
  { id:"1", emoji:"🎩", name:"Plush Pepe",      rarity:"Legendary", price:"120",  badge:"Hot",   badgeCls:"orange" },
  { id:"2", emoji:"💎", name:"Crystal Gem",      rarity:"Epic",      price:"45",   badge:"New",   badgeCls:"blue"   },
  { id:"3", emoji:"🌟", name:"Star Fragment",    rarity:"Rare",      price:"18",   badge:"",      badgeCls:""       },
  { id:"4", emoji:"🐉", name:"Dragon Scale",     rarity:"Legendary", price:"200",  badge:"🔥",    badgeCls:"orange" },
  { id:"5", emoji:"🍄", name:"Mushroom Charm",   rarity:"Common",    price:"4.5",  badge:"",      badgeCls:""       },
  { id:"6", emoji:"🗡️", name:"Frost Blade",      rarity:"Epic",      price:"60",   badge:"FROST", badgeCls:"blue"   },
  { id:"7", emoji:"🌈", name:"Rainbow Key",      rarity:"Rare",      price:"22",   badge:"",      badgeCls:""       },
  { id:"8", emoji:"🤖", name:"Bot Chip",         rarity:"Common",    price:"3",    badge:"Sale",  badgeCls:"green"  },
];

const RARITY_COLOR: Record<string, string> = {
  Legendary: "var(--orange)",
  Epic:      "var(--purple)",
  Rare:      "var(--blue)",
  Common:    "var(--t3)",
};

/* ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [labFilter, setLabFilter] = useState<"all"|"legendary"|"epic"|"rare">("all");
  const tonAddress = useTonAddress();
  const { price, change, loading: priceLoading, error: priceError } = useTonPrice();
  const { items: nfts, loading: nftLoading, error: nftError } = useTonApiCollections();
  const up = change !== null && change >= 0;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor("#07101f"); tg.setBackgroundColor("#050816"); }
  }, []);

  const user        = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const displayName = (user?.first_name || user?.last_name)
    ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
    : "FROST User";
  const username = user?.username ? `@${user.username}` : "@telegram";

  const filteredGifts = LAB_GIFTS.filter((g) =>
    labFilter === "all" ? true : g.rarity.toLowerCase() === labFilter
  );

  return (
    <div className="app-shell">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:     #050816;
          --border: rgba(255,255,255,0.10);
          --t1:     rgba(255,255,255,0.90);
          --t2:     rgba(255,255,255,0.52);
          --t3:     rgba(255,255,255,0.28);
          --blue:   #60a5fa;
          --purple: #a78bfa;
          --green:  #34d399;
          --orange: #fb923c;
          --pink:   #f472b6;
          --f-d:    -apple-system,"SF Pro Rounded","SF Pro Display",system-ui,sans-serif;
          --f-b:    -apple-system,"SF Pro Text",system-ui,sans-serif;
        }

        .app-shell {
          min-height: 100dvh;
          background: var(--bg);
          color: var(--t1);
          font-family: var(--f-b);
          overflow-x: hidden;
        }

        .app-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 13px calc(92px + env(safe-area-inset-bottom,0px));
          max-width: 440px;
          margin: 0 auto;
        }

        /* ── glass card ── */
        .gc {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background: rgba(255,255,255,0.062);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          border: 1px solid var(--border);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.07) inset,
            0 6px 24px rgba(0,0,0,0.32),
            0 2px 6px rgba(0,0,0,0.18);
          padding: 15px 15px;
        }
        .gc::before {
          content:"";
          position:absolute; top:0; left:10%; right:10%; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18) 40%,rgba(255,255,255,0.18) 60%,transparent);
          pointer-events:none;
        }
        .gc::after {
          content:"";
          position:absolute; top:-22px; left:-14px;
          width:90px; height:56px;
          background:var(--gc-accent,rgba(255,255,255,0.35));
          border-radius:50%;
          filter:blur(26px);
          opacity:0.12;
          pointer-events:none;
        }

        /* ── type scale ── */
        .ey  { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--t3); font-family:var(--f-b); }
        .h1  { font-size:22px; font-weight:800; letter-spacing:-0.4px; line-height:1.1; color:var(--t1); font-family:var(--f-d); }
        .h2  { font-size:15px; font-weight:700; letter-spacing:-0.1px; color:var(--t1); font-family:var(--f-d); }
        .h3  { font-size:13px; font-weight:700; color:var(--t1); font-family:var(--f-d); }
        .lbl { font-size:11px; font-weight:600; color:var(--t2); font-family:var(--f-b); }
        .val { font-size:13px; font-weight:700; color:var(--t1); font-family:var(--f-d); }
        .cap { font-size:11px; color:var(--t3); font-family:var(--f-b); line-height:1.4; }
        .bod { font-size:13px; color:var(--t2); line-height:1.5; }

        /* ── FROST wordmark ── */
        .frost-mark {
          font-size:22px; font-weight:900; letter-spacing:-1px;
          background: linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 45%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: var(--f-d);
          line-height:1;
        }

        /* ── profile header ── */
        .p-row  { display:flex; align-items:center; gap:11px; }
        .avatar {
          width:44px; height:44px; border-radius:50%; flex-shrink:0;
          background:rgba(255,255,255,0.09); border:1.5px solid rgba(255,255,255,0.13);
          display:flex; align-items:center; justify-content:center; overflow:hidden;
          box-shadow:0 0 0 2.5px rgba(96,165,250,0.18);
        }
        .avatar img { width:100%; height:100%; object-fit:cover; }
        .p-name   { font-size:16px; font-weight:700; letter-spacing:-0.1px; color:var(--t1); font-family:var(--f-d); }
        .p-handle { font-size:11px; color:var(--t3); margin-top:1px; }

        .badges { display:flex; gap:7px; margin-top:10px; flex-wrap:wrap; }
        .badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:4px 9px; border-radius:999px;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.09);
          font-size:11px; font-weight:600; color:var(--t2);
          white-space:nowrap;
        }
        .badge.live { color:var(--green); border-color:rgba(52,211,153,0.22); background:rgba(52,211,153,0.07); }
        .connect-zone { margin-top:12px; }

        /* ── hero card inner ── */
        .hero-inner { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .hero-copy  { display:flex; flex-direction:column; gap:6px; flex:1; min-width:0; }
        .hero-orb   {
          width:46px; height:46px; flex-shrink:0; border-radius:50%;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.11);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 16px rgba(96,165,250,0.18); color:var(--blue);
        }

        /* ── 2-col grid ── */
        .g2 { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
        .mini { display:flex; flex-direction:column; gap:5px; }
        .mini-ico {
          width:28px; height:28px; border-radius:8px;
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.09);
          display:flex; align-items:center; justify-content:center; margin-bottom:3px;
        }

        /* ── divider ── */
        .div { height:1px; background:rgba(255,255,255,0.07); margin:10px 0; }

        /* ── feature rows ── */
        .f-list { display:flex; flex-direction:column; margin-top:10px; }
        .f-row  {
          display:flex; align-items:center; justify-content:space-between;
          padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .f-row:last-child { border-bottom:none; padding-bottom:0; }
        .f-pill {
          font-size:10px; font-weight:700; padding:3px 7px; border-radius:999px;
          background:rgba(255,255,255,0.07); color:var(--t3); letter-spacing:0.2px;
          white-space:nowrap;
        }
        .f-pill.blue   { background:rgba(96,165,250,0.13);  color:var(--blue);   }
        .f-pill.green  { background:rgba(52,211,153,0.11);  color:var(--green);  }
        .f-pill.orange { background:rgba(251,146,60,0.13);  color:var(--orange); }

        /* ── TON price ── */
        .price-big {
          font-family:var(--f-d); font-size:32px; font-weight:800;
          letter-spacing:-0.8px; color:var(--t1); line-height:1;
        }
        .price-row   { display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap; margin-top:5px; }
        .chg {
          display:inline-flex; align-items:center; gap:2px;
          font-size:12px; font-weight:700; padding:3px 8px; border-radius:999px; margin-bottom:3px;
        }
        .chg.up   { background:rgba(52,211,153,0.11);  color:var(--green); }
        .chg.down { background:rgba(251,113,133,0.11); color:#fb7185; }
        .ton-orb  {
          width:50px; height:50px; flex-shrink:0; border-radius:50%;
          background:rgba(96,165,250,0.07); border:1px solid rgba(96,165,250,0.18);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 20px rgba(96,165,250,0.14);
        }
        .ton-orb img { width:26px; height:26px; object-fit:contain; }

        /* ── NFT cards — uniform fixed-size grid ── */
        .nft-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        .nft-card {
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
          height: 148px;
          transition: transform 0.15s ease;
        }
        .nft-card:active { transform: scale(0.97); }
        .nft-img-wrap {
          width: 100%;
          height: 90px;
          flex-shrink: 0;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .nft-img-wrap img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .nft-info {
          flex: 1; min-height: 0;
          padding: 5px 6px 5px;
          display: flex; flex-direction: column; gap: 3px; overflow: hidden;
        }
        .nft-name {
          font-size: 9.5px; font-weight: 600; color: var(--t2);
          line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nft-owners {
          font-size: 9px; font-weight: 700; color: var(--blue); white-space: nowrap;
        }
        .nft-badge {
          display: inline-flex; align-items: center; gap: 2px;
          font-size: 8.5px; font-weight: 700; padding: 2px 5px;
          border-radius: 4px; align-self: flex-start; white-space: nowrap; letter-spacing: 0.1px;
        }
        .nft-badge--gift     { background:rgba(251,146,60,0.14);  color:var(--orange); }
        .nft-badge--username { background:rgba(96,165,250,0.14);  color:var(--blue);   }
        .nft-badge--verified { background:rgba(167,139,250,0.14); color:var(--purple); }

        /* ── TON links ── */
        .ton-links { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:2px; }
        .ton-link-btn {
          display:flex; align-items:center; justify-content:center; gap:5px;
          padding:9px 10px; border-radius:11px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
          font-size:11px; font-weight:600; color:var(--t2); text-decoration:none;
          transition:background 0.15s ease; cursor:pointer; white-space:nowrap;
        }
        .ton-link-btn:active { background:rgba(255,255,255,0.1); }

        /* ── LAB marketplace ── */
        .lab-filters {
          display:flex; gap:6px; overflow-x:auto;
          padding-bottom:2px; scrollbar-width:none; margin-top:10px;
        }
        .lab-filters::-webkit-scrollbar { display:none; }
        .lab-filter-btn {
          flex-shrink:0; padding:5px 12px; border-radius:999px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09);
          font-size:11px; font-weight:600; color:var(--t2);
          cursor:pointer; transition:all 0.15s ease; white-space:nowrap;
        }
        .lab-filter-btn.active {
          background:rgba(96,165,250,0.15); border-color:rgba(96,165,250,0.35); color:var(--blue);
        }
        .lab-gift-grid {
          display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;
        }
        .lab-gift-card {
          display:flex; flex-direction:column;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
          border-radius:14px; overflow:hidden; position:relative;
          transition:transform 0.15s ease;
        }
        .lab-gift-card:active { transform:scale(0.97); }
        .lab-gift-emoji-wrap {
          height:80px; display:flex; align-items:center; justify-content:center;
          font-size:38px; background:rgba(255,255,255,0.03);
        }
        .lab-gift-body {
          padding:8px 9px 10px; display:flex; flex-direction:column; gap:4px;
        }
        .lab-gift-name {
          font-size:12px; font-weight:700; color:var(--t1); font-family:var(--f-d);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .lab-gift-rarity { font-size:10px; font-weight:600; }
        .lab-gift-footer { display:flex; align-items:center; justify-content:space-between; margin-top:2px; }
        .lab-gift-price {
          display:flex; align-items:center; gap:3px;
          font-size:12px; font-weight:800; color:var(--t1); font-family:var(--f-d);
        }
        .lab-gift-price img { width:12px; height:12px; object-fit:contain; opacity:0.8; }
        .lab-buy-btn {
          padding:4px 10px; border-radius:8px;
          background:rgba(96,165,250,0.18); border:1px solid rgba(96,165,250,0.28);
          font-size:10px; font-weight:700; color:var(--blue);
          cursor:pointer; transition:background 0.15s ease; white-space:nowrap;
        }
        .lab-buy-btn:active { background:rgba(96,165,250,0.3); }
        .lab-badge {
          position:absolute; top:7px; right:7px;
          font-size:9px; font-weight:700; padding:2px 6px; border-radius:6px;
          white-space:nowrap; pointer-events:none;
        }
        .lab-badge.orange { background:rgba(251,146,60,0.22);  color:var(--orange); }
        .lab-badge.blue   { background:rgba(96,165,250,0.20);  color:var(--blue);   }
        .lab-badge.green  { background:rgba(52,211,153,0.18);  color:var(--green);  }
        .lab-send-strip {
          display:flex; align-items:center; gap:10px;
          padding:11px 13px; border-radius:13px;
          background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.18);
          margin-top:2px; cursor:pointer; transition:background 0.15s ease;
        }
        .lab-send-strip:active { background:rgba(52,211,153,0.14); }
        .lab-send-ico {
          width:34px; height:34px; border-radius:10px; flex-shrink:0;
          background:rgba(52,211,153,0.12); display:flex; align-items:center; justify-content:center;
          color:var(--green);
        }

        /* ── detail rows (profile) ── */
        .d-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .d-row:last-child { border-bottom:none; }

        /* ── screen transitions ── */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .screen { display:flex; flex-direction:column; gap:9px; }
        .screen > * { animation:fadeUp 0.22s ease both; }
        .screen > *:nth-child(1) { animation-delay:0ms; }
        .screen > *:nth-child(2) { animation-delay:40ms; }
        .screen > *:nth-child(3) { animation-delay:80ms; }
        .screen > *:nth-child(4) { animation-delay:120ms; }
        .screen > *:nth-child(5) { animation-delay:160ms; }

        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation:spin 1s linear infinite; }
      `}</style>

      <SnowCanvas />

      <main className="app-content">

        {/* ── Always-visible profile header ── */}
        <GlassCard accent={tonAddress ? "#34d399" : "#60a5fa"}>
          <div className="p-row">
            <div className="avatar">
              {user?.photo_url
                ? <img src={user.photo_url} alt={displayName} />
                : <UserRound size={22} strokeWidth={1.6} />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="p-name">{displayName}</div>
              <div className="p-handle">{username}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
              <Snowflake size={13} strokeWidth={2.5} style={{ color:"var(--blue)" }} />
              <span className="frost-mark">FROST</span>
            </div>
          </div>
          <div className="badges">
            <span className="badge"><Snowflake size={10} strokeWidth={2.5} />Rank I</span>
            <span className={`badge${tonAddress ? " live" : ""}`}>
              <Wallet size={10} strokeWidth={2.5} />
              {tonAddress ? "Wallet live" : "Wallet offline"}
            </span>
          </div>
          <div className="connect-zone"><TonConnectButton /></div>
        </GlassCard>

        {/* ════════ HOME ════════ */}
        {activeTab === "home" && (
          <div className="screen">
            <GlassCard accent="#60a5fa">
              <div className="hero-inner">
                <div className="hero-copy">
                  <span className="ey">TON Ecosystem Hub</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                    <Snowflake size={20} strokeWidth={2} style={{ color:"var(--blue)", flexShrink:0 }} />
                    <h1 className="frost-mark" style={{ fontSize:28 }}>FROST</h1>
                  </div>
                  <p className="bod" style={{ fontSize:12 }}>
                    Icy command center for wallets, drops, vault items, and Telegram-native collectibles.
                  </p>
                </div>
                <div className="hero-orb">
                  <Snowflake size={22} strokeWidth={1.8} />
                </div>
              </div>
            </GlassCard>

            <div className="g2">
              <GlassCard accent="#60a5fa" className="mini">
                <div className="mini-ico" style={{ color:"var(--blue)" }}><Wallet size={14} strokeWidth={2} /></div>
                <span className="lbl">{tonAddress ? "Connected" : "Offline"}</span>
                <span className="val">{tonAddress ? shortenAddress(tonAddress) : "TON Wallet"}</span>
              </GlassCard>
              <GlassCard accent="#a78bfa" className="mini">
                <div className="mini-ico" style={{ color:"var(--purple)" }}><Shield size={14} strokeWidth={2} /></div>
                <span className="lbl">Vault</span>
                <span className="val">No items yet</span>
              </GlassCard>
            </div>

            <GlassCard accent="#34d399">
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                <Zap size={14} strokeWidth={2} style={{ color:"var(--green)", flexShrink:0 }} />
                <span className="h3">Active Drops</span>
              </div>
              <p className="bod" style={{ fontSize:12 }}>No live drops yet. Supabase drops will appear here.</p>
            </GlassCard>
          </div>
        )}

        {/* ════════ VAULT ════════ */}
        {activeTab === "vault" && (
          <div className="screen">
            <GlassCard accent="#a78bfa">
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                <Shield size={14} strokeWidth={2} style={{ color:"var(--purple)", flexShrink:0 }} />
                <span className="h2">NFT Vault</span>
              </div>
              <p className="bod">
                {tonAddress
                  ? "Wallet connected. Next step: load owned TON collectibles."
                  : "Connect your TON wallet to unlock your vault."}
              </p>
            </GlassCard>
          </div>
        )}

        {/* ════════ TON TAB ════════ */}
        {activeTab === "drops" && (
          <div className="screen">

            {/* Price card */}
            <GlassCard accent="#60a5fa">
              <div className="hero-inner" style={{ marginBottom:12 }}>
                <div className="hero-copy">
                  <span className="ey">TON · Live Price</span>
                  <div className="price-row">
                    {priceLoading
                      ? <Loader2 size={20} className="spin" style={{ color:"var(--t3)" }} />
                      : priceError
                        ? <span className="h2" style={{ color:"var(--t3)" }}>Unavailable</span>
                        : <>
                            <span className="price-big">${price?.toFixed(2)}</span>
                            <span className={`chg ${up ? "up" : "down"}`}>
                              {up
                                ? <ArrowUpRight size={11} strokeWidth={2.5} />
                                : <ArrowDownRight size={11} strokeWidth={2.5} />}
                              {Math.abs(change ?? 0).toFixed(2)}%
                            </span>
                          </>}
                  </div>
                  <span className="cap" style={{ marginTop:3 }}>24h change · auto-refreshes</span>
                </div>
                <div className="ton-orb"><img src={TonIcon} alt="TON" /></div>
              </div>

              <div className="div" />

              <div className="g2" style={{ gap:6, marginTop:2 }}>
                <div>
                  <span className="cap">Wallet</span>
                  <div className="lbl" style={{ marginTop:3, color: tonAddress ? "var(--green)" : "var(--t3)" }}>
                    {tonAddress ? shortenAddress(tonAddress) : "Not connected"}
                  </div>
                </div>
                <div>
                  <span className="cap">Network</span>
                  <div className="lbl" style={{ marginTop:3, color:"var(--blue)" }}>TON Mainnet</div>
                </div>
              </div>
            </GlassCard>

            {/* Stats */}
            <div className="g2">
              <GlassCard accent="#60a5fa" className="mini">
                <div className="mini-ico" style={{ color:"var(--blue)" }}><TrendingUp size={13} strokeWidth={2} /></div>
                <span className="lbl">Market Cap</span>
                <span className="val">
                  {price
                    ? `$${(price * 2_516_000_000).toLocaleString("en",{ notation:"compact", maximumFractionDigits:1 })}`
                    : "—"}
                </span>
              </GlassCard>
              <GlassCard accent="#34d399" className="mini">
                <div className="mini-ico" style={{ color:"var(--green)" }}><Layers size={13} strokeWidth={2} /></div>
                <span className="lbl">Supply</span>
                <span className="val">2.52B TON</span>
              </GlassCard>
            </div>

            {/* NFT Collections */}
            <GlassCard accent="#a78bfa">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <Gem size={14} strokeWidth={2} style={{ color:"var(--purple)", flexShrink:0 }} />
                  <span className="h3">TON NFTs</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <BadgeCheck size={11} strokeWidth={2.5} style={{ color:"var(--green)" }} />
                  <span className="cap" style={{ color:"var(--green)", fontWeight:600 }}>Curated</span>
                </div>
              </div>

              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                <span className="nft-badge nft-badge--gift"><Gift size={8} strokeWidth={2.5} /> Gifts</span>
                <span className="nft-badge nft-badge--username"><AtSign size={8} strokeWidth={2.5} /> Usernames</span>
                <span className="nft-badge nft-badge--verified"><Gem size={8} strokeWidth={2.5} /> NFTs</span>
              </div>

              {nftLoading && (
                <div style={{ display:"flex", justifyContent:"center", padding:"20px 0" }}>
                  <Loader2 size={18} className="spin" style={{ color:"var(--t3)" }} />
                </div>
              )}
              {nftError && !nftLoading && (
                <p className="cap" style={{ textAlign:"center", padding:"12px 0" }}>Couldn't load collections</p>
              )}
              {!nftLoading && !nftError && nfts.length > 0 && (
                <div className="nft-grid">
                  {nfts.map((col) => (
                    <a
                      key={col.address}
                      className="nft-card"
                      href={`https://getgems.io/collection/${col.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="nft-img-wrap">
                        {col.coverImage
                          ? <img src={col.coverImage} alt={col.name} loading="lazy" />
                          : <ImageOff size={16} style={{ color:"var(--t3)" }} />}
                      </div>
                      <div className="nft-info">
                        <NftKindBadge kind={col.kind} />
                        <span className="nft-name">{col.name}</span>
                        {col.ownerCount != null && (
                          <span className="nft-owners">{col.ownerCount.toLocaleString()} owners</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {!nftLoading && !nftError && nfts.length === 0 && (
                <p className="cap" style={{ textAlign:"center", padding:"16px 0" }}>No collections found</p>
              )}
            </GlassCard>

            {/* Explore TON */}
            <GlassCard accent="#60a5fa">
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <Sparkles size={13} strokeWidth={2} style={{ color:"var(--blue)", flexShrink:0 }} />
                <span className="h3">Explore TON</span>
              </div>
              <div className="ton-links">
                <a className="ton-link-btn" href="https://fragment.com" target="_blank" rel="noopener noreferrer">
                  <AtSign size={12} strokeWidth={2.5} style={{ color:"var(--blue)", flexShrink:0 }} />Fragment
                </a>
                <a className="ton-link-btn" href="https://getgems.io" target="_blank" rel="noopener noreferrer">
                  <Gem size={12} strokeWidth={2.5} style={{ color:"var(--purple)", flexShrink:0 }} />Getgems
                </a>
                <a className="ton-link-btn" href="https://t.me/wallet" target="_blank" rel="noopener noreferrer">
                  <Wallet size={12} strokeWidth={2.5} style={{ color:"var(--green)", flexShrink:0 }} />TG Wallet
                </a>
                <a className="ton-link-btn" href="https://tonscan.org" target="_blank" rel="noopener noreferrer">
                  <Layers size={12} strokeWidth={2.5} style={{ color:"var(--orange)", flexShrink:0 }} />TONScan
                </a>
              </div>
            </GlassCard>

          </div>
        )}

        {/* ════════ LAB — Telegram Gift Marketplace ════════ */}
        {activeTab === "track" && (
          <div className="screen">

            {/* Hero */}
            <GlassCard accent="#a78bfa">
              <div className="hero-inner">
                <div className="hero-copy">
                  <span className="ey">FROST · Gift Marketplace</span>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:2 }}>
                    <FlaskConical size={18} strokeWidth={2} style={{ color:"var(--purple)", flexShrink:0 }} />
                    <h2 className="h1" style={{ fontSize:24 }}>LAB</h2>
                  </div>
                  <p className="bod" style={{ fontSize:12, marginTop:2 }}>
                    Buy, send &amp; trade Telegram gifts with TON. Verified listings only.
                  </p>
                </div>
                <div className="hero-orb" style={{ boxShadow:"0 0 16px rgba(167,139,250,0.22)", color:"var(--purple)" }}>
                  <ShoppingBag size={20} strokeWidth={1.8} />
                </div>
              </div>
            </GlassCard>

            {/* Stats row */}
            <div className="g2">
              <GlassCard accent="#a78bfa" className="mini">
                <div className="mini-ico" style={{ color:"var(--purple)" }}><Tag size={13} strokeWidth={2} /></div>
                <span className="lbl">Listed</span>
                <span className="val">1,240 gifts</span>
              </GlassCard>
              <GlassCard accent="#34d399" className="mini">
                <div className="mini-ico" style={{ color:"var(--green)" }}><TrendingUp size={13} strokeWidth={2} /></div>
                <span className="lbl">Floor</span>
                <span className="val">3 TON</span>
              </GlassCard>
            </div>

            {/* Send banner */}
            <div className="lab-send-strip">
              <div className="lab-send-ico"><Send size={16} strokeWidth={2} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="lbl" style={{ color:"var(--green)", fontWeight:700 }}>Send a gift</div>
                <div className="cap">Transfer any gift instantly via TON wallet</div>
              </div>
              <span className="f-pill green">Soon</span>
            </div>

            {/* Marketplace grid */}
            <GlassCard accent="#a78bfa">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <Star size={13} strokeWidth={2} style={{ color:"var(--purple)", flexShrink:0 }} />
                  <span className="h3">Marketplace</span>
                </div>
                <span className="cap">Pay with TON</span>
              </div>

              <div className="lab-filters">
                {(["all","legendary","epic","rare"] as const).map((f) => (
                  <button
                    key={f}
                    className={`lab-filter-btn${labFilter === f ? " active" : ""}`}
                    onClick={() => setLabFilter(f)}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="lab-gift-grid">
                {filteredGifts.map((g) => (
                  <div key={g.id} className="lab-gift-card">
                    {g.badge && (
                      <span className={`lab-badge ${g.badgeCls}`}>{g.badge}</span>
                    )}
                    <div className="lab-gift-emoji-wrap">{g.emoji}</div>
                    <div className="lab-gift-body">
                      <span className="lab-gift-name">{g.name}</span>
                      <span className="lab-gift-rarity" style={{ color: RARITY_COLOR[g.rarity] ?? "var(--t3)" }}>
                        {g.rarity}
                      </span>
                      <div className="lab-gift-footer">
                        <div className="lab-gift-price">
                          <img src={TonIcon} alt="TON" />
                          {g.price}
                        </div>
                        <button className="lab-buy-btn">Buy</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Upcoming */}
            <GlassCard accent="#fb923c">
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <Sparkles size={14} strokeWidth={2} style={{ color:"var(--orange)", flexShrink:0 }} />
                <span className="h3">Upcoming</span>
              </div>
              <div className="f-list">
                {[
                  { label:"Rare Telegram Gifts",   badge:"Soon",      cls:""       },
                  { label:"Collectible Usernames",  badge:"Live next", cls:"green"  },
                  { label:"Seasonal Drops",         badge:"Planned",   cls:""       },
                  { label:"FROST Exclusive NFTs",   badge:"FROST",     cls:"blue"   },
                ].map(({ label, badge, cls }) => (
                  <div className="f-row" key={label}>
                    <span className="lbl" style={{ fontWeight:500 }}>{label}</span>
                    <span className={`f-pill ${cls}`}>{badge}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>
        )}

        {/* ════════ PROFILE ════════ */}
        {activeTab === "profile" && (
          <div className="screen">
            <GlassCard accent="#f472b6">
              <div className="p-row" style={{ marginBottom:12 }}>
                <div className="avatar">
                  {user?.photo_url
                    ? <img src={user.photo_url} alt={displayName} />
                    : <UserRound size={22} strokeWidth={1.6} />}
                </div>
                <div>
                  <div className="p-name">{displayName}</div>
                  <div className="p-handle">{username}</div>
                </div>
              </div>
              <div className="div" />
              {[
                { label:"Wallet",     value: tonAddress ? shortenAddress(tonAddress) : "Not connected", color: tonAddress ? "var(--green)" : "var(--t3)" },
                { label:"FROST Rank", value:"Rank I",      color:"var(--blue)"  },
                { label:"Network",    value:"TON Mainnet", color:"var(--blue)"  },
              ].map(({ label, value, color }) => (
                <div className="d-row" key={label}>
                  <span className="cap">{label}</span>
                  <span className="lbl" style={{ color }}>{value}</span>
                </div>
              ))}
            </GlassCard>
          </div>
        )}

      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
