import {
  Gift,
  Package2,
  Sparkles,
  User,
} from "lucide-react";

type Tab =
  | "home"
  | "inventory"
  | "cases"
  | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs = [
  {
    id: "home",
    label: "Home",
    icon: Gift,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package2,
  },
  {
    id: "cases",
    label: "Cases",
    icon: Sparkles,
  },
  {
    id: "profile",
    label: "Me",
    icon: User,
  },
];

export default function BottomNav({
  activeTab,
  setActiveTab,
}: Props) {
  return (
    <>
      <style>{`
        .dock-wrap {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 18px;
          width: calc(100% - 26px);
          max-width: 400px;
          z-index: 999;
        }

        .dock {
          height: 76px;
          border-radius: 999px;
          background: rgba(18,18,18,0.92);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }

        .dock-item {
          width: 78px;
          height: 58px;
          border-radius: 999px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: rgba(255,255,255,0.38);
          font-size: 11px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .dock-item.active {
          background: rgba(255,255,255,0.08);
          color: white;
        }
      `}</style>

      <div className="dock-wrap">
        <div className="dock">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <div
                key={tab.id}
                className={`dock-item ${
                  activeTab === tab.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab(tab.id as Tab)
                }
              >
                <Icon size={20} />

                {tab.label}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
