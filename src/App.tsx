import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";
import FrostCard from "./components/FrostCard";

declare global {
  interface Window {
    Telegram?: any;
  }
}

type Tab = "home" | "vault" | "drops" | "track" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
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

  return (
    <div className="app-shell">
      <SnowCanvas />

      <main className="app-content">
        <header className="hero">
          <div>
            <p className="eyebrow">TON ECOSYSTEM HUB</p>
            <h1>FrostLab</h1>
            <p className="subtitle">
              Icy vault for TON, Telegram collectibles, stickers, drops and tracking.
            </p>
          </div>

          <div className="ton-connect-wrap">
            <TonConnectButton />
          </div>
        </header>

        {activeTab === "home" && (
          <div className="screen">
            <FrostCard title="Frozen Command Center">
              <p>
                {user
                  ? `Welcome, ${user.first_name}.`
                  : "Open inside Telegram for identity sync."}
              </p>

              <div className="stat-grid">
                <div>
                  <strong>{tonAddress ? "Connected" : "Offline"}</strong>
                  <span>Wallet</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>Active Drops</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>Vault Items</span>
                </div>
              </div>
            </FrostCard>

            <FrostCard title="Daily Frost">
              <p>No missions yet. Next: connect Supabase and real tracking.</p>
            </FrostCard>
          </div>
        )}

        {activeTab === "vault" && (
          <div className="screen">
            <FrostCard title="NFT Vault">
              <p>
                {tonAddress
                  ? "Wallet connected. Next step: fetch real NFTs with TONAPI."
                  : "Connect TON wallet to view collectibles."}
              </p>
            </FrostCard>
          </div>
        )}

        {activeTab === "drops" && (
          <div className="screen">
            <FrostCard title="Drops">
              <p>No live drops yet. This will load from Supabase.</p>
            </FrostCard>
          </div>
        )}

        {activeTab === "track" && (
          <div className="screen">
            <FrostCard title="TON Tracking">
              <p>Track wallet activity, collections, drops and ecosystem events.</p>
            </FrostCard>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="screen">
            <FrostCard title="Telegram Profile">
              {user ? (
                <>
                  <p>{user.first_name}</p>
                  <p>@{user.username || "no_username"}</p>
                </>
              ) : (
                <p>No Telegram user detected.</p>
              )}

              <p className="wallet-text">
                {tonAddress ? tonAddress : "No wallet connected"}
              </p>
            </FrostCard>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
