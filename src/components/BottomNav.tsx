import { PackageOpen, Backpack, Store, FlaskConical, User } from "lucide-react";
import { useRef } from "react";

type Tab = "open" | "inventory" | "market" | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const haptic = {
  light: () => window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light"),
  selection: () => window?.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.(),
};

const items: {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "open", label: "Open", Icon: PackageOpen },
  { id: "inventory", label: "Inventory", Icon: Backpack },
  { id: "market", label: "Market", Icon: Store },
  { id: "profile", label: "Me", Icon: User },
];

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  const prevTab = useRef<Tab>(activeTab);

  function handleTab(id: Tab) {
    if (id === activeTab) {
      haptic.light();
      return;
    }

    haptic.selection();
    prevTab.current = activeTab;
    setActiveTab(id);
  }

  return (
    <>
      <style>{`
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
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.42),
            0 1px 0 rgba(255, 255, 255, 0.12) inset;
        }

        .nav-btn {
          position: relative;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 0;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.18s ease;
        }

        .nav-btn:active {
          transform: scale(0.9);
        }

        .nav-btn.active {
          background: rgba(255, 255, 255, 0.11);
          border: 1px solid rgba(255, 255, 255, 0.14);
          transform: scale(1.05);
        }

        .nav-btn.active::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          box-shadow: 0 0 16px 3px var(--tab-accent);
          opacity: 0.22;
          pointer-events: none;
        }

        .nav-btn svg {
          position: relative;
          z-index: 1;
          color: rgba(255, 255, 255, 0.36);
          transition: color 0.18s ease, filter 0.18s ease;
        }

        .nav-btn.active svg {
          color: var(--tab-accent);
          filter: drop-shadow(0 0 5px var(--tab-accent));
        }

        .nav-label {
          position: relative;
          z-index: 1;
          font-size: 8.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.32);
          line-height: 1;
          font-family: -apple-system, "SF Pro Rounded", system-ui, sans-serif;
        }

        .nav-btn.active .nav-label {
          color: var(--tab-accent);
        }

        .nav-btn[data-tab="open"] { --tab-accent: #60a5fa; }
        .nav-btn[data-tab="inventory"] { --tab-accent: #a78bfa; }
        .nav-btn[data-tab="market"] { --tab-accent: #34d399; }
        .nav-btn[data-tab="lab"] { --tab-accent: #fb923c; }
        .nav-btn[data-tab="profile"] { --tab-accent: #f472b6; }

        .nav-sep {
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 999px;
        }
      `}</style>

      <nav className="glass-nav">
        {items.map(({ id, label, Icon }, i) => {
          const active = activeTab === id;

          return (
            <div key={id} style={{ display: "contents" }}>
              {i > 0 && <div className="nav-sep" />}
              <button
                type="button"
                data-tab={id}
                className={`nav-btn${active ? " active" : ""}`}
                onClick={() => handleTab(id)}
                aria-label={label}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.85} />
                <span className="nav-label">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </>
  );
                                                     }
