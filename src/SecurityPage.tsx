// SecurityPage.tsx — browser-native TOTP, no otplib/qrcode required

import { useState, useEffect, useRef, useCallback, KeyboardEvent, ClipboardEvent } from "react";
import {
  ChevronLeft,
  Shield,
  Lock,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  KeyRound,
} from "lucide-react";

// ─── Browser-native TOTP (no npm packages needed) ────────────────────────────

/** Generate a random Base32 secret using Web Crypto */
function generateSecret(length = 20): string {
  const chars  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes  = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => chars[b % 32]).join("");
}

/** Decode Base32 → Uint8Array */
function base32Decode(input: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of input.replace(/=+$/, "").toUpperCase()) {
    const idx = chars.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bits -= 8; out.push((value >> bits) & 0xff); }
  }
  return new Uint8Array(out);
}

/** TOTP verify — returns true if the 6-digit token matches */
async function verifyTotp(token: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const window = 1; // ±1 step tolerance
  const step   = Math.floor(Date.now() / 1000 / 30);
  for (let s = step - window; s <= step + window; s++) {
    const buf   = new ArrayBuffer(8);
    const view  = new DataView(buf);
    view.setUint32(4, s);
    const sig   = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
    const off   = sig[19] & 0xf;
    const otp   = ((sig[off] & 0x7f) << 24 | sig[off+1] << 16 | sig[off+2] << 8 | sig[off+3]) % 1_000_000;
    if (String(otp).padStart(6, "0") === token) return true;
  }
  return false;
}

