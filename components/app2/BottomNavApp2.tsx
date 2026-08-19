import { CarFront, Gift, Home, PlugZap } from "lucide-react";

export type App2View = "home" | "stations" | "map" | "rewards" | "vehicle";
type NavView = Exclude<App2View, "map">;

const items: { id: NavView; label: string; icon: typeof Home }[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "stations", label: "충전소", icon: PlugZap },
  { id: "rewards", label: "리워드", icon: Gift },
  { id: "vehicle", label: "내 차량", icon: CarFront },
];

/**
 * §12: kept intentionally simple (same idea as /mobile's BottomNav) —
 * no frosted/liquid-glass treatment in this web MVP. See app2.css's
 * `.a2-bottom-nav` block for the future-native note (§13).
 */
export function BottomNavApp2({
  view,
  onNavigate,
}: {
  view: NavView;
  onNavigate: (view: App2View) => void;
}) {
  return (
    <nav className="a2-bottom-nav" aria-label="주요 메뉴">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={view === id ? "a2-bottom-nav-item active" : "a2-bottom-nav-item"}
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
