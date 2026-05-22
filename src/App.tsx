import { useState, useEffect, useRef } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import SecurityPage from "src/SecurityPage";
import {
  ChevronLeft,
  ChevronDown,
  Gift,
  Search,
  Package,
  Box,
  Wallet,
  LogOut,
  Copy,
  CheckCircle,
  Clock,
  ChevronRight,
  User,
  Inbox,
  Flame,
  Star,
  TrendingUp,
  Bell,
  Settings,
  Shield,
  ExternalLink,
} from "lucide-react";

import BottomNav from "./components/BottomNav";
import CaseOpeningCanvas from "./components/CaseOpeningCanvas";
import { createClient } from "@supabase/supabase-js";

import TonIcon   from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";
import logoH     from "./assets/logoH.png";

// ─── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      ?? "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "your-anon-key";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Telegram SDK helpers ──────────────────────────────────────────────────────
const tgApp  = (): any => (window as any).Telegram?.WebApp ?? null;
const tgUser = (): any => tgApp()?.initDataUnsafe?.user ?? null;

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab    = "home" | "inventory" | "cases" | "profile";
type Rarity = "consumer" | "industrial" | "milspec" | "restricted" | "classified" | "covert" | "contraband";

type CaseItem = {
  id:         string;
  name:       string;
  rarity:     Rarity;
  chance:     number;
  image_url?: string;
};

type CaseType = {
  id:           string;
  name:         string;
  subtitle:     string;
  image_url:    string;
  price:        string;
  currency:     "TON" | "STARS";
  glow:         string;
  accent?:      string;
  description?: string;
  items?:       CaseItem[];
};

type UserProfile = {
  id:            string;
  telegram_id:   number;
  created_at:    string;
  cases_opened?: number;
};

type InventoryItem = {
  id:          string;
  item_id:     string;
  obtained_at: string;
  name:        string;
  rarity:      Rarity;
  image_url?:  string;
};

// ─── Rarity config ─────────────────────────────────────────────────────────────
const RARITY: Record<Rarity, { label: string; color: string; bg: string; border: string }> = {
  consumer:   { label: "Consumer",   color: "#8fa3bb", bg: "rgba(143,163,187,0.10)", border: "rgba(143,163,187,0.20)" },
  industrial: { label: "Industrial", color: "#4e8ecf", bg: "rgba(78,142,207,0.10)",  border: "rgba(78,142,207,0.22)"  },
  milspec:    { label: "Mil-Spec",   color: "#4b69ff", bg: "rgba(75,105,255,0.10)",  border: "rgba(75,105,255,0.22)"  },
  restricted: { label: "Restricted", color: "#9055ff", bg: "rgba(144,85,255,0.10)",  border: "rgba(144,85,255,0.22)"  },
  classified: { label: "Classified", color: "#d32ce6", bg: "rgba(211,44,230,0.10)",  border: "rgba(211,44,230,0.22)"  },
  covert:     { label: "Covert",     color: "#eb4b4b", bg: "rgba(235,75,75,0.10)",   border: "rgba(235,75,75,0.22)"   },
  contraband: { label: "Contraband", color: "#e4ae39", bg: "rgba(228,174,57,0.12)",  border: "rgba(228,174,57,0.26)"  },
};

// ─── Shared visual tokens ──────────────────────────────────────────────────────
const CARD_SHADOW      = "0 2px 18px rgba(0,0,0,0.32), 0 1px 0 rgba(255,255,255,0.055) inset";
const CARD_SHADOW_DEEP = "0 4px 32px rgba(0,0,0,0.44), 0 1px 0 rgba(255,255,255,0.06) inset";
const STARS_FILTER     = "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)";

