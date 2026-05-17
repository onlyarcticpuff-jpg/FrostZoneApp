import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  Wallet, Gem, Radar, Shield, Sparkles,
  Snowflake, UserRound, TrendingUp, ArrowUpRight,
  ArrowDownRight, Layers, Tag, Clock, Loader2,
} from "lucide-react";
import TonIcon from "./assets/icons/ton.svg";
import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";

declare global { interface Window { Telegram?: any; } }

type Tab = "home" | "vault" | "drops" | "track" | "profile";

function shortenAddress(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

/* ─── TON price hook ─────────────────────────────────────────── */
function useTonPrice() {
  const [price, setPrice]     = useState<number | null>(null);
  const [change, setChange]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true"
        );
        const d = await r.json();
        if (dead) return;
        const coin = d["the-open-network"];
        setPrice(coin.usd);
        setChange(coin.usd_24h_change);
      } catch {
        if (!dead) setError(true);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  return { price, change, loading, error };
}

/* ─── Reusable glass card shell ──────────────────────────────── */
function GlassCard({
  children, accent = "rgba(255,255,255,0.5)", className = "", style = {},
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

/* ─── Section label ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

/* ═══════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const tonAddress = useTonAddress();
  const { price, change, loading: priceLoading, error: priceError } = useTonPrice();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor("#07101f"); tg.setBackgroundColor("#050816"); }
  }, []);

  const user        = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const displayName = user?.first_name || user?.last_name
    ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
    : "Frost User";
  const username = user?.username ? `@${user.username}` : "@telegram";
  const up = change !== null && change >= 0;

  return (
    <div className="app-shell">
      <style>{`
        /* ── Reset / root ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #050816;
          --surface:   rgba(255,255,255,0.06);
          --border:    rgba(255,255,255,0.11);
          --text-1:    rgba(255,255,255,0.92);
          --text-2:    rgba(255,255,255,0.55);
          --text-3:    rgba(255,255,255,0.32);
          --blue:      #60a5fa;
          --purple:    #a78bfa;
          --green:     #34d399;
          --orange:    #fb923c;
          --pink:      #f472b6;
          --font-disp: -apple-system, "SF Pro Rounded", "SF Pro Display", system-ui, sans-serif;
          --font-body: -apple-system, "SF Pro Text", system-ui, sans-serif;
        }

        /* ── Shell ── */
        .app-shell {
          min-height: 100dvh;
          background: var(--bg);
          color: var(--text-1);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .app-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 14px calc(100px + env(safe-area-inset-bottom, 0px));
          max-width: 480px;
          margin: 0 auto;
        }

        /* ── Glass card base ── */
        .gc {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255,255,255,0.065);
          backdrop-filter: blur(40px) saturate(190%) brightness(1.07);
          -webkit-backdrop-filter: blur(40px) saturate(190%) brightness(1.07);
          border: 1px solid var(--border);
          box-shadow:
            0 2px 0 rgba(255,255,255,0.08) inset,
            0 -1px 0 rgba(0,0,0,0.18) inset,
            0 8px 32px rgba(0,0,0,0.35),
            0 2px 8px rgba(0,0,0,0.2);
          padding: 18px 18px;
        }

        /* Top specular line */
        .gc::before {
          content: "";
          position: absolute;
          top: 0; left: 12%; right: 12%;
          height: 1px;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.22) 40%,rgba(255,255,255,0.22) 60%,transparent);
          pointer-events: none;
        }

        /* Accent glow */
        .gc::after {
          content: "";
          position: absolute;
          top: -28px; left: -16px;
          width: 110px; height: 70px;
          background: var(--gc-accent, rgba(255,255,255,0.4));
          border-radius: 50%;
          filter: blur(32px);
          opacity: 0.13;
          pointer-events: none;
        }

        /* ── Typography scale ── */
        .t-eyebrow {
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--text-3);
          line-height: 1;
        }

        .t-hero {
          font-family: var(--font-disp);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
          color: var(--text-1);
        }

        .t-title {
          font-family: var(--font-disp);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: var(--text-1);
          line-height: 1.2;
        }

        .t-label {
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-2);
          line-height: 1;
        }

        .t-value {
          font-family: var(--font-disp);
          font-size: 15px;
          font-weight: 700;
          color: var(--text-1);
          line-height: 1.2;
        }

        .t-caption {
          font-family: var(--font-body);
          font-size: 12px;
          color: var(--text-3);
          line-height: 1.4;
        }

        .t-body {
          font-size: 14px;
          color: var(--text-2);
          line-height: 1.55;
        }

        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-3);
          padding: 4px 2px 2px;
        }

        /* ── Profile header card ── */
        .profile-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .profile-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-wrap {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.14);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(96,165,250,0.15);
        }

        .avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }

        .profile-name { font-family: var(--font-disp); font-size: 18px; font-weight: 700; letter-spacing: -0.2px; color: var(--text-1); }
        .profile-handle { font-size: 12px; color: var(--text-3); margin-top: 1px; }

        .badge-row {
          display: flex;
          gap: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-2);
        }

        .badge.live { color: var(--green); border-color: rgba(52,211,153,0.25); background: rgba(52,211,153,0.08); }
        .badge svg { flex-shrink: 0; }

        .connect-zone { display: flex; }

        /* ── Hero card ── */
        .hero-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .hero-card-copy { display: flex; flex-direction: column; gap: 8px; flex: 1; }

        .hero-orb {
          width: 52px; height: 52px; flex-shrink: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(96,165,250,0.2);
          color: var(--blue);
        }

        /* ── 2-col grid ── */
        .grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .mini-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mini-card-icon {
          width: 32px; height: 32px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2px;
        }

        /* ── Feature rows ── */
        .feature-list { display: flex; flex-direction: column; gap: 1px; margin-top: 12px; }

        .feature-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .feature-row:last-child { border-bottom: none; }

        .feature-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          color: var(--text-3);
          letter-spacing: 0.3px;
        }
        .feature-badge.featured { background: rgba(96,165,250,0.15); color: var(--blue); }
        .feature-badge.live-soon { background: rgba(52,211,153,0.12); color: var(--green); }

        /* ── TON price display ── */
        .ton-price-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ton-price-big {
          font-family: var(--font-disp);
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--text-1);
          line-height: 1;
        }

        .ton-change {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 13px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 999px;
          margin-bottom: 4px;
        }

        .ton-change.up   { background: rgba(52,211,153,0.12); color: var(--green); }
        .ton-change.down { background: rgba(251,113,133,0.12); color: #fb7185; }

        .ton-icon-sm {
          width: 18px; height: 18px;
          object-fit: contain;
          filter: drop-shadow(0 0 6px rgba(96,165,250,0.5));
        }

        .ton-hero-orb {
          width: 56px; height: 56px; flex-shrink: 0;
          border-radius: 50%;
          background: rgba(96,165,250,0.08);
          border: 1px solid rgba(96,165,250,0.2);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 24px rgba(96,165,250,0.18);
        }

        .ton-hero-orb img { width: 30px; height: 30px; object-fit: contain; }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 4px 0;
        }

        /* ── Profile page detail rows ── */
        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .detail-row:last-child { border-bottom: none; }

        /* ── Fade-in animation ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .screen > * {
          animation: fadeUp 0.28s ease both;
        }
        .screen > *:nth-child(1) { animation-delay: 0ms; }
        .screen > *:nth-child(2) { animation-delay: 50ms; }
        .screen > *:nth-child(3) { animation-delay: 100ms; }
        .screen > *:nth-child(4) { animation-delay: 150ms; }

        .screen { display: flex; flex-direction: column; gap: 10px; }
      `}</style>

      <SnowCanvas />

      <main className="app-content">

        {/* ── Profile header (always visible) ── */}
        <GlassCard accent={tonAddress ? "#34d399" : "#60a5fa"} className="profile-card">
          <div className="profile-row">
            <div className="avatar-wrap">
              {user?.photo_url
                ? <img src={user.photo_url} alt={displayName} />
                : <UserRound size={26} strokeWidth={1.6} />}
            </div>
            <div>
              <div className="profile-name">{displayName}</div>
              <div className="profile-handle">{username}</div>
            </div>
          </div>

          <div className="badge-row">
            <span className="badge">
              <Snowflake size={11} strokeWidth={2.5} />
              Frost Rank I
            </span>
            <span className={`badge${tonAddress ? " live" : ""}`}>
              <Wallet size={11} strokeWidth={2.5} />
              {tonAddress ? "Wallet live" : "Wallet offline"}
            </span>
          </div>

          <div className="connect-zone">
            <TonConnectButton />
          </div>
        </GlassCard>

        {/* ─────────────────── HOME ─────────────────── */}
        {activeTab === "home" && (
          <div className="screen">
            <GlassCard accent="#60a5fa">
              <div className="hero-card">
                <div className="hero-card-copy">
                  <span className="t-eyebrow">TON Ecosystem Hub</span>
                  <h2 className="t-hero">FrostLab</h2>
                  <p className="t-body" style={{ fontSize: 13 }}>
                    Icy command center for wallets, drops, vault items, and Telegram-native collectibles.
                  </p>
                </div>
                <div className="hero-orb"><Sparkles size={24} /></div>
              </div>
            </GlassCard>

            <div className="grid-two">
              <GlassCard accent="#60a5fa" className="mini-card">
                <div className="mini-card-icon" style={{ color: "var(--blue)" }}>
                  <Wallet size={16} strokeWidth={2} />
                </div>
                <span className="t-label">{tonAddress ? "Connected" : "Offline"}</span>
                <span className="t-value" style={{ fontSize: 13 }}>
                  {tonAddress ? shortenAddress(tonAddress) : "TON Wallet"}
                </span>
              </GlassCard>

              <GlassCard accent="#a78bfa" className="mini-card">
                <div className="mini-card-icon" style={{ color: "var(--purple)" }}>
                  <Shield size={16} strokeWidth={2} />
                </div>
                <span className="t-label">Vault</span>
                <span className="t-value" style={{ fontSize: 13 }}>No items yet</span>
              </GlassCard>
            </div>

            <GlassCard accent="#34d399">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Gem size={16} strokeWidth={2} style={{ color: "var(--green)", flexShrink: 0 }} />
                <span className="t-title" style={{ fontSize: 15 }}>Active Drops</span>
              </div>
              <p className="t-body" style={{ fontSize: 13 }}>No live drops yet. Supabase drops will appear here.</p>
            </GlassCard>
          </div>
        )}

        {/* ─────────────────── VAULT ─────────────────── */}
        {activeTab === "vault" && (
          <div className="screen">
            <GlassCard accent="#a78bfa">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Shield size={16} strokeWidth={2} style={{ color: "var(--purple)", flexShrink: 0 }} />
                <span className="t-title">NFT Vault</span>
              </div>
              <p className="t-body">
                {tonAddress
                  ? "Wallet connected. Next step: load owned TON collectibles."
                  : "Connect your TON wallet to unlock your vault."}
              </p>
            </GlassCard>
          </div>
        )}

        {/* ─────────────────── TON TAB ─────────────────── */}
        {activeTab === "drops" && (
          <div className="screen">

            {/* Hero price card */}
            <GlassCard accent="#60a5fa">
              <div className="hero-card" style={{ marginBottom: 14 }}>
                <div className="hero-card-copy">
                  <span className="t-eyebrow">Live Price · CoinGecko</span>
                  <div className="ton-price-row" style={{ marginTop: 6 }}>
                    {priceLoading ? (
                      <span className="t-hero" style={{ fontSize: 28, opacity: 0.5 }}>
                        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                      </span>
                    ) : priceError ? (
                      <span className="t-hero" style={{ fontSize: 22, opacity: 0.5 }}>Unavailable</span>
                    ) : (
                      <>
                        <span className="ton-price-big">${price?.toFixed(2)}</span>
                        <span className={`ton-change ${up ? "up" : "down"}`}>
                          {up
                            ? <ArrowUpRight size={13} strokeWidth={2.5} />
                            : <ArrowDownRight size={13} strokeWidth={2.5} />}
                          {Math.abs(change ?? 0).toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="t-caption" style={{ marginTop: 4 }}>24h change · auto-refreshes</span>
                </div>
                <div className="ton-hero-orb">
                  <img src={TonIcon} alt="TON" />
                </div>
              </div>

              <div className="divider" />

              <div className="grid-two" style={{ marginTop: 12, gap: 8 }}>
                <div>
                  <span className="t-caption">Wallet</span>
                  <div className="t-label" style={{ marginTop: 4, color: tonAddress ? "var(--green)" : "var(--text-3)" }}>
                    {tonAddress ? shortenAddress(tonAddress) : "Not connected"}
                  </div>
                </div>
                <div>
                  <span className="t-caption">Network</span>
                  <div className="t-label" style={{ marginTop: 4, color: "var(--blue)" }}>TON Mainnet</div>
                </div>
              </div>
            </GlassCard>

            {/* Stats row */}
            <div className="grid-two">
              <GlassCard accent="#60a5fa" className="mini-card">
                <div className="mini-card-icon" style={{ color: "var(--blue)" }}>
                  <TrendingUp size={15} strokeWidth={2} />
                </div>
                <span className="t-label">Market Cap</span>
                <span className="t-value" style={{ fontSize: 13 }}>
                  {price ? `$${(price * 2_516_000_000).toLocaleString("en", { notation: "compact", maximumFractionDigits: 2 })}` : "—"}
                </span>
              </GlassCard>

              <GlassCard accent="#34d399" className="mini-card">
                <div className="mini-card-icon" style={{ color: "var(--green)" }}>
                  <Layers size={15} strokeWidth={2} />
                </div>
                <span className="t-label">Supply</span>
                <span className="t-value" style={{ fontSize: 13 }}>2.52B TON</span>
              </GlassCard>
            </div>

            {/* NFT + market section */}
            <GlassCard accent="#a78bfa">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Tag size={15} strokeWidth={2} style={{ color: "var(--purple)", flexShrink: 0 }} />
                <span className="t-title" style={{ fontSize: 15 }}>Popular NFTs</span>
              </div>
              <div className="feature-list">
                {[
                  { label: "Telegram Usernames",  badge: "Featured",     cls: "featured"   },
                  { label: "TON Collectibles",     badge: "Tracking soon", cls: ""           },
                  { label: "Market Activity",      badge: "Coming soon",  cls: ""           },
                ].map(({ label, badge, cls }) => (
                  <div className="feature-row" key={label}>
                    <span className="t-label" style={{ fontWeight: 500 }}>{label}</span>
                    <span className={`feature-badge ${cls}`}>{badge}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>
        )}

        {/* ─────────────────── TRACK ─────────────────── */}
        {activeTab === "track" && (
          <div className="screen">
            <GlassCard accent="#fb923c">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Gem size={16} strokeWidth={2} style={{ color: "var(--orange)", flexShrink: 0 }} />
                <span className="t-title">Gifts & NFTs</span>
              </div>
              <p className="t-body">Explore Telegram gifts, collectible usernames, rare NFTs, and featured drops.</p>
            </GlassCard>

            <div className="grid-two">
              <GlassCard accent="#fb923c" className="mini-card">
                <div className="mini-card-icon" style={{ color: "var(--orange)" }}>
                  <Gem size={16} strokeWidth={2} />
                </div>
                <span className="t-label">Gifts</span>
                <span className="t-value" style={{ fontSize: 13 }}>Popular items</span>
              </GlassCard>

              <GlassCard accent="#a78bfa" className="mini-card">
                <div className="mini-card-icon" style={{ color: "var(--purple)" }}>
                  <Shield size={16} strokeWidth={2} />
                </div>
                <span className="t-label">NFTs</span>
                <span className="t-value" style={{ fontSize: 13 }}>Featured</span>
              </GlassCard>
            </div>

            <GlassCard accent="#fb923c">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Sparkles size={15} strokeWidth={2} style={{ color: "var(--orange)", flexShrink: 0 }} />
                <span className="t-title" style={{ fontSize: 15 }}>Featured</span>
              </div>
              <div className="feature-list">
                {[
                  { label: "Rare Telegram Gifts",    badge: "Soon",      cls: "" },
                  { label: "Collectible Usernames",  badge: "Live next", cls: "live-soon" },
                  { label: "Seasonal Drops",         badge: "Planned",   cls: "" },
                ].map(({ label, badge, cls }) => (
                  <div className="feature-row" key={label}>
                    <span className="t-label" style={{ fontWeight: 500 }}>{label}</span>
                    <span className={`feature-badge ${cls}`}>{badge}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ─────────────────── PROFILE ─────────────────── */}
        {activeTab === "profile" && (
          <div className="screen">
            <GlassCard accent="#f472b6">
              <div className="profile-row" style={{ marginBottom: 16 }}>
                <div className="avatar-wrap">
                  {user?.photo_url
                    ? <img src={user.photo_url} alt={displayName} />
                    : <UserRound size={24} strokeWidth={1.6} />}
                </div>
                <div>
                  <div className="profile-name">{displayName}</div>
                  <div className="profile-handle">{username}</div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ marginTop: 4 }}>
                {[
                  { label: "Wallet",    value: tonAddress ? shortenAddress(tonAddress) : "Not connected", color: tonAddress ? "var(--green)" : "var(--text-3)" },
                  { label: "Frost Rank", value: "Rank I",      color: "var(--blue)"   },
                  { label: "Network",   value: "TON Mainnet",  color: "var(--blue)"   },
                ].map(({ label, value, color }) => (
                  <div className="detail-row" key={label}>
                    <span className="t-caption">{label}</span>
                    <span className="t-label" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Spin keyframe for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
