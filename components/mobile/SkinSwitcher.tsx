import { useSkin } from "@/components/mobile/SkinProvider";

/** 발표용 빠른 스킨 전환 필입니다. 시연 시각 스트립 옆에 붙습니다. */
export function SkinSwitcher() {
  const { skin, setSkin } = useSkin();

  return (
    <div className="skin-switcher" role="group" aria-label="화면 스타일 빠른 전환">
      <button
        type="button"
        className={skin === "epit" ? "active" : ""}
        onClick={() => setSkin("epit")}
      >
        Charge
      </button>
      <button
        type="button"
        className={skin === "myhyundai" ? "active" : ""}
        onClick={() => setSkin("myhyundai")}
      >
        My Car
      </button>
    </div>
  );
}
