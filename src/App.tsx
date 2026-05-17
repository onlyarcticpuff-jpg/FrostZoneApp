import { useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  ChevronRight,
  Gift,
  Search,
  Sparkles,
} from "lucide-react";

import BottomNav from "./components/BottomNav";

import TonIcon from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";

import FrostbiteCase from "./assets/frostbite.png";
import EmberCase from "./assets/ember.png";

type Tab = "home" | "inventory" | "cases" | "profile";

type CaseType = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  price: string;
  currency: "TON" | "STARS";
  glow: string;
};

const cases: CaseType[] = [
  {
    id: "frostbite",
    name: "Frostbite Case",
    subtitle: "Frozen Arsenal Collection",
    image: FrostbiteCase,
    price: "12",
    currency: "TON",
    glow: "rgba(72,157,255,0.35)",
  },
  {
    id: "ember",
    name: "Ember Case",
    subtitle: "Molten Collection",
    image: EmberCase,
    price: "350",
    currency: "STARS",
    glow: "rgba(255,132,0,0.35)",
  },
];

export default function App() {
  const tonAddress = useTonAddress();

  const [activeTab, setActiveTab] = useState<Tab>("home");

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          margin: 0;
          background: #090909;
          color: white;
          font-family: Inter, system-ui, sans-serif;
        }

        .app {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(58,58,58,0.18), transparent 30%),
            #090909;
        }

        .container {
          max-width: 430px;
          margin: 0 auto;
          padding: 18px 14px 130px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .brand {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -1.7px;
        }

        .balance-row {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
        }

        .pill {
          height: 44px;
          padding: 0 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #151515;
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 4px 20px rgba(0,0,0,0.28);
        }

        .pill img {
          width: 16px;
          height: 16px;
        }

        .stars-icon {
          filter:
            brightness(0)
            saturate(100%)
            invert(79%)
            sepia(96%)
            saturate(649%)
            hue-rotate(355deg)
            brightness(101%)
            contrast(105%);
        }

        .hero {
          height: 132px;
          border-radius: 28px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          margin-bottom: 20px;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 30%),
            linear-gradient(135deg,#1677ff,#2343d8);
          box-shadow: 0 12px 40px rgba(0,0,0,0.32);
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, transparent, rgba(255,255,255,0.04));
        }

        .hero-title {
          position: relative;
          z-index: 1;
          font-size: 44px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .hero-sub {
          position: relative;
          z-index: 1;
          margin-top: 6px;
          width: fit-content;
          padding: 7px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          backdrop-filter: blur(14px);
          font-size: 14px;
          font-weight: 700;
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .search {
          height: 50px;
          border-radius: 999px;
          background: #151515;
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 18px;
          font-weight: 700;
        }

        .cases {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .case-card {
          background: #131313;
          border-radius: 28px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.28);
        }

        .case-glow {
          position: absolute;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          top: -40px;
          right: -40px;
          filter: blur(50px);
          opacity: 0.8;
        }

        .case-top {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .case-image {
          width: 92px;
          height: 92px;
          object-fit: contain;
          border-radius: 24px;
          background: rgba(255,255,255,0.03);
          padding: 10px;
        }

        .case-name {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.8px;
        }

        .case-sub {
          margin-top: 4px;
          color: rgba(255,255,255,0.48);
          font-size: 13px;
          line-height: 1.3;
        }

        .price-row {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .price-pill {
          height: 44px;
          padding: 0 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          font-size: 14px;
          font-weight: 900;
        }

        .price-pill img {
          width: 14px;
          height: 14px;
        }

        .open-btn {
          flex: 1;
          height: 48px;
          border-radius: 999px;
          border: 0;
          background: white;
          color: black;
          font-size: 14px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .placeholder {
          margin-top: 20px;
          border-radius: 24px;
          padding: 22px;
          background: #131313;
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          color: rgba(255,255,255,0.55);
        }
      `}</style>

      <div className="container">
        <div className="topbar">
          <div className="brand">OPENCASE</div>

          <TonConnectButton />
        </div>

        <div className="balance-row">
          <div className="pill">
            <img
              src={StarsIcon}
              className="stars-icon"
            />
            0
          </div>

          <div className="pill">
            <img src={TonIcon} />

            {tonAddress ? "0 TON" : "-- TON"}
          </div>
        </div>

        <div className="hero">
          <div className="hero-title">OPENCASE</div>

          <div className="hero-sub">
            Telegram Case Openings
          </div>
        </div>

        {activeTab === "home" && (
          <>
            <div className="section-title">
              <div className="title">
                Cases
              </div>

              <Sparkles size={22} />
            </div>

            <div className="search">
              <Search size={18} />
              Quick find
            </div>

            <div className="cases">
              {cases.map((item) => (
                <div
                  key={item.id}
                  className="case-card"
                >
                  <div
                    className="case-glow"
                    style={{
                      background: item.glow,
                    }}
                  />

                  <div className="case-top">
                    <img
                      src={item.image}
                      className="case-image"
                    />

                    <div>
                      <div className="case-name">
                        {item.name}
                      </div>

                      <div className="case-sub">
                        {item.subtitle}
                      </div>

                      <div className="price-row">
                        <div className="price-pill">
                          {item.currency === "TON" ? (
                            <img src={TonIcon} />
                          ) : (
                            <img
                              src={StarsIcon}
                              className="stars-icon"
                            />
                          )}

                          {item.price}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="price-row">
                    <button className="open-btn">
                      OPEN CASE

                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab !== "home" && (
          <div className="placeholder">
            <Gift size={30} />

            <div
              style={{
                marginTop: 12,
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              Coming Soon
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 14,
              }}
            >
              This section will be implemented later.
            </div>
          </div>
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
