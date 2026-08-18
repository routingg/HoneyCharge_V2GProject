"use client";

import { useMemo, useState } from "react";
import { Wand2 } from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { EpitFocusScreen } from "@/components/mobile/EpitFocusScreen";
import { EpitHome } from "@/components/mobile/EpitHome";
import { EpitPncFlow } from "@/components/mobile/EpitPncFlow";
import { EpitRewards } from "@/components/mobile/EpitRewards";
import { EpitSocSettings } from "@/components/mobile/EpitSocSettings";
import { EpitStationMap } from "@/components/mobile/EpitStationMap";
import { EpitV2GSchedule } from "@/components/mobile/EpitV2GSchedule";
import { EpitVehicle } from "@/components/mobile/EpitVehicle";
import { MyHyundaiHome } from "@/components/mobile/MyHyundaiHome";
import { MyHyundaiSocSettings } from "@/components/mobile/MyHyundaiSocSettings";
import { MyHyundaiStationMap } from "@/components/mobile/MyHyundaiStationMap";
import { MyHyundaiV2GSchedule } from "@/components/mobile/MyHyundaiV2GSchedule";
import { MyHyundaiVehicle } from "@/components/mobile/MyHyundaiVehicle";
import { MyHyundaiWallet } from "@/components/mobile/MyHyundaiWallet";
import { NotificationsScreen } from "@/components/mobile/NotificationsScreen";
import { CalendarSettingsScreen } from "@/components/mobile/CalendarSettingsScreen";
import { SkinProvider, useSkin } from "@/components/mobile/SkinProvider";
import { SkinSettings } from "@/components/mobile/SkinSettings";
import { SkinSwitcher } from "@/components/mobile/SkinSwitcher";
import { useLiveMobility } from "@/components/mobile/useLiveMobility";
import { DEMO_CURRENT_HOUR } from "@/lib/data/mockData";
import {
  deriveEnergyState,
  estimateRangeKm,
  getChargeCompleteEta,
  getDemoUserSchedule,
  getEnergySignalCopy,
  getRecommendedMinimumSoc,
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
  | "focus"
  | "pnc"
  | "calendar"
  | "notifications";

const TIME_JUMP_PRESETS: { label: string; minutes: number }[] = [
  { label: "+2시간", minutes: 120 },
  { label: "+6시간", minutes: 360 },
  { label: "+12시간", minutes: 720 },
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
  const [hour] = useState(DEMO_CURRENT_HOUR);
  const live = useLiveMobility();

  // "focus" and "pnc" only exist as E-pit screens — if the presenter
  // switches skin mid-flow, render Home instead of nothing (derived,
  // not stored, so it never needs an effect to "catch up").
  const view: MobileView =
    (rawView === "focus" || rawView === "pnc") && skin !== "epit"
      ? "home"
      : rawView;

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
  return (
    <div className="hc-mobile" data-skin={skin}>
      <div className="mobile-shell">
        <div className="presenter-strip">
          <div className="demo-clock-bar" role="group" aria-label="시연 시나리오 제어">
            <span>DEMO</span>
            <div>
              {TIME_JUMP_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => live.jumpBy(preset.minutes)}
                >
                  {preset.label}
                </button>
              ))}
              <button type="button" onClick={live.triggerScheduleChange}>
                <Wand2 size={11} style={{ display: "inline", marginRight: 3 }} />
                일정 변경
              </button>
              <button type="button" onClick={live.reset}>
                초기화
              </button>
            </div>
          </div>
          <SkinSwitcher />
        </div>

        {view === "home" && live.vm &&
          (skin === "epit" ? (
            <EpitHome
              vm={vm}
              mvm={live.vm}
              scheduleChangeDiff={live.scheduleChangeDiff}
              onDismissScheduleChange={live.dismissScheduleChangeDiff}
              fetchExplanation={live.fetchExplanation}
              fetchMobilityInsight={live.fetchMobilityInsight}
              onNavigate={setView}
              onOpenSettings={() => setView("settings")}
              onOpenFocus={() => setView("focus")}
              onOpenCalendar={() => setView("calendar")}
              onOpenNotifications={() => setView("notifications")}
              notificationCount={live.notifications.length}
            />
          ) : (
            <MyHyundaiHome
              vm={vm}
              mvm={live.vm}
              scheduleChangeDiff={live.scheduleChangeDiff}
              onDismissScheduleChange={live.dismissScheduleChangeDiff}
              fetchExplanation={live.fetchExplanation}
              fetchMobilityInsight={live.fetchMobilityInsight}
              onNavigate={setView}
              onOpenSettings={() => setView("settings")}
              onOpenCalendar={() => setView("calendar")}
              onOpenNotifications={() => setView("notifications")}
              notificationCount={live.notifications.length}
            />
          ))}

        {view === "focus" && skin === "epit" && (
          <EpitFocusScreen vm={vm} onBack={() => setView("home")} />
        )}

        {view === "pnc" && skin === "epit" && (
          <EpitPncFlow
            vehicleModel={vm.vehicle.model}
            onDone={() => setView("home")}
          />
        )}

        {view === "settings" && <SkinSettings />}

        {view === "calendar" && (
          <CalendarSettingsScreen
            calendarEnabled={live.calendarEnabled}
            onToggle={live.setCalendarEnabled}
            events={live.calendarEvents}
          />
        )}

        {view === "notifications" && (
          <NotificationsScreen events={live.notifications} />
        )}

        {view === "v2g" && live.vm &&
          (skin === "epit" ? (
            <EpitV2GSchedule
              mvm={live.vm}
              v2gEnabled={live.v2gEnabled}
              onToggleV2g={live.setV2gEnabled}
              onChangeHardMinimumSoc={live.setHardMinimumSoc}
            />
          ) : (
            <MyHyundaiV2GSchedule
              mvm={live.vm}
              v2gEnabled={live.v2gEnabled}
              onToggleV2g={live.setV2gEnabled}
              onChangeHardMinimumSoc={live.setHardMinimumSoc}
            />
          ))}
        {view === "soc" && live.vm &&
          (skin === "epit" ? (
            <EpitSocSettings mvm={live.vm} onSave={live.setHardMinimumSoc} />
          ) : (
            <MyHyundaiSocSettings mvm={live.vm} onSave={live.setHardMinimumSoc} />
          ))}
        {view === "stations" &&
          (skin === "epit" ? (
            <EpitStationMap onReserve={() => setView("pnc")} />
          ) : (
            <MyHyundaiStationMap />
          ))}
        {view === "rewards" &&
          (skin === "epit" ? (
            <EpitRewards schedule={schedule} />
          ) : (
            <MyHyundaiWallet schedule={schedule} />
          ))}
        {view === "myVehicle" && live.vm && live.pattern &&
          (skin === "epit" ? (
            <EpitVehicle mvm={live.vm} pattern={live.pattern} />
          ) : (
            <MyHyundaiVehicle mvm={live.vm} pattern={live.pattern} />
          ))}

        <BottomNav
          view={
            view === "settings" ||
            view === "focus" ||
            view === "pnc" ||
            view === "calendar" ||
            view === "notifications"
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
