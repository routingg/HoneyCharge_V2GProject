import type { VehicleEnergyState } from "@/lib/services/mobileHomeService";

/**
 * 순수 SVG 실루엣입니다. 특정 제조사·차종의 실제 렌더링을 모사하지 않고,
 * 일반화된 SUV형 전기차 형태만 표현합니다.
 */
export function VehicleGlyph({
  state,
}: {
  state: VehicleEnergyState;
}) {
  return (
    <div className={`vehicle-glyph is-${state}`} aria-hidden="true">
      <svg
        viewBox="0 -16 320 156"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          className="glyph-shadow"
          cx="160"
          cy="122"
          rx="118"
          ry="10"
        />
        <path
          className="glyph-body"
          d="M28 96
             C24 74 40 62 62 58
             L86 40
             C96 32 110 27 125 27
             L205 27
             C220 27 233 32 243 41
             L266 58
             C288 62 300 74 296 96
             C296 104 290 110 282 110
             L262 110
             C262 96 251 85 237 85
             C223 85 212 96 212 110
             L112 110
             C112 96 101 85 87 85
             C73 85 62 96 62 110
             L42 110
             C34 110 28 104 28 96 Z"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="glyph-glass"
          d="M96 40 L114 41 L108 58 L90 58 Z M132 40 L200 40 L206 58 L126 58 Z M220 40 L238 41 L254 58 L226 58 Z"
        />
        <circle className="glyph-wheel" cx="87" cy="110" r="19" />
        <circle className="glyph-wheel" cx="237" cy="110" r="19" />
        <circle className="glyph-hub" cx="87" cy="110" r="7" />
        <circle className="glyph-hub" cx="237" cy="110" r="7" />

        <g className="glyph-charge-flow">
          <path d="M160 8 L152 22 L162 22 L154 38" />
        </g>
        <g className="glyph-discharge-flow">
          <path d="M40 30 L18 30 M18 30 L26 22 M18 30 L26 38" />
          <path d="M280 30 L302 30 M302 30 L294 22 M302 30 L294 38" />
        </g>
        <g className="glyph-protect-badge">
          <circle cx="160" cy="6" r="15" />
          <path d="M160 -1 L166 2 V8 C166 12 163 15 160 16 C157 15 154 12 154 8 V2 Z" />
        </g>
      </svg>
    </div>
  );
}
