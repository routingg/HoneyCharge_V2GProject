"use client";

import { useState } from "react";
import type { HomeViewModel } from "@/lib/services/mobileHomeService";

const SLIDER_MIN = 40;
const SLIDER_MAX = 80;

/** E-pit 컴팩트 카드 문법을 쓴 최소 SOC 설정. */
export function EpitSocSettings({ vm }: { vm: HomeViewModel }) {
  const [draftMinimumSoc, setDraftMinimumSoc] = useState(vm.minimumSoc);
  const fillPercent =
    ((draftMinimumSoc - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <div className="epit-v2g">
      <div className="epit-v2g-summary">
        <div>
          <span>현재 SOC</span>
          <strong>{Math.round(vm.soc)}%</strong>
        </div>
        <div>
          <span>최소 보장</span>
          <strong className="is-accent">{draftMinimumSoc}%</strong>
        </div>
        <div>
          <span>자동 추천</span>
          <strong>{vm.recommendedMinimumSoc}%</strong>
        </div>
      </div>

      <div className="epit-mint-card epit-soc-card">
        <p>최소 보장 SOC를 조정하면 V2G가 공유할 수 있는 여유 배터리 범위가 바뀌어요.</p>
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
          aria-label="최소 보장 SOC"
        />
        <button type="button" className="epit-btn-filled epit-soc-save">
          {draftMinimumSoc}%로 저장 (DEMO)
        </button>
      </div>
    </div>
  );
}
