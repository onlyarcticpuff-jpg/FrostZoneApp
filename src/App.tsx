import { useEffect, useMemo, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  Backpack,
  Box,
  ChevronRight,
  Crown,
  FlaskConical,
  Gift,
  Lock,
  PackageOpen,
  Shield,
  Snowflake,
  Sparkles,
  Store,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";

import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";

declare global {
  interface Window {
    Telegram?: any;
  }
}

type Tab = "open" | "inventory" | "market" | "lab" | "profile";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

type CaseItem = {
  id: string;
  name: string;
  rarity: Rarity;
  chance: string;
  image?: string;
};

type CasePack = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  accent: string;
  status: "Ready" | "Locked";
  items: CaseItem[];
};

const rarityColor: Record<Rarity, string> = {
  Common: "var(--muted)",
  Rare: "var(--blue)",
  Epic: "var(--purple)",
  Legendary: "var(--orange)",
  Mythic: "var(--pink)",
};

const cases: CasePack[] = [
  {
    id: "frostbite",
    name: "Frostbite Case",
    subtitle: "Weapon skins · Season 01",
    price: "12 TON",
    accent: "#60a5fa",
    status: "Locked",
    items: [
      { id: "ak", name: "AK-47 | Frostbite", rarity: "Legendary", chance: "1.2%" },
      { id: "karambit", name: "Karambit | Glacier", rarity: "Mythic", chance: "0.3%" },
      { id: "blade", name: "Frost Blade", rarity: "Epic", chance: "6%" },
    ],
  },
  {
    id: "gift",
    name: "Telegram Gift Case",
    subtitle: "Gifts · stickers · collectibles",
    price: "⭐ 250",
    accent: "#a78bfa",
    status: "Locked",
    items: [
      { id: "pepe", name: "Plush Pepe", rarity: "Legendary", chance: "1%" },
      { id: "gem", name: "Crystal Gem", rarity: "Epic", chance: "5%" },
      { id: "star", name: "Star Fragment", rarity: "Rare", chance: "18%" },
    ],
  },
];

function shortenAddress(address: string) {
  return address ? `${address.slice(0, 5)}…${address.slice(-4)}` : "";
}

function haptic(type: "light" | "success" | "error" = "light") {
  const tg = window.Telegram?.WebApp;
  if (!tg?.HapticFeedback) return;

  if (type === "success") tg.HapticFeedback.notificationOccurred("success");
  else if (type === "error") tg.HapticFeedback.notificationOccurred("error");
  else tg.HapticFeedback.impactOccurred("light");
}

function FrostCard({
  children,
  accent = "rgba(255,255,255,0.45)",
  className = "",
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <section
      className={`frost-card ${className}`}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {children}
    </section>
  );
}

