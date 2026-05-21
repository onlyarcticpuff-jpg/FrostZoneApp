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
import logoH from "./assets/logoH.png";

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
  consumer:   { label: "Consumer",   color: "#8fa3bb", bg: "rgba(143,163,187,0.10)", border: "rgba(143,163,187,0.20)" },
  industrial: { label: "Industrial", color: "#4e8ecf", bg: "rgba(78,142,207,0.10)",  border: "rgba(78,142,207,0.22)"  },
  milspec:    { label: "Mil-Spec",   color: "#4b69ff", bg: "rgba(75,105,255,0.10)",  border: "rgba(75,105,255,0.22)"  },
  restricted: { label: "Restricted", color: "#9055ff", bg: "rgba(144,85,255,0.10)",  border: "rgba(144,85,255,0.22)"  },
  classified: { label: "Classified", color: "#d32ce6", bg: "rgba(211,44,230,0.10)",  border: "rgba(211,44,230,0.22)"  },
  covert:     { label: "Covert",     color: "#eb4b4b", bg: "rgba(235,75,75,0.10)",   border: "rgba(235,75,75,0.22)"   },
  contraband: { label: "Contraband", color: "#e4ae39", bg: "rgba(228,174,57,0.12)",  border: "rgba(228,174,57,0.26)"  },
};

