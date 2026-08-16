import { CarFront, Gift, Home, PlugZap, Zap } from "lucide-react";
import type { MobileView } from "@/components/mobile/MobileApp";

const items: { id: MobileView; label: string; icon: typeof Home }[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "v2g", label: "V2G", icon: Zap },
  { id: "stations", label: "충전소", icon: PlugZap },
  { id: "rewards", label: "리워드", icon: Gift },
  { id: "myVehicle", label: "내 차량", icon: CarFront },
];

export function BottomNav({
  view,
  onNavigate,
}: {
  view: MobileView;
  onNavigate: (view: MobileView) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={view === id ? "bottom-nav-item active" : "bottom-nav-item"}
          aria-current={view === id ? "page" : undefined}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
