import {
  Home,
  Shield,
  Search,
  Radar,
  User,
} from "lucide-react";

type Tab = "home" | "vault" | "drops" | "track" | "profile";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const items: {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "vault", label: "Vault", Icon: Shield },
  { id: "drops", label: "Search", Icon: Search },
  { id: "track", label: "Track", Icon: Radar },
  { id: "profile", label: "Me", Icon: User },
];

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map(({ id, label, Icon }) => {
        const active = activeTab === id;

        return (
          <button
            key={id}
            className={active ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            <Icon size={21} strokeWidth={active ? 2.7 : 2.2} />
            <small>{label}</small>
          </button>
        );
      })}
    </nav>
  );
}
