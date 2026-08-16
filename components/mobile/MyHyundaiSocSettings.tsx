"use client";

import { useState } from "react";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import type { HomeViewModel } from "@/lib/services/mobileHomeService";

const SLIDER_MIN = 40;
const SLIDER_MAX = 80;
const SLIDER_TICKS = [40, 50, 60, 70, 80];

/** myHyundai의 차량-제어 슬라이더 문법을 재현한 배터리 안심 설정(스펙 §35~36). */
export function MyHyundaiSocSettings({ vm }: { vm: HomeViewModel }) {
  const [draftMinimumSoc, setDraftMinimumSoc] = useState(vm.minimumSoc);
  const fillPercent =
    ((draftMinimumSoc - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <section className="myhv-screen">
      <h1 className="myhv-title">배터리 안심 설정</h1>

      <div className="myhv-stage myhv-soc-stage">
        <VehicleGlyph state={vm.energyState} />
      </div>

      <dl className="myhv-rows myhv-soc-rows">
        <div>
          <dt>현재 SOC</dt>
          <dd>{Math.round(vm.soc)}%</dd>
        </div>
        <div>
          <dt>최소 보장</dt>
          <dd>{draftMinimumSoc}%</dd>
        </div>
        <div>
          <dt>자동 추천</dt>
          <dd>{vm.recommendedMinimumSoc}%</dd>
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
          aria-label="최소 보장 SOC"
        />
        <div className="myh-slider-ticks">
          {SLIDER_TICKS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      <button type="button" className="myh-blue-cta">
        최소 SOC {draftMinimumSoc}%로 저장 (DEMO)
      </button>
    </section>
  );
}
