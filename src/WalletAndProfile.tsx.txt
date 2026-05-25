// ─────────────────────────────────────────────────────────────────────────────
//  DROP-IN REPLACEMENTS for WalletModal + ProfilePage in App.tsx
//
//  Changes:
//  • Deposit  → numpad UI (no keyboard); formatted numbers (1,000 / 1.5)
//  • Withdraw Stars → sends to Telegram @username, NOT a TON address
//  • Withdraw TON   → still uses connected TON wallet address
//  • TON deposit feels "native" (TonConnect-style card flow)
//  • All content visible without scrolling (compact layout)
//  • Profile page rebuilt with Telegram avatar, name, @username
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import {
  X, ArrowDownLeft, ArrowUpRight, CheckCircle, AlertCircle,
  Wallet, Clock, Copy, ChevronRight, Box, Bell, Shield, Gift,
  ExternalLink, LogOut, User, Delete,
} from "lucide-react";

import TonIcon   from "./assets/icons/ton.svg";
import StarsIcon from "./assets/icons/stars.svg";
import SecurityPage from "./SecurityPage";
import { createClient } from "@supabase/supabase-js";
import { TonConnectButton } from "@tonconnect/ui-react";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tgUser = (): any => (window as any).Telegram?.WebApp?.initDataUnsafe?.user ?? null;

const CARD_SHADOW      = "0 2px 18px rgba(0,0,0,0.32), 0 1px 0 rgba(255,255,255,0.055) inset";
const CARD_SHADOW_DEEP = "0 4px 32px rgba(0,0,0,0.44), 0 1px 0 rgba(255,255,255,0.06) inset";
const STARS_FILTER     = "brightness(0) saturate(100%) invert(79%) sepia(96%) saturate(649%) hue-rotate(355deg) brightness(101%) contrast(105%)";

type WalletMode     = "deposit" | "withdraw";
type WalletCurrency = "TON" | "STARS";
type UserProfile    = {
  id:            string;
  telegram_id:   number;
  username?:     string;
  created_at:    string;
  cases_opened?: number;
  stars_balance: number;
};

// ─── Format helpers ────────────────────────────────────────────────────────────
function fmtStars(v: string): string {
  if (!v) return "";
  const n = parseInt(v.replace(/,/g, ""), 10);
  return isNaN(n) ? v : n.toLocaleString();
}
function fmtTon(v: string): string {
  // keep raw decimal string, just add commas to integer part
  if (!v) return "";
  const [int, dec] = v.split(".");
  const intFmt = parseInt(int || "0", 10).toLocaleString();
  return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
}

// ─── Numpad ───────────────────────────────────────────────────────────────────
function Numpad({
  value, onChange, isDecimal = false,
}: {
  value: string;
  onChange: (v: string) => void;
  isDecimal?: boolean;
}) {
  const press = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (!isDecimal || value.includes(".")) return;
      onChange(value === "" ? "0." : value + ".");
      return;
    }
    // guard: max 2 decimal places
    if (value.includes(".") && value.split(".")[1]?.length >= 2) return;
    // guard: no leading zeros for integers
    const next = value === "0" ? key : value + key;
    onChange(next);
  };

  const keys = ["1","2","3","4","5","6","7","8","9", isDecimal ? "." : "", "0","⌫"];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
      padding: "0 0 4px",
    }}>
      {keys.map((k, i) => (
        <button key={i} onClick={() => k && press(k)} style={{
          height: 58, borderRadius: 16,
          background: k === "⌫"
            ? "rgba(235,75,75,0.10)"
            : "rgba(255,255,255,0.06)",
          border: k === "⌫"
            ? "1px solid rgba(235,75,75,0.20)"
            : "1px solid rgba(255,255,255,0.09)",
          color: k === "⌫" ? "#eb4b4b" : "rgba(255,255,255,0.92)",
          fontSize: k === "⌫" ? 14 : 22,
          fontWeight: k === "⌫" ? 600 : 700,
          fontFamily: "inherit",
          cursor: k ? "pointer" : "default",
          opacity: k ? 1 : 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.12s, transform 0.08s",
          WebkitTapHighlightColor: "transparent",
        }}
          onTouchStart={e => { if (k) e.currentTarget.style.transform = "scale(0.93)"; }}
          onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {k === "⌫" ? <Delete size={18} /> : k}
        </button>
      ))}
    </div>
  );
}

