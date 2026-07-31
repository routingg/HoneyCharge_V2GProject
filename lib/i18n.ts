"use client";

import { createContext, useContext } from "react";
import type {
  Region,
  ScheduleAction,
  VehicleStatus,
} from "@/lib/types";

export type Language = "ko" | "en";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext =
  createContext<LanguageContextValue>({
    language: "ko",
    setLanguage: () => undefined,
  });

export function useLanguage() {
  return useContext(LanguageContext);
}

export const textFor = (
  language: Language,
  korean: string,
  english: string,
) => (language === "ko" ? korean : english);

const regionNames: Record<Region, Record<Language, string>> = {
  jeju: { ko: "제주", en: "Jeju" },
  honam: { ko: "호남", en: "Honam" },
};

const actionNames: Record<
  ScheduleAction,
  Record<Language, string>
> = {
  charge: { ko: "충전", en: "Charge" },
  discharge: { ko: "방전", en: "Discharge" },
  standby: { ko: "대기", en: "Standby" },
};

const statusNames: Record<
  VehicleStatus,
  Record<Language, string>
> = {
  charging: { ko: "충전 중", en: "Charging" },
  discharging: { ko: "방전 중", en: "Discharging" },
  standby: { ko: "대기", en: "Standby" },
  offline: { ko: "미연결", en: "Offline" },
  "not-enrolled": { ko: "미참여", en: "Not Enrolled" },
  full: { ko: "완충", en: "Fully Charged" },
};

const weatherConditions: Record<string, string> = {
  맑음: "Clear",
  "대체로 맑음": "Mostly Clear",
  "구름 조금": "Partly Cloudy",
  "구름 많음": "Mostly Cloudy",
  흐림: "Overcast",
  안개: "Fog",
  이슬비: "Drizzle",
  "약한 비": "Light Rain",
  비: "Rain",
  눈: "Snow",
  소나기: "Rain Showers",
  "눈 소나기": "Snow Showers",
  뇌우: "Thunderstorm",
  "기상 관측": "Current Conditions",
};

const compassDirections: Record<string, string> = {
  북: "N",
  북북동: "NNE",
  북동: "NE",
  동북동: "ENE",
  동: "E",
  동남동: "ESE",
  남동: "SE",
  남남동: "SSE",
  남: "S",
  남남서: "SSW",
  남서: "SW",
  서남서: "WSW",
  서: "W",
  서북서: "WNW",
  북서: "NW",
  북북서: "NNW",
  "지평선 아래": "Below Horizon",
  "계산 불가": "Unavailable",
};

const windZones: Record<string, string> = {
  "컷인 미만 · 발전 대기": "Below Cut-in · Idle",
  "증속 구간 · 출력 상승":
    "Ramp-up Range · Output Rising",
  "정격 구간 · 출력 유지": "Rated Range · Full Output",
  "컷아웃 이상 · 안전 정지":
    "Above Cut-out · Safety Shutdown",
};

const scheduleReasons: Record<string, string> = {
  "충전기에 연결되지 않아 제어 대상에서 제외":
    "Charger disconnected; excluded from control.",
  "출발 전 목표 충전량 확보를 최우선으로 배정":
    "Priority assigned to reaching the target SOC before departure.",
  "재생에너지 잉여 전력을 차량 배터리에 저장":
    "Store surplus renewable energy in the vehicle battery.",
  "피크 수요를 지원하되 최소 보장 잔량 유지":
    "Support peak demand while maintaining the minimum SOC.",
  "V2G 미동의 차량으로 제어·포인트 대상에서 제외":
    "Not opted in; excluded from V2G control and rewards.",
  "전력 수급 차이가 기준값 이내이거나 배터리 보호 구간":
    "Supply-demand gap is within the threshold or battery protection is active.",
};

const vehicleModels: Record<string, string> = {
  "아이오닉 5": "IONIQ 5",
  "아이오닉 6": "IONIQ 6",
  "니로 EV": "Niro EV",
  "코나 일렉트릭": "KONA Electric",
  "테슬라 Model 3": "Tesla Model 3",
  "폴스타 2": "Polestar 2",
  "볼트 EV": "Bolt EV",
  "내 전기차": "My EV",
};

export const regionNameFor = (
  region: Region,
  language: Language,
) => regionNames[region][language];

export const actionNameFor = (
  action: ScheduleAction,
  language: Language,
) => actionNames[action][language];

export const statusNameFor = (
  status: VehicleStatus,
  language: Language,
) => statusNames[status][language];

function translatedOrOriginal(
  value: string,
  language: Language,
  dictionary: Record<string, string>,
) {
  return language === "ko" ? value : dictionary[value] ?? value;
}

export const weatherConditionFor = (
  condition: string,
  language: Language,
) =>
  translatedOrOriginal(
    condition,
    language,
    weatherConditions,
  );

export const compassDirectionFor = (
  direction: string,
  language: Language,
) =>
  translatedOrOriginal(
    direction,
    language,
    compassDirections,
  );

export const windZoneFor = (
  zone: string,
  language: Language,
) => translatedOrOriginal(zone, language, windZones);

export const scheduleReasonFor = (
  reason: string,
  language: Language,
) => translatedOrOriginal(reason, language, scheduleReasons);

export const vehicleModelFor = (
  model: string,
  language: Language,
) => translatedOrOriginal(model, language, vehicleModels);
