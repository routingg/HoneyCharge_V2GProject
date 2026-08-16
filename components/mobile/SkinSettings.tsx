import { Car, Check } from "lucide-react";
import { useSkin, type HoneyChargeSkin } from "@/components/mobile/SkinProvider";

const previews: {
  id: HoneyChargeSkin;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    id: "epit",
    title: "HoneyCharge Charge",
    subtitle: "E-pit",
    description: "충전 상태 중심",
  },
  {
    id: "myhyundai",
    title: "HoneyCharge My Car",
    subtitle: "myHyundai",
    description: "차량 관리 중심",
  },
];

export function SkinSettings() {
  const { skin, setSkin } = useSkin();

  return (
    <section className="skin-settings" aria-label="화면 스타일 설정">
      <h1>화면 스타일</h1>
      <p className="skin-settings-hint">
        데이터는 그대로 유지되고, 보여주는 방식만 바뀌어요.
      </p>

      <div className="skin-preview-list">
        {previews.map((preview) => {
          const selected = skin === preview.id;
          return (
            <button
              key={preview.id}
              type="button"
              className={
                selected ? "skin-preview-card is-selected" : "skin-preview-card"
              }
              aria-pressed={selected}
              onClick={() => setSkin(preview.id)}
            >
              <span className={`skin-preview-mock is-${preview.id}`}>
                <Car size={22} strokeWidth={1.6} />
                <span className="skin-preview-mock-accent" />
                <strong>72%</strong>
              </span>
              <span className="skin-preview-copy">
                <strong>{preview.title}</strong>
                <small>{preview.subtitle}</small>
                <span>{preview.description}</span>
              </span>
              <span
                className={
                  selected
                    ? "skin-preview-radio is-selected"
                    : "skin-preview-radio"
                }
              >
                {selected ? <Check size={14} /> : null}
                {selected ? "사용 중" : "선택"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
