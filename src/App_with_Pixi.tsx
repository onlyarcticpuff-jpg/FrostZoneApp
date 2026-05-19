import { useState, useEffect, useRef } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import {
  ChevronLeft,
  ChevronDown,
  Gift,
  Search,
  Sparkles,
  Package,
  Zap,
  Shield,
  Crown,
  Gem,
  Star,
} from "lucide-react";

import BottomNav from "./components/BottomNav";
import CaseOpeningCanvas from "./components/CaseOpeningCanvas";
import { createClient } from "@supabase/supabase-js";

import TonIcon from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";

// ─── Supabase ──────────────────────────────────────────────────────────────────
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
  chance: number;
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
  accent?: string;
  description?: string;
  items?: CaseItem[];
};

// ─── Rarity Config ─────────────────────────────────────────────────────────────
const RARITY: Record<Rarity, { label: string; color: string; bg: string; border: string }> = {
  consumer:   { label: "Consumer",   color: "#b0c3d9", bg: "rgba(176,195,217,0.08)", border: "rgba(176,195,217,0.18)" },
  industrial: { label: "Industrial", color: "#5e98d9", bg: "rgba(94,152,217,0.08)",  border: "rgba(94,152,217,0.18)"  },
  milspec:    { label: "Mil-Spec",   color: "#4b69ff", bg: "rgba(75,105,255,0.08)",  border: "rgba(75,105,255,0.18)"  },
  restricted: { label: "Restricted", color: "#8847ff", bg: "rgba(136,71,255,0.08)",  border: "rgba(136,71,255,0.18)"  },
  classified: { label: "Classified", color: "#d32ce6", bg: "rgba(211,44,230,0.08)",  border: "rgba(211,44,230,0.18)"  },
  covert:     { label: "Covert",     color: "#eb4b4b", bg: "rgba(235,75,75,0.08)",   border: "rgba(235,75,75,0.18)"   },
  contraband: { label: "Contraband", color: "#e4ae39", bg: "rgba(228,174,57,0.10)",  border: "rgba(228,174,57,0.22)"  },
};

