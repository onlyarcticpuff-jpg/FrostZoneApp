import { Gift, Package2, Sparkles, User } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type Tab = "home" | "inventory" | "cases" | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs = [
  { id: "home",      label: "Home",      icon: Gift     },
  { id: "inventory", label: "Inventory", icon: Package2 },
  { id: "cases",     label: "Cases",     icon: Sparkles },
  { id: "profile",   label: "Me",        icon: User     },
] as const;

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  const [ripple, setRipple] = useState<{ id: string; key: number } | null>(null);
  const rippleKey = useRef(0);

  const handlePress = (id: Tab) => {
    rippleKey.current += 1;
    setRipple({ id, key: rippleKey.current });
    setActiveTab(id);
  };

  useEffect(() => {
    if (!ripple) return;
    const t = setTimeout(() => setRipple(null), 600);
    return () => clearTimeout(t);
  }, [ripple]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600&display=swap');

        /* ── Outer wrap ── */
        .bn-wrap {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: calc(100% - 32px);
          max-width: 420px;
          font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif;
        }

        /* ── Glass pill container ── */
        .bn-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 8px;
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.28),
            0 1px 0 rgba(255, 255, 255, 0.12) inset,
            0 -1px 0 rgba(0, 0, 0, 0.2) inset;
        }

        /* ── Individual tab pill ── */
        .bn-tab {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 60px;
          border-radius: 24px;
          cursor: pointer;
          overflow: hidden;
          transition:
            transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            background 0.3s ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        /* ── Inactive glass button bg ── */
        .bn-tab::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.0);
          border: 1px solid rgba(255, 255, 255, 0.0);
          transition:
            background 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        /* ── Active glass button bg ── */
        .bn-tab.bn-active::before {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.28);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.18),
            0 1px 0 rgba(255, 255, 255, 0.25) inset,
            0 -1px 0 rgba(0, 0, 0, 0.12) inset;
        }

        /* ── Hover: subtle glass lift ── */
        .bn-tab:not(.bn-active):hover::before {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* ── Press scale ── */
        .bn-tab:active {
          transform: scale(0.91);
        }

        /* ── Icon container ── */
        .bn-icon {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            color 0.25s ease;
          color: rgba(255, 255, 255, 0.38);
        }

        .bn-tab.bn-active .bn-icon {
          color: rgba(255, 255, 255, 1);
          transform: translateY(-1px) scale(1.12);
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.45));
        }

        /* ── Label ── */
        .bn-label {
          position: relative;
          z-index: 1;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: rgba(255, 255, 255, 0.38);
          transition:
            color 0.25s ease,
            opacity 0.25s ease,
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateY(0);
        }

        .bn-tab.bn-active .bn-label {
          color: rgba(255, 255, 255, 0.95);
          transform: translateY(1px);
        }

        /* ── Active dot indicator ── */
        .bn-dot {
          position: absolute;
          bottom: 7px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 0 6px rgba(255,255,255,0.6);
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
        }

        .bn-tab.bn-active .bn-dot {
          transform: translateX(-50%) scale(1);
        }

        /* ── Ripple ── */
        .bn-ripple {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          pointer-events: none;
          z-index: 0;
        }

        .bn-ripple::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.22);
          animation: bn-ripple-anim 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes bn-ripple-anim {
          0%   { opacity: 1; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(1.1); }
        }

        /* ── Sheen shimmer on active ── */
        .bn-sheen {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.12) 50%,
            transparent 70%
          );
          border-radius: 24px;
          pointer-events: none;
          z-index: 0;
          animation: none;
        }

        .bn-tab.bn-active .bn-sheen {
          animation: bn-sheen-sweep 2.4s ease-in-out infinite;
          animation-delay: 0.15s;
        }

        @keyframes bn-sheen-sweep {
          0%   { left: -80%; opacity: 0; }
          20%  { opacity: 1; }
          60%  { left: 140%; opacity: 0; }
          100% { left: 140%; opacity: 0; }
        }

        /* ── Specular top highlight ── */
        .bn-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 12px;
          right: 12px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.35) 30%,
            rgba(255,255,255,0.5) 50%,
            rgba(255,255,255,0.35) 70%,
            transparent
          );
          border-radius: 999px;
          pointer-events: none;
        }

        .bn-bar {
          position: relative;
        }
      `}</style>

      <div className="bn-wrap">
        <div className="bn-bar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showRipple = ripple?.id === tab.id;

            return (
              <div
                key={tab.id}
                className={`bn-tab${isActive ? " bn-active" : ""}`}
                onClick={() => handlePress(tab.id as Tab)}
              >
                {/* Sheen */}
                <div className="bn-sheen" />

                {/* Ripple on press */}
                {showRipple && (
                  <div key={ripple!.key} className="bn-ripple" />
                )}

                {/* Icon */}
                <div className="bn-icon">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>

                {/* Label */}
                <span className="bn-label">{tab.label}</span>

                {/* Active indicator dot */}
                <div className="bn-dot" />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
