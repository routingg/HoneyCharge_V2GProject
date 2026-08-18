"use client";

import { useState } from "react";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import { deriveDisplayEnergyState, type MobilityHomeViewModel } from "@/lib/services/liveMobilityService";

const SLIDER_MIN = 10;
const SLIDER_MAX = 60;
const SLIDER_TICKS = [10, 20, 35, 50, 60];

/** myHyundai의 차량-제어 슬라이더 문법을 재현한 배터리 안심 설정. hardMinimumSoc는 절대 하한선이에요. */
export function MyHyundaiSocSettings({
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
    <section className="myhv-screen">
      <h1 className="myhv-title">배터리 안심 설정</h1>

      <div className="myhv-stage myhv-soc-stage">
        <VehicleGlyph state={deriveDisplayEnergyState(mvm)} />
      </div>

      <dl className="myhv-rows myhv-soc-rows">
        <div>
          <dt>현재 SOC</dt>
          <dd>{Math.round(mvm.currentSoc)}%</dd>
        </div>
        <div>
          <dt>자동 보호 SOC</dt>
          <dd>{Math.round(mvm.guaranteedSoc)}%</dd>
        </div>
        <div>
          <dt>내 최소 설정</dt>
          <dd>{draftMinimumSoc}%</dd>
        </div>
      </dl>

      <div className="myh-slider-block">
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          value={draftMinimumSoc}
          onChange={(event) =>
            setDraftMinimumSoc(Number(event.target.value))
          }
          className="myh-slider"
          style={{ ["--fill" as string]: `${fillPercent}%` }}
          aria-label="내가 원하는 최소 배터리"
        />
        <div className="myh-slider-ticks">
          {SLIDER_TICKS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      <button type="button" className="myh-blue-cta" onClick={() => onSave(draftMinimumSoc)}>
        최소 배터리 {draftMinimumSoc}%로 저장
      </button>
    </section>
  );
}