// ─── Wallet Modal ──────────────────────────────────────────────────────────────
export function WalletModal({
  mode, onClose, tonAddress, userId, currentStarsBalance, onStarsDeposited,
}: {
  mode: WalletMode;
  onClose: () => void;
  tonAddress: string;
  userId?: string;
  currentStarsBalance?: number;
  onStarsDeposited?: (newBalance: number) => void;
}) {
  const [currency, setCurrency] = useState<WalletCurrency>("TON");
  const [rawValue, setRawValue] = useState(""); // raw number string without formatting
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState<"input" | "confirm" | "done" | "processing">("input");
  const [txError, setTxError]   = useState("");

  const isDeposit   = mode === "deposit";
  const isStars     = currency === "STARS";
  const isTon       = currency === "TON";
  const accentColor = isTon ? "#2AABEE" : "#e4ae39";
  const accentAlpha = isTon ? "rgba(42,171,238," : "rgba(228,174,57,";

  const tg          = tgUser();
  const tgUsername  = tg?.username as string | undefined;

  // Display value (formatted)
  const displayValue = isStars ? fmtStars(rawValue) : fmtTon(rawValue);
  const numericValue = parseFloat(rawValue.replace(/,/g, "") || "0");
  const hasAmount    = numericValue > 0;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 320); };

  // Stars deposit
  const handleStarsDeposit = async () => {
    const stars = Math.round(numericValue);
    if (!stars || stars <= 0) return;
    setTxError("");
    setStep("processing");
    const tgApp = (window as any).Telegram?.WebApp;
    if (!tgApp?.openInvoice) {
      setTxError("Telegram invoice API not available.");
      setStep("confirm");
      return;
    }
    try {
      const res = await fetch("/api/stars-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: stars }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { invoiceUrl } = await res.json();
      tgApp.openInvoice(invoiceUrl, async (status: string) => {
        if (status === "paid") {
          const newBalance = (currentStarsBalance ?? 0) + stars;
          if (userId) {
            await supabase.from("users").update({ stars_balance: newBalance }).eq("id", userId);
          }
          onStarsDeposited?.(newBalance);
          setStep("done");
          setTimeout(handleClose, 1800);
        } else {
          setTxError(status === "cancelled" ? "Payment cancelled." : "Payment failed. Please try again.");
          setStep("confirm");
        }
      });
    } catch (err: any) {
      setTxError(err.message ?? "Something went wrong.");
      setStep("confirm");
    }
  };

  const handleSubmit = () => {
    if (isDeposit && isStars) { handleStarsDeposit(); return; }
    // TON deposit / Stars withdraw / TON withdraw: plug logic here
    setStep("done");
    setTimeout(handleClose, 1800);
  };

  // ── Confirm details ────────────────────────────────────────────────────────
  const withdrawDestination = isStars
    ? (tgUsername ? `@${tgUsername}` : "your Telegram account")
    : (tonAddress ? `${tonAddress.slice(0, 8)}…${tonAddress.slice(-6)}` : "No wallet connected");

  const CurrIcon = ({ size = 16 }: { size?: number }) =>
    isTon
      ? <img src={TonIcon}   style={{ width: size, height: size }} />
      : <img src={StarsIcon} style={{ width: size, height: size, filter: STARS_FILTER }} />;

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.72)",
        opacity: visible ? 1 : 0, transition: "opacity 0.32s",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" as any,
      }} />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 501,
        background: "#1c1c1e",
        borderRadius: "26px 26px 0 0",
        border: "1px solid rgba(255,255,255,0.09)",
        borderBottom: "none",
        boxShadow: "0 -8px 48px rgba(0,0,0,0.55)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.36s cubic-bezier(0.4,0,0.2,1)",
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
        maxHeight: "95dvh",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.16)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 16px", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.6px", color: "#fff" }}>
              {isDeposit ? "Deposit" : "Withdraw"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 500, marginTop: 1 }}>
              {isDeposit
                ? "Add funds to your balance"
                : isStars
                  ? `Stars sent to ${tgUsername ? `@${tgUsername}` : "your Telegram"}`
                  : "Withdraw to your TON wallet"}
            </div>
          </div>
          <button onClick={handleClose} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <X size={16} color="rgba(255,255,255,0.65)" />
          </button>
        </div>

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, padding: "24px 24px 40px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%",
              border: "3px solid rgba(228,174,57,0.22)",
              borderTop: "3px solid #e4ae39",
              animation: "wSpin 0.85s linear infinite" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Opening Telegram invoice…</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              Complete the payment in Telegram to credit your Stars.
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            gap: 14, padding: "24px 24px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%",
              background: "rgba(76,175,80,0.14)", border: "1px solid rgba(76,175,80,0.26)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 28px rgba(76,175,80,0.28)",
              animation: "wPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <CheckCircle size={32} color="#4CAF50" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              {isDeposit ? "Deposited!" : "Withdrawal Submitted!"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", textAlign: "center", lineHeight: 1.6 }}>
              {isDeposit ? "Your balance has been updated." : "Funds will arrive shortly."}
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
            <div style={{
              borderRadius: 20, padding: "20px",
              background: `${accentAlpha}0.06)`,
              border: `1px solid ${accentAlpha}0.18)`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.38)",
                textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>
                {isDeposit ? "Depositing" : "Withdrawing"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CurrIcon size={28} />
                <span style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>
                  {displayValue}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>
                  {isStars ? "Stars" : "TON"}
                </span>
              </div>
              {!isDeposit && (
                <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                  to {withdrawDestination}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, padding: "12px 14px",
              background: "rgba(228,174,57,0.07)", border: "1px solid rgba(228,174,57,0.18)",
              borderRadius: 14, alignItems: "flex-start" }}>
              <AlertCircle size={14} color="#e4ae39" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500, lineHeight: 1.5 }}>
                {isDeposit && isStars
                  ? "Payment processed securely via Telegram. Stars credited instantly."
                  : isDeposit
                    ? "Network fees may apply. Transactions are irreversible."
                    : isStars
                      ? "Stars will be sent directly to your Telegram account."
                      : "Withdrawal is irreversible. Double-check your wallet address."}
              </span>
            </div>

            {txError && (
              <div style={{ display: "flex", gap: 8, padding: "10px 14px",
                background: "rgba(235,75,75,0.10)", border: "1px solid rgba(235,75,75,0.22)",
                borderRadius: 12, alignItems: "center" }}>
                <AlertCircle size={13} color="#eb4b4b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#eb4b4b", fontWeight: 600 }}>{txError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("input")} style={{
                flex: 1, height: 50, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Back</button>
              <button onClick={handleSubmit} style={{
                flex: 2, height: 50, borderRadius: 14, border: "none",
                background: isDeposit
                  ? "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)"
                  : "linear-gradient(135deg, #e4ae39 0%, #c99520 100%)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.1px",
                boxShadow: isDeposit
                  ? "0 4px 20px rgba(42,171,238,0.30)"
                  : "0 4px 20px rgba(228,174,57,0.28)",
              }}>
                Confirm {isDeposit ? "Deposit" : "Withdrawal"}
              </button>
            </div>
          </div>
        )}

        {/* ── INPUT ── */}
        {step === "input" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, minHeight: 0 }}>

            {/* Currency toggle */}
            <div style={{ display: "flex", gap: 8, padding: "0 20px 14px",
              flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 6, flex: 1, padding: 4,
                background: "rgba(255,255,255,0.05)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)" }}>
                {(["TON", "STARS"] as WalletCurrency[]).map(c => (
                  <button key={c} onClick={() => { setCurrency(c); setRawValue(""); }} style={{
                    flex: 1, height: 38, borderRadius: 11, border: "none",
                    background: currency === c
                      ? (c === "TON" ? "rgba(42,171,238,0.18)" : "rgba(228,174,57,0.18)")
                      : "transparent",
                    color: currency === c
                      ? (c === "TON" ? "#2AABEE" : "#e4ae39")
                      : "rgba(255,255,255,0.38)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    transition: "all 0.2s",
                    boxShadow: currency === c
                      ? (c === "TON" ? "0 0 0 1px rgba(42,171,238,0.30)" : "0 0 0 1px rgba(228,174,57,0.28)")
                      : "none",
                  }}>
                    <img src={c === "TON" ? TonIcon : StarsIcon}
                      style={{ width: 15, height: 15, filter: c === "STARS" ? STARS_FILTER : "none" }} />
                    {c === "STARS" ? "Stars" : "TON"}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount display */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "10px 20px 10px", flexShrink: 0,
            }}>
              {/* TON native deposit card */}
              {isDeposit && isTon ? (
                <div style={{
                  width: "100%", borderRadius: 20, padding: "18px 20px",
                  background: "rgba(42,171,238,0.07)",
                  border: "1px solid rgba(42,171,238,0.22)",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  {/* Big amount */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <img src={TonIcon} style={{ width: 32, height: 32 }} />
                    <span style={{
                      fontSize: rawValue ? 42 : 36,
                      fontWeight: 900, letterSpacing: "-1.5px", color: rawValue ? "#fff" : "rgba(255,255,255,0.20)",
                      lineHeight: 1, fontVariantNumeric: "tabular-nums",
                      transition: "font-size 0.15s",
                    }}>
                      {rawValue ? fmtTon(rawValue) : "0.00"}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#2AABEE" }}>TON</span>
                  </div>

                  {/* Connected wallet badge */}
                  {tonAddress ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                      background: "rgba(42,171,238,0.10)", borderRadius: 12,
                      border: "1px solid rgba(42,171,238,0.18)",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF50",
                        boxShadow: "0 0 6px rgba(76,175,80,0.7)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(42,171,238,0.70)",
                          textTransform: "uppercase" as any, letterSpacing: "0.3px", marginBottom: 1 }}>
                          From wallet
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.80)",
                          fontFamily: "'SF Mono','Fira Code',monospace",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tonAddress.slice(0, 10)}…{tonAddress.slice(-6)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                      Connect wallet above to deposit TON
                    </div>
                  )}
                </div>
              ) : (
                /* Stars or TON withdraw — big display */
                <div style={{
                  width: "100%", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CurrIcon size={30} />
                    <span style={{
                      fontSize: rawValue ? 52 : 44,
                      fontWeight: 900, letterSpacing: "-2px",
                      color: rawValue ? "#fff" : "rgba(255,255,255,0.18)",
                      lineHeight: 1, fontVariantNumeric: "tabular-nums",
                      transition: "font-size 0.15s, color 0.15s",
                    }}>
                      {rawValue ? displayValue : (isStars ? "0" : "0.00")}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>
                      {isStars ? "Stars" : "TON"}
                    </span>
                  </div>

                  {/* Destination tag for withdraw */}
                  {!isDeposit && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                      background: `${accentAlpha}0.07)`,
                      border: `1px solid ${accentAlpha}0.18)`,
                      borderRadius: 999, marginTop: 4,
                    }}>
                      {isStars ? (
                        <>
                          <img src={StarsIcon} style={{ width: 13, height: 13, filter: STARS_FILTER }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                            To {tgUsername ? `@${tgUsername}` : "your Telegram"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Wallet size={12} color="rgba(255,255,255,0.40)" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)",
                            fontFamily: "'SF Mono','Fira Code',monospace",
                            overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180, whiteSpace: "nowrap" }}>
                            {tonAddress ? `${tonAddress.slice(0,10)}…${tonAddress.slice(-6)}` : "No wallet"}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Numpad (always shown) */}
            <div style={{ padding: "6px 16px 4px", flexShrink: 0 }}>
              <Numpad
                value={rawValue}
                onChange={setRawValue}
                isDecimal={isTon}
              />
            </div>

            {/* CTA */}
            <div style={{ padding: "10px 20px 0", flexShrink: 0 }}>
              <button
                onClick={() => { if (hasAmount) setStep("confirm"); }}
                disabled={!hasAmount}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: !hasAmount
                    ? "rgba(255,255,255,0.08)"
                    : isDeposit
                      ? "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)"
                      : "linear-gradient(135deg, #e4ae39 0%, #c99520 100%)",
                  color: !hasAmount ? "rgba(255,255,255,0.30)" : "#fff",
                  fontSize: 16, fontWeight: 700,
                  cursor: !hasAmount ? "not-allowed" : "pointer",
                  fontFamily: "inherit", letterSpacing: "-0.1px",
                  transition: "all 0.2s",
                  boxShadow: !hasAmount ? "none"
                    : isDeposit
                      ? "0 4px 20px rgba(42,171,238,0.32)"
                      : "0 4px 20px rgba(228,174,57,0.28)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {isDeposit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                {isDeposit ? "Deposit" : "Withdraw"}{" "}
                {hasAmount ? `${displayValue} ${isStars ? "Stars" : "TON"}` : (isStars ? "Stars" : "TON")}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes wPopIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes wSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────────
export function ProfilePage({
  tonAddress, appUser, onStarsDeposited,
}: {
  tonAddress: string;
  appUser: UserProfile | null;
  onStarsDeposited?: (b: number) => void;
}) {
  const [copied, setCopied]             = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [walletModal, setWalletModal]   = useState<WalletMode | null>(null);

  const profile   = appUser;
  const loading   = !appUser;

  const tg          = tgUser();
  const displayName = [tg?.first_name, tg?.last_name].filter(Boolean).join(" ") || "Anonymous";
  const username    = tg?.username as string | undefined;
  const avatarUrl   = tg?.photo_url as string | undefined;
  const initials    = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const joinedAt     = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const casesOpened  = profile?.cases_opened ?? 0;
  const starsBalance = profile?.stars_balance ?? 0;
  const tonBalance   = "0.00";
  const shortAddr    = tonAddress ? `${tonAddress.slice(0, 6)}…${tonAddress.slice(-4)}` : null;

  const handleCopy = () => {
    if (!tonAddress) return;
    navigator.clipboard.writeText(tonAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div style={{ animation: "fadeUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}>

      {showSecurity && <SecurityPage onClose={() => setShowSecurity(false)} />}
      {walletModal && (
        <WalletModal
          mode={walletModal}
          tonAddress={tonAddress}
          userId={profile?.id}
          currentStarsBalance={starsBalance}
          onStarsDeposited={onStarsDeposited}
          onClose={() => setWalletModal(null)}
        />
      )}

      {/* ── Hero Card: Telegram Identity ── */}
      <div style={{
        marginBottom: 14, borderRadius: 24, overflow: "hidden", position: "relative",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: CARD_SHADOW_DEEP,
      }}>
        {/* Gradient accent */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,171,238,0.12), transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "55%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(42,171,238,0.6), transparent)" }} />

        {/* Avatar + name row */}
        <div style={{ padding: "24px 20px 18px", display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {loading ? (
              <div style={{ width: 72, height: 72, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)", animation: "shimmerPulse 1.6s ease-in-out infinite" }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={displayName} style={{
                width: 72, height: 72, borderRadius: "50%", objectFit: "cover", display: "block",
                border: "2.5px solid rgba(42,171,238,0.35)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 6px 24px rgba(0,0,0,0.45)",
              }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #2AABEE 0%, #1a85c2 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 800, color: "#fff",
                border: "2.5px solid rgba(42,171,238,0.35)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 6px 24px rgba(42,171,238,0.28)",
              }}>
                {initials || <User size={26} color="rgba(255,255,255,0.9)" />}
              </div>
            )}
            {/* Online dot */}
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 13, height: 13,
              borderRadius: "50%", background: "#4CAF50", border: "2px solid #1c1c1e",
              boxShadow: "0 0 6px rgba(76,175,80,0.7)" }} />
          </div>

          {/* Name + Telegram info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <>
                <div style={{ width: 110, height: 20, borderRadius: 7, background: "rgba(255,255,255,0.08)",
                  animation: "shimmerPulse 1.6s ease-in-out infinite", marginBottom: 8 }} />
                <div style={{ width: 74, height: 14, borderRadius: 5, background: "rgba(255,255,255,0.06)",
                  animation: "shimmerPulse 1.6s ease-in-out infinite" }} />
              </>
            ) : (
              <>
                <div style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: "-0.6px", color: "#fff",
                  lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {displayName}
                </div>
                {username && (
                  <div style={{
                    fontSize: 13, color: "rgba(42,171,238,0.85)", fontWeight: 600,
                    marginTop: 3, letterSpacing: "-0.1px",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {/* Telegram logo mini */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="12" fill="#2AABEE" fillOpacity="0.25"/>
                      <path d="M17.5 6.5L5.5 11l4 1.5 1.5 4.5 2-3 3.5 2.5 1.5-10z" fill="#2AABEE"/>
                    </svg>
                    @{username}
                  </div>
                )}
                {joinedAt && (
                  <div style={{
                    marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4,
                    background: "rgba(255,255,255,0.065)", border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 999, padding: "3px 9px",
                    fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 600,
                  }}>
                    <Clock size={8} color="rgba(255,255,255,0.30)" />
                    Member since {joinedAt}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 16px" }} />

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "14px 20px 18px", gap: 12 }}>
          {/* Cases opened */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9,
                background: "rgba(42,171,238,0.12)", border: "1px solid rgba(42,171,238,0.20)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box size={13} color="#2AABEE" />
              </div>
            </div>
            {loading
              ? <div style={{ width: 40, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.08)",
                  animation: "shimmerPulse 1.6s ease-in-out infinite" }} />
              : <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-1px", color: "#fff", lineHeight: 1 }}>
                  {casesOpened.toLocaleString()}
                </div>
            }
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Cases Opened</div>
          </div>

          {/* TON Wallet */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9,
                background: tonAddress ? "rgba(42,171,238,0.12)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${tonAddress ? "rgba(42,171,238,0.20)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={13} color={tonAddress ? "#2AABEE" : "rgba(255,255,255,0.35)"} />
              </div>
              {tonAddress && (
                <button onClick={handleCopy} style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: copied ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${copied ? "rgba(76,175,80,0.28)" : "rgba(255,255,255,0.10)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  {copied
                    ? <CheckCircle size={12} color="#4CAF50" />
                    : <Copy size={12} color="rgba(255,255,255,0.5)" />}
                </button>
              )}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1,
              color: tonAddress ? "#fff" : "rgba(255,255,255,0.28)",
              fontFamily: tonAddress ? "'SF Mono','Fira Code',monospace" : "inherit",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {tonAddress ? shortAddr : "Not linked"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>TON Wallet</div>
          </div>
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div style={{
        marginBottom: 14, borderRadius: 20, overflow: "hidden",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: CARD_SHADOW,
      }}>
        {/* Balance header */}
        <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 10 }}>
            Your Balance
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* TON balance */}
            <div style={{ borderRadius: 14, padding: "11px 14px",
              background: "rgba(42,171,238,0.07)", border: "1px solid rgba(42,171,238,0.16)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <img src={TonIcon} style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(42,171,238,0.80)",
                  textTransform: "uppercase" as any, letterSpacing: "0.3px" }}>TON</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1 }}>
                {tonBalance}
              </div>
            </div>
            {/* Stars balance */}
            <div style={{ borderRadius: 14, padding: "11px 14px",
              background: "rgba(228,174,57,0.07)", border: "1px solid rgba(228,174,57,0.16)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <img src={StarsIcon} style={{ width: 15, height: 15, filter: STARS_FILTER }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(228,174,57,0.80)",
                  textTransform: "uppercase" as any, letterSpacing: "0.3px" }}>Stars</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1 }}>
                {starsBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Deposit / Withdraw buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <button
            onClick={() => setWalletModal("deposit")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 12px", background: "none", border: "none",
              borderRight: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onTouchStart={e => (e.currentTarget.style.background = "rgba(42,171,238,0.08)")}
            onTouchEnd={e => (e.currentTarget.style.background = "none")}>
            <div style={{ width: 30, height: 30, borderRadius: 9,
              background: "rgba(42,171,238,0.14)", border: "1px solid rgba(42,171,238,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowDownLeft size={15} color="#2AABEE" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2AABEE", letterSpacing: "-0.2px" }}>
              Deposit
            </span>
          </button>
          <button
            onClick={() => setWalletModal("withdraw")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 12px", background: "none", border: "none",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onTouchStart={e => (e.currentTarget.style.background = "rgba(228,174,57,0.08)")}
            onTouchEnd={e => (e.currentTarget.style.background = "none")}>
            <div style={{ width: 30, height: 30, borderRadius: 9,
              background: "rgba(228,174,57,0.14)", border: "1px solid rgba(228,174,57,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={15} color="#e4ae39" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e4ae39", letterSpacing: "-0.2px" }}>
              Withdraw
            </span>
          </button>
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
            <div style={{
              display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
              background: "rgba(255,255,255,0.04)", cursor: "pointer",
              transition: "background 0.15s",
            }}
              onClick={row.onClick}
              onTouchStart={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onTouchEnd={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}>
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
