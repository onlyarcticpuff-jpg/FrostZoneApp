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
const RARITY: Record<Rarity, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  consumer:   { label: "Consumer Grade",   color: "#b0c3d9", bg: "rgba(176,195,217,0.10)", icon: <Package size={11} /> },
  industrial: { label: "Industrial Grade", color: "#5e98d9", bg: "rgba(94,152,217,0.10)",  icon: <Shield size={11} /> },
  milspec:    { label: "Mil-Spec",         color: "#4b69ff", bg: "rgba(75,105,255,0.10)",  icon: <Zap size={11} /> },
  restricted: { label: "Restricted",      color: "#8847ff", bg: "rgba(136,71,255,0.10)",  icon: <Star size={11} /> },
  classified: { label: "Classified",      color: "#d32ce6", bg: "rgba(211,44,230,0.10)",  icon: <Gem size={11} /> },
  covert:     { label: "Covert",          color: "#eb4b4b", bg: "rgba(235,75,75,0.10)",   icon: <Crown size={11} /> },
  contraband: { label: "Contraband",      color: "#e4ae39", bg: "rgba(228,174,57,0.12)",  icon: <Crown size={11} /> },
};

// ─── Case Card ─────────────────────────────────────────────────────────────────
function CaseCard({ item, index, onClick }: { item: CaseType; index: number; onClick: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const press = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = "transform 0.1s ease";
    cardRef.current.style.transform = "scale(0.962)";
  };
  const release = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = "transform 0.38s cubic-bezier(0.34,1.56,0.64,1)";
    cardRef.current.style.transform = "scale(1)";
  };

  const glowColor = item.glow ?? "rgba(100,100,255,0.3)";

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={release}
      style={{
        borderRadius: 28,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 56px rgba(0,0,0,0.5)",
        animation: `fadeUp 0.44s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.08}s both`,
        willChange: "transform",
      }}
    >
      {/* ── Stage: full-width image area ── */}
      <div style={{
        position: "relative",
        height: 240,
        background: "#0d0d0d",
        overflow: "hidden",
        isolation: "isolate",
      }}>
        {/* Radial glow atmosphere */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 85% 75% at 50% 65%, ${glowColor}, transparent 70%)`,
        }} />

        {/* Subtle grid */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 78%)",
        }} />

        {/* Case image — big, centered, floating */}
        <img
          src={item.image_url}
          alt={item.name}
          style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: 182,
            height: 182,
            objectFit: "contain",
            zIndex: 1,
            filter: `drop-shadow(0 18px 42px ${glowColor}) drop-shadow(0 4px 14px rgba(0,0,0,0.85))`,
            animation: "floatCase 4s ease-in-out infinite",
          }}
        />

        {/* Price badge — top right */}
        <div style={{
          position: "absolute", top: 14, right: 14, zIndex: 2,
          height: 32, padding: "0 12px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.58)",
          border: "1px solid rgba(255,255,255,0.13)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 900,
        }}>
          {item.currency === "TON"
            ? <img src={TonIcon} style={{ width: 14, height: 14 }} />
            : <img src={StarsIcon} style={{ width: 14, height: 14, filter: "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)" }} />
          }
          {item.price}
        </div>

        {/* Fade into card body — no hard edge */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 72, zIndex: 2,
          background: "linear-gradient(to bottom, transparent, #141414)",
        }} />
      </div>

      {/* ── Body ── */}
      <div style={{
        padding: "12px 16px 16px",
        background: "#141414",
        position: "relative", zIndex: 3,
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.7px", lineHeight: 1.1 }}>
          {item.name}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.38)" }}>
          {item.subtitle}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

        {/* CTA */}
        <button
          style={{
            width: "100%", height: 50,
            borderRadius: 16, border: "none",
            background: glowColor.replace(/[\d.]+\)$/, "0.18)"),
            backdropFilter: "blur(8px)",
            color: "white",
            fontSize: 14, fontWeight: 900, letterSpacing: 0.3,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 4px 22px ${glowColor.replace(/[\d.]+\)$/, "0.35)")}`,
            position: "relative", overflow: "hidden",
            border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.28)")}`,
          } as React.CSSProperties}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)",
            animation: "shimmerSlide 3s ease-in-out infinite",
          }} />
          <span style={{ position: "relative", zIndex: 1 }}>OPEN CASE</span>
          <ChevronRight size={15} style={{ position: "relative", zIndex: 1 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Case Detail Sheet ─────────────────────────────────────────────────────────
function CaseDetailSheet({ caseData, onClose }: { caseData: CaseType; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<CaseItem[]>(caseData.items ?? []);
  const [loadingItems, setLoadingItems] = useState(!caseData.items);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);

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
    setTimeout(onClose, 380);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
    dragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startY.current;
    currentY.current = dy;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = "none";
    }
  };
  const onTouchEnd = () => {
    dragging.current = false;
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "";
    if (currentY.current > 110) handleClose();
    else sheetRef.current.style.transform = "";
    currentY.current = 0;
  };

  const glowColor = caseData.glow ?? "rgba(255,255,255,0.25)";

  return (
    <>
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }} />

      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0, zIndex: 201,
          background: "#141414",
          borderRadius: "30px 30px 0 0",
          maxHeight: "91dvh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.44s cubic-bezier(0.34,1.56,0.64,1)",
          willChange: "transform",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
          boxShadow: "0 -4px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Drag pill */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px" }}>{caseData.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3, fontWeight: 600 }}>{caseData.subtitle}</div>
          </div>
          <button onClick={handleClose} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.55)", cursor: "pointer",
          }}>
            <X size={15} />
          </button>
        </div>

        {/* PixiJS Canvas zone */}
        <div style={{
          margin: "0 16px 18px",
          borderRadius: 24, height: 230,
          position: "relative", overflow: "hidden",
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          isolation: "isolate",
        }}>
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 80% 70% at 50% 70%, ${glowColor}, transparent 70%)`,
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }} />
          <div style={{
            position: "absolute", top: 14, left: 0, right: 0, zIndex: 2,
            textAlign: "center", fontSize: 10, fontWeight: 800,
            letterSpacing: 2.5, color: "rgba(255,255,255,0.18)",
            textTransform: "uppercase",
          }}>
            PIXI.JS CANVAS
          </div>
          <img
            src={caseData.image_url}
            alt={caseData.name}
            style={{
              position: "absolute",
              left: "50%", top: "52%",
              transform: "translate(-50%, -50%)",
              width: 148, height: 148,
              objectFit: "contain", zIndex: 1,
              filter: `drop-shadow(0 12px 36px ${glowColor}) drop-shadow(0 4px 10px rgba(0,0,0,0.9))`,
              animation: "floatCase 3.5s ease-in-out infinite",
            }}
          />
        </div>

        {/* Open CTA */}
        <div style={{ padding: "0 16px 22px" }}>
          <button
            style={{
              width: "100%", height: 54, borderRadius: 18,
              border: "none", background: "white", color: "black",
              fontSize: 15, fontWeight: 900, letterSpacing: 0.2,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 7, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 28px rgba(255,255,255,0.18)",
              transition: "transform 0.14s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onTouchStart={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
            onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            OPEN CASE <ChevronRight size={15} />
          </button>
        </div>

        {/* What's Inside */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 12 }}>
            What's Inside
          </div>

          {loadingItems
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  height: 58, borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  marginBottom: 8,
                  animation: `shimmerPulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                }} />
              ))
            : items.length === 0
              ? <div style={{
                  textAlign: "center", color: "rgba(255,255,255,0.28)",
                  fontSize: 13, padding: "24px 0", fontWeight: 600,
                }}>
                  No items configured yet.
                </div>
              : items.map((item) => {
                  const cfg = RARITY[item.rarity] ?? RARITY.consumer;
                  return (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 16,
                      background: cfg.bg,
                      border: `1px solid ${cfg.color}1A`,
                      marginBottom: 8,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${cfg.color}28`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, overflow: "hidden",
                      }}>
                        {item.image_url
                          ? <img src={item.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <Package size={16} color={cfg.color} opacity={0.7} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 800, letterSpacing: "-0.2px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                          <span style={{ color: cfg.color, display: "flex", alignItems: "center" }}>{cfg.icon}</span>
                          <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 900, color: cfg.color,
                        background: `${cfg.color}14`,
                        padding: "4px 10px", borderRadius: 999, flexShrink: 0,
                      }}>
                        {item.chance}%
                      </div>
                    </div>
                  );
                })
          }
        </div>

        <div style={{ height: 16 }} />
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
          background: #090909;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
                       'SF Pro Text', system-ui, sans-serif;
          overscroll-behavior: none;
        }

        .app {
          min-height: 100vh;
          min-height: 100dvh;
          background:
            radial-gradient(ellipse 60% 38% at 88% 0%, rgba(22,119,255,0.09), transparent),
            radial-gradient(ellipse 50% 32% at 8% 92%, rgba(136,71,255,0.07), transparent),
            #090909;
        }

        .container {
          max-width: 430px;
          margin: 0 auto;
          padding: 16px 14px 120px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-top: env(safe-area-inset-top, 0px);
        }

        .brand {
          font-size: 27px;
          font-weight: 900;
          letter-spacing: -1.5px;
          background: linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.45));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .balance-row { display: flex; gap: 8px; margin-bottom: 18px; }

        .pill {
          height: 38px; padding: 0 14px; border-radius: 999px;
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.09);
          font-size: 13px; font-weight: 800;
          transition: background 0.15s;
        }
        .pill:active { background: rgba(255,255,255,0.12); }
        .pill img { width: 15px; height: 15px; }

        .stars-icon {
          filter: brightness(0) saturate(100%) invert(79%) sepia(96%)
                  saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%);
        }

        .hero {
          height: 130px; border-radius: 24px;
          padding: 20px; position: relative; overflow: hidden;
          margin-bottom: 22px;
          background: linear-gradient(135deg, #1677ff 0%, #2343d8 55%, #6b1dce 100%);
          box-shadow: 0 14px 48px rgba(22,119,255,0.25), 0 1px 0 rgba(255,255,255,0.1) inset;
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
          font-size: 38px; font-weight: 900; letter-spacing: -2px; line-height: 1;
        }
        .hero-sub {
          position: relative; z-index: 1; margin-top: 10px;
          width: fit-content; padding: 6px 13px; border-radius: 999px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          font-size: 13px; font-weight: 700;
        }

        .section-title {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .title { font-size: 25px; font-weight: 900; letter-spacing: -0.9px; }

        .search {
          height: 46px; border-radius: 15px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; gap: 10px;
          padding: 0 14px; margin-bottom: 18px;
        }
        .search-input {
          background: none; border: none; outline: none;
          color: #fff; font-size: 15px; font-weight: 600;
          font-family: inherit; flex: 1; padding: 0;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.28); }

        .cases { display: flex; flex-direction: column; gap: 14px; }

        .skeleton-card {
          height: 330px; border-radius: 28px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          animation: shimmerPulse 1.5s ease-in-out infinite;
        }

        .placeholder {
          margin-top: 20px; border-radius: 24px; padding: 48px 22px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center; color: rgba(255,255,255,0.4);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatCase {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50%       { transform: translate(-50%, -50%) translateY(-9px); }
        }

        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.38; }
          50%       { opacity: 0.65; }
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
            <div className="section-title">
              <div className="title">Cases</div>
              <Sparkles size={19} color="rgba(255,255,255,0.35)" />
            </div>

            <div className="search">
              <Search size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
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
                    <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))
                : filteredCases.map((item, i) => (
                    <CaseCard
                      key={item.id}
                      item={item}
                      index={i}
                      onClick={() => setSelectedCase(item)}
                    />
                  ))
              }
              {!loadingCases && filteredCases.length === 0 && (
                <div style={{
                  textAlign: "center", color: "rgba(255,255,255,0.28)",
                  padding: "48px 0", fontSize: 14, fontWeight: 600,
                }}>
                  No cases found.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab !== "home" && (
          <div className="placeholder">
            <Gift size={30} color="rgba(255,255,255,0.22)" />
            <div style={{ marginTop: 14, fontWeight: 800, fontSize: 17 }}>Coming Soon</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.32)" }}>
              This section will be implemented later.
            </div>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {selectedCase && (
        <CaseDetailSheet
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