/** Build otpauth URI and return a QR image URL (via free public API, no npm) */
function buildQrUrl(secret: string, issuer = "OpenCase", account = "user@opencase"): string {
  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&color=ffffff&bgcolor=1c1c1e&data=${encodeURIComponent(uri)}`;
}

// ─── Visual tokens ───────────────────────────────────────────────────────────
const CARD_SHADOW      = "0 2px 18px rgba(0,0,0,0.32), 0 1px 0 rgba(255,255,255,0.055) inset";
const CARD_SHADOW_DEEP = "0 4px 32px rgba(0,0,0,0.44), 0 1px 0 rgba(255,255,255,0.06) inset";

// ─── Types ───────────────────────────────────────────────────────────────────
type SecurityState = { pinEnabled: boolean; totpEnabled: boolean; totpSecret: string | null };
type SubPage = null | "pin-setup" | "totp-setup";

// ─── Persist to localStorage ──────────────────────────────────────────────────
const LS_KEY = "oc_security";
const PIN_KEY = "oc_pin_hash";
function loadSecurity(): SecurityState {
  try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r); } catch {}
  return { pinEnabled: false, totpEnabled: false, totpSecret: null };
}
function saveSecurity(s: SecurityState) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Shared style objects ─────────────────────────────────────────────────────
const navBarStyle: React.CSSProperties = {
  background: "rgba(26,26,28,0.96)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 14px",
  height: "calc(52px + env(safe-area-inset-top,0px))",
  paddingTop: "env(safe-area-inset-top,0px)",
  flexShrink: 0,
  boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.20)",
};

const backBtnStyle: React.CSSProperties = {
  height: 34,
  padding: "0 13px 0 9px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: "rgba(255,255,255,0.82)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
};

const pinWrapStyle: React.CSSProperties = { display: "flex", justifyContent: "center" };

// ─── Custom PIN Field ─────────────────────────────────────────────────────────
function PinField({
  length = 6, secret = false, secretDelay = 300,
  onChange, onComplete, autoFocus = true, resetKey,
}: {
  length?: number; secret?: boolean; secretDelay?: number;
  onChange?: (val: string) => void; onComplete?: (val: string) => void;
  autoFocus?: boolean; resetKey?: string | number;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const [masked, setMasked] = useState<boolean[]>(Array(length).fill(false));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timers    = useRef<(ReturnType<typeof setTimeout> | null)[]>(Array(length).fill(null));

  // Reset when resetKey changes
  useEffect(() => {
    setDigits(Array(length).fill(""));
    setMasked(Array(length).fill(false));
    if (autoFocus) setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }, [resetKey]);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }, [autoFocus]);

  const updateDigit = useCallback((index: number, value: string) => {
    setDigits(prev => {
      const next = [...prev];
      next[index] = value;
      const joined = next.join("");
      onChange?.(joined);
      if (next.every(d => d !== "")) onComplete?.(joined);
      return next;
    });
    if (secret && value !== "") {
      setMasked(prev => { const m = [...prev]; m[index] = false; return m; });
      if (timers.current[index]) clearTimeout(timers.current[index]!);
      timers.current[index] = setTimeout(() => {
        setMasked(prev => { const m = [...prev]; m[index] = true; return m; });
      }, secretDelay);
    } else {
      setMasked(prev => { const m = [...prev]; m[index] = !secret || value === ""; return m; });
    }
  }, [length, onChange, onComplete, secret, secretDelay]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Backspace") {
      if (digits[i] !== "") updateDigit(i, "");
      else if (i > 0) { updateDigit(i - 1, ""); inputRefs.current[i - 1]?.focus(); }
    } else if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    const char = raw[raw.length - 1];
    updateDigit(i, char);
    if (i < length - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    if (secret) setMasked(next.map(d => d !== ""));
    const joined = next.join("");
    onChange?.(joined);
    if (pasted.length === length) { onComplete?.(joined); inputRefs.current[length - 1]?.focus(); }
    else inputRefs.current[pasted.length]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length }).map((_, i) => {
        const filled  = digits[i] !== "";
        const display = filled ? (secret && masked[i] ? "●" : digits[i]) : "";
        return (
          <div key={i} style={{ position: "relative", width: 46, height: 54 }}>
            <input
              ref={el => { inputRefs.current[i] = el; }}
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
              value={display} autoComplete="one-time-code"
              onChange={e => handleInput(e, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              onPaste={handlePaste}
              onFocus={e => {
                e.target.select();
                e.target.style.borderColor = "rgba(42,171,238,0.70)";
                e.target.style.background  = "rgba(42,171,238,0.10)";
                e.target.style.boxShadow   = "0 0 0 3px rgba(42,171,238,0.14)";
              }}
              onBlur={e => {
                e.target.style.borderColor = filled ? "rgba(42,171,238,0.50)" : "rgba(255,255,255,0.12)";
                e.target.style.background  = filled ? "rgba(42,171,238,0.08)" : "rgba(255,255,255,0.07)";
                e.target.style.boxShadow   = "none";
              }}
              style={{
                width: "100%", height: "100%",
                borderRadius: 13,
                background: filled ? "rgba(42,171,238,0.08)" : "rgba(255,255,255,0.07)",
                border: `1.5px solid ${filled ? "rgba(42,171,238,0.50)" : "rgba(255,255,255,0.12)"}`,
                color: "#fff",
                fontSize: filled && secret && masked[i] ? 10 : 22,
                fontWeight: 700, textAlign: "center",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
                outline: "none", caretColor: "transparent",
                transition: "border-color 0.15s, background 0.15s",
                cursor: "text", boxSizing: "border-box",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ number, title, subtitle, children }: {
  number: number; title: string; subtitle: string; children?: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 20, padding: "18px 16px 20px",
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: CARD_SHADOW }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: "rgba(42,171,238,0.14)", border: "1px solid rgba(42,171,238,0.24)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#2AABEE" }}>
          {number}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.3px" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500, marginTop: 3, lineHeight: 1.5 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ icon, iconBg, label, sub, enabled, onToggle, onSetup }: {
  icon: React.ReactNode; iconBg: string; label: string; sub: string;
  enabled: boolean; onToggle: () => void; onSetup?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", cursor: "pointer" }}
      onClick={enabled ? onToggle : (onSetup ?? onToggle)}>
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 8px ${iconBg}55` }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.2px" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginTop: 1 }}>{sub}</div>
      </div>
      <div onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{ width: 46, height: 28, borderRadius: 999, flexShrink: 0, position: "relative",
          background: enabled ? "#4CAF50" : "rgba(255,255,255,0.14)",
          border: `1px solid ${enabled ? "#4CAF50" : "rgba(255,255,255,0.12)"}`,
          transition: "background 0.22s, border-color 0.22s",
          boxShadow: enabled ? "0 0 10px rgba(76,175,80,0.35)" : "none",
          cursor: "pointer" }}>
        <div style={{ position: "absolute", top: 2, left: enabled ? 20 : 2,
          width: 22, height: 22, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 6px rgba(0,0,0,0.30)",
          transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
    </div>
  );
}

