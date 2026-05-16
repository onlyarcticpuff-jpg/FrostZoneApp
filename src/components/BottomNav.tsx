type Tab = "home" | "vault" | "drops" | "track" | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const items: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "❄️" },
  { id: "vault", label: "Vault", icon: "🧊" },
  { id: "drops", label: "Drops", icon: "💎" },
  { id: "track", label: "Track", icon: "📡" },
  { id: "profile", label: "Me", icon: "👤" },
];

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={activeTab === item.id ? "nav-item active" : "nav-item"}
          onClick={() => setActiveTab(item.id)}
        >
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}
