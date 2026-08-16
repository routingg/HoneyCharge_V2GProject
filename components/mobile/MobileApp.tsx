"use client";

import { useMemo, useState } from "react";
import { CarFront, Gift } from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { EpitFocusScreen } from "@/components/mobile/EpitFocusScreen";
import { EpitHome } from "@/components/mobile/EpitHome";
import { EpitSocSettings } from "@/components/mobile/EpitSocSettings";
import { EpitStationMap } from "@/components/mobile/EpitStationMap";
import { EpitV2GSchedule } from "@/components/mobile/EpitV2GSchedule";
import { MyHyundaiHome } from "@/components/mobile/MyHyundaiHome";
import { MyHyundaiSocSettings } from "@/components/mobile/MyHyundaiSocSettings";
import { MyHyundaiStationMap } from "@/components/mobile/MyHyundaiStationMap";
import { MyHyundaiV2GSchedule } from "@/components/mobile/MyHyundaiV2GSchedule";
import { MyHyundaiVehicle } from "@/components/mobile/MyHyundaiVehicle";
import { PlaceholderScreen } from "@/components/mobile/PlaceholderScreen";
import { SkinProvider, useSkin } from "@/components/mobile/SkinProvider";
import { SkinSettings } from "@/components/mobile/SkinSettings";
import { SkinSwitcher } from "@/components/mobile/SkinSwitcher";
import { DEMO_CURRENT_HOUR } from "@/lib/data/mockData";
import {
  deriveEnergyState,
  estimateRangeKm,
  getChargeCompleteEta,
  getDemoUserSchedule,
  getEnergySignalCopy,
  getRecommendedMinimumSoc,
  getScheduleBlocks,
  getSessionEnergy,
  getTodayV2GWindow,
  type HomeViewModel,
} from "@/lib/services/mobileHomeService";
import { runSimulation } from "@/lib/services/simulationService";

export type MobileView =
  | "home"
  | "v2g"
  | "soc"
  | "stations"
  | "rewards"
  | "myVehicle"
  | "settings"
  | "focus";

const DEMO_HOUR_PRESETS: { hour: number; label: string }[] = [
  { hour: 11, label: "11:00 여유" },
  { hour: 16, label: "16:00 대기" },
  { hour: 18, label: "18:00 공유" },
  { hour: 21, label: "21:00 보호" },
];

export function MobileApp() {
  return (
    <SkinProvider>
      <MobileShell />
    </SkinProvider>
  );
}

function MobileShell() {
  const { skin } = useSkin();
  const [rawView, setView] = useState<MobileView>("home");
  const [hour, setHour] = useState(DEMO_CURRENT_HOUR);

  // "focus" only exists as an E-pit screen — if the presenter switches
  // skin mid-flow, render Home instead of nothing (derived, not stored,
  // so it never needs an effect to "catch up").
  const view: MobileView =
    rawView === "focus" && skin !== "epit" ? "home" : rawView;

  const simulation = useMemo(() => runSimulation("jeju"), []);
  const schedule = useMemo(
    () => getDemoUserSchedule(simulation),
    [simulation],
  );

  const item = schedule.items[hour];
  const soc = item?.expectedSocAfter ?? schedule.vehicle.currentSoc;
  const energyState = deriveEnergyState(schedule, hour);
  const v2gWindow = getTodayV2GWindow(schedule);

  const vm: HomeViewModel = {
    vehicle: schedule.vehicle,
    soc,
    rangeKm: estimateRangeKm(schedule.vehicle, soc),
    energyState,
    powerKw: item?.powerKw ?? 0,
    chargeEta: getChargeCompleteEta(schedule, hour),
    minimumSoc: schedule.vehicle.minimumSoc,
    recommendedMinimumSoc: getRecommendedMinimumSoc(schedule.vehicle),
    v2gWindow,
    rewardPoints: schedule.rewardPoints,
    signalCopy: getEnergySignalCopy(simulation.energy[hour], v2gWindow),
    sessionEnergy: getSessionEnergy(schedule, hour),
  };
  const scheduleBlocks = useMemo(
    () => getScheduleBlocks(schedule),
    [schedule],
  );

  return (
    <div className="hc-mobile" data-skin={skin}>
      <div className="mobile-shell">
        <div className="presenter-strip">
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
          <SkinSwitcher />
        </div>

        {view === "home" &&
          (skin === "epit" ? (
            <EpitHome
              vm={vm}
              onNavigate={setView}
              onOpenSettings={() => setView("settings")}
              onOpenFocus={() => setView("focus")}
            />
          ) : (
            <MyHyundaiHome
              vm={vm}
              onNavigate={setView}
              onOpenSettings={() => setView("settings")}
            />
          ))}

        {view === "focus" && skin === "epit" && (
          <EpitFocusScreen vm={vm} onBack={() => setView("home")} />
        )}

        {view === "settings" && <SkinSettings />}

        {view === "v2g" &&
          (skin === "epit" ? (
            <EpitV2GSchedule
              blocks={scheduleBlocks}
              chargeEnergyKWh={schedule.chargeEnergyKWh}
              dischargeEnergyKWh={schedule.dischargeEnergyKWh}
              rewardPoints={schedule.rewardPoints}
            />
          ) : (
            <MyHyundaiV2GSchedule
              blocks={scheduleBlocks}
              chargeEnergyKWh={schedule.chargeEnergyKWh}
              dischargeEnergyKWh={schedule.dischargeEnergyKWh}
              rewardPoints={schedule.rewardPoints}
            />
          ))}
        {view === "soc" &&
          (skin === "epit" ? (
            <EpitSocSettings vm={vm} />
          ) : (
            <MyHyundaiSocSettings vm={vm} />
          ))}
        {view === "stations" &&
          (skin === "epit" ? <EpitStationMap /> : <MyHyundaiStationMap />)}
        {view === "rewards" && (
          <PlaceholderScreen
            icon={Gift}
            title="리워드"
            description="적립된 HoneyPoint 내역과 사용처를 준비 중이에요."
          />
        )}
        {view === "myVehicle" &&
          (skin === "myhyundai" ? (
            <MyHyundaiVehicle vm={vm} />
          ) : (
            <PlaceholderScreen
              icon={CarFront}
              title="마이카"
              description="차량 정보와 이용 내역을 준비 중이에요."
            />
          ))}

        <BottomNav
          view={
            view === "settings" || view === "focus"
              ? "home"
              : view === "soc"
                ? "myVehicle"
                : view
          }
          onNavigate={setView}
        />
      </div>
    </div>
  );
}
