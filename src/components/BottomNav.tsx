import { Gift, Package2, Sparkles, User } from "lucide-react";
import { useRef, useEffect, useState, useLayoutEffect } from "react";

type Tab = "home" | "inventory" | "cases" | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const haptic = {
  light: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred("light"); } catch {}
  },
};

const tabs = [
  { id: "home",      label: "Home",      icon: Gift     },
  { id: "inventory", label: "Inventory", icon: Package2 },
  { id: "cases",     label: "Cases",     icon: Sparkles },
  { id: "profile",   label: "Me",        icon: User     },
] as const;

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  const [pressed, setPressed]     = useState<string | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const barRef    = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure and position the sliding pill under the active tab
  const updatePill = () => {
    const idx = tabs.findIndex(t => t.id === activeTab);
    const el  = tabRefs.current[idx];
    const bar = barRef.current;
    if (!el || !bar) return;
    const barRect = bar.getBoundingClientRect();
    const elRect  = el.getBoundingClientRect();
    setPillStyle({
      left:    elRect.left - barRect.left,
      width:   elRect.width,
      opacity: 1,
    });
  };

  useLayoutEffect(() => { updatePill(); }, [activeTab]);

  useEffect(() => {
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [activeTab]);

  const handlePress = (id: Tab) => {
    haptic.light();
    if (id !== activeTab) setActiveTab(id);
    setPressed(id);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressed(null), 220);
  };

  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .bn-wrap {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: calc(100% - 32px);
          max-width: 420px;
          font-family: -apple-system, 'SF Pro Text', 'Inter', BlinkMacSystemFont, sans-serif;
        }

        /* ── Main bar ── */
        .bn-bar {
          position: relative;
          display: flex;
          align-items: center;
          padding: 5px;
          gap: 4px;
          border-radius: 999px;
          background: rgba(28, 28, 30, 0.82);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow:
            0 6px 32px rgba(0,0,0,0.38),
            0 1px 0  rgba(255,255,255,0.06) inset,
            0 -1px 0 rgba(0,0,0,0.25) inset;
        }

        /* Specular top edge */
        .bn-bar::after {
          content: '';
          position: absolute;
          top: 0; left: 16px; right: 16px;
          height: 1px;
          border-radius: 999px;
          background: linear-gradient(90deg,
            transparent,
            rgba(255,255,255,0.18) 30%,
            rgba(255,255,255,0.24) 50%,
            rgba(255,255,255,0.18) 70%,
            transparent
          );
          pointer-events: none;
        }

        /* ── Sliding pill indicator ── */
        .bn-pill {
          position: absolute;
          top: 5px;
          bottom: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.11);
          border: 1px solid rgba(255,255,255,0.17);
          box-shadow:
            0 2px 12px rgba(0,0,0,0.22),
            0 1px 0 rgba(255,255,255,0.16) inset,
            0 -1px 0 rgba(0,0,0,0.14) inset;
          /* Spring-like transition — fast start, soft land */
          transition:
            left  0.38s cubic-bezier(0.28, 0.84, 0.42, 1),
            width 0.38s cubic-bezier(0.28, 0.84, 0.42, 1),
            opacity 0.18s ease;
          pointer-events: none;
          z-index: 0;
          will-change: left, width;
        }

        /* Pill inner shimmer */
        .bn-pill::before {
          content: '';
          position: absolute;
          top: 0; left: 12px; right: 12px;
          height: 1px;
          border-radius: 999px;
          background: linear-gradient(90deg,
            transparent,
            rgba(255,255,255,0.30) 40%,
            rgba(255,255,255,0.38) 50%,
            rgba(255,255,255,0.30) 60%,
            transparent
          );
        }

        /* ── Individual tab ── */
        .bn-tab {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 56px;
          border-radius: 999px;
          cursor: pointer;
          overflow: visible;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          z-index: 1;
          /* Subtle press scale */
          transition: transform 0.14s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bn-tab.bn-pressed {
          transform: scale(0.90);
        }

        /* ── Icon ── */
        .bn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            color   0.22s ease,
            transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
          color: rgba(255,255,255,0.30);
        }

        .bn-tab.bn-active .bn-icon {
          color: rgba(255,255,255,0.96);
          transform: translateY(-1.5px);
        }

        /* ── Label ── */
        .bn-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.26);
          transition:
            color      0.22s ease,
            opacity    0.22s ease,
            transform  0.22s ease;
          transform: translateY(0px);
        }

        .bn-tab.bn-active .bn-label {
          color: rgba(255,255,255,0.88);
          font-weight: 600;
        }

        /* ── Tiny dot below label — iOS style ── */
        .bn-dot {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          width: 3.5px;
          height: 3.5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
          transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
          pointer-events: none;
        }

        .bn-tab.bn-active .bn-dot {
          transform: translateX(-50%) scale(1);
        }
      `}</style>

      <div className="bn-wrap">
        <div className="bn-bar" ref={barRef}>

          {/* Sliding glass pill */}
          <div className="bn-pill" style={pillStyle} />

          {tabs.map((tab, i) => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            const isPressed = pressed === tab.id;

            return (
              <div
                key={tab.id}
                ref={el => { tabRefs.current[i] = el; }}
                className={[
                  "bn-tab",
                  isActive  ? "bn-active"  : "",
                  isPressed ? "bn-pressed" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => handlePress(tab.id as Tab)}
              >
                <div className="bn-icon">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.65} />
                </div>

                <span className="bn-label">{tab.label}</span>

                <div className="bn-dot" />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
