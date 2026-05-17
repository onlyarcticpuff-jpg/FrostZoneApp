import { useEffect, useMemo, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  Backpack,
  Box,
  ChevronRight,
  Crown,
  Gift,
  PackageOpen,
  Shield,
  Sparkles,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";

import { createClient } from "@supabase/supabase-js";

import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";

import TonIcon from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";

declare global {
  interface Window {
    Telegram?: any;
  }
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Tab = "open" | "inventory" | "market" | "profile";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

type CaseItem = {
  id: string;
  name: string;
  rarity: Rarity;
  chance: string;
};

type CasePack = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  currency: "TON" | "STARS";
  accent: string;
  items: CaseItem[];
};

const rarityColor: Record<Rarity, string> = {
  Common: "#a1a1aa",
  Rare: "#60a5fa",
  Epic: "#a78bfa",
  Legendary: "#fb923c",
  Mythic: "#f472b6",
};

const cases: CasePack[] = [
  {
    id: "frostbite",
    name: "Frostbite Case",
    subtitle: "Frozen Arsenal Collection",
    price: "12",
    currency: "TON",
    accent: "#60a5fa",
    items: [
      {
        id: "ak",
        name: "AK-47 | Frostbite",
        rarity: "Legendary",
        chance: "1.2%",
      },
      {
        id: "karambit",
        name: "Karambit | Glacier",
        rarity: "Mythic",
        chance: "0.2%",
      },
      {
        id: "ice-smg",
        name: "Ice SMG",
        rarity: "Epic",
        chance: "6%",
      },
    ],
  },
  {
    id: "ember",
    name: "Ember Case",
    subtitle: "Molten Collection",
    price: "350",
    currency: "STARS",
    accent: "#fb923c",
    items: [
      {
        id: "deagle",
        name: "Deagle | Inferno",
        rarity: "Legendary",
        chance: "1%",
      },
      {
        id: "knife",
        name: "Molten Blade",
        rarity: "Mythic",
        chance: "0.15%",
      },
      {
        id: "revolver",
        name: "Blaze Revolver",
        rarity: "Epic",
        chance: "5%",
      },
    ],
  },
];

export default function App() {
  const tonAddress = useTonAddress();

  const [activeTab, setActiveTab] = useState<Tab>("open");
  const [selectedCase, setSelectedCase] = useState<CasePack>(cases[0]);
  const [inventoryCount, setInventoryCount] = useState(0);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      tg.setBackgroundColor("#050816");
      tg.setHeaderColor("#050816");
    }

    loadInventory();
  }, []);

  async function loadInventory() {
    const { data } = await supabase
      .from("inventory")
      .select("*");

    if (data) {
      setInventoryCount(data.length);
    }
  }

  const featuredItems = useMemo(() => {
    return selectedCase.items;
  }, [selectedCase]);

  function handleOpenCase() {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");

    window.Telegram?.WebApp?.showAlert?.(
      "Backend opening logic not connected yet. Next step: Supabase openings + TON NFT transfer."
    );
  }

  return (
    <div className="app-shell">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050816;
        }

        :root {
          --bg: #050816;
          --card: rgba(255,255,255,0.06);
          --border: rgba(255,255,255,0.08);
          --text: rgba(255,255,255,0.95);
          --soft: rgba(255,255,255,0.55);
          --muted: rgba(255,255,255,0.3);
        }

        .app-shell {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
          position: relative;
          font-family: Inter, system-ui, sans-serif;
        }

        .content {
          position: relative;
          z-index: 2;
          max-width: 430px;
          margin: 0 auto;
          padding: 14px 14px 110px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .glass {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 16px;
          backdrop-filter: blur(18px);
          box-shadow:
            0 8px 30px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .muted {
          color: var(--soft);
          font-size: 12px;
        }

        .balance-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }

        .balance-card {
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .balance-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .balance-top img {
          width: 18px;
          height: 18px;
        }

        .balance-value {
          font-size: 20px;
          font-weight: 800;
          margin-top: 10px;
        }

        .hero {
          padding: 20px;
          border-radius: 24px;
          background:
            radial-gradient(circle at top left, rgba(96,165,250,0.22), transparent 40%),
            rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .case-orb {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .open-button {
          width: 100%;
          height: 54px;
          border: 0;
          border-radius: 18px;
          margin-top: 20px;
          background: linear-gradient(135deg,#dbeafe,#60a5fa,#a78bfa);
          color: #04101c;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .case-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .case-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
        }

        .case-row.active {
          border-color: rgba(96,165,250,0.3);
          background: rgba(96,165,250,0.08);
        }

        .item-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .item-card {
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .item-preview {
          height: 90px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.03);
        }

        .item-info {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .rarity {
          width: fit-content;
          font-size: 9px;
          font-weight: 900;
          padding: 3px 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
        }

        .item-name {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
        }

        .inventory-empty {
          height: 160px;
          display: grid;
          place-items: center;
          text-align: center;
          color: var(--soft);
        }
      `}</style>

      <SnowCanvas />

      <main className="content">
        <div className="glass">
          <div className="topbar">
            <div>
              <div className="brand">OPENCASE</div>
              <div className="muted">
                Telegram collectible opening platform
              </div>
            </div>

            <TonConnectButton />
          </div>

          <div className="balance-row">
            <div className="balance-card">
              <div className="balance-top">
                <img src={TonIcon} alt="TON" />
                <span className="muted">TON Balance</span>
              </div>

              <div className="balance-value">
                {tonAddress ? "Connected" : "--"}
              </div>
            </div>

            <div className="balance-card">
              <div className="balance-top">
                <img src={StarsIcon} alt="Stars" />
                <span className="muted">Stars</span>
              </div>

              <div className="balance-value">Soon</div>
            </div>
          </div>
        </div>

        {activeTab === "open" && (
          <>
            <div className="hero">
              <div className="hero-top">
                <div>
                  <div className="muted">Featured Case</div>

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      marginTop: 6,
                    }}
                  >
                    {selectedCase.name}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    {selectedCase.subtitle}
                  </div>
                </div>

                <div className="case-orb">
                  <PackageOpen size={34} />
                </div>
              </div>

              <button
                className="open-button"
                onClick={handleOpenCase}
              >
                OPEN CASE
              </button>
            </div>

            <div className="glass">
              <div className="section-title">
                <div>
                  <div style={{ fontWeight: 800 }}>
                    Cases
                  </div>

                  <div className="muted">
                    Expandable menu architecture
                  </div>
                </div>

                <Box size={18} />
              </div>

              <div className="case-list">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className={`case-row ${selectedCase.id === c.id ? "active" : ""}`}
                    onClick={() => setSelectedCase(c)}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {c.name}
                      </div>

                      <div className="muted">
                        {c.subtitle}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div className="muted">
                        {c.price} {c.currency}
                      </div>

                      <ChevronRight size={15} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass">
              <div className="section-title">
                <div>
                  <div style={{ fontWeight: 800 }}>
                    Drop Preview
                  </div>

                  <div className="muted">
                    Possible rewards
                  </div>
                </div>

                <Sparkles size={18} />
              </div>

              <div className="item-grid">
                {featuredItems.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                  >
                    <div className="item-preview">
                      <Shield size={26} />
                    </div>

                    <div className="item-info">
                      <div
                        className="rarity"
                        style={{
                          color: rarityColor[item.rarity],
                        }}
                      >
                        {item.rarity}
                      </div>

                      <div className="item-name">
                        {item.name}
                      </div>

                      <div className="muted">
                        {item.chance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "inventory" && (
          <div className="glass">
            <div className="section-title">
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>
                  Inventory
                </div>

                <div className="muted">
                  Real Supabase inventory system
                </div>
              </div>

              <Backpack size={24} />
            </div>

            {inventoryCount === 0 ? (
              <div className="inventory-empty">
                <div>
                  <Gift size={30} />

                  <div
                    style={{
                      marginTop: 10,
                      fontWeight: 700,
                    }}
                  >
                    No collectibles yet
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {inventoryCount} items owned
              </div>
            )}
          </div>
        )}

        {activeTab === "market" && (
          <div className="glass">
            <div className="section-title">
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>
                  Market
                </div>

                <div className="muted">
                  Trading + listings later
                </div>
              </div>

              <Store size={24} />
            </div>

            <div className="case-list">
              <div className="case-row">
                <div>
                  <div style={{ fontWeight: 700 }}>
                    User Listings
                  </div>

                  <div className="muted">
                    Coming later
                  </div>
                </div>

                <Crown size={18} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="glass">
            <div className="section-title">
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>
                  Profile
                </div>

                <div className="muted">
                  Showcase inventory + stats
                </div>
              </div>

              <UserRound size={24} />
            </div>

            <div className="case-list">
              <div className="case-row">
                <div>
                  <div style={{ fontWeight: 700 }}>
                    Wallet
                  </div>

                  <div className="muted">
                    {tonAddress || "Not connected"}
                  </div>
                </div>

                <Wallet size={18} />
              </div>

              <div className="case-row">
                <div>
                  <div style={{ fontWeight: 700 }}>
                    Total Openings
                  </div>

                  <div className="muted">
                    Will connect to Supabase openings table
                  </div>
                </div>

                <PackageOpen size={18} />
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
