import {
  Gift,
  Package2,
  Sparkles,
  User,
} from "lucide-react";

type Tab =
  | "store"
  | "inventory"
  | "market"
  | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs = [
  {
    id: "store",
    label: "Store",
    icon: Gift,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package2,
  },
  {
    id: "market",
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
        .dock {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 20px;
          width: calc(100% - 28px);
          max-width: 400px;
          height: 74px;
          border-radius: 999px;
          background: rgba(20,20,20,0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 999;
        }

        .dock-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: rgba(255,255,255,0.35);
          font-size: 11px;
          font-weight: 700;
        }

        .dock-item.active {
          color: white;
        }
      `}</style>

      <div className="dock">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <div
              key={tab.id}
              className={`dock-item ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id as Tab)}
            >
              <Icon size={20} />
              {tab.label}
            </div>
          );
        })}
      </div>
    </>
  );
}
