"use client";

import { useMemo, useState } from "react";
import { CarFront, Gift, PlugZap, Zap } from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Hero } from "@/components/mobile/Hero";
import { InfoGrid } from "@/components/mobile/InfoGrid";
import { PlaceholderScreen } from "@/components/mobile/PlaceholderScreen";
import { DEMO_CURRENT_HOUR } from "@/lib/data/mockData";
import {
  deriveEnergyState,
  estimateRangeKm,
  getChargeCompleteEta,
  getDemoUserSchedule,
  getEnergySignalCopy,
  getRecommendedMinimumSoc,
  getTodayV2GWindow,
} from "@/lib/services/mobileHomeService";
import { runSimulation } from "@/lib/services/simulationService";

export type MobileView =
  | "home"
  | "v2g"
  | "stations"
  | "rewards"
  | "myVehicle";

const DEMO_HOUR_PRESETS: { hour: number; label: string }[] = [
  { hour: 11, label: "11:00 여유" },
  { hour: 16, label: "16:00 대기" },
  { hour: 18, label: "18:00 공유" },
  { hour: 21, label: "21:00 보호" },
];

export function MobileApp() {
  const [view, setView] = useState<MobileView>("home");
  const [hour, setHour] = useState(DEMO_CURRENT_HOUR);

  const simulation = useMemo(() => runSimulation("jeju"), []);
  const schedule = useMemo(
    () => getDemoUserSchedule(simulation),
    [simulation],
  );

  const item = schedule.items[hour];
  const soc = item?.expectedSocAfter ?? schedule.vehicle.currentSoc;
  const energyState = deriveEnergyState(schedule, hour);
  const rangeKm = estimateRangeKm(schedule.vehicle, soc);
  const chargeEta = getChargeCompleteEta(schedule, hour);
  const v2gWindow = getTodayV2GWindow(schedule);
  const recommendedMinimumSoc = getRecommendedMinimumSoc(schedule.vehicle);
  const signalCopy = getEnergySignalCopy(simulation.energy[hour], v2gWindow);

  return (
    <div className="hc-mobile">
      <div className="mobile-shell">
        <div className="demo-clock-bar" role="group" aria-label="시연 시각 이동">
          <span>시연 시각</span>
          <div>
            {DEMO_HOUR_PRESETS.map((preset) => (
              <button
                key={preset.hour}
                type="button"
                className={hour === preset.hour ? "active" : ""}
                onClick={() => setHour(preset.hour)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {view === "home" && (
          <>
            <Hero
              vehicle={schedule.vehicle}
              soc={soc}
              rangeKm={rangeKm}
              energyState={energyState}
              powerKw={item?.powerKw ?? 0}
              chargeEta={chargeEta}
            />
            <InfoGrid
              minimumSoc={schedule.vehicle.minimumSoc}
              recommendedMinimumSoc={recommendedMinimumSoc}
              v2gWindow={v2gWindow}
              rewardPoints={schedule.rewardPoints}
              signalCopy={signalCopy}
              onNavigate={setView}
            />
          </>
        )}

        {view === "v2g" && (
          <PlaceholderScreen
            icon={Zap}
            title="V2G 일정"
            description="오늘과 이번 주의 전력 공유 일정을 한눈에 볼 수 있는 화면을 준비 중이에요."
          />
        )}
        {view === "stations" && (
          <PlaceholderScreen
            icon={PlugZap}
            title="충전소"
            description="주변 충전소 검색과 혼잡도 안내를 준비 중이에요."
          />
        )}
        {view === "rewards" && (
          <PlaceholderScreen
            icon={Gift}
            title="리워드"
            description="적립된 HoneyPoint 내역과 사용처를 준비 중이에요."
          />
        )}
        {view === "myVehicle" && (
          <PlaceholderScreen
            icon={CarFront}
            title="내 차량"
            description="최소 보장 SOC 설정과 차량 정보 관리를 준비 중이에요."
          />
        )}

        <BottomNav view={view} onNavigate={setView} />
      </div>
    </div>
  );
}
