import { useMemo, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  ChevronDown,
  Gift,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import BottomNav from "./components/BottomNav";

import TonIcon from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";

type Tab = "store" | "inventory" | "market" | "profile";

type Item = {
  id: string;
  name: string;
  number: string;
  price: string;
  currency: "TON" | "STARS";
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  bg: string;
};

const items: Item[] = [
  {
    id: "1",
    name: "AK-47 | Frostbite",
    number: "#2383",
    price: "2.38",
    currency: "TON",
    rarity: "Legendary",
    bg: "linear-gradient(180deg,#8bd2ff,#5ba8ff)",
  },
  {
    id: "2",
    name: "Karambit | Glacier",
    number: "#981",
    price: "7.12",
    currency: "TON",
    rarity: "Mythic",
    bg: "linear-gradient(180deg,#9de7ff,#7a6cff)",
  },
  {
    id: "3",
    name: "Deagle | Inferno",
    number: "#1288",
    price: "5.14",
    currency: "TON",
    rarity: "Legendary",
    bg: "linear-gradient(180deg,#ffbd73,#ff6f3d)",
  },
  {
    id: "4",
    name: "Molten Blade",
    number: "#421",
    price: "320",
    currency: "STARS",
    rarity: "Epic",
    bg: "linear-gradient(180deg,#ffcf7d,#ff8b42)",
  },
];

const rarityGlow = {
  Common: "#777",
  Rare: "#5ba8ff",
  Epic: "#8d6cff",
  Legendary: "#ff9d4d",
  Mythic: "#ff4df0",
};

export default function App() {
  const tonAddress = useTonAddress();

  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [selectedCase, setSelectedCase] = useState("Frostbite");

  const filteredItems = useMemo(() => {
    if (selectedCase === "All") return items;

    if (selectedCase === "Frostbite") {
      return items.filter((x) =>
        x.name.includes("Frost") || x.name.includes("Glacier")
      );
    }

    return items.filter((x) =>
      x.name.includes("Inferno") || x.name.includes("Molten")
    );
  }, [selectedCase]);

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          margin: 0;
          background: #050505;
          color: white;
          font-family: Inter, system-ui, sans-serif;
        }

        .app {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(60,60,60,0.18), transparent 30%),
            #050505;
        }

        .container {
          max-width: 430px;
          margin: 0 auto;
          padding: 18px 14px 120px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .brand {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -1.6px;
        }

        .balance-row {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
        }

        .balance-pill {
          height: 42px;
          padding: 0 14px;
          border-radius: 999px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 14px;
        }

        .balance-pill img {
          width: 16px;
          height: 16px;
        }

        .banner {
          width: 100%;
          height: 120px;
          border-radius: 26px;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 30%),
            linear-gradient(135deg,#0077ff,#1e40af);
          position: relative;
          overflow: hidden;
          padding: 20px;
          margin-bottom: 20px;
        }

        .banner::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, transparent, rgba(255,255,255,0.04));
        }

        .banner-title {
          position: relative;
          z-index: 1;
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .banner-sub {
          position: relative;
          z-index: 1;
          margin-top: 4px;
          width: fit-content;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          backdrop-filter: blur(10px);
          font-size: 14px;
          font-weight: 700;
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.8px;
        }

        .tabs {
          display: flex;
          gap: 18px;
          margin-bottom: 18px;
        }

        .tab {
          font-size: 17px;
          font-weight: 800;
          color: rgba(255,255,255,0.35);
        }

        .tab.active {
          color: white;
        }

        .search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }

        .search {
          flex: 1;
          height: 48px;
          border-radius: 999px;
          background: #101010;
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          color: rgba(255,255,255,0.45);
          font-weight: 600;
        }

        .circle-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #101010;
          border: 1px solid rgba(255,255,255,0.06);
          display: grid;
          place-items: center;
          color: rgba(255,255,255,0.75);
        }

        .filter-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 18px;
        }

        .filter-row::-webkit-scrollbar {
          display: none;
        }

        .filter-pill {
          white-space: nowrap;
          height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          background: #101010;
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .filter-pill.active {
          background: white;
          color: black;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .card {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 28px;
          overflow: hidden;
          position: relative;
        }

        .preview {
          height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .preview::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.2), transparent 35%);
        }

        .weapon {
          width: 130px;
          height: 130px;
          border-radius: 24px;
          background: rgba(255,255,255,0.14);
          backdrop-filter: blur(10px);
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
          padding: 12px;
          box-shadow: 0 0 24px rgba(255,255,255,0.08);
        }

        .card-info {
          padding: 14px;
        }

        .item-name {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.2;
        }

        .item-number {
          margin-top: 3px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }

        .price-row {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .price-pill {
          flex: 1;
          height: 42px;
          border-radius: 999px;
          background: #1683ff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 15px;
          font-weight: 900;
        }

        .price-pill img {
          width: 14px;
          height: 14px;
        }

        .buy-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.05);
          display: grid;
          place-items: center;
        }

        .rarity-dot {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${rarityGlow.Legendary};
          box-shadow: 0 0 18px currentColor;
        }
      `}</style>

      <div className="container">
        <div className="topbar">
          <div className="brand">OPENCASE</div>

          <TonConnectButton />
        </div>

        <div className="balance-row">
          <div className="balance-pill">
            <img src={StarsIcon} />
            0
          </div>

          <div className="balance-pill">
            <img src={TonIcon} />
            {tonAddress ? "0 TON" : "-- TON"}
          </div>
        </div>

        <div className="banner">
          <div className="banner-title">OPENCASE</div>
          <div className="banner-sub">
            Telegram Collectibles
          </div>
        </div>

        <div className="tabs">
          <div className="tab active">All items</div>
          <div className="tab">Collections</div>
        </div>

        <div className="search-row">
          <div className="search">
            <Search size={18} />
            Quick find
          </div>

          <div className="circle-btn">
            <SlidersHorizontal size={18} />
          </div>
        </div>

        <div className="filter-row">
          {["All", "Frostbite", "Ember"].map((x) => (
            <div
              key={x}
              className={`filter-pill ${selectedCase === x ? "active" : ""}`}
              onClick={() => setSelectedCase(x)}
            >
              {x}
              <ChevronDown size={14} />
            </div>
          ))}
        </div>

        <div className="grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card"
            >
              <div
                className="preview"
                style={{
                  background: item.bg,
                }}
              >
                <div
                  className="rarity-dot"
                  style={{
                    color: rarityGlow[item.rarity],
                    background: rarityGlow[item.rarity],
                  }}
                />

                <div className="weapon">
                  {item.name}
                </div>
              </div>

              <div className="card-info">
                <div className="item-name">
                  {item.name}
                </div>

                <div className="item-number">
                  {item.number}
                </div>

                <div className="price-row">
                  <div className="price-pill">
                    {item.currency === "TON" ? (
                      <img src={TonIcon} />
                    ) : (
                      <img src={StarsIcon} />
                    )}

                    {item.price}
                  </div>

                  <div className="buy-btn">
                    <Gift size={17} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