// ─── Big Case Card ─────────────────────────────────────────────────────────────
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
        gap: 9,
        cursor: "pointer",
        animation: `fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.07}s both`,
        willChange: "transform",
      }}
    >
      {/* ── Image card ── */}
      <div style={{
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        aspectRatio: "3 / 4",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        isolation: "isolate",
        boxShadow: "0 2px 16px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.06) inset",
      }}>
        {/* Atmospheric glow */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 95% 85% at 50% 58%, ${glowColor}, transparent 65%)`,
          opacity: 0.75,
        }} />

        {/* Case image */}
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

        {/* Subtle bottom fade */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          background: "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.22) 100%)",
        }} />

        {/* Currency badge — top right */}
        <div style={{
          position: "absolute", top: 9, right: 9, zIndex: 3,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.46)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 999,
          padding: "3px 9px 3px 6px",
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.1px",
        }}>
          {item.currency === "TON"
            ? <img src={TonIcon} style={{ width: 13, height: 13 }} />
            : <img src={StarsIcon} style={{ width: 13, height: 13, filter: "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)" }} />
          }
          {item.price}
        </div>
      </div>

      {/* ── Name + subtitle below card ── */}
      <div style={{ paddingLeft: 2, paddingBottom: 2 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.2px",
          color: "rgba(255,255,255,0.95)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {item.name}
        </div>
        {item.subtitle && (
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.38)",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {item.subtitle}
          </div>
        )}
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
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      {/* Trigger row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontFamily: "inherit",
          borderBottom: open ? "1px solid rgba(255,255,255,0.08)" : "none",
          transition: "border 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: glowColor.replace(/[\d.]+\)$/, "0.16)"),
            border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.26)")}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={13} color="rgba(255,255,255,0.88)" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>
            What's Inside
          </span>
          {!loadingItems && items.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.08)",
              padding: "2px 8px", borderRadius: 999,
            }}>
              {items.length}
            </span>
          )}
        </div>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          color: "rgba(255,255,255,0.5)",
          flexShrink: 0,
        }}>
          <ChevronDown size={15} />
        </div>
      </button>

      {/* Animated panel */}
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
                      background: "rgba(0,0,0,0.22)",
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
                        height: 2.5, background: cfg.color, opacity: 0.8,
                      }} />
                    </div>
                    {/* Info */}
                    <div style={{ padding: "5px 7px 7px" }}>
                      <div style={{
                        fontSize: 9.5, fontWeight: 700,
                        color: "rgba(255,255,255,0.92)",
                        lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        marginBottom: 4,
                      } as React.CSSProperties}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 8.5, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: cfg.color,
                          background: `${cfg.color}1a`, padding: "1px 5px", borderRadius: 999,
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
      background: "var(--bg-base)",
      transform: visible ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      willChange: "transform",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── Sticky nav bar ── */}
      <div style={{
        background: "var(--bar-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center",
        padding: "0 14px",
        height: "calc(52px + env(safe-area-inset-top, 0px))",
        paddingTop: "env(safe-area-inset-top, 0px)",
        gap: 11,
        flexShrink: 0,
      }}>
        {/* Back button — iOS-style */}
        <button
          onClick={handleClose}
          style={{
            height: 34, padding: "0 13px 0 9px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
            color: "rgba(255,255,255,0.82)",
            cursor: "pointer",
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, letterSpacing: "-0.4px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            color: "#fff",
          }}>
            {caseData.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 500, marginTop: 1 }}>
            {caseData.subtitle}
          </div>
        </div>
        {/* Price badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          height: 32, padding: "0 13px",
          borderRadius: 999,
          background: glowColor.replace(/[\d.]+\)$/, "0.14)"),
          border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.24)")}`,
          fontSize: 13, fontWeight: 800,
          flexShrink: 0,
          color: "#fff",
        }}>
          {caseData.currency === "TON"
            ? <img src={TonIcon} style={{ width: 13, height: 13 }} />
            : <img src={StarsIcon} style={{ width: 13, height: 13, filter: "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)" }} />
          }
          {caseData.price}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overscrollBehavior: "contain",
        scrollbarWidth: "none",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
      } as React.CSSProperties}>

        {/* Hero canvas zone */}
        <div style={{
          margin: "16px 16px 0",
          borderRadius: 22,
          height: 230,
          position: "relative",
          overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.09)",
          isolation: "isolate",
          boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 92% 82% at 50% 60%, ${glowColor}, transparent 66%)`,
          }} />
          <CaseOpeningCanvas
            items={items}
            isOpening={false}
            glowColor={glowColor}
          />
        </div>

        {/* Open CTA */}
        <div style={{ padding: "14px 16px 0" }}>
          <button
            style={{
              width: "100%", height: 52,
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
              color: "#fff",
              fontSize: 15, fontWeight: 700, letterSpacing: 0.1,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 7,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 24px rgba(42,171,238,0.32), 0 1px 0 rgba(255,255,255,0.18) inset",
              transition: "transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.14s",
            }}
            onTouchStart={e => {
              e.currentTarget.style.transform = "scale(0.97)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(42,171,238,0.22)";
            }}
            onTouchEnd={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(42,171,238,0.32), 0 1px 0 rgba(255,255,255,0.18) inset";
            }}
          >
            Open Case
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* What's Inside */}
        <div style={{ padding: "12px 16px 0" }}>
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

// ─── Swipe Banner ─────────────────────────────────────────────────────────────
import banner1 from "./assets/banner1.png";
import banner2 from "./assets/banner2.png";
import banner3 from "./assets/banner3.png";

const BANNERS = [banner1, banner2, banner3];

function SwipeBanner() {
  const [current, setCurrent] = useState(0);
  const startX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % BANNERS.length), 6500);
    return () => clearInterval(id);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) {
      setCurrent(c => dx < 0 ? (c + 1) % BANNERS.length : (c - 1 + BANNERS.length) % BANNERS.length);
    }
    startX.current = null;
  };

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 22,
        height: 140,
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.28)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: `${BANNERS.length * 100}%`,
          height: "100%",
          transform: `translateX(-${(current / BANNERS.length) * 100}%)`,
          transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
          willChange: "transform",
        }}
      >
        {BANNERS.map((src, i) => (
          <div key={i} style={{ width: `${100 / BANNERS.length}%`, height: "100%", flexShrink: 0 }}>
            <img
              src={src}
              alt={`Banner ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", draggable: false } as React.CSSProperties}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 5,
        zIndex: 10,
      }}>
        {BANNERS.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: i === current ? "#fff" : "rgba(255,255,255,0.38)",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              cursor: "pointer",
            }}
          />
        ))}
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

        :root {
          --bg-base:      #1c1c1e;
          --bg-elevated:  #2c2c2e;
          --bg-card:      rgba(255,255,255,0.055);
          --bar-bg:       rgba(28,28,30,0.88);
          --border:       rgba(255,255,255,0.09);
          --border-mid:   rgba(255,255,255,0.13);
          --text-primary: rgba(255,255,255,0.96);
          --text-secondary: rgba(255,255,255,0.44);
          --text-tertiary:  rgba(255,255,255,0.26);
          --tg-blue:      #2AABEE;
          --tg-blue-dim:  rgba(42,171,238,0.14);
        }

        html, body {
          margin: 0; padding: 0;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
                       'SF Pro Text', system-ui, sans-serif;
          overscroll-behavior: none;
        }

        .app {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg-base);
        }

        .container {
          max-width: 430px;
          margin: 0 auto;
          padding: 0 14px 110px;
        }

        /* ── Top Bar ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: calc(env(safe-area-inset-top, 0px) + 12px) 0 11px;
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bar-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          margin: 0 -14px;
          padding-left: 16px;
          padding-right: 14px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 18px;
        }

        /* Logo image placeholder */
        .brand-logo {
          height: 28px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        /* ── Balance pills ── */
        .balance-row { display: flex; gap: 7px; margin-bottom: 18px; }

        .pill {
          height: 34px; padding: 0 13px; border-radius: 999px;
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-card);
          border: 1px solid var(--border-mid);
          font-size: 13px; font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.1px;
          transition: background 0.15s;
        }
        .pill:active { background: rgba(255,255,255,0.10); }
        .pill img { width: 14px; height: 14px; }

        .stars-icon {
          filter: brightness(0) saturate(100%) invert(79%) sepia(96%)
                  saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%);
        }

        /* ── Section Header ── */
        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 13px;
        }
        .section-title {
          font-size: 20px; font-weight: 800; letter-spacing: -0.6px;
          color: var(--text-primary);
        }
        .section-badge {
          font-size: 11px; font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 3px 9px; border-radius: 999px;
        }

        /* ── Search bar — iOS style ── */
        .search {
          height: 40px; border-radius: 12px;
          background: rgba(255,255,255,0.07);
          border: 1px solid var(--border);
          display: flex; align-items: center; gap: 9px;
          padding: 0 13px; margin-bottom: 16px;
          transition: border-color 0.15s, background 0.15s;
        }
        .search:focus-within {
          background: rgba(255,255,255,0.09);
          border-color: rgba(42,171,238,0.38);
        }
        .search-input {
          background: none; border: none; outline: none;
          color: var(--text-primary); font-size: 15px; font-weight: 500;
          font-family: inherit; flex: 1; padding: 0;
        }
        .search-input::placeholder { color: var(--text-tertiary); }

        /* ── 2-col case grid ── */
        .cases-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px 11px;
        }

        /* ── Skeleton card ── */
        .skeleton-card {
          border-radius: 18px;
          aspect-ratio: 3 / 4;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          animation: shimmerPulse 1.6s ease-in-out infinite;
        }

        /* ── Placeholder section ── */
        .placeholder {
          margin-top: 24px; border-radius: 18px; padding: 44px 24px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          text-align: center; color: var(--text-secondary);
        }
        .placeholder-title {
          margin-top: 14px; font-weight: 700; font-size: 16px;
          color: var(--text-primary);
        }
        .placeholder-sub {
          margin-top: 6px; font-size: 13px; color: var(--text-tertiary);
          font-weight: 500;
          line-height: 1.5;
        }

        ::-webkit-scrollbar { display: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.55; }
        }

        @keyframes shimmerSlide {
          0%        { transform: translateX(-120%); }
          60%, 100% { transform: translateX(220%); }
        }
      `}</style>

      <div className="container">
        {/* ── Top Bar ── */}
        <div className="topbar">
          {/* Logo — replace src/assets/logoH.png with your actual logo */}
          <img
            src={logoH}
            alt="Logo"
            className="brand-logo"
            onError={(e) => {
              // Graceful fallback if logo not yet added
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "block";
            }}
          />
          {/* Text fallback (hidden when logo loads) */}
          <div style={{
            display: "none",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.8px",
            color: "#fff",
          }}>
            OpenCase
          </div>

          <TonConnectButton />
        </div>

        {/* ── Balance row ── */}
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

        <SwipeBanner />

        {activeTab === "home" && (
          <>
            <div className="section-header">
              <div className="section-title">Cases</div>
              {!loadingCases && filteredCases.length > 0 && (
                <div className="section-badge">{filteredCases.length} available</div>
              )}
            </div>

            {/* Search */}
            <div className="search">
              <Search size={15} color="rgba(255,255,255,0.30)" style={{ flexShrink: 0 }} />
              <input
                className="search-input"
                placeholder="Search cases…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grid */}
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
                padding: "44px 0", fontSize: 14, fontWeight: 600,
              }}>
                No cases found.
              </div>
            )}
          </>
        )}

        {activeTab !== "home" && (
          <div className="placeholder">
            <Gift size={30} color="rgba(255,255,255,0.20)" />
            <div className="placeholder-title">Coming Soon</div>
            <div className="placeholder-sub">This section is being built.</div>
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
