import { useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  Wallet,
  Gem,
  Radar,
  Shield,
  Sparkles,
  Snowflake,
  UserRound,
} from "lucide-react";

import SnowCanvas from "./components/SnowCanvas";
import BottomNav from "./components/BottomNav";

declare global {
  interface Window {
    Telegram?: any;
  }
}

type Tab = "home" | "vault" | "drops" | "track" | "profile";

function shortenAddress(address: string) {
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

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
      : "Frost User";

  const username = user?.username ? `@${user.username}` : "@telegram";

  return (
    <div className="app-shell">
      <SnowCanvas />

      <main className="app-content">
        <section className="top-card">
          <div className="profile-row">
            <div className="avatar-wrap">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={displayName} />
              ) : (
                <UserRound size={30} />
              )}
            </div>

            <div className="profile-copy">
              <h1>{displayName}</h1>
              <p>{username}</p>
            </div>
          </div>

          <div className="top-meta">
            <span>
              <Snowflake size={14} />
              Frost Rank I
            </span>
            <span className={tonAddress ? "live" : ""}>
              <Wallet size={14} />
              {tonAddress ? "Wallet online" : "Wallet offline"}
            </span>
          </div>

          <div className="connect-zone">
            <TonConnectButton />
          </div>
        </section>

        {activeTab === "home" && (
          <section className="screen">
            <div className="hero-card">
              <div>
                <p className="eyebrow">TON ECOSYSTEM HUB</p>
                <h2>FrostLab</h2>
                <p>
                  Icy command center for TON wallets, drops, vault items,
                  tracking, and Telegram-native collectibles.
                </p>
              </div>

              <div className="hero-orb">
                <Sparkles size={28} />
              </div>
            </div>

            <div className="grid-two">
              <div className="mini-card">
                <Wallet size={20} />
                <strong>{tonAddress ? "Connected" : "Offline"}</strong>
                <span>{tonAddress ? shortenAddress(tonAddress) : "TON Wallet"}</span>
              </div>

              <div className="mini-card">
                <Shield size={20} />
                <strong>Vault</strong>
                <span>No items yet</span>
              </div>
            </div>

            <div className="section-card">
              <div className="card-title">
                <Gem size={18} />
                <h3>Active Drops</h3>
              </div>
              <p>No live drops yet. Supabase drops will appear here.</p>
            </div>
          </section>
        )}

        {activeTab === "vault" && (
          <section className="screen">
            <div className="section-card large">
              <div className="card-title">
                <Shield size={18} />
                <h3>NFT Vault</h3>
              </div>
              <p>
                {tonAddress
                  ? "Wallet connected. Next step: load owned TON collectibles."
                  : "Connect your TON wallet to unlock your vault."}
              </p>
            </div>
          </section>
        )}

        {activeTab === "drops" && (
          <section className="screen">
            <div className="section-card large">
              <div className="card-title">
                <Gem size={18} />
                <h3>Drops</h3>
              </div>
              <p>Future sticker packs, creator drops, and TON collectibles go here.</p>
            </div>
          </section>
        )}

        {activeTab === "track" && (
          <section className="screen">
            <div className="section-card large">
              <div className="card-title">
                <Radar size={18} />
                <h3>Tracking</h3>
              </div>
              <p>Wallet activity, collection signals, and ecosystem events.</p>
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="screen">
            <div className="section-card large">
              <div className="profile-row compact">
                <div className="avatar-wrap small">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt={displayName} />
                  ) : (
                    <UserRound size={24} />
                  )}
                </div>

                <div className="profile-copy">
                  <h2>{displayName}</h2>
                  <p>{username}</p>
                </div>
              </div>

              <div className="profile-detail">
                <span>Wallet</span>
                <strong>{tonAddress ? shortenAddress(tonAddress) : "Not connected"}</strong>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
