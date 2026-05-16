import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  BadgeCheck,
  Bell,
  Copy,
  Gem,
  Radar,
  Shield,
  Sparkles,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";
import FrostCard from "./components/FrostCard";

declare global {
  interface Window {
    Telegram?: any;
  }
}

type Tab = "home" | "vault" | "drops" | "track" | "profile";

function shortAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-5)}`;
}

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
  const displayName = user?.first_name || "Frost User";
  const username = user?.username ? `@${user.username}` : "@telegram_user";
  const photoUrl = user?.photo_url;

  return (
    <div className="app-shell">
      <SnowCanvas />

      <main className="app-content">
        <section className="topbar">
          <div>
            <p className="eyebrow">FROSTLAB</p>
            <h1>Frozen TON Hub</h1>
          </div>

          <button className="icon-button" type="button">
            <Bell size={20} />
          </button>
        </section>

        <section className="profile-card">
          <div className="profile-main">
            <div className="avatar">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} />
              ) : (
                <User size={28} />
              )}
            </div>

            <div className="profile-text">
              <h2>{displayName}</h2>
              <p>{username}</p>
            </div>
          </div>

          <div className="profile-badges">
            <span>
              <BadgeCheck size={14} />
              Glacier I
            </span>

            <span className={tonAddress ? "live" : ""}>
              <Wallet size={14} />
              {tonAddress ? "Wallet Live" : "No Wallet"}
            </span>
          </div>

          <div className="xp-block">
            <div className="xp-label">
              <span>Frost XP</span>
              <strong>120 / 500</strong>
            </div>
            <div className="xp-track">
              <div className="xp-fill" />
            </div>
          </div>
        </section>

        <section className="wallet-strip">
          <div>
            <p>TON Wallet</p>
            <strong>{tonAddress ? shortAddress(tonAddress) : "Connect to sync vault"}</strong>
          </div>

          {tonAddress ? (
            <button className="copy-button" type="button">
              <Copy size={17} />
            </button>
          ) : (
            <TonConnectButton />
          )}
        </section>

        {activeTab === "home" && (
          <div className="screen">
            <div className="quick-grid">
              <button className="quick-card" type="button" onClick={() => setActiveTab("vault")}>
                <Shield size={21} />
                <strong>Vault</strong>
                <span>Owned assets</span>
              </button>

              <button className="quick-card" type="button" onClick={() => setActiveTab("drops")}>
                <Gem size={21} />
                <strong>Drops</strong>
                <span>Live mints</span>
              </button>

              <button className="quick-card" type="button" onClick={() => setActiveTab("track")}>
                <Radar size={21} />
                <strong>Track</strong>
                <span>TON activity</span>
              </button>

              <button className="quick-card" type="button" onClick={() => setActiveTab("profile")}>
                <Sparkles size={21} />
                <strong>Rank</strong>
                <span>Progression</span>
              </button>
            </div>

            <FrostCard title="Command Center">
              <div className="metric-row">
                <div>
                  <strong>{tonAddress ? "Synced" : "Offline"}</strong>
                  <span>Wallet State</span>
                </div>

                <div>
                  <strong>0</strong>
                  <span>Vault Items</span>
                </div>

                <div>
                  <strong>0</strong>
                  <span>Active Drops</span>
                </div>
              </div>
            </FrostCard>

            <FrostCard title="Daily Frost">
              <div className="mission-line">
                <Zap size={18} />
                <div>
                  <strong>Connect wallet</strong>
                  <span>Unlock vault sync and TON tracking.</span>
                </div>
              </div>
            </FrostCard>
          </div>
        )}

        {activeTab === "vault" && (
          <div className="screen">
            <FrostCard title="NFT Vault">
              <p className="muted">
                {tonAddress
                  ? "Wallet connected. Next step: load real NFTs from TONAPI."
                  : "Connect your TON wallet to reveal your frozen collection."}
              </p>
            </FrostCard>
          </div>
        )}

        {activeTab === "drops" && (
          <div className="screen">
            <FrostCard title="Drops">
              <p className="muted">
                No live drops yet. Soon this loads from Supabase.
              </p>
            </FrostCard>
          </div>
        )}

        {activeTab === "track" && (
          <div className="screen">
            <FrostCard title="TON Tracking">
              <p className="muted">
                Track wallet movement, collectibles, creator drops, and ecosystem events.
              </p>
            </FrostCard>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="screen">
            <FrostCard title="Profile">
              <div className="profile-detail">
                <span>Name</span>
                <strong>{displayName}</strong>
              </div>

              <div className="profile-detail">
                <span>Username</span>
                <strong>{username}</strong>
              </div>

              <div className="profile-detail">
                <span>Wallet</span>
                <strong>{tonAddress ? shortAddress(tonAddress) : "Not connected"}</strong>
              </div>
            </FrostCard>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