// ─── PIN Setup Sub-page ───────────────────────────────────────────────────────
function PinSetupPage({ onBack, onEnabled }: { onBack: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<"create" | "confirm" | "done">("create");
  const [first, setFirst] = useState("");
  const [error, setError] = useState("");
  const [show, setShow]   = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleFirst = (val: string) => {
    if (val.length === 6) { setFirst(val); setStep("confirm"); setError(""); setResetKey(k => k + 1); }
  };

  const handleConfirm = async (val: string) => {
    if (val.length < 6) return;
    if (val !== first) {
      setError("PINs don't match — try again.");
      setStep("create");
      setFirst("");
      setResetKey(k => k + 1);
      return;
    }
    localStorage.setItem(PIN_KEY, await hashPin(val));
    setStep("done");
    setTimeout(onEnabled, 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-base, #1c1c1e)" }}>
      <div style={navBarStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          <ChevronLeft size={16} />Cancel
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
          {step === "create" ? "Create PIN" : step === "confirm" ? "Confirm PIN" : "PIN Set"}
        </span>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px 60px",
        display: "flex", flexDirection: "column", alignItems: "center" }}>

        {step !== "done" ? (
          <>
            <div style={{ width: 76, height: 76, borderRadius: 24, marginBottom: 28,
              background: "rgba(42,171,238,0.10)", border: "1px solid rgba(42,171,238,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 28px rgba(42,171,238,0.16)" }}>
              <Lock size={30} color="#2AABEE" />
            </div>

            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px", color: "#fff",
              marginBottom: 8, textAlign: "center" }}>
              {step === "create" ? "Create a PIN" : "Confirm your PIN"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", fontWeight: 500,
              marginBottom: 40, textAlign: "center", lineHeight: 1.65, maxWidth: 260 }}>
              {step === "create"
                ? "Choose a 6-digit PIN to protect your account."
                : "Enter the same PIN again to confirm."}
            </div>

            {error && (
              <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8,
                background: "rgba(235,75,75,0.10)", border: "1px solid rgba(235,75,75,0.22)",
                borderRadius: 12, padding: "10px 14px", width: "100%", maxWidth: 320 }}>
                <AlertCircle size={14} color="#eb4b4b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#eb4b4b", fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <div style={pinWrapStyle}>
              <PinField
                key={step === "create" ? `create-${resetKey}` : `confirm-${resetKey}`}
                length={6} secret={!show} secretDelay={300}
                onComplete={step === "create" ? handleFirst : handleConfirm}
                autoFocus resetKey={`${step}-${resetKey}`}
              />
            </div>

            <button onClick={() => setShow(s => !s)}
              style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 999, padding: "7px 14px",
                cursor: "pointer", color: "rgba(255,255,255,0.50)",
                fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
              {show ? "Hide digits" : "Show digits"}
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%",
              background: "rgba(76,175,80,0.14)", border: "1px solid rgba(76,175,80,0.26)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 28px rgba(76,175,80,0.28)",
              animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <CheckCircle size={36} color="#4CAF50" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>PIN Enabled!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", textAlign: "center" }}>
              Your account is now PIN protected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TOTP Setup Sub-page ──────────────────────────────────────────────────────
function TotpSetupPage({
  onBack, onEnabled, existingSecret,
}: { onBack: () => void; onEnabled: (secret: string) => void; existingSecret: string | null }) {
  const [secret]     = useState<string>(() => existingSecret ?? generateSecret());
  const qrUrl        = buildQrUrl(secret);
  const [qrLoaded, setQrLoaded]     = useState(false);
  const [qrError, setQrError]       = useState(false);
  const [code, setCode]             = useState("");
  const [codeError, setCodeError]   = useState("");
  const [verifying, setVerifying]   = useState(false);
  const [verified, setVerified]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [resetKey, setResetKey]     = useState(0);

  const handleVerify = async (val?: string) => {
    const token = val ?? code;
    if (token.length < 6) return;
    setVerifying(true);
    setCodeError("");
    const ok = await verifyTotp(token, secret);
    setVerifying(false);
    if (ok) {
      setVerified(true);
      setTimeout(() => onEnabled(secret), 1100);
    } else {
      setCodeError("Incorrect code — check your app and try again.");
      setCode("");
      setResetKey(k => k + 1);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-base, #1c1c1e)" }}>
      <div style={navBarStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          <ChevronLeft size={16} />Cancel
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
          {verified ? "2FA Enabled" : "Set Up Authenticator"}
        </span>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain",
        padding: "24px 18px calc(env(safe-area-inset-bottom,0px) + 48px)" }}>

        {!verified ? (
          <>
            {/* Step 1 — QR */}
            <StepCard
              number={1}
              title="Scan with your authenticator"
              subtitle="Open Google Authenticator, Authy, or any TOTP app and scan the QR code."
            >
              <div style={{ marginTop: 20 }}>
                {/* QR image */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ borderRadius: 20, overflow: "hidden", padding: 14,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: CARD_SHADOW_DEEP, display: "inline-flex", position: "relative",
                    minWidth: 218, minHeight: 218, alignItems: "center", justifyContent: "center" }}>
                    {!qrLoaded && !qrError && (
                      <div style={{ position: "absolute", inset: 0, display: "flex",
                        alignItems: "center", justifyContent: "center" }}>
                        <RefreshCw size={22} color="rgba(255,255,255,0.25)"
                          style={{ animation: "spin 1s linear infinite" }} />
                      </div>
                    )}
                    {qrError ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 10, padding: "20px 10px", textAlign: "center" }}>
                        <QrCode size={28} color="rgba(255,255,255,0.25)" />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500, lineHeight: 1.5 }}>
                          QR unavailable — use the manual key below
                        </span>
                      </div>
                    ) : (
                      <img
                        src={qrUrl}
                        alt="TOTP QR Code"
                        onLoad={() => setQrLoaded(true)}
                        onError={() => { setQrError(true); setQrLoaded(true); }}
                        style={{ width: 190, height: 190, display: qrLoaded ? "block" : "none",
                          borderRadius: 8, imageRendering: "crisp-edges" as any }}
                      />
                    )}
                  </div>
                </div>

                {/* Manual key toggle */}
                <div style={{ marginTop: 14, borderRadius: 14, overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)" }}>
                  <button
                    onClick={() => setShowSecret(s => !s)}
                    style={{ width: "100%", padding: "11px 14px", background: "none", border: "none",
                      display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
                      fontFamily: "inherit" }}>
                    <KeyRound size={13} color="rgba(255,255,255,0.40)" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.40)",
                      letterSpacing: "0.3px", textTransform: "uppercase", flex: 1, textAlign: "left" }}>
                      Manual entry key
                    </span>
                    {showSecret
                      ? <EyeOff size={13} color="rgba(255,255,255,0.35)" />
                      : <Eye size={13} color="rgba(255,255,255,0.35)" />}
                  </button>

                  {showSecret && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 700,
                          letterSpacing: "0.12em", color: "rgba(255,255,255,0.88)",
                          fontFamily: "'SF Mono','Fira Code',monospace",
                          wordBreak: "break-all", lineHeight: 1.7,
                          userSelect: "text" } as React.CSSProperties}>
                          {/* Group into chunks of 4 for readability */}
                          {secret.match(/.{1,4}/g)?.join(" ")}
                        </div>
                        <button onClick={handleCopy}
                          style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: copied ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.08)",
                            border: `1px solid ${copied ? "rgba(76,175,80,0.30)" : "rgba(255,255,255,0.10)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", transition: "all 0.2s" }}>
                          {copied ? <Check size={14} color="#4CAF50" /> : <Copy size={14} color="rgba(255,255,255,0.50)" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </StepCard>

            {/* Step 2 — Verify */}
            <div style={{ marginTop: 14 }}>
              <StepCard
                number={2}
                title="Enter the 6-digit code"
                subtitle="Type the code shown in your authenticator app to confirm setup."
              >
                <div style={{ marginTop: 20 }}>
                  {codeError && (
                    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                      background: "rgba(235,75,75,0.10)", border: "1px solid rgba(235,75,75,0.22)",
                      borderRadius: 12, padding: "10px 14px" }}>
                      <AlertCircle size={14} color="#eb4b4b" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#eb4b4b", fontWeight: 600 }}>{codeError}</span>
                    </div>
                  )}

                  <div style={pinWrapStyle}>
                    <PinField
                      length={6}
                      onChange={val => { setCode(val); setCodeError(""); }}
                      onComplete={handleVerify}
                      autoFocus={false}
                      resetKey={resetKey}
                    />
                  </div>

                  <button
                    onClick={() => handleVerify()}
                    disabled={code.length < 6 || verifying}
                    style={{ width: "100%", height: 50, borderRadius: 14, border: "none",
                      marginTop: 18,
                      background: code.length < 6 || verifying
                        ? "rgba(255,255,255,0.08)"
                        : "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
                      color: code.length < 6 || verifying ? "rgba(255,255,255,0.30)" : "#fff",
                      fontSize: 15, fontWeight: 700, cursor: code.length < 6 || verifying ? "not-allowed" : "pointer",
                      fontFamily: "inherit", letterSpacing: "-0.1px",
                      transition: "all 0.2s",
                      boxShadow: code.length < 6 || verifying ? "none" : "0 4px 24px rgba(42,171,238,0.30)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {verifying ? (
                      <RefreshCw size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Verify &amp; Enable
                      </>
                    )}
                  </button>
                </div>
              </StepCard>
            </div>
          </>
        ) : (
          /* Success state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, paddingTop: 56, textAlign: "center" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%",
              background: "rgba(76,175,80,0.14)", border: "1px solid rgba(76,175,80,0.26)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 32px rgba(76,175,80,0.30)",
              animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <CheckCircle size={40} color="#4CAF50" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.6px" }}>
              2FA Enabled!
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.42)", fontWeight: 500,
              lineHeight: 1.65, maxWidth: 260 }}>
              Your account is now protected with two-factor authentication.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main SecurityPage ────────────────────────────────────────────────────────
export default function SecurityPage({ onClose }: { onClose: () => void }) {
  const [visible, setVisible]   = useState(false);
  const [subPage, setSubPage]   = useState<SubPage>(null);
  const [subVisible, setSubVisible] = useState(false);
  const [security, setSecurity] = useState<SecurityState>(loadSecurity);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Animate sub-page in
  const openSubPage = (page: Exclude<SubPage, null>) => {
    setSubPage(page);
    requestAnimationFrame(() => setSubVisible(true));
  };

  const closeSubPage = () => {
    setSubVisible(false);
    setTimeout(() => setSubPage(null), 280);
  };

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };

  const update = (patch: Partial<SecurityState>) => {
    setSecurity(s => { const next = { ...s, ...patch }; saveSecurity(next); return next; });
  };

  const handlePinToggle = () => {
    if (security.pinEnabled) { update({ pinEnabled: false }); localStorage.removeItem(PIN_KEY); }
    else openSubPage("pin-setup");
  };

  const handleTotpToggle = () => {
    if (security.totpEnabled) update({ totpEnabled: false, totpSecret: null });
    else openSubPage("totp-setup");
  };

  return (
    <>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.65); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Main security slide-in */}
      <div style={{ position: "fixed", inset: 0, zIndex: 400,
        background: "var(--bg-base, #1c1c1e)",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.30s cubic-bezier(0.4,0,0.2,1)",
        willChange: "transform", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Nav bar */}
        <div style={navBarStyle}>
          <button onClick={handleClose} style={backBtnStyle}>
            <ChevronLeft size={16} />Back
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
            Security
          </span>
          <div style={{ width: 70 }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain",
          padding: "20px 16px calc(env(safe-area-inset-bottom,0px) + 40px)" }}>

          {/* Status badge */}
          <div style={{ borderRadius: 20, padding: "18px 18px 16px", marginBottom: 20,
            background: security.pinEnabled && security.totpEnabled
              ? "rgba(76,175,80,0.08)" : "rgba(228,174,57,0.07)",
            border: `1px solid ${security.pinEnabled && security.totpEnabled
              ? "rgba(76,175,80,0.20)" : "rgba(228,174,57,0.18)"}`,
            boxShadow: CARD_SHADOW_DEEP, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: "55%", height: 1,
              background: security.pinEnabled && security.totpEnabled
                ? "linear-gradient(90deg, transparent, rgba(76,175,80,0.55), transparent)"
                : "linear-gradient(90deg, transparent, rgba(228,174,57,0.50), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, flexShrink: 0,
                background: security.pinEnabled && security.totpEnabled
                  ? "rgba(76,175,80,0.14)" : "rgba(228,174,57,0.11)",
                border: `1px solid ${security.pinEnabled && security.totpEnabled
                  ? "rgba(76,175,80,0.24)" : "rgba(228,174,57,0.20)"}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={22} color={security.pinEnabled && security.totpEnabled ? "#4CAF50" : "#e4ae39"} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px",
                  color: security.pinEnabled && security.totpEnabled ? "#4CAF50" : "#e4ae39" }}>
                  {security.pinEnabled && security.totpEnabled ? "Fully Secured" : "Partially Secured"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500, marginTop: 3, lineHeight: 1.5 }}>
                  {security.pinEnabled && security.totpEnabled
                    ? "PIN + 2FA are both active."
                    : "Enable both PIN and 2FA for maximum protection."}
                </div>
              </div>
            </div>
          </div>

          {/* PIN section */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
            PIN Code
          </div>
          <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 20,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: CARD_SHADOW }}>
            <ToggleRow
              icon={<Lock size={16} color="#fff" />} iconBg="#2AABEE"
              label="PIN Lock"
              sub={security.pinEnabled ? "6-digit PIN is active" : "Require PIN to open app"}
              enabled={security.pinEnabled}
              onToggle={handlePinToggle}
              onSetup={() => openSubPage("pin-setup")}
            />
            {security.pinEnabled && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 0 65px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
                  cursor: "pointer" }} onClick={() => openSubPage("pin-setup")}>
                  <div style={{ width: 36, height: 36 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2AABEE", letterSpacing: "-0.2px" }}>
                    Change PIN
                  </div>
                  <ChevronLeft size={14} color="rgba(255,255,255,0.22)"
                    style={{ marginLeft: "auto", transform: "rotate(180deg)" }} />
                </div>
              </>
            )}
          </div>

          {/* 2FA section */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
            Two-Factor Authentication
          </div>
          <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 20,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: CARD_SHADOW }}>
            <ToggleRow
              icon={<Smartphone size={16} color="#fff" />} iconBg="#9055ff"
              label="Authenticator App"
              sub={security.totpEnabled ? "TOTP 2FA is active" : "Google Authenticator, Authy…"}
              enabled={security.totpEnabled}
              onToggle={handleTotpToggle}
              onSetup={() => openSubPage("totp-setup")}
            />
            {security.totpEnabled && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 0 65px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
                  cursor: "pointer" }} onClick={() => openSubPage("totp-setup")}>
                  <div style={{ width: 36, height: 36 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#9055ff", letterSpacing: "-0.2px" }}>
                    Re-configure 2FA
                  </div>
                  <ChevronLeft size={14} color="rgba(255,255,255,0.22)"
                    style={{ marginLeft: "auto", transform: "rotate(180deg)" }} />
                </div>
              </>
            )}
          </div>

          {/* Info note */}
          <div style={{ borderRadius: 14, padding: "13px 15px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", fontWeight: 500, lineHeight: 1.65 }}>
              🔐 Two-factor authentication adds an extra layer of security. Even if someone knows your password, they can't access your account without your authenticator code.
            </div>
          </div>
        </div>
      </div>

      {/* Sub-page overlay — slides in on top */}
      {subPage && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500,
          transform: subVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          willChange: "transform", overflow: "hidden" }}>
          {subPage === "pin-setup" && (
            <PinSetupPage
              onBack={closeSubPage}
              onEnabled={() => { update({ pinEnabled: true }); closeSubPage(); }}
            />
          )}
          {subPage === "totp-setup" && (
            <TotpSetupPage
              onBack={closeSubPage}
              existingSecret={security.totpSecret}
              onEnabled={secret => { update({ totpEnabled: true, totpSecret: secret }); closeSubPage(); }}
            />
          )}
        </div>
      )}
    </>
  );
}
