import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  BadgeCheck,
  Bell,
  Gem,
  Radar,
  Shield,
  Snowflake,
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
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
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
        <section className="top-bar">
          <div className="brand-mark">
            <Snowflake size={19} />
          </div>

          <div>
            <p className="brand-label">FROSTLAB</p>
            <h1>Command Center</h1>
          </div>

          <button className="icon-button" type="button">
            <Bell size={18} />
          </button>
        </section>

        <section className="profile-card">
          <div className="profile-row">
            <div className="avatar">
              {photoUrl ? <img src={photoUrl} alt={displayName} /> : <User size={26} />}
            </div>

            <div className="profile-info">
              <div className="name-row">
                <h2>{displayName}</h2>
                <BadgeCheck size={17} />
              </div>
              <p>{username}</p>
            </div>
          </div>

          <div className="profile-meta">
            <span>
              <Shield size={14} />
              Glacier I
            </span>

            <span className={tonAddress ? "connected" : ""}>
              <Wallet size={14} />
              {tonAddress ? "Wallet linked" : "No wallet"}
            </span>
          </div>

          <div className="xp-block">
            <div className="xp-top">
              <span>Frost XP</span>
              <strong>120 / 500</strong>
            </div>
            <div className="xp-track">
              <div className="xp-fill" />
            </div>
          </div>
        </section>

        <section className="wallet-card">
          <div>
            <p className="section-kicker">TON CONNECT</p>
            <h3>{tonAddress ? "Wallet active" : "Connect wallet"}</h3>
            <p>{tonAddress ? shortAddress(tonAddress) : "Unlock vault, drops and tracking."}</p>
          </div>

          <div className="ton-connect-wrap">
            <TonConnectButton />
          </div>
        </section>

        {activeTab === "home" && (
          <div className="screen">
            <div className="quick-grid">
              <button className="quick-card" type="button" onClick={() => setActiveTab("vault")}>
                <Shield size={22} />
                <span>Vault</span>
              </button>

              <button className="quick-card" type="button" onClick={() => setActiveTab("drops")}>
                <Gem size={22} />
                <span>Drops</span>
              </button>

              <button className="quick-card" type="button" onClick={() => setActiveTab("track")}>
                <Radar size={22} />
                <span>Track</span>
              </button>

              <button className="quick-card" type="button" onClick={() => setActiveTab("profile")}>
                <Sparkles size={22} />
                <span>Profile</span>
              </button>
            </div>

            <FrostCard title="Frozen Overview">
              <div className="stat-grid">
                <div>
                  <strong>0</strong>
                  <span>Vault Items</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>Active Drops</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>Tracked</span>
                </div>
              </div>
            </FrostCard>

            <FrostCard title="Daily Frost">
              <div className="mission-row">
                <div className="mission-icon">
                  <Zap size={18} />
                </div>
                <div>
                  <strong>Connect wallet</strong>
                  <p>First mission starts with linking your TON wallet.</p>
                </div>
              </div>
            </FrostCard>
          </div>
        )}

        {activeTab === "vault" && (
          <div className="screen">
            <FrostCard title="NFT Vault">
              <p>
                {tonAddress
                  ? "Wallet connected. Next upgrade: fetch real NFTs with TONAPI."
                  : "Connect your TON wallet to reveal vault items."}
              </p>
            </FrostCard>
          </div>
        )}

        {activeTab === "drops" && (
          <div className="screen">
            <FrostCard title="Drops">
              <p>No live drops yet. Next upgrade: Supabase drop database.</p>
            </FrostCard>
          </div>
        )}

        {activeTab === "track" && (
          <div className="screen">
            <FrostCard title="TON Tracking">
              <p>Track wallets, drops, collections and activity across the TON ecosystem.</p>
            </FrostCard>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="screen">
            <FrostCard title="Profile">
              <p>{displayName}</p>
              <p>{username}</p>
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