function RarityPill({ rarity }: { rarity: Rarity }) {
  return (
    <span className="rarity-pill" style={{ color: rarityColor[rarity] }}>
      {rarity}
    </span>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("open");
  const [selectedCase, setSelectedCase] = useState(cases[0]);
  const tonAddress = useTonAddress();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#07101f");
      tg.setBackgroundColor("#050816");
    }
  }, []);

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
      : "FROST User";

  const username = user?.username ? `@${user.username}` : "@telegram";

  const featuredItems = useMemo(() => selectedCase.items, [selectedCase]);

  function lockedOpen() {
    haptic("error");
    window.Telegram?.WebApp?.showAlert?.(
      "Opening backend is not connected yet. Next step: payment verification, provably fair RNG, and instant NFT transfer."
    );
  }

  return (
    <div className="app-shell">
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --bg: #050816;
          --text: rgba(255,255,255,0.92);
          --soft: rgba(255,255,255,0.56);
          --muted: rgba(255,255,255,0.32);
          --border: rgba(255,255,255,0.11);
          --blue: #60a5fa;
          --purple: #a78bfa;
          --green: #34d399;
          --orange: #fb923c;
          --pink: #f472b6;
          --font-display: -apple-system, "SF Pro Rounded", "SF Pro Display", system-ui, sans-serif;
          --font-body: -apple-system, "SF Pro Text", system-ui, sans-serif;
        }

        .app-shell {
          min-height: 100dvh;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .app-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 440px;
          margin: 0 auto;
          padding: 14px 13px calc(96px + env(safe-area-inset-bottom, 0px));
        }

        .frost-card {
          position: relative;
          overflow: hidden;
          border-radius: 19px;
          padding: 15px;
          background: rgba(255,255,255,0.062);
          border: 1px solid var(--border);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 7px 26px rgba(0,0,0,0.34);
        }

        .frost-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          pointer-events: none;
        }

        .frost-card::after {
          content: "";
          position: absolute;
          top: -24px;
          left: -18px;
          width: 96px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent);
          filter: blur(28px);
          opacity: 0.13;
          pointer-events: none;
        }

        .screen {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .screen > * {
          animation: fadeUp 0.22s ease both;
        }

        .screen > *:nth-child(2) { animation-delay: 35ms; }
        .screen > *:nth-child(3) { animation-delay: 70ms; }
        .screen > *:nth-child(4) { animation-delay: 105ms; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .brand {
          font-family: var(--font-display);
          font-weight: 950;
          letter-spacing: -1px;
          line-height: 1;
          background: linear-gradient(135deg, #e0f2fe, #7dd3fc 45%, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--muted);
        }

        .title-xl {
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 900;
          letter-spacing: -0.8px;
          line-height: 1;
        }

        .title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .label {
          font-size: 11px;
          font-weight: 700;
          color: var(--soft);
        }

        .caption {
          font-size: 11px;
          color: var(--muted);
          line-height: 1.35;
        }

        .body {
          font-size: 13px;
          color: var(--soft);
          line-height: 1.5;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
          overflow: hidden;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.09);
          border: 1.5px solid rgba(255,255,255,0.13);
          box-shadow: 0 0 0 2.5px rgba(96,165,250,0.16);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .badge-row {
          display: flex;
          gap: 7px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.09);
          font-size: 11px;
          font-weight: 700;
          color: var(--soft);
          white-space: nowrap;
        }

        .badge.live {
          color: var(--green);
          background: rgba(52,211,153,0.08);
          border-color: rgba(52,211,153,0.22);
        }

        .connect-zone {
          margin-top: 12px;
        }

        .hero-case {
          min-height: 230px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .case-orb {
          width: 78px;
          height: 78px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 35% 25%, rgba(255,255,255,0.34), transparent 34%),
            linear-gradient(145deg, rgba(96,165,250,0.2), rgba(167,139,250,0.08));
          border: 1px solid rgba(255,255,255,0.13);
          box-shadow: 0 16px 48px rgba(96,165,250,0.16);
        }

        .case-orb svg {
          color: var(--blue);
          filter: drop-shadow(0 0 10px rgba(96,165,250,0.36));
        }

        .open-button {
          width: 100%;
          height: 52px;
          border: 0;
          border-radius: 16px;
          color: #06101d;
          font-size: 14px;
          font-weight: 950;
          font-family: var(--font-display);
          background: linear-gradient(135deg, #dff7ff, #60a5fa 55%, #a78bfa);
          box-shadow:
            0 12px 32px rgba(96,165,250,0.25),
            0 1px 0 rgba(255,255,255,0.35) inset;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .open-button:active {
          transform: scale(0.98);
        }

        .grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .mini-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mini-icon {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.09);
        }

        .case-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }

        .case-row {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.045);
          border-radius: 15px;
          padding: 11px;
          color: inherit;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
        }

        .case-row.active {
          border-color: rgba(96,165,250,0.3);
          background: rgba(96,165,250,0.08);
        }

        .item-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .item-card {
          height: 140px;
          border-radius: 14px;
          background: rgba(255,255,255,0.048);
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .item-preview {
          height: 82px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 50% 30%, rgba(255,255,255,0.09), transparent 58%),
            rgba(255,255,255,0.035);
          color: var(--blue);
        }

        .item-info {
          padding: 7px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .item-name {
          font-size: 10px;
          font-weight: 800;
          color: var(--soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rarity-pill {
          width: fit-content;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
        }

        .empty-state {
          min-height: 160px;
          display: grid;
          place-items: center;
          text-align: center;
          gap: 8px;
          color: var(--muted);
        }

        .market-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .market-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .status-pill {
          font-size: 10px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          color: var(--muted);
        }

        .status-pill.ready {
          color: var(--green);
          background: rgba(52,211,153,0.09);
        }
      `}</style>

      <SnowCanvas />

      <main className="app-content">
        <FrostCard accent={tonAddress ? "#34d399" : "#60a5fa"}>
          <div className="between">
            <div className="row" style={{ minWidth: 0 }}>
              <div className="avatar">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={displayName} />
                ) : (
                  <UserRound size={22} strokeWidth={1.7} />
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="title" style={{ fontSize: 15 }}>
                  {displayName}
                </div>
                <div className="caption">{username}</div>
              </div>
            </div>

            <div className="row" style={{ gap: 5 }}>
              <Snowflake size={14} style={{ color: "var(--blue)" }} />
              <span className="brand" style={{ fontSize: 22 }}>
                FROST
              </span>
            </div>
          </div>

          <div className="badge-row">
            <span className="badge">
              <Trophy size={10} />
              Rank I
            </span>
            <span className={`badge${tonAddress ? " live" : ""}`}>
              <Wallet size={10} />
              {tonAddress ? "Wallet live" : "Wallet offline"}
            </span>
          </div>

          <div className="connect-zone">
            <TonConnectButton />
          </div>
        </FrostCard>

        {activeTab === "open" && (
          <section className="screen">
            <FrostCard accent={selectedCase.accent} className="hero-case">
              <div className="between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="eyebrow">Featured Case</div>
                  <div className="title-xl" style={{ marginTop: 7 }}>
                    {selectedCase.name}
                  </div>
                  <p className="body" style={{ marginTop: 8 }}>
                    {selectedCase.subtitle}
                  </p>
                </div>

                <div className="case-orb">
                  <PackageOpen size={36} />
                </div>
              </div>

              <div>
                <div className="between" style={{ marginBottom: 12 }}>
                  <span className="label">Price</span>
                  <span className="title">{selectedCase.price}</span>
                </div>

                <button className="open-button" onClick={lockedOpen}>
                  OPEN CASE
                </button>

                <p className="caption" style={{ marginTop: 9, textAlign: "center" }}>
                  Locked until backend: payment, provably fair RNG, instant NFT transfer.
                </p>
              </div>
            </FrostCard>

            <FrostCard accent="#60a5fa">
              <div className="between">
                <div>
                  <div className="title">Cases</div>
                  <div className="caption">Choose a drop pool</div>
                </div>
                <Box size={17} style={{ color: "var(--blue)" }} />
              </div>

              <div className="case-list">
                {cases.map((pack) => (
                  <button
                    key={pack.id}
                    className={`case-row${selectedCase.id === pack.id ? " active" : ""}`}
                    onClick={() => {
                      haptic("light");
                      setSelectedCase(pack);
                    }}
                  >
                    <div>
                      <div className="label" style={{ color: "var(--text)" }}>
                        {pack.name}
                      </div>
                      <div className="caption">{pack.subtitle}</div>
                    </div>

                    <div className="row">
                      <span className="status-pill">{pack.status}</span>
                      <ChevronRight size={15} style={{ color: "var(--muted)" }} />
                    </div>
                  </button>
                ))}
              </div>
            </FrostCard>

            <FrostCard accent="#a78bfa">
              <div className="between">
                <div>
                  <div className="title">Drop Preview</div>
                  <div className="caption">Items inside this case</div>
                </div>
                <Sparkles size={16} style={{ color: "var(--purple)" }} />
              </div>

              <div className="item-grid">
                {featuredItems.map((item) => (
                  <div key={item.id} className="item-card">
                    <div className="item-preview">
                      <Shield size={25} />
                    </div>
                    <div className="item-info">
                      <RarityPill rarity={item.rarity} />
                      <span className="item-name">{item.name}</span>
                      <span className="caption">{item.chance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </FrostCard>
          </section>
        )}

        {activeTab === "inventory" && (
          <section className="screen">
            <FrostCard accent="#a78bfa">
              <div className="between">
                <div>
                  <div className="title-xl" style={{ fontSize: 24 }}>
                    Inventory
                  </div>
                  <p className="body" style={{ marginTop: 7 }}>
                    Your opened NFT skins, Telegram gifts, and FROST collectibles will appear here.
                  </p>
                </div>
                <Backpack size={28} style={{ color: "var(--purple)" }} />
              </div>
            </FrostCard>

            <FrostCard accent="#a78bfa">
              <div className="empty-state">
                <Lock size={28} />
                <div>
                  <div className="title">No items yet</div>
                  <div className="caption" style={{ marginTop: 5 }}>
                    Openings must transfer real NFTs before inventory activates.
                  </div>
                </div>
              </div>
            </FrostCard>
          </section>
        )}

        {activeTab === "market" && (
          <section className="screen">
            <FrostCard accent="#34d399">
              <div className="between">
                <div>
                  <div className="title-xl" style={{ fontSize: 24 }}>
                    Market
                  </div>
                  <p className="body" style={{ marginTop: 7 }}>
                    Listings, trading, and gift liquidity. Built after inventory + transfers work.
                  </p>
                </div>
                <Store size={28} style={{ color: "var(--green)" }} />
              </div>
            </FrostCard>

            <FrostCard accent="#34d399">
              {["User listings", "Instant buy", "Trade offers", "Floor tracking"].map((row) => (
                <div className="market-row" key={row}>
                  <span className="label">{row}</span>
                  <span className="status-pill">Soon</span>
                </div>
              ))}
            </FrostCard>
          </section>
        )}

        {activeTab === "lab" && (
          <section className="screen">
            <FrostCard accent="#fb923c">
              <div className="between">
                <div>
                  <div className="eyebrow">Experimental drops</div>
                  <div className="title-xl" style={{ marginTop: 7 }}>
                    LAB
                  </div>
                  <p className="body" style={{ marginTop: 8 }}>
                    Seasonal cases, limited skins, rarity tests, and FROST-native collections.
                  </p>
                </div>
                <FlaskConical size={34} style={{ color: "var(--orange)" }} />
              </div>
            </FrostCard>

            <div className="grid-two">
              <FrostCard accent="#fb923c" className="mini-card">
                <div className="mini-icon" style={{ color: "var(--orange)" }}>
                  <Gift size={15} />
                </div>
                <span className="label">Gift cases</span>
                <span className="title" style={{ fontSize: 13 }}>
                  Planned
                </span>
              </FrostCard>

              <FrostCard accent="#f472b6" className="mini-card">
                <div className="mini-icon" style={{ color: "var(--pink)" }}>
                  <Crown size={15} />
                </div>
                <span className="label">Mythics</span>
                <span className="title" style={{ fontSize: 13 }}>
                  Limited
                </span>
              </FrostCard>
            </div>

            <FrostCard accent="#fb923c">
              {[
                "AK-47 | Frostbite",
                "Karambit | Glacier",
                "Telegram Gift Case",
                "Provably Fair verifier",
              ].map((row, index) => (
                <div className="market-row" key={row}>
                  <span className="label">{row}</span>
                  <span className={`status-pill${index === 0 ? " ready" : ""}`}>
                    {index === 0 ? "Ready art" : "Next"}
                  </span>
                </div>
              ))}
            </FrostCard>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="screen">
            <FrostCard accent="#f472b6">
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="avatar">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt={displayName} />
                  ) : (
                    <UserRound size={22} strokeWidth={1.7} />
                  )}
                </div>

                <div>
                  <div className="title">{displayName}</div>
                  <div className="caption">{username}</div>
                </div>
              </div>

              {[
                ["Wallet", tonAddress ? shortenAddress(tonAddress) : "Not connected"],
                ["FROST Rank", "Rank I"],
                ["Inventory", "0 items"],
                ["Openings", "0"],
              ].map(([label, value]) => (
                <div className="market-row" key={label}>
                  <span className="caption">{label}</span>
                  <span className="label">{value}</span>
                </div>
              ))}
            </FrostCard>
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
