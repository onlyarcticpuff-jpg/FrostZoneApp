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
  Search,
  Loader2,
  Wallet,
} from "lucide-react";
import TonIcon from "./assets/icons/ton.svg";

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
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<any[]>([]);
const [searchLoading, setSearchLoading] = useState(false);
const [searchError, setSearchError] = useState("");
const tonAddress = useTonAddress();
  async function runSearch() {
  const q = searchQuery.trim();

  if (!q) return;

  setSearchLoading(true);
  setSearchError("");

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Search failed");
    }

    setSearchResults(data.results || []);
  } catch (err) {
    setSearchError(
      err instanceof Error ? err.message : "Search failed"
    );

    setSearchResults([]);
  } finally {
    setSearchLoading(false);
  }
  }

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
    <div className="hero-card ton-hero">
      <div>
        <p className="eyebrow">TON NETWORK</p>
        <h2>TON Hub</h2>
        <p>Wallet, market, and collectible signals in one frozen command panel.</p>
      </div>

      <div className="ton-orb">
        <img src={TonIcon} alt="TON" />
      </div>
    </div>

    <div className="grid-two">
      <div className="mini-card">
        <img className="mini-ton-icon" src={TonIcon} alt="TON" />
        <strong>TON Price</strong>
        <span>Coming soon</span>
      </div>

      <div className="mini-card">
        <Wallet size={20} />
        <strong>Wallet</strong>
        <span>{tonAddress ? shortenAddress(tonAddress) : "Not connected"}</span>
      </div>
    </div>

    <div className="section-card">
      <div className="card-title">
        <Shield size={18} />
        <h3>Popular NFTs</h3>
      </div>

      <div className="feature-list">
        <div className="feature-row">
          <span>Telegram Usernames</span>
          <strong>Featured</strong>
        </div>

        <div className="feature-row">
          <span>TON Collectibles</span>
          <strong>Tracking soon</strong>
        </div>

        <div className="feature-row">
          <span>Market Activity</span>
          <strong>Coming soon</strong>
        </div>
      </div>
    </div>
  </section>
)}
        {activeTab === "track" && (
  <section className="screen">
    <div className="section-card large">
      <div className="card-title">
        <Gem size={18} />
        <h3>Gifts & NFTs</h3>
      </div>

      <p>Explore Telegram gifts, collectible usernames, rare NFTs, and featured drops.</p>
    </div>

    <div className="grid-two">
      <div className="mini-card">
        <Gem size={20} />
        <strong>Gifts</strong>
        <span>Popular items</span>
      </div>

      <div className="mini-card">
        <Shield size={20} />
        <strong>NFTs</strong>
        <span>Featured collections</span>
      </div>
    </div>

    <div className="section-card">
      <div className="card-title">
        <Sparkles size={18} />
        <h3>Featured</h3>
      </div>

      <div className="feature-list">
        <div className="feature-row">
          <span>Rare Telegram Gifts</span>
          <strong>Soon</strong>
        </div>

        <div className="feature-row">
          <span>Collectible Usernames</span>
          <strong>Live next</strong>
        </div>

        <div className="feature-row">
          <span>Seasonal Drops</span>
          <strong>Planned</strong>
        </div>
      </div>
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
