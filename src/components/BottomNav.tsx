import { Home, Shield, Wallet, Radar, User } from "lucide-react";
import { useRef } from "react";

// Telegram WebApp haptic feedback
const haptic = {
  light:     () => window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light"),
  selection: () => window?.Telegram?.WebApp?.HapticFeedback?.selectionChanged(),
};

type Tab = "home" | "vault" | "drops" | "track" | "profile";
type Props = { activeTab: Tab; setActiveTab: (tab: Tab) => void };

const items: {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "home",    label: "Home",  Icon: Home   },
  { id: "vault",   label: "Vault", Icon: Shield },
  { id: "drops",   label: "TON",   Icon: Wallet },
  { id: "track",   label: "Track", Icon: Radar  },
  { id: "profile", label: "Me",    Icon: User   },
];

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  const prevTab = useRef<Tab>(activeTab);

  const handleTab = (id: Tab) => {
    if (id === activeTab) { haptic.light(); return; }
    haptic.selection();
    prevTab.current = activeTab;
    setActiveTab(id);
  };

  return (
    <>
      <style>{`
        /* ── Floating pill container ── */
        .glass-nav {
          position: fixed;
          bottom: max(env(safe-area-inset-bottom, 0px) + 12px, 20px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;

          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;

          /* Outer frosted glass shell */
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(40px) saturate(200%) brightness(1.1);
          -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(1.1);
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.45),
            0 2px 8px rgba(0, 0, 0, 0.3),
            0 1px 0 rgba(255, 255, 255, 0.12) inset,
            0 -1px 0 rgba(0, 0, 0, 0.2) inset;
        }

        /* ── Individual round buttons ── */
        .nav-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: none;
          outline: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          overflow: hidden;
          background: transparent;
          transition:
            transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        /* Active disc */
        .nav-btn.active {
          background: rgba(255, 255, 255, 0.11);
          box-shadow:
            0 2px 12px rgba(0, 0, 0, 0.25),
            0 1px 0 rgba(255, 255, 255, 0.18) inset,
            0 -1px 0 rgba(0, 0, 0, 0.15) inset;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transform: scale(1.09);
        }

        /* Press */
        .nav-btn:active {
          transform: scale(0.87) !important;
        }

        /* Radial flash on press */
        .nav-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at center,
            rgba(255, 255, 255, 0.2) 0%,
            transparent 65%
          );
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.18s ease, transform 0.22s ease;
          pointer-events: none;
        }
        .nav-btn:active::after {
          opacity: 1;
          transform: scale(1);
        }

        /* Soft glow ring behind active button */
        .nav-btn.active::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 0 16px 4px var(--tab-accent, #60a5fa);
          opacity: 0.22;
          pointer-events: none;
        }

        /* ── Icon ── */
        .nav-btn svg {
          position: relative;
          z-index: 1;
          color: rgba(255, 255, 255, 0.38);
          transition: color 0.2s ease, filter 0.2s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }

        .nav-btn.active svg {
          color: var(--tab-accent, #60a5fa);
          filter: drop-shadow(0 0 5px var(--tab-accent, #60a5fa));
          transform: translateY(-1px);
        }

        /* ── Label ── */
        .nav-label {
          position: relative;
          z-index: 1;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.25px;
          font-family: -apple-system, "SF Pro Rounded", "SF Pro Text", system-ui, sans-serif;
          color: rgba(255, 255, 255, 0.32);
          transition: color 0.2s ease;
          user-select: none;
          line-height: 1;
        }

        .nav-btn.active .nav-label {
          color: var(--tab-accent, #60a5fa);
        }

        /* ── Per-tab accent colours ── */
        .nav-btn[data-tab="home"]    { --tab-accent: #60a5fa; }
        .nav-btn[data-tab="vault"]   { --tab-accent: #a78bfa; }
        .nav-btn[data-tab="drops"]   { --tab-accent: #34d399; }
        .nav-btn[data-tab="track"]   { --tab-accent: #fb923c; }
        .nav-btn[data-tab="profile"] { --tab-accent: #f472b6; }

        /* ── Hairline separators between items ── */
        .nav-sep {
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 1px;
          flex-shrink: 0;
        }
      `}</style>

      <nav className="glass-nav" role="navigation" aria-label="Main navigation">
        {items.map(({ id, label, Icon }, i) => {
          const active = activeTab === id;
          return (
            <div key={id} style={{ display: "contents" }}>
              {i > 0 && <div className="nav-sep" aria-hidden="true" />}
              <button
                type="button"
                data-tab={id}
                className={`nav-btn${active ? " active" : ""}`}
                onClick={() => handleTab(id)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
                <span className="nav-label">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </>
  );
}
