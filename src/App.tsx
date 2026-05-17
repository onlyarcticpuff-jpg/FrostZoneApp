import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  Wallet, Gem, Shield, Sparkles, Snowflake,
  UserRound, TrendingUp, ArrowUpRight, ArrowDownRight,
  Layers, Loader2, ImageOff,
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

/* ─── GetGems NFT collections ────────────────────────────────── */
interface NftCollection {
  address: string;
  name: string;
  coverImage: string | null;
  floorPrice: string | null;   // in TON, string
  ownerCount: number | null;
}

function useGetGemsCollections() {
  const [items, setItems]     = useState<NftCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let dead = false;
    async function load() {
      const query = `{
        alphaNftCollectionSearch(
          query: ""
          count: 6
          sort: VOLUME_DESC
        ) {
          items {
            address
            name
            coverImagePreview { url originalUrl }
            floorPrice
            ownersCount
          }
        }
      }`;
      try {
        const r = await fetch("https://api.getgems.io/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const d = await r.json();
        if (dead) return;
        const raw = d?.data?.alphaNftCollectionSearch?.items ?? [];
        setItems(raw.map((c: any) => ({
          address:    c.address,
          name:       c.name,
          coverImage: c.coverImagePreview?.url ?? c.coverImagePreview?.originalUrl ?? null,
          floorPrice: c.floorPrice ?? null,
          ownerCount: c.ownersCount ?? null,
        })));
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

/* ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const tonAddress = useTonAddress();
  const { price, change, loading: priceLoading, error: priceError } = useTonPrice();
  const { items: nfts, loading: nftLoading, error: nftError } = useGetGemsCollections();
  const up = change !== null && change >= 0;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor("#07101f"); tg.setBackgroundColor("#050816"); }
  }, []);

  const user        = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const displayName = (user?.first_name || user?.last_name)
    ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
    : "Frost User";
  const username = user?.username ? `@${user.username}` : "@telegram";

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
        .f-pill.blue  { background:rgba(96,165,250,0.13);  color:var(--blue);   }
        .f-pill.green { background:rgba(52,211,153,0.11);  color:var(--green);  }

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

        /* ── NFT cards ── */
        .nft-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:10px; }
        .nft-item {
          display:flex; flex-direction:column; gap:5px; cursor:pointer;
        }
        .nft-thumb {
          width:100%; aspect-ratio:1/1; border-radius:12px; overflow:hidden;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:center;
          position:relative;
        }
        .nft-thumb img {
          width:100%; height:100%; object-fit:cover;
          transition: opacity 0.2s;
        }
        .nft-name  { font-size:10px; font-weight:600; color:var(--t2); line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .nft-floor { font-size:10px; font-weight:700; color:var(--blue); }

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
            <div>
              <div className="p-name">{displayName}</div>
              <div className="p-handle">{username}</div>
            </div>
          </div>
          <div className="badges">
            <span className="badge"><Snowflake size={10} strokeWidth={2.5} />Frost Rank I</span>
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
                  <h1 className="h1">FrostLab</h1>
                  <p className="bod" style={{ fontSize:12 }}>
                    Icy command center for wallets, drops, vault items, and Telegram-native collectibles.
                  </p>
                </div>
                <div className="hero-orb"><Sparkles size={22} /></div>
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
                <Gem size={14} strokeWidth={2} style={{ color:"var(--green)", flexShrink:0 }} />
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

            {/* Popular NFTs via GetGems */}
            <GlassCard accent="#a78bfa">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <Gem size={14} strokeWidth={2} style={{ color:"var(--purple)", flexShrink:0 }} />
                  <span className="h3">Popular NFTs</span>
                </div>
                <span className="cap">via GetGems</span>
              </div>

              {nftLoading && (
                <div style={{ display:"flex", justifyContent:"center", padding:"16px 0" }}>
                  <Loader2 size={18} className="spin" style={{ color:"var(--t3)" }} />
                </div>
              )}

              {nftError && !nftLoading && (
                <p className="cap" style={{ textAlign:"center", padding:"12px 0" }}>
                  Couldn't load collections
                </p>
              )}

              {!nftLoading && !nftError && nfts.length > 0 && (
                <div className="nft-grid">
                  {nfts.map((col) => (
                    <a
                      key={col.address}
                      className="nft-item"
                      href={`https://getgems.io/collection/${col.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration:"none" }}
                    >
                      <div className="nft-thumb">
                        {col.coverImage
                          ? <img src={col.coverImage} alt={col.name} loading="lazy" />
                          : <ImageOff size={16} style={{ color:"var(--t3)" }} />}
                      </div>
                      <span className="nft-name">{col.name}</span>
                      {col.floorPrice && (
                        <span className="nft-floor">
                          {parseFloat(col.floorPrice).toFixed(1)} TON
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {!nftLoading && !nftError && nfts.length === 0 && (
                <p className="cap" style={{ textAlign:"center", padding:"12px 0" }}>No collections found</p>
              )}
            </GlassCard>

          </div>
        )}

        {/* ════════ TRACK ════════ */}
        {activeTab === "track" && (
          <div className="screen">
            <GlassCard accent="#fb923c">
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                <Gem size={14} strokeWidth={2} style={{ color:"var(--orange)", flexShrink:0 }} />
                <span className="h2">Gifts & NFTs</span>
              </div>
              <p className="bod">Explore Telegram gifts, collectible usernames, rare NFTs, and featured drops.</p>
            </GlassCard>

            <div className="g2">
              <GlassCard accent="#fb923c" className="mini">
                <div className="mini-ico" style={{ color:"var(--orange)" }}><Gem size={14} strokeWidth={2} /></div>
                <span className="lbl">Gifts</span>
                <span className="val">Popular items</span>
              </GlassCard>
              <GlassCard accent="#a78bfa" className="mini">
                <div className="mini-ico" style={{ color:"var(--purple)" }}><Shield size={14} strokeWidth={2} /></div>
                <span className="lbl">NFTs</span>
                <span className="val">Featured</span>
              </GlassCard>
            </div>

            <GlassCard accent="#fb923c">
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <Sparkles size={14} strokeWidth={2} style={{ color:"var(--orange)", flexShrink:0 }} />
                <span className="h3">Featured</span>
              </div>
              <div className="f-list">
                {[
                  { label:"Rare Telegram Gifts",   badge:"Soon",      cls:""      },
                  { label:"Collectible Usernames",  badge:"Live next", cls:"green" },
                  { label:"Seasonal Drops",         badge:"Planned",   cls:""      },
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
                { label:"Frost Rank", value:"Rank I",      color:"var(--blue)"  },
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
