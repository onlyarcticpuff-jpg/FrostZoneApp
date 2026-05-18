import { useState, useEffect, useRef } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  ChevronRight,
  Gift,
  Search,
  Sparkles,
  X,
  Star,
  Package,
  Zap,
  Shield,
  Crown,
  Gem,
} from "lucide-react";

import BottomNav from "./components/BottomNav";
import { createClient } from "@supabase/supabase-js";

import TonIcon from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";

// ─── Supabase Setup ────────────────────────────────────────────────────────────
// Replace with your actual project URL and anon key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "your-anon-key";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = "home" | "inventory" | "cases" | "profile";

type Rarity = "consumer" | "industrial" | "milspec" | "restricted" | "classified" | "covert" | "contraband";

type CaseItem = {
  id: string;
  name: string;
  rarity: Rarity;
  chance: number; // percentage
  image_url?: string;
};

type CaseType = {
  id: string;
  name: string;
  subtitle: string;
  image_url: string;
  price: string;
  currency: "TON" | "STARS";
  glow: string;
  description?: string;
  items?: CaseItem[];
};

// ─── Rarity Config ─────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  consumer:    { label: "Consumer Grade",   color: "#b0c3d9", bg: "rgba(176,195,217,0.12)", icon: <Package size={12} /> },
  industrial:  { label: "Industrial Grade", color: "#5e98d9", bg: "rgba(94,152,217,0.12)",  icon: <Shield size={12} /> },
  milspec:     { label: "Mil-Spec",         color: "#4b69ff", bg: "rgba(75,105,255,0.12)",  icon: <Zap size={12} /> },
  restricted:  { label: "Restricted",       color: "#8847ff", bg: "rgba(136,71,255,0.12)",  icon: <Star size={12} /> },
  classified:  { label: "Classified",       color: "#d32ce6", bg: "rgba(211,44,230,0.12)",  icon: <Gem size={12} /> },
  covert:      { label: "Covert",           color: "#eb4b4b", bg: "rgba(235,75,75,0.12)",   icon: <Crown size={12} /> },
  contraband:  { label: "Contraband",       color: "#e4ae39", bg: "rgba(228,174,57,0.14)",  icon: <Crown size={12} /> },
};