// ─── Case Grid Card ────────────────────────────────────────────────────────────
function CaseGridCard({ item, index, onClick }: { item: CaseType; index: number; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const glow = item.glow ?? "rgba(100,100,255,0.35)";
  const press   = () => { if (!ref.current) return; ref.current.style.transition = "transform 0.08s ease"; ref.current.style.transform = "scale(0.955)"; };
  const release = () => { if (!ref.current) return; ref.current.style.transition = "transform 0.36s cubic-bezier(0.34,1.56,0.64,1)"; ref.current.style.transform = "scale(1)"; };

  return (
    <div ref={ref} onClick={onClick}
      onMouseDown={press} onMouseUp={release} onMouseLeave={release}
      onTouchStart={press} onTouchEnd={release} onTouchCancel={release}
      style={{ display: "flex", flexDirection: "column", gap: 9, cursor: "pointer",
        animation: `fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.07}s both`, willChange: "transform" }}
    >
      <div style={{ borderRadius: 18, overflow: "hidden", position: "relative", aspectRatio: "3 / 4",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
        isolation: "isolate", boxShadow: CARD_SHADOW }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 95% 85% at 50% 58%, ${glow}, transparent 65%)`, opacity: 0.75 }} />
        <img src={item.image_url} alt={item.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2,
          background: "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.22) 100%)" }} />
      </div>
      <div style={{ paddingLeft: 2, paddingBottom: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", color: "rgba(255,255,255,0.95)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
        {item.subtitle && (
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.38)", marginTop: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.subtitle}</div>
        )}
        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.32)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999,
          padding: "3px 9px 3px 7px", fontSize: 12, fontWeight: 800, color: "#fff",
          letterSpacing: "-0.1px", width: "fit-content" }}>
          {item.currency === "TON"
            ? <img src={TonIcon} style={{ width: 13, height: 13 }} />
            : <img src={StarsIcon} style={{ width: 13, height: 13, filter: STARS_FILTER }} />}
          {item.price}
        </div>
      </div>
    </div>
  );
}

// ─── What's Inside Dropdown ────────────────────────────────────────────────────
function WhatsInsideDropdown({ items, loadingItems, glowColor }: {
  items: CaseItem[]; loadingItems: boolean; glowColor: string;
}) {
  const [open, setOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridH, setGridH] = useState(0);

  useEffect(() => { if (gridRef.current) setGridH(gridRef.current.scrollHeight); }, [items, open]);

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      boxShadow: CARD_SHADOW }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", background: "none", border: "none", color: "#fff",
        cursor: "pointer", fontFamily: "inherit",
        borderBottom: open ? "1px solid rgba(255,255,255,0.08)" : "none", transition: "border 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9,
            background: glowColor.replace(/[\d.]+\)$/, "0.16)"),
            border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.26)")}`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={13} color="rgba(255,255,255,0.88)" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>What's Inside</span>
          {!loadingItems && items.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 999 }}>{items.length}</span>
          )}
        </div>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
          <ChevronDown size={15} />
        </div>
      </button>
      <div style={{ maxHeight: open ? `${Math.max(gridH, 60)}px` : "0px", overflow: "hidden",
        transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)" }}>
        <div ref={gridRef} style={{ padding: "12px 12px 14px" }}>
          {loadingItems ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 100, borderRadius: 12, background: "rgba(255,255,255,0.06)",
                  animation: `shimmerPulse 1.5s ease-in-out ${i * 0.08}s infinite` }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 13, padding: "20px 0", fontWeight: 600 }}>
              No items configured yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {items.map(item => {
                const cfg = RARITY[item.rarity] ?? RARITY.consumer;
                return (
                  <div key={item.id} style={{ borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`,
                    overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ height: 66, background: "rgba(0,0,0,0.22)", display: "flex",
                      alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                      {item.image_url
                        ? <img src={item.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <Package size={20} color={cfg.color} opacity={0.55} />}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: cfg.color, opacity: 0.8 }} />
                    </div>
                    <div style={{ padding: "5px 7px 7px" }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4 } as React.CSSProperties}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 8.5, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: cfg.color,
                          background: `${cfg.color}1a`, padding: "1px 5px", borderRadius: 999 }}>{item.chance}%</span>
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

// ─── Case Detail Page ──────────────────────────────────────────────────────────
function CaseDetailPage({ caseData, onClose }: { caseData: CaseType; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<CaseItem[]>(caseData.items ?? []);
  const [loadingItems, setLoadingItems] = useState(!caseData.items);
  const glow = caseData.glow ?? "rgba(255,255,255,0.25)";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (!caseData.items) {
      supabase.from("case_items").select("*").eq("case_id", caseData.id)
        .order("chance", { ascending: false })
        .then(({ data }) => { if (data) setItems(data as CaseItem[]); setLoadingItems(false); });
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--bg-base)",
      transform: visible ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      willChange: "transform", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Nav bar */}
      <div style={{ background: "var(--bar-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", padding: "0 14px",
        height: "calc(52px + env(safe-area-inset-top,0px))",
        paddingTop: "env(safe-area-inset-top,0px)",
        gap: 11, flexShrink: 0,
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.20)" }}>
        <button onClick={handleClose} style={{ height: 34, padding: "0 13px 0 9px", borderRadius: 999,
          background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", gap: 3, color: "rgba(255,255,255,0.82)",
          cursor: "pointer", flexShrink: 0, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
          <ChevronLeft size={16} />Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.4px", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#fff" }}>{caseData.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 500, marginTop: 1 }}>{caseData.subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 13px",
          borderRadius: 999,
          background: glow.replace(/[\d.]+\)$/, "0.14)"),
          border: `1px solid ${glow.replace(/[\d.]+\)$/, "0.24)")}`,
          fontSize: 13, fontWeight: 800, flexShrink: 0, color: "#fff" }}>
          {caseData.currency === "TON"
            ? <img src={TonIcon} style={{ width: 13, height: 13 }} />
            : <img src={StarsIcon} style={{ width: 13, height: 13, filter: STARS_FILTER }} />}
          {caseData.price}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", scrollbarWidth: "none",
        paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 90px)" } as React.CSSProperties}>
        <div style={{ margin: "16px 16px 0", borderRadius: 22, height: 230, position: "relative",
          overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
          isolation: "isolate", boxShadow: CARD_SHADOW_DEEP }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 92% 82% at 50% 60%, ${glow}, transparent 66%)` }} />
          <CaseOpeningCanvas items={items} isOpening={false} glowColor={glow} />
        </div>
        <div style={{ padding: "14px 16px 0" }}>
          <button style={{ width: "100%", height: 52, borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
            color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: 0.1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 24px rgba(42,171,238,0.34), 0 1px 0 rgba(255,255,255,0.18) inset",
            transition: "transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.14s" }}
            onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(42,171,238,0.22)"; }}
            onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(42,171,238,0.34), 0 1px 0 rgba(255,255,255,0.18) inset"; }}>
            Open Case
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "12px 16px 0" }}>
          <WhatsInsideDropdown items={items} loadingItems={loadingItems} glowColor={glow} />
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Page ────────────────────────────────────────────────────────────
function InventoryPage() {
  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tg = tgUser();

  useEffect(() => {
    if (!tg?.id) { setLoading(false); return; }
    supabase
      .from("user_items")
      .select(`id, item_id, obtained_at, case_items ( name, rarity, image_url )`)
      .eq("user_id", String(tg.id))
      .order("obtained_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setItems((data as any[]).map(row => ({
            id:          row.id,
            item_id:     row.item_id,
            obtained_at: row.obtained_at,
            name:        row.case_items?.name      ?? "Unknown Item",
            rarity:      (row.case_items?.rarity   ?? "consumer") as Rarity,
            image_url:   row.case_items?.image_url,
          })));
        }
        setLoading(false);
      });
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (!tg?.id) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 24px", textAlign: "center",
      animation: "fadeUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: 16, boxShadow: CARD_SHADOW }}>
        <Inbox size={26} color="rgba(255,255,255,0.22)" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 6 }}>No Telegram session</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, lineHeight: 1.5 }}>
        Open this app inside Telegram to view your inventory.
      </div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--text-primary)" }}>
          Inventory
        </div>
        {!loading && items.length > 0 && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.44)",
            background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)",
            padding: "3px 9px", borderRadius: 999 }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 16, aspectRatio: "1",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)",
              animation: `shimmerPulse 1.6s ease-in-out ${i * 0.07}s infinite` }} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
          padding: "52px 24px", textAlign: "center", borderRadius: 22, marginTop: 4,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: CARD_SHADOW }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center",
            justifyContent: "center", marginBottom: 14 }}>
            <Box size={24} color="rgba(255,255,255,0.22)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 5 }}>No items yet</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", fontWeight: 500, lineHeight: 1.5 }}>
            Open some cases and your drops will appear here.
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {items.map((item, i) => {
            const cfg = RARITY[item.rarity] ?? RARITY.consumer;
            return (
              <div key={item.id} style={{
                borderRadius: 16, background: cfg.bg, border: `1px solid ${cfg.border}`,
                overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: CARD_SHADOW,
                animation: `fadeUp 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.045}s both`,
              }}>
                <div style={{ height: 80, background: "rgba(0,0,0,0.25)", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Package size={22} color={cfg.color} opacity={0.5} />
                  }
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0,
                    height: 2.5, background: cfg.color, opacity: 0.85 }} />
                </div>
                <div style={{ padding: "7px 8px 8px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.92)",
                    lineHeight: 1.3, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  } as React.CSSProperties}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
                    <span style={{ fontSize: 8.5, color: cfg.color, fontWeight: 700,
                      background: `${cfg.color}18`, padding: "1px 5px", borderRadius: 999 }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.28)", fontWeight: 500 }}>
                      {fmt(item.obtained_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ tonAddress }: { tonAddress: string }) {
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [copied, setCopied]           = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const tg          = tgUser();
  const displayName = [tg?.first_name, tg?.last_name].filter(Boolean).join(" ") || "Anonymous";
  const username    = tg?.username as string | undefined;
  const avatarUrl   = tg?.photo_url as string | undefined;
  const initials    = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!tg?.id) { setLoading(false); return; }
    supabase
      .from("users")
      .select("id, telegram_id, created_at, cases_opened")
      .eq("telegram_id", tg.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); setLoading(false); });
  }, []);

  const joinedAt    = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const casesOpened = profile?.cases_opened ?? 0;
  const shortAddr   = tonAddress ? `${tonAddress.slice(0, 6)}…${tonAddress.slice(-4)}` : null;

  const handleCopy = () => {
    if (!tonAddress) return;
    navigator.clipboard.writeText(tonAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div style={{ animation: "fadeUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}>

      {/* Security Page slide-in overlay */}
      {showSecurity && <SecurityPage onClose={() => setShowSecurity(false)} />}

      {/* ── Hero: Avatar + Identity ── */}
      <div style={{ marginBottom: 16, borderRadius: 24, overflow: "hidden", position: "relative",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: CARD_SHADOW_DEEP }}>

        {/* Background gradient accent */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,171,238,0.12), transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "55%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(42,171,238,0.6), transparent)" }} />

        {/* Avatar row */}
        <div style={{ padding: "28px 20px 22px", display: "flex", alignItems: "center", gap: 18 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {loading ? (
              <div style={{ width: 76, height: 76, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)", animation: "shimmerPulse 1.6s ease-in-out infinite" }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={displayName} style={{ width: 76, height: 76, borderRadius: "50%",
                objectFit: "cover", display: "block",
                border: "2.5px solid rgba(42,171,238,0.35)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 6px 24px rgba(0,0,0,0.45)" }} />
            ) : (
              <div style={{ width: 76, height: 76, borderRadius: "50%",
                background: "linear-gradient(135deg, #2AABEE 0%, #1a85c2 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 800, color: "#fff",
                border: "2.5px solid rgba(42,171,238,0.35)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 6px 24px rgba(42,171,238,0.28)" }}>
                {initials || <User size={28} color="rgba(255,255,255,0.9)" />}
              </div>
            )}
            {/* Online dot */}
            <div style={{ position: "absolute", bottom: 3, right: 3, width: 13, height: 13,
              borderRadius: "50%", background: "#4CAF50", border: "2px solid #1c1c1e",
              boxShadow: "0 0 6px rgba(76,175,80,0.7)" }} />
          </div>

          {/* Name & meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <>
                <div style={{ width: 110, height: 22, borderRadius: 7, background: "rgba(255,255,255,0.08)",
                  animation: "shimmerPulse 1.6s ease-in-out infinite", marginBottom: 8 }} />
                <div style={{ width: 74, height: 15, borderRadius: 5, background: "rgba(255,255,255,0.06)",
                  animation: "shimmerPulse 1.6s ease-in-out infinite" }} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.6px", color: "#fff",
                  lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                {username && (
                  <div style={{ fontSize: 13, color: "rgba(42,171,238,0.80)", fontWeight: 600,
                    marginTop: 3, letterSpacing: "-0.1px" }}>
                    @{username}
                  </div>
                )}
                {joinedAt && (
                  <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4,
                    background: "rgba(255,255,255,0.065)", border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 999, padding: "4px 10px",
                    fontSize: 11, color: "rgba(255,255,255,0.40)", fontWeight: 600 }}>
                    <Clock size={9} color="rgba(255,255,255,0.30)" />
                    Member since {joinedAt}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 16px" }} />

        {/* Stats row inside hero card */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "16px 20px 20px", gap: 12 }}>
          {/* Cases Opened stat */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9,
                background: "rgba(42,171,238,0.12)", border: "1px solid rgba(42,171,238,0.20)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box size={13} color="#2AABEE" />
              </div>
            </div>
            {loading
              ? <div style={{ width: 40, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.08)",
                  animation: "shimmerPulse 1.6s ease-in-out infinite" }} />
              : <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-1px", color: "#fff", lineHeight: 1 }}>
                  {casesOpened.toLocaleString()}
                </div>
            }
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Cases Opened</div>
          </div>

          {/* Wallet stat */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9,
                background: tonAddress ? "rgba(42,171,238,0.12)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${tonAddress ? "rgba(42,171,238,0.20)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={13} color={tonAddress ? "#2AABEE" : "rgba(255,255,255,0.35)"} />
              </div>
              {tonAddress && (
                <button onClick={handleCopy} style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: copied ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${copied ? "rgba(76,175,80,0.28)" : "rgba(255,255,255,0.10)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? <CheckCircle size={12} color="#4CAF50" /> : <Copy size={12} color="rgba(255,255,255,0.5)" />}
                </button>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1,
              color: tonAddress ? "#fff" : "rgba(255,255,255,0.28)",
              fontFamily: tonAddress ? "'SF Mono','Fira Code',monospace" : "inherit",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tonAddress ? shortAddr : "Not linked"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>TON Wallet</div>
          </div>
        </div>
      </div>

      {/* ── Menu list — iOS grouped style ── */}
      <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 12,
        border: "1px solid rgba(255,255,255,0.09)", boxShadow: CARD_SHADOW }}>
        {[
          { icon: <Bell size={15} color="#fff" />, iconBg: "#2AABEE", label: "Notifications", sub: "Manage alerts", onClick: undefined },
          { icon: <Shield size={15} color="#fff" />, iconBg: "#4CAF50", label: "Security", sub: "PIN, 2FA & authenticator", onClick: () => setShowSecurity(true) },
          { icon: <Gift size={15} color="#fff" />, iconBg: "#9055ff", label: "Support", sub: "Help & contact", onClick: undefined },
          { icon: <ExternalLink size={15} color="#fff" />, iconBg: "#e4ae39", label: "About", sub: "App info & terms", onClick: undefined },
        ].map((row, i, arr) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
              background: "rgba(255,255,255,0.04)", cursor: "pointer",
              transition: "background 0.15s" }}
              onClick={row.onClick}
              onTouchStart={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onTouchEnd={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}>
              {/* iOS-style colored icon square */}
              <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: row.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 8px ${row.iconBg}44` }}>
                {row.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.92)",
                  letterSpacing: "-0.2px" }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.33)", fontWeight: 500, marginTop: 1 }}>{row.sub}</div>
              </div>
              <ChevronRight size={15} color="rgba(255,255,255,0.20)" />
            </div>
            {i < arr.length - 1 && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.055)", margin: "0 16px 0 61px" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Disconnect wallet ── */}
      {tonAddress && (
        <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 12,
          border: "1px solid rgba(235,75,75,0.16)", boxShadow: "0 2px 16px rgba(235,75,75,0.07)" }}>
          <button style={{ width: "100%", padding: "14px 16px", background: "rgba(235,75,75,0.07)",
            border: "none", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: "#eb4b4b",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(235,75,75,0.40)" }}>
              <LogOut size={15} color="#fff" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#eb4b4b", letterSpacing: "-0.2px" }}>
              Disconnect Wallet
            </div>
          </button>
        </div>
      )}
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

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % BANNERS.length), 6500);
    return () => clearInterval(id);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) setCurrent(c => dx < 0 ? (c + 1) % BANNERS.length : (c - 1 + BANNERS.length) % BANNERS.length);
    startX.current = null;
  };

  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", marginBottom: 22,
      height: 140, touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none",
      border: "1px solid rgba(255,255,255,0.09)", boxShadow: CARD_SHADOW_DEEP } as React.CSSProperties}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ display: "flex", width: `${BANNERS.length * 100}%`, height: "100%",
        transform: `translateX(-${(current / BANNERS.length) * 100}%)`,
        transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)", willChange: "transform" }}>
        {BANNERS.map((src, i) => (
          <div key={i} style={{ width: `${100 / BANNERS.length}%`, height: "100%", flexShrink: 0 }}>
            <img src={src} alt={`Banner ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" } as React.CSSProperties} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 5, zIndex: 10 }}>
        {BANNERS.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            width: i === current ? 18 : 6, height: 6, borderRadius: 999,
            background: i === current ? "#fff" : "rgba(255,255,255,0.38)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────────
function QuickAction({ icon, label, accent, onClick }: {
  icon: React.ReactNode; label: string; accent: string; onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 7 }}
      onTouchStart={() => { if (ref.current) { ref.current.style.transform = "scale(0.92)"; ref.current.style.transition = "transform 0.08s ease"; } }}
      onTouchEnd={() => { if (ref.current) { ref.current.style.transform = "scale(1)"; ref.current.style.transition = "transform 0.32s cubic-bezier(0.34,1.56,0.64,1)"; } }}>
      <div style={{ width: 52, height: 52, borderRadius: 16,
        background: `${accent}18`, border: `1px solid ${accent}28`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 12px ${accent}18` }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "-0.1px", textAlign: "center" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const tonAddress  = useTonAddress();
  const [activeTab, setActiveTab]       = useState<Tab>("home");
  const [cases, setCases]               = useState<CaseType[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseType | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");

  useEffect(() => {
    supabase.from("cases").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setCases(data as CaseType[]); setLoadingCases(false); });
  }, []);

  const filteredCases = cases.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subtitle ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tg          = tgUser();
  const firstName   = tg?.first_name ?? null;

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
          --bg-base:        #1c1c1e;
          --bg-elevated:    #2c2c2e;
          --bg-card:        rgba(255,255,255,0.055);
          --bar-bg:         rgba(26,26,28,0.92);
          --border:         rgba(255,255,255,0.09);
          --border-mid:     rgba(255,255,255,0.13);
          --text-primary:   rgba(255,255,255,0.96);
          --text-secondary: rgba(255,255,255,0.44);
          --text-tertiary:  rgba(255,255,255,0.26);
          --tg-blue:        #2AABEE;
        }
        html, body {
          margin: 0; padding: 0;
          background: var(--bg-base); color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
          overscroll-behavior: none;
        }
        .app { min-height: 100vh; min-height: 100dvh; background: var(--bg-base); }
        .container { max-width: 430px; margin: 0 auto; padding: 0 14px 110px; }

        /* ── Top Bar ── */
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: calc(env(safe-area-inset-top,0px) + 12px) 16px 11px;
          position: sticky; top: 0; z-index: 100;
          background: var(--bar-bg);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          margin: 0 -14px;
          border-bottom: 1px solid var(--border); margin-bottom: 18px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.22);
        }
        .logo-wrap {
          display: flex; align-items: center; justify-content: center;
          height: 52px; padding: 0 16px; border-radius: 16px;
          background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 2px 20px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.12) inset, 0 0 0 1px rgba(42,171,238,0.08);
        }
        .brand-logo { height: 36px; width: auto; object-fit: contain; display: block; filter: drop-shadow(0 2px 8px rgba(42,171,238,0.30)); }
        .brand-fallback { display: none; font-size: 17px; font-weight: 800; letter-spacing: -0.7px; color: #fff; }

        /* ── Pills ── */
        .balance-row { display: flex; gap: 7px; margin-bottom: 18px; }
        .pill {
          height: 34px; padding: 0 13px; border-radius: 999px;
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-card); border: 1px solid var(--border-mid);
          font-size: 13px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.1px;
          transition: background 0.15s; box-shadow: 0 1px 8px rgba(0,0,0,0.18);
        }
        .pill:active { background: rgba(255,255,255,0.10); }
        .pill img { width: 14px; height: 14px; }
        .stars-icon { filter: brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%); }

        /* ── Section header ── */
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; }
        .section-title  { font-size: 20px; font-weight: 800; letter-spacing: -0.6px; color: var(--text-primary); }
        .section-badge  {
          font-size: 11px; font-weight: 600; color: var(--text-secondary);
          background: var(--bg-card); border: 1px solid var(--border); padding: 3px 9px; border-radius: 999px;
        }

        /* ── Search ── */
        .search {
          height: 40px; border-radius: 12px;
          background: rgba(255,255,255,0.07); border: 1px solid var(--border);
          display: flex; align-items: center; gap: 9px; padding: 0 13px; margin-bottom: 16px;
          transition: border-color 0.15s, background 0.15s; box-shadow: 0 1px 8px rgba(0,0,0,0.14);
        }
        .search:focus-within { background: rgba(255,255,255,0.09); border-color: rgba(42,171,238,0.38); }
        .search-input {
          background: none; border: none; outline: none;
          color: var(--text-primary); font-size: 15px; font-weight: 500; font-family: inherit; flex: 1; padding: 0;
        }
        .search-input::placeholder { color: var(--text-tertiary); }

        /* ── Grids ── */
        .cases-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px 11px; }
        .skeleton-card {
          border-radius: 18px; aspect-ratio: 3 / 4;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06);
          animation: shimmerPulse 1.6s ease-in-out infinite;
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
      `}</style>

      <div className="container">
        {/* ── Top Bar ── */}
        <div className="topbar">
          <div className="logo-wrap">
            <img src={logoH} alt="Logo" className="brand-logo"
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fb = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                if (fb) fb.style.display = "block";
              }} />
            <span className="brand-fallback">OpenCase</span>
          </div>
          <TonConnectButton />
        </div>

        {/* ── Balance pills ── */}
        <div className="balance-row">
          <div className="pill">
            <img src={StarsIcon} className="stars-icon" />0
          </div>
          <div className="pill">
            <img src={TonIcon} />{tonAddress ? "0 TON" : "— TON"}
          </div>
        </div>

        {/* ── HOME ── */}
        {activeTab === "home" && (
          <>
            <SwipeBanner />

            {/* ── Greeting strip ── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px", color: "#fff", lineHeight: 1.2 }}>
                {firstName ? `Hey, ${firstName} 👋` : "Welcome back 👋"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", fontWeight: 500, marginTop: 4 }}>
                What are you opening today?
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ display: "flex", justifyContent: "space-around",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "16px 8px 14px", marginBottom: 22, boxShadow: CARD_SHADOW }}>
              <QuickAction
                icon={<Box size={20} color="#2AABEE" />}
                label="Cases"
                accent="#2AABEE"
                onClick={() => setActiveTab("cases")}
              />
              <QuickAction
                icon={<Star size={20} color="#e4ae39" />}
                label="Top Drops"
                accent="#e4ae39"
              />
              <QuickAction
                icon={<TrendingUp size={20} color="#4CAF50" />}
                label="Live Feed"
                accent="#4CAF50"
              />
              <QuickAction
                icon={<Flame size={20} color="#eb4b4b" />}
                label="Hot Now"
                accent="#eb4b4b"
              />
            </div>

            {/* ── Featured Cases — show 4 max ── */}
            <div className="section-header">
              <div className="section-title">Featured</div>
              {!loadingCases && cases.length > 4 && (
                <button onClick={() => setActiveTab("cases")}
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--tg-blue)", background: "none",
                    border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, letterSpacing: "-0.1px" }}>
                  See all →
                </button>
              )}
            </div>
            <div className="cases-grid">
              {loadingCases
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))
                : cases.slice(0, 4).map((item, i) => (
                    <CaseGridCard key={item.id} item={item} index={i} onClick={() => setSelectedCase(item)} />
                  ))
              }
            </div>
          </>
        )}

        {/* ── CASES ── */}
        {activeTab === "cases" && (
          <>
            <div className="section-header">
              <div className="section-title">All Cases</div>
              {!loadingCases && filteredCases.length > 0 && (
                <div className="section-badge">{filteredCases.length} available</div>
              )}
            </div>
            <div className="search">
              <Search size={15} color="rgba(255,255,255,0.30)" style={{ flexShrink: 0 }} />
              <input className="search-input" placeholder="Search cases…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="cases-grid">
              {loadingCases
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))
                : filteredCases.map((item, i) => (
                    <CaseGridCard key={item.id} item={item} index={i} onClick={() => setSelectedCase(item)} />
                  ))
              }
            </div>
            {!loadingCases && filteredCases.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.28)", padding: "44px 0", fontSize: 14, fontWeight: 600 }}>
                No cases found.
              </div>
            )}
          </>
        )}

        {/* ── INVENTORY ── */}
        {activeTab === "inventory" && <InventoryPage />}

        {/* ── PROFILE ── */}
        {activeTab === "profile" && <ProfilePage tonAddress={tonAddress} />}

        {/* ── Other tabs ── */}
        {activeTab !== "home" && activeTab !== "inventory" && activeTab !== "profile" && activeTab !== "cases" && (
          <div style={{ marginTop: 24, borderRadius: 18, padding: "44px 24px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            textAlign: "center", boxShadow: "0 2px 20px rgba(0,0,0,0.22)" }}>
            <Gift size={30} color="rgba(255,255,255,0.20)" />
            <div style={{ marginTop: 14, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Coming Soon</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500, lineHeight: 1.5 }}>This section is being built.</div>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {selectedCase && (
        <CaseDetailPage caseData={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  );
}
