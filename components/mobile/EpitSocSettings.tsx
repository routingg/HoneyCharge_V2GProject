"use client";

import { useState } from "react";
import type { MobilityHomeViewModel } from "@/lib/services/liveMobilityService";

const SLIDER_MIN = 10;
const SLIDER_MAX = 60;

/** E-pit 컴팩트 카드 문법을 쓴 최소 SOC 설정. hardMinimumSoc는 자동 보호 SOC의 절대 하한선이에요. */
export function EpitSocSettings({
  mvm,
  onSave,
}: {
  mvm: MobilityHomeViewModel;
  onSave: (value: number) => void;
}) {
  const [draftMinimumSoc, setDraftMinimumSoc] = useState(mvm.hardMinimumSoc);
  const fillPercent =
    ((draftMinimumSoc - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <div className="epit-v2g">
      <div className="epit-v2g-summary">
        <div>
          <span>현재 SOC</span>
          <strong>{Math.round(mvm.currentSoc)}%</strong>
        </div>
        <div>
          <span>자동 보호 SOC</span>
          <strong className="is-accent">{Math.round(mvm.guaranteedSoc)}%</strong>
        </div>
        <div>
          <span>내 최소 설정</span>
          <strong>{draftMinimumSoc}%</strong>
        </div>
      </div>

      <div className="epit-mint-card epit-soc-card">
        <p>
          내가 원하는 최소 배터리를 설정하면, HoneyCharge는 계산된 자동 보호 SOC가 이보다
          낮아지더라도 절대 이 값 아래로 방전하지 않아요.
        </p>
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          value={draftMinimumSoc}
          onChange={(event) =>
            setDraftMinimumSoc(Number(event.target.value))
          }
          className="epit-slider"
          style={{ ["--fill" as string]: `${fillPercent}%` }}
          aria-label="내가 원하는 최소 배터리"
        />
        <button
          type="button"
          className="epit-btn-filled epit-soc-save"
          onClick={() => onSave(draftMinimumSoc)}
        >
          {draftMinimumSoc}%로 저장
        </button>
      </div>
    </div>
  );
}
