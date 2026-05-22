// SecurityPage.tsx
// Requires: otplib, qrcode
// npm install otplib qrcode
// npm install --save-dev @types/qrcode

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
} from "lucide-react";
import { authenticator } from "otplib";
import QRCode from "qrcode";

// ─── Custom PIN Field ──────────────────────────────────────────────────────────
function PinField({
  length = 6,
  secret = false,
  secretDelay = 300,
  onChange,
  onComplete,
  autoFocus = true,
}: {
  length?: number;
  secret?: boolean;
  secretDelay?: number;
  onChange?: (val: string) => void;
  onComplete?: (val: string) => void;
  autoFocus?: boolean;
}) {
  const [digits, setDigits]   = useState<string[]>(Array(length).fill(""));
  const [masked, setMasked]   = useState<boolean[]>(Array(length).fill(false));
  const inputRefs             = useRef<(HTMLInputElement | null)[]>([]);
  const maskTimers            = useRef<(ReturnType<typeof setTimeout> | null)[]>(Array(length).fill(null));

  // Expose a reset method via a stable ref callback pattern
  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const updateDigit = useCallback((index: number, value: string) => {
    setDigits(prev => {
      const next = [...prev];
      next[index] = value;
      const joined = next.join("");
      onChange?.(joined);
      if (joined.length === length && next.every(d => d !== "")) {
        onComplete?.(joined);
      }
      return next;
    });

    if (secret && value !== "") {
      // Show digit briefly, then mask
      setMasked(prev => { const m = [...prev]; m[index] = false; return m; });
      if (maskTimers.current[index]) clearTimeout(maskTimers.current[index]!);
      maskTimers.current[index] = setTimeout(() => {
        setMasked(prev => { const m = [...prev]; m[index] = true; return m; });
      }, secretDelay);
    } else {
      setMasked(prev => { const m = [...prev]; m[index] = !secret || value === ""; return m; });
    }
  }, [length, onChange, onComplete, secret, secretDelay]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (digits[index] !== "") {
        updateDigit(index, "");
      } else if (index > 0) {
        updateDigit(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    const char = raw[raw.length - 1]; // take last digit if multiple entered
    updateDigit(index, char);
    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    if (secret) {
      setMasked(next.map(d => d !== ""));
    }
    const joined = next.join("");
    onChange?.(joined);
    if (pasted.length === length) {
      onComplete?.(joined);
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length }).map((_, i) => {
        const filled  = digits[i] !== "";
        const display = filled ? (secret && masked[i] ? "●" : digits[i]) : "";
        return (
          <div key={i} style={{ position: "relative", width: 44, height: 52 }}>
            <input
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={display}
              autoComplete="one-time-code"
              onChange={e => handleInput(e, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              onPaste={handlePaste}
              onFocus={handleFocus}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 13,
                background: filled ? "rgba(42,171,238,0.08)" : "rgba(255,255,255,0.07)",
                border: `1.5px solid ${filled ? "rgba(42,171,238,0.50)" : "rgba(255,255,255,0.12)"}`,
                color: "#fff",
                fontSize: filled && secret && masked[i] ? 10 : 20,
                fontWeight: 700,
                textAlign: "center",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
                outline: "none",
                caretColor: "transparent",
                transition: "border-color 0.15s, background 0.15s",
                cursor: "text",
                boxSizing: "border-box",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(42,171,238,0.65)";
                e.target.style.background  = "rgba(42,171,238,0.10)";
                e.target.style.boxShadow   = "0 0 0 3px rgba(42,171,238,0.12)";
              }}
              onBlur={e => {
                const isFilled = digits[i] !== "";
                e.target.style.borderColor = isFilled ? "rgba(42,171,238,0.50)" : "rgba(255,255,255,0.12)";
                e.target.style.background  = isFilled ? "rgba(42,171,238,0.08)" : "rgba(255,255,255,0.07)";
                e.target.style.boxShadow   = "none";
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Visual tokens (mirror App.tsx) ───────────────────────────────────────────
const CARD_SHADOW      = "0 2px 18px rgba(0,0,0,0.32), 0 1px 0 rgba(255,255,255,0.055) inset";
const CARD_SHADOW_DEEP = "0 4px 32px rgba(0,0,0,0.44), 0 1px 0 rgba(255,255,255,0.06) inset";

// ─── Types ────────────────────────────────────────────────────────────────────
type SecurityState = {
  pinEnabled:   boolean;
  totpEnabled:  boolean;
  totpSecret:   string | null;
};

// ─── Persist to localStorage (no Supabase needed for MVP) ─────────────────────
const LS_KEY = "oc_security";
function loadSecurity(): SecurityState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { pinEnabled: false, totpEnabled: false, totpSecret: null };
}
function saveSecurity(s: SecurityState) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

// ─── PIN stored as simple hash (SHA-256) ──────────────────────────────────────
async function hashPin(pin: string): Promise<string> {
  const buf  = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const PIN_KEY = "oc_pin_hash";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: PIN Setup
// ─────────────────────────────────────────────────────────────────────────────
function PinSetupPage({
  onBack, onEnabled,
}: { onBack: () => void; onEnabled: () => void }) {
  const [step, setStep]           = useState<"create" | "confirm" | "done">("create");
  const [first, setFirst]         = useState("");
  const [error, setError]         = useState("");
  const [show, setShow]           = useState(false);

  const handleFirst = (val: string) => {
    if (val.length === 6) { setFirst(val); setStep("confirm"); setError(""); }
  };
  const handleConfirm = async (val: string) => {
    if (val.length < 6) return;
    if (val !== first) {
      setError("PINs don't match. Try again.");
      setStep("create");
      setFirst("");
      return;
    }
    const hash = await hashPin(val);
    localStorage.setItem(PIN_KEY, hash);
    setStep("done");
    setTimeout(onEnabled, 900);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Nav */}
      <div style={navBarStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          <ChevronLeft size={16} />Cancel
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
          Set PIN Code
        </span>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {step !== "done" && (
          <>
            {/* Lock icon */}
            <div style={{ width: 72, height: 72, borderRadius: 22, marginBottom: 24,
              background: "rgba(42,171,238,0.12)", border: "1px solid rgba(42,171,238,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(42,171,238,0.18)" }}>
              <Lock size={28} color="#2AABEE" />
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.6px", color: "#fff", marginBottom: 6, textAlign: "center" }}>
              {step === "create" ? "Create a PIN" : "Confirm your PIN"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", fontWeight: 500, marginBottom: 36, textAlign: "center", lineHeight: 1.6 }}>
              {step === "create"
                ? "Choose a 6-digit PIN to protect your account."
                : "Enter the same PIN again to confirm."}
            </div>

            {error && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
                background: "rgba(235,75,75,0.10)", border: "1px solid rgba(235,75,75,0.22)",
                borderRadius: 12, padding: "10px 14px", width: "100%" }}>
                <AlertCircle size={14} color="#eb4b4b" />
                <span style={{ fontSize: 13, color: "#eb4b4b", fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {/* PIN dots */}
            {step === "create" && (
              <div style={pinWrapStyle}>
                <PinField
                  key="create"
                  length={6}
                  secret={!show}
                  secretDelay={300}
                  onComplete={handleFirst}
                  autoFocus
                />
              </div>
            )}
            {step === "confirm" && (
              <div style={pinWrapStyle}>
                <PinField
                  key="confirm"
                  length={6}
                  secret={!show}
                  secretDelay={300}
                  onComplete={handleConfirm}
                  autoFocus
                />
              </div>
            )}

            {/* Show/hide toggle */}
            <button onClick={() => setShow(s => !s)}
              style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
              {show ? "Hide digits" : "Show digits"}
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 40 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%",
              background: "rgba(76,175,80,0.14)", border: "1px solid rgba(76,175,80,0.26)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(76,175,80,0.22)",
              animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <CheckCircle size={32} color="#4CAF50" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>PIN Enabled!</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: 2FA / TOTP Setup
// ─────────────────────────────────────────────────────────────────────────────
function TotpSetupPage({
  onBack, onEnabled, existingSecret,
}: { onBack: () => void; onEnabled: (secret: string) => void; existingSecret: string | null }) {
  const [secret]            = useState<string>(() => existingSecret ?? authenticator.generateSecret());
  const [qrDataUrl, setQr]  = useState<string>("");
  const [code, setCode]     = useState("");
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);
  const [verified, setVerified]   = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // The TOTP issuer / account label shown in authenticator apps
  const ISSUER  = "OpenCase";
  const ACCOUNT = "user@opencase";

  useEffect(() => {
    const uri = authenticator.keyuri(ACCOUNT, ISSUER, secret);
    QRCode.toDataURL(uri, {
      width: 220,
      margin: 2,
      color: { dark: "#ffffff", light: "#1c1c1e" },
    }).then(setQr);
  }, [secret]);

  const handleVerify = (val: string) => {
    const v = val ?? code;
    if (v.length < 6) return;
    const ok = authenticator.verify({ token: v, secret });
    if (ok) {
      setVerified(true);
      setTimeout(() => onEnabled(secret), 900);
    } else {
      setCodeError("Incorrect code — try again.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Nav */}
      <div style={navBarStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          <ChevronLeft size={16} />Cancel
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
          Authenticator App
        </span>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 56px" }}>
        {!verified ? (
          <>
            {/* Step 1 */}
            <StepCard number={1} title="Scan QR code" subtitle="Open Google Authenticator, Authy, or any TOTP app and scan the code below.">
              {qrDataUrl ? (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                  <div style={{ borderRadius: 20, overflow: "hidden", padding: 14,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: CARD_SHADOW_DEEP, display: "inline-flex" }}>
                    <img src={qrDataUrl} alt="TOTP QR Code"
                      style={{ width: 190, height: 190, display: "block", borderRadius: 8 }} />
                  </div>
                </div>
              ) : (
                <div style={{ height: 218, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RefreshCw size={22} color="rgba(255,255,255,0.25)"
                    style={{ animation: "spin 1s linear infinite" }} />
                </div>
              )}
            </StepCard>

            {/* Manual key */}
            <div style={{ marginTop: 14, borderRadius: 16, padding: "14px 16px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: CARD_SHADOW }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8 }}>
                Manual entry key
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontSize: showSecret ? 13 : 14, fontWeight: 700,
                  letterSpacing: showSecret ? "0.08em" : "0.4em",
                  color: showSecret ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.88)",
                  fontFamily: "'SF Mono','Fira Code',monospace",
                  overflow: "hidden", wordBreak: "break-all",
                  filter: showSecret ? "none" : "blur(5px)",
                  transition: "filter 0.2s",
                  userSelect: showSecret ? "text" : "none" } as React.CSSProperties}>
                  {secret}
                </div>
                <button onClick={() => setShowSecret(s => !s)}
                  style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer" }}>
                  {showSecret ? <EyeOff size={13} color="rgba(255,255,255,0.50)" /> : <Eye size={13} color="rgba(255,255,255,0.50)" />}
                </button>
                <button onClick={handleCopy}
                  style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: copied ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.07)",
                    border: `1px solid ${copied ? "rgba(76,175,80,0.28)" : "rgba(255,255,255,0.10)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? <Check size={13} color="#4CAF50" /> : <Copy size={13} color="rgba(255,255,255,0.50)" />}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ marginTop: 14 }}>
              <StepCard number={2} title="Enter verification code" subtitle="Type the 6-digit code from your authenticator app to confirm setup.">
                <div style={{ marginTop: 18 }}>
                  {codeError && (
                    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
                      background: "rgba(235,75,75,0.10)", border: "1px solid rgba(235,75,75,0.22)",
                      borderRadius: 12, padding: "10px 14px" }}>
                      <AlertCircle size={14} color="#eb4b4b" />
                      <span style={{ fontSize: 13, color: "#eb4b4b", fontWeight: 600 }}>{codeError}</span>
                    </div>
                  )}
                  <div style={pinWrapStyle}>
                    <PinField
                      length={6}
                      onChange={(val: string) => { setCode(val); setCodeError(""); }}
                      onComplete={handleVerify}
                      autoFocus
                    />
                  </div>
                  <button onClick={() => handleVerify(code)}
                    style={{ width: "100%", height: 50, borderRadius: 14, border: "none",
                      marginTop: 16, background: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
                      color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit", letterSpacing: "-0.1px",
                      boxShadow: "0 4px 24px rgba(42,171,238,0.30), 0 1px 0 rgba(255,255,255,0.18) inset",
                      opacity: code.length < 6 ? 0.45 : 1, transition: "opacity 0.15s" }}>
                    Verify & Enable
                  </button>
                </div>
              </StepCard>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 48 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%",
              background: "rgba(76,175,80,0.14)", border: "1px solid rgba(76,175,80,0.26)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 28px rgba(76,175,80,0.28)",
              animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <CheckCircle size={36} color="#4CAF50" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>2FA Enabled!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.6 }}>
              Your account is now protected with<br />two-factor authentication.
            </div>
          </div>
        )}
      </div>
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
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 500, marginTop: 3, lineHeight: 1.5 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ icon, iconBg, label, sub, enabled, onToggle, onSetup, danger }: {
  icon: React.ReactNode; iconBg: string; label: string; sub: string;
  enabled: boolean; onToggle: () => void; onSetup?: () => void; danger?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px",
      cursor: "pointer" }}
      onClick={enabled ? onToggle : (onSetup ?? onToggle)}>
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 8px ${iconBg}55` }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600,
          color: danger ? "#eb4b4b" : "rgba(255,255,255,0.92)", letterSpacing: "-0.2px" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.33)", fontWeight: 500, marginTop: 1 }}>{sub}</div>
      </div>
      {/* iOS-style toggle */}
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

// ─── Main SecurityPage ─────────────────────────────────────────────────────────
type SubPage = null | "pin-setup" | "totp-setup";

export default function SecurityPage({ onClose }: { onClose: () => void }) {
  const [visible, setVisible]   = useState(false);
  const [subPage, setSubPage]   = useState<SubPage>(null);
  const [security, setSecurity] = useState<SecurityState>(loadSecurity);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };

  const update = (patch: Partial<SecurityState>) => {
    setSecurity(s => {
      const next = { ...s, ...patch };
      saveSecurity(next);
      return next;
    });
  };

  const handlePinToggle = () => {
    if (security.pinEnabled) {
      update({ pinEnabled: false });
      localStorage.removeItem(PIN_KEY);
    } else {
      setSubPage("pin-setup");
    }
  };

  const handleTotpToggle = () => {
    if (security.totpEnabled) {
      update({ totpEnabled: false, totpSecret: null });
    } else {
      setSubPage("totp-setup");
    }
  };

  return (
    <>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.55; }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 400,
        background: "var(--bg-base, #1c1c1e)",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        willChange: "transform", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Sub-page: PIN Setup ── */}
        {subPage === "pin-setup" && (
          <PinSetupPage
            onBack={() => setSubPage(null)}
            onEnabled={() => { update({ pinEnabled: true }); setSubPage(null); }}
          />
        )}

        {/* ── Sub-page: TOTP Setup ── */}
        {subPage === "totp-setup" && (
          <TotpSetupPage
            onBack={() => setSubPage(null)}
            existingSecret={security.totpSecret}
            onEnabled={(secret) => { update({ totpEnabled: true, totpSecret: secret }); setSubPage(null); }}
          />
        )}

        {/* ── Main Security screen ── */}
        {subPage === null && (
          <>
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
                  ? "rgba(76,175,80,0.08)" : "rgba(228,174,57,0.08)",
                border: `1px solid ${security.pinEnabled && security.totpEnabled
                  ? "rgba(76,175,80,0.20)" : "rgba(228,174,57,0.20)"}`,
                boxShadow: CARD_SHADOW_DEEP, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: "55%", height: 1,
                  background: security.pinEnabled && security.totpEnabled
                    ? "linear-gradient(90deg, transparent, rgba(76,175,80,0.55), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(228,174,57,0.55), transparent)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 15, flexShrink: 0,
                    background: security.pinEnabled && security.totpEnabled
                      ? "rgba(76,175,80,0.14)" : "rgba(228,174,57,0.12)",
                    border: `1px solid ${security.pinEnabled && security.totpEnabled
                      ? "rgba(76,175,80,0.24)" : "rgba(228,174,57,0.22)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={22} color={security.pinEnabled && security.totpEnabled ? "#4CAF50" : "#e4ae39"} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700,
                      color: security.pinEnabled && security.totpEnabled ? "#4CAF50" : "#e4ae39",
                      letterSpacing: "-0.3px" }}>
                      {security.pinEnabled && security.totpEnabled ? "Fully Secured" : "Partially Secured"}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>
                      {security.pinEnabled && security.totpEnabled
                        ? "PIN + 2FA are both active."
                        : "Enable both PIN and 2FA for maximum protection."}
                    </div>
                  </div>
                </div>
              </div>

              {/* PIN Code section */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
                PIN Code
              </div>
              <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 20,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: CARD_SHADOW }}>
                <ToggleRow
                  icon={<Lock size={16} color="#fff" />}
                  iconBg="#2AABEE"
                  label="PIN Lock"
                  sub={security.pinEnabled ? "6-digit PIN is active" : "Require PIN to open app"}
                  enabled={security.pinEnabled}
                  onToggle={handlePinToggle}
                  onSetup={() => setSubPage("pin-setup")}
                />
                {security.pinEnabled && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 0 65px" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
                      cursor: "pointer" }} onClick={() => setSubPage("pin-setup")}>
                      <div style={{ width: 36, height: 36 }} /> {/* spacer */}
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
                  icon={<Smartphone size={16} color="#fff" />}
                  iconBg="#9055ff"
                  label="Authenticator App"
                  sub={security.totpEnabled ? "TOTP 2FA is active" : "Google Authenticator, Authy…"}
                  enabled={security.totpEnabled}
                  onToggle={handleTotpToggle}
                  onSetup={() => setSubPage("totp-setup")}
                />
                {security.totpEnabled && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 0 65px" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 16px",
                      cursor: "pointer" }} onClick={() => setSubPage("totp-setup")}>
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
              <div style={{ borderRadius: 14, padding: "12px 14px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", fontWeight: 500, lineHeight: 1.6 }}>
                  🔐 Two-factor authentication adds an extra layer of security. Even if someone knows your password, they can't access your account without your authenticator code.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Shared style objects ──────────────────────────────────────────────────────
const navBarStyle: React.CSSProperties = {
  background: "rgba(26,26,28,0.92)",
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
  gap: 3,
  color: "rgba(255,255,255,0.82)",
  cursor: "pointer",
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
};

const pinWrapStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};


