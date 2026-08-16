"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap } from "lucide-react";

const STEP_DELAY_MS = 900;

/**
 * E-pit의 PnC(Plug & Charge) 연출을 재현합니다(스펙 §17). 실제 충전기
 * 하드웨어와 연동되지 않으므로 전 구간에 DEMO 배지를 붙여 시뮬레이션
 * 임을 분명히 합니다.
 */
export function EpitPncFlow({
  vehicleModel,
  onDone,
}: {
  vehicleModel: string;
  onDone: () => void;
}) {
  const labels = [
    "차량 확인 중",
    `${vehicleModel} 연결 완료`,
    "HoneyCharge V2G 준비 완료",
  ];
  const finalStep = labels.length + 1;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === 0 || step >= finalStep) return;
    const timer = window.setTimeout(() => {
      setStep((current) => current + 1);
    }, STEP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [step, finalStep]);

  return (
    <section className="epit-pnc">
      <span className="epit-pnc-badge">SIMULATED · DEMO</span>

      {step === 0 && (
        <>
          <span className="epit-pnc-icon">
            <PlugZap size={30} />
          </span>
          <p className="epit-pnc-lead">충전기를 연결해 주세요.</p>
          <p className="epit-pnc-sub">
            실제 충전기 하드웨어 연동 없이 연결 과정을 시뮬레이션합니다.
          </p>
          <button
            type="button"
            className="epit-btn-filled epit-pnc-start"
            onClick={() => setStep(1)}
          >
            연결 시뮬레이션 시작
          </button>
        </>
      )}

      {step >= 1 && (
        <ul className="epit-pnc-steps">
          {labels.slice(0, Math.min(step, labels.length)).map((label, index) => {
            const isCurrent = step <= labels.length && index === step - 1;
            return (
              <li key={label} className={isCurrent ? "is-current" : "is-done"}>
                {isCurrent ? (
                  <Loader2 size={22} className="epit-pnc-spin" />
                ) : (
                  <CheckCircle2 size={22} />
                )}
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {step >= finalStep && (
        <div className="epit-pnc-final">
          <p className="epit-pnc-final-title">
            자동 충전 / 방전 스케줄 적용
          </p>
          <p className="epit-pnc-sub">
            최소 보장 SOC를 지키면서 오늘의 V2G 스케줄대로 자동 진행돼요.
          </p>
          <button
            type="button"
            className="epit-btn-filled epit-pnc-start"
            onClick={onDone}
          >
            확인
          </button>
        </div>
      )}
    </section>
  );
}