// ─── Big Case Card (screenshot-style) ─────────────────────────────────────────
function CaseGridCard({ item, index, onClick }: { item: CaseType; index: number; onClick: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowColor = item.glow ?? "rgba(100,100,255,0.35)";

  const press = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = "transform 0.08s ease";
    cardRef.current.style.transform = "scale(0.955)";
  };
  const release = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = "transform 0.36s cubic-bezier(0.34,1.56,0.64,1)";
    cardRef.current.style.transform = "scale(1)";
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseDown={press} onMouseUp={release} onMouseLeave={release}
      onTouchStart={press} onTouchEnd={release} onTouchCancel={release}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        cursor: "pointer",
        animation: `fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.07}s both`,
        willChange: "transform",
      }}
    >
      {/* ── Big image card ── */}
      <div style={{
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        aspectRatio: "3 / 4",
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.07)",
        isolation: "isolate",
      }}>
        {/* Atmospheric glow behind image */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 95% 85% at 50% 58%, ${glowColor}, transparent 65%)`,
          opacity: 0.85,
        }} />

        {/* Case image — fills card fully, no padding, bold */}
        <img
          src={item.image_url}
          alt={item.name}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
        />

        {/* Top-to-bottom dark gradient so name reads clearly */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, transparent 38%, transparent 55%, rgba(0,0,0,0.18) 100%)",
        }} />

        {/* Case name overlaid at top — like the screenshot */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          zIndex: 3,
          padding: "14px 12px 8px",
          fontSize: 15,
          fontWeight: 900,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)",
          lineHeight: 1.15,
          textAlign: "center",
        }}>
          {item.name}
        </div>
      </div>

      {/* ── Price below card — plain, bold, centered ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 17,
        fontWeight: 900,
        letterSpacing: "-0.3px",
        color: "#fff",
        paddingBottom: 4,
      }}>
        {item.currency === "TON"
          ? <img src={TonIcon} style={{ width: 16, height: 16 }} />
          : <img src={StarsIcon} style={{ width: 16, height: 16, filter: "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)" }} />
        }
        {item.price}
      </div>
    </div>
  );
}

// ─── What's Inside Dropdown ────────────────────────────────────────────────────
function WhatsInsideDropdown({ items, loadingItems, glowColor }: {
  items: CaseItem[];
  loadingItems: boolean;
  glowColor: string;
}) {
  const [open, setOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(0);

  useEffect(() => {
    if (gridRef.current) {
      setGridHeight(gridRef.current.scrollHeight);
    }
  }, [items, open]);

  return (
    <div style={{
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.09)",
      background: "rgba(255,255,255,0.04)",
    }}>
      {/* Dropdown trigger row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "15px 16px",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontFamily: "inherit",
          borderBottom: open ? "1px solid rgba(255,255,255,0.07)" : "none",
          transition: "border 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: glowColor.replace(/[\d.]+\)$/, "0.18)"),
            border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.28)")}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={13} color={glowColor.replace(/rgba\([\d,\s]+,/, "rgba(255,255,255,").replace(/[\d.]+\)$/, "0.9)")} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" }}>
            What's Inside
          </span>
          {!loadingItems && items.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.07)",
              padding: "2px 8px", borderRadius: 999,
            }}>
              {items.length} items
            </span>
          )}
        </div>
        <div style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          color: "rgba(255,255,255,0.45)",
        }}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Animated content panel */}
      <div style={{
        maxHeight: open ? `${Math.max(gridHeight, 60)}px` : "0px",
        overflow: "hidden",
        transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div ref={gridRef} style={{ padding: "12px 12px 14px" }}>
          {loadingItems ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  height: 100, borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  animation: `shimmerPulse 1.5s ease-in-out ${i * 0.08}s infinite`,
                }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{
              textAlign: "center", color: "rgba(255,255,255,0.28)",
              fontSize: 13, padding: "20px 0", fontWeight: 600,
            }}>
              No items configured yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {items.map((item, i) => {
                const cfg = RARITY[item.rarity] ?? RARITY.consumer;
                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 12,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Item image */}
                    <div style={{
                      height: 66,
                      background: "rgba(0,0,0,0.28)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}>
                      {item.image_url
                        ? <img src={item.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <Package size={20} color={cfg.color} opacity={0.55} />
                      }
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        height: 3, background: cfg.color, opacity: 0.75,
                      }} />
                    </div>
                    {/* Info */}
                    <div style={{ padding: "5px 6px 6px" }}>
                      <div style={{
                        fontSize: 9.5, fontWeight: 800,
                        color: "rgba(255,255,255,0.9)",
                        lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        marginBottom: 3,
                      } as React.CSSProperties}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 8.5, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 900, color: cfg.color,
                          background: `${cfg.color}18`, padding: "1px 5px", borderRadius: 999,
                        }}>{item.chance}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Full-Page Case Detail ─────────────────────────────────────────────────────
function CaseDetailPage({ caseData, onClose }: { caseData: CaseType; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<CaseItem[]>(caseData.items ?? []);
  const [loadingItems, setLoadingItems] = useState(!caseData.items);

  const glowColor = caseData.glow ?? "rgba(255,255,255,0.25)";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
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
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 300,
      background: "#111",
      transform: visible ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      willChange: "transform",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── Sticky nav bar ── */}
      <div style={{
        background: "rgba(17,17,17,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center",
        padding: "0 12px",
        height: "calc(52px + env(safe-area-inset-top, 0px))",
        paddingTop: "env(safe-area-inset-top, 0px)",
        gap: 10,
        flexShrink: 0,
      }}>
        <button
          onClick={handleClose}
          style={{
            width: 36, height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 17, fontWeight: 800, letterSpacing: "-0.5px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {caseData.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 600, marginTop: 1 }}>
            {caseData.subtitle}
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          height: 30, padding: "0 12px",
          borderRadius: 999,
          background: glowColor.replace(/[\d.]+\)$/, "0.14)"),
          border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.24)")}`,
          fontSize: 13, fontWeight: 900,
          flexShrink: 0,
        }}>
          {caseData.currency === "TON"
            ? <img src={TonIcon} style={{ width: 13, height: 13 }} />
            : <img src={StarsIcon} style={{ width: 13, height: 13, filter: "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)" }} />
          }
          {caseData.price}
        </div>
      </div>

      {/* ── Scrollable body — all content scrolls together ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overscrollBehavior: "contain",
        scrollbarWidth: "none",
        // Enough bottom padding so content clears the bottom nav bar (typically ~80px) + safe area
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
      } as React.CSSProperties}>

        {/* Hero canvas zone */}
        <div style={{
          margin: "14px 16px 0",
          borderRadius: 22,
          height: 230,
          position: "relative",
          overflow: "hidden",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.07)",
          isolation: "isolate",
        }}>
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 92% 82% at 50% 60%, ${glowColor}, transparent 66%)`,
          }} />
          <CaseOpeningCanvas
            imageUrl={caseData.image_url}
            glowColor={glowColor}
            label="OPENING ENGINE"
          />
        </div>

        {/* Open CTA */}
        <div style={{ padding: "14px 16px 0" }}>
          <button
            style={{
              width: "100%", height: 52,
              borderRadius: 16,
              border: "none",
              background: "white",
              color: "black",
              fontSize: 15, fontWeight: 900, letterSpacing: 0.2,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 7,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 28px rgba(255,255,255,0.14)",
              transition: "transform 0.14s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onTouchStart={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
            onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            OPEN CASE
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* What's Inside — dropdown */}
        <div style={{ padding: "14px 16px 0" }}>
          <WhatsInsideDropdown
            items={items}
            loadingItems={loadingItems}
            glowColor={glowColor}
          />
        </div>
      </div>
    </div>
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

  useEffect(() => {
    supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setCases(data as CaseType[]);
        setLoadingCases(false);
      });
  }, []);

  const filteredCases = cases.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        html, body {
          margin: 0; padding: 0;
          background: #111;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
                       'SF Pro Text', system-ui, sans-serif;
          overscroll-behavior: none;
        }

        .app {
          min-height: 100vh;
          min-height: 100dvh;
          background: #111;
        }

        .container {
          max-width: 430px;
          margin: 0 auto;
          padding: 0 14px 110px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: calc(env(safe-area-inset-top, 0px) + 14px) 0 12px;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(17,17,17,0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          margin: 0 -14px;
          padding-left: 14px;
          padding-right: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 16px;
        }

        .brand {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -1.2px;
          background: linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.5));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .balance-row { display: flex; gap: 7px; margin-bottom: 16px; }

        .pill {
          height: 34px; padding: 0 12px; border-radius: 999px;
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.09);
          font-size: 13px; font-weight: 800;
          transition: background 0.15s;
        }
        .pill:active { background: rgba(255,255,255,0.12); }
        .pill img { width: 14px; height: 14px; }

        .stars-icon {
          filter: brightness(0) saturate(100%) invert(79%) sepia(96%)
                  saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%);
        }

        .hero {
          height: 110px; border-radius: 20px;
          padding: 18px; position: relative; overflow: hidden;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #1677ff 0%, #2343d8 55%, #6b1dce 100%);
          box-shadow: 0 10px 36px rgba(22,119,255,0.22), 0 1px 0 rgba(255,255,255,0.1) inset;
        }
        .hero::before {
          content: "";
          position: absolute; top: -40%; left: -8%;
          width: 55%; height: 180%;
          background: radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, transparent 70%);
          transform: rotate(-22deg);
        }
        .hero-title {
          position: relative; z-index: 1;
          font-size: 30px; font-weight: 900; letter-spacing: -1.8px; line-height: 1;
        }
        .hero-sub {
          position: relative; z-index: 1; margin-top: 8px;
          width: fit-content; padding: 5px 12px; border-radius: 999px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          font-size: 12px; font-weight: 700;
        }

        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .section-title { font-size: 20px; font-weight: 900; letter-spacing: -0.7px; }

        .search {
          height: 42px; border-radius: 12px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; gap: 9px;
          padding: 0 13px; margin-bottom: 16px;
        }
        .search-input {
          background: none; border: none; outline: none;
          color: #fff; font-size: 15px; font-weight: 500;
          font-family: inherit; flex: 1; padding: 0;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.25); }

        /* ── 2-col case grid, gap between cards ── */
        .cases-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 10px;
        }

        .skeleton-card {
          border-radius: 20px;
          aspect-ratio: 3 / 4;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          animation: shimmerPulse 1.5s ease-in-out infinite;
        }

        .placeholder {
          margin-top: 20px; border-radius: 20px; padding: 40px 22px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center; color: rgba(255,255,255,0.4);
        }

        ::-webkit-scrollbar { display: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.6; }
        }

        @keyframes shimmerSlide {
          0%        { transform: translateX(-120%); }
          60%, 100% { transform: translateX(220%); }
        }
      `}</style>

      <div className="container">
        <div className="topbar">
          <div className="brand">OPENCASE</div>
          <TonConnectButton />
        </div>

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

        <div className="hero">
          <div className="hero-title">OPENCASE</div>
          <div className="hero-sub">Telegram Case Openings</div>
        </div>

        {activeTab === "home" && (
          <>
            <div className="section-header">
              <div className="section-title">Cases</div>
              <Sparkles size={17} color="rgba(255,255,255,0.3)" />
            </div>

            <div className="search">
              <Search size={15} color="rgba(255,255,255,0.28)" style={{ flexShrink: 0 }} />
              <input
                className="search-input"
                placeholder="Quick find"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="cases-grid">
              {loadingCases
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))
                : filteredCases.map((item, i) => (
                    <CaseGridCard
                      key={item.id}
                      item={item}
                      index={i}
                      onClick={() => setSelectedCase(item)}
                    />
                  ))
              }
            </div>

            {!loadingCases && filteredCases.length === 0 && (
              <div style={{
                textAlign: "center", color: "rgba(255,255,255,0.28)",
                padding: "40px 0", fontSize: 14, fontWeight: 600,
              }}>
                No cases found.
              </div>
            )}
          </>
        )}

        {activeTab !== "home" && (
          <div className="placeholder">
            <Gift size={28} color="rgba(255,255,255,0.2)" />
            <div style={{ marginTop: 14, fontWeight: 800, fontSize: 16 }}>Coming Soon</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.32)" }}>
              This section will be implemented later.
            </div>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {selectedCase && (
        <CaseDetailPage
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