// ─── Case Detail Sheet ─────────────────────────────────────────────────────────
function CaseDetailSheet({
  caseData,
  onClose,
}: {
  caseData: CaseType;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<CaseItem[]>(caseData.items ?? []);
  const [loadingItems, setLoadingItems] = useState(!caseData.items);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    // Mount → animate in
    requestAnimationFrame(() => setVisible(true));

    // Fetch items from Supabase if not already loaded
    if (!caseData.items) {
      supabase
        .from("case_items")
        .select("*")
        .eq("case_id", caseData.id)
        .order("chance", { ascending: false })
        .then(({ data }) => {
          if (data) setItems(data as CaseItem[]);
          setLoadingItems(false);
        });
    }

    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 360);
  };

  // Drag-to-dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY - startY.current;
    if (currentY.current > 0) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
      sheetRef.current.style.transition = "none";
    }
  };
  const onTouchEnd = () => {
    dragging.current = false;
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "";
    if (currentY.current > 120) {
      handleClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    currentY.current = 0;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 100,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)",
          borderRadius: "28px 28px 0 0",
          maxHeight: "92vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.42s cubic-bezier(0.34,1.56,0.64,1)",
          willChange: "transform",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
          <div style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.2)",
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px 16px",
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px" }}>
              {caseData.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              {caseData.subtitle}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* PixiJS Canvas Placeholder */}
        <div style={{
          margin: "0 16px 20px",
          borderRadius: 24,
          overflow: "hidden",
          background: "linear-gradient(135deg, #0d0d0d, #1a1a1a)",
          border: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          height: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Animated glow behind */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 60%, ${caseData.glow}, transparent 65%)`,
            opacity: 0.6,
          }} />

          {/* Placeholder content */}
          <div style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
              PIXI.JS CANVAS
            </div>
            <img
              src={caseData.image_url}
              alt={caseData.name}
              style={{
                width: 110,
                height: 110,
                objectFit: "contain",
                filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.5))",
                animation: "floatCase 3s ease-in-out infinite",
              }}
            />
            <div style={{
              marginTop: 8,
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              fontWeight: 600,
            }}>
              Case opening animation here
            </div>
          </div>
        </div>

        {/* Open Button */}
        <div style={{ padding: "0 16px 20px" }}>
          <button style={{
            width: "100%",
            height: 54,
            borderRadius: 18,
            border: "none",
            background: "white",
            color: "black",
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: 0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(255,255,255,0.15)",
            transition: "transform 0.12s, opacity 0.12s",
          }}
            onTouchStart={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onTouchEnd={e => (e.currentTarget.style.transform = "")}
          >
            OPEN CASE
            <ChevronRight size={16} />
          </button>
        </div>

        {/* What's In The Case */}
        <div style={{ padding: "0 16px" }}>
          <div style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "-0.5px",
            marginBottom: 12,
          }}>
            What's Inside
          </div>

          {loadingItems ? (
            // Skeleton loaders
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: 62,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                marginBottom: 8,
                animation: "shimmer 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))
          ) : items.length === 0 ? (
            <div style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 13,
              padding: "24px 0",
            }}>
              No items configured yet.
            </div>
          ) : (
            items.map((item) => {
              const cfg = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.consumer;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 16,
                    background: cfg.bg,
                    border: `1px solid ${cfg.color}22`,
                    marginBottom: 8,
                  }}
                >
                  {/* Item image placeholder */}
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${cfg.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Package size={18} color={cfg.color} opacity={0.6} />
                    )}
                  </div>

                  {/* Name + rarity */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "-0.2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 2,
                    }}>
                      <span style={{ color: cfg.color, display: "flex", alignItems: "center" }}>
                        {cfg.icon}
                      </span>
                      <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Chance */}
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: cfg.color,
                    background: `${cfg.color}18`,
                    padding: "4px 10px",
                    borderRadius: 999,
                    flexShrink: 0,
                  }}>
                    {item.chance}%
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const tonAddress = useTonAddress();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [cases, setCases] = useState<CaseType[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch cases from Supabase
  useEffect(() => {
    supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (data) setCases(data as CaseType[]);
        setLoadingCases(false);
      });
  }, []);

  const filteredCases = cases.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;700;900&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          -webkit-font-smoothing: antialiased;
        }

        body {
          margin: 0;
          background: #090909;
          color: white;
          font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif;
          overscroll-behavior: none;
        }

        .app {
          min-height: 100vh;
          min-height: 100dvh;
          background:
            radial-gradient(ellipse at top right, rgba(22,119,255,0.08), transparent 45%),
            radial-gradient(ellipse at bottom left, rgba(136,71,255,0.06), transparent 45%),
            #090909;
        }

        .container {
          max-width: 430px;
          margin: 0 auto;
          padding: 18px 16px 130px;
        }

        /* Topbar */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          padding-top: env(safe-area-inset-top, 0px);
        }

        .brand {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1.5px;
          background: linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.55));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Balance pills */
        .balance-row {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .pill {
          height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
          font-weight: 800;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: background 0.2s;
        }

        .pill:active { background: rgba(255,255,255,0.12); }

        .pill img {
          width: 16px;
          height: 16px;
        }

        .stars-icon {
          filter: brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%);
        }

        /* Hero */
        .hero {
          height: 138px;
          border-radius: 26px;
          padding: 22px 22px;
          position: relative;
          overflow: hidden;
          margin-bottom: 22px;
          background: linear-gradient(135deg, #1677ff 0%, #2343d8 60%, #6b1dce 100%);
          box-shadow:
            0 16px 48px rgba(22,119,255,0.28),
            0 2px 0 rgba(255,255,255,0.12) inset;
        }

        .hero::before {
          content: "";
          position: absolute;
          top: -40%;
          left: -10%;
          width: 60%;
          height: 180%;
          background: radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%);
          transform: rotate(-20deg);
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.12));
        }

        .hero-title {
          position: relative;
          z-index: 1;
          font-size: 40px;
          font-weight: 900;
          letter-spacing: -2px;
          line-height: 1;
        }

        .hero-sub {
          position: relative;
          z-index: 1;
          margin-top: 10px;
          width: fit-content;
          padding: 6px 13px;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        /* Section header */
        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .title {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        /* Search */
        .search-wrap {
          position: relative;
          margin-bottom: 16px;
        }

        .search {
          height: 48px;
          border-radius: 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          color: rgba(255,255,255,0.38);
          font-weight: 600;
          font-size: 15px;
          width: 100%;
          outline: none;
          transition: background 0.2s, border-color 0.2s;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .search-input {
          background: none;
          border: none;
          outline: none;
          color: white;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          flex: 1;
          padding: 0;
        }

        .search-input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        /* Case cards */
        .cases {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .case-card {
          background: rgba(255,255,255,0.04);
          border-radius: 24px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.15s;
          will-change: transform;
        }

        .case-card:active {
          transform: scale(0.97);
          background: rgba(255,255,255,0.07);
        }

        .case-glow {
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          top: -50px;
          right: -50px;
          filter: blur(55px);
          opacity: 0.75;
          pointer-events: none;
        }

        .case-top {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .case-image {
          width: 86px;
          height: 86px;
          object-fit: contain;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          padding: 10px;
          flex-shrink: 0;
        }

        .case-name {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.7px;
          line-height: 1.1;
        }

        .case-sub {
          margin-top: 4px;
          color: rgba(255,255,255,0.42);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
        }

        .price-row {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .price-pill {
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
          font-weight: 900;
        }

        .price-pill img {
          width: 14px;
          height: 14px;
        }

        .open-btn {
          flex: 1;
          height: 44px;
          border-radius: 14px;
          border: 0;
          background: white;
          color: black;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.12s;
        }

        .open-btn:active { opacity: 0.8; }

        /* Skeleton */
        .skeleton-card {
          background: rgba(255,255,255,0.04);
          border-radius: 24px;
          height: 140px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* Placeholder tab */
        .placeholder {
          margin-top: 20px;
          border-radius: 24px;
          padding: 40px 22px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          color: rgba(255,255,255,0.45);
        }

        /* Animations */
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }

        @keyframes floatCase {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-up {
          animation: fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
      `}</style>

      <div className="container">
        {/* Topbar */}
        <div className="topbar">
          <div className="brand">OPENCASE</div>
          <TonConnectButton />
        </div>

        {/* Balance */}
        <div className="balance-row">
          <div className="pill">
            <img src={StarsIcon} className="stars-icon" />
            0
          </div>
          <div className="pill">
            <img src={TonIcon} />
            {tonAddress ? "0 TON" : "— TON"}
          </div>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="hero-title">OPENCASE</div>
          <div className="hero-sub">Telegram Case Openings</div>
        </div>

        {/* HOME TAB */}
        {activeTab === "home" && (
          <>
            <div className="section-title">
              <div className="title">Cases</div>
              <Sparkles size={20} color="rgba(255,255,255,0.4)" />
            </div>

            {/* Search */}
            <div className="search">
              <Search size={16} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
              <input
                className="search-input"
                placeholder="Quick find"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="cases">
              {loadingCases
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton-card"
                      style={{
                        animation: "shimmer 1.4s ease-in-out infinite",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))
                : filteredCases.map((item, i) => (
                    <div
                      key={item.id}
                      className="case-card fade-up"
                      style={{ animationDelay: `${i * 0.07}s` }}
                      onClick={() => setSelectedCase(item)}
                    >
                      <div
                        className="case-glow"
                        style={{ background: item.glow }}
                      />

                      <div className="case-top">
                        <img
                          src={item.image_url}
                          className="case-image"
                          alt={item.name}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="case-name">{item.name}</div>
                          <div className="case-sub">{item.subtitle}</div>
                          <div style={{ marginTop: 10 }}>
                            <div className="price-pill">
                              {item.currency === "TON" ? (
                                <img src={TonIcon} />
                              ) : (
                                <img src={StarsIcon} className="stars-icon" />
                              )}
                              {item.price} {item.currency}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="price-row">
                        <button
                          className="open-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(item);
                          }}
                        >
                          OPEN CASE
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

              {!loadingCases && filteredCases.length === 0 && (
                <div style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.3)",
                  padding: "40px 0",
                  fontSize: 14,
                  fontWeight: 600,
                }}>
                  No cases found.
                </div>
              )}
            </div>
          </>
        )}

        {/* OTHER TABS */}
        {activeTab !== "home" && (
          <div className="placeholder">
            <Gift size={32} color="rgba(255,255,255,0.25)" />
            <div style={{ marginTop: 14, fontWeight: 800, fontSize: 17 }}>
              Coming Soon
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              This section will be implemented later.
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Case Detail Sheet */}
      {selectedCase && (
        <CaseDetailSheet
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
