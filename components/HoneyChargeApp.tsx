"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BatteryCharging,
  CalendarClock,
  CarFront,
  ChevronRight,
  CircleGauge,
  Cloud,
  CloudSun,
  Compass,
  Database,
  Factory,
  Gauge,
  Info,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  PlugZap,
  ShieldCheck,
  Sun,
  Sparkles,
  ThermometerSun,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { InfrastructureMap } from "@/components/InfrastructureMap";
import {
  DEMO_CURRENT_HOUR,
  DEMO_DATE,
} from "@/lib/data/mockData";
import { CloudForecastMap } from "@/components/CloudForecastMap";
import {
  actionNameFor,
  compassDirectionFor,
  LanguageContext,
  regionNameFor,
  scheduleReasonFor,
  statusNameFor,
  textFor,
  useLanguage,
  vehicleModelFor,
  weatherConditionFor,
  windZoneFor,
  type Language,
} from "@/lib/i18n";
import { getLiveWeather } from "@/lib/services/liveWeatherService";
import { calculateGridBalance } from "@/lib/services/gridBalanceService";
import { getRenewableForecastBreakdown } from "@/lib/services/renewableForecastService";
import { settleSingleVehicleReward } from "@/lib/services/rewardSettlementService";
import { runSimulation } from "@/lib/services/simulationService";
import { getStayDurationHours } from "@/lib/services/stayDurationService";
import { scheduleVehicle } from "@/lib/services/v2gScheduler";
import { getVehicleDisplayStatus } from "@/lib/services/vehicleStatusService";
import type {
  AbsorptionHorizon,
  Region,
  Vehicle,
  VehicleSchedule,
  VehicleStatus,
  WeatherHour,
} from "@/lib/types";

type View = "dashboard" | "fleet" | "simulation";
type WeatherConnection = "loading" | "live" | "fallback";

const statusClassName: Record<VehicleStatus, string> = {
  charging: "status-charge",
  discharging: "status-discharge",
  standby: "status-standby",
  offline: "status-offline",
  "not-enrolled": "status-not-enrolled",
  full: "status-full",
};

const formatPower = (value: number, language: Language) =>
  new Intl.NumberFormat(language === "ko" ? "ko-KR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatMoney = (value: number, language: Language) =>
  new Intl.NumberFormat(language === "ko" ? "ko-KR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatWeatherTimestamp = (
  timestamp: string,
  language: Language,
) => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return textFor(language, "현재 시각", "Current time");
  }
  return new Intl.DateTimeFormat(
    language === "ko" ? "ko-KR" : "en-US",
    {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: language === "ko" ? "2-digit" : "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: language === "en",
    },
  ).format(parsed);
};

function Sidebar({
  view,
  onView,
  open,
  onClose,
}: {
  view: View;
  onView: (view: View) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  const nav = [
    {
      id: "dashboard" as const,
      label: t("운영 대시보드", "Operations Dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "fleet" as const,
      label: t("차량·스케줄", "Vehicles & Schedules"),
      icon: CarFront,
    },
    {
      id: "simulation" as const,
      label: t("V2G 시뮬레이션", "V2G Simulation"),
      icon: Gauge,
    },
  ];

  return (
    <>
      {open && (
        <button
          className="sidebar-scrim"
          onClick={onClose}
          aria-label={t("메뉴 닫기", "Close menu")}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Zap size={19} strokeWidth={2.7} />
          </span>
          <span>
            <strong>HoneyCharge</strong>
            <small>V2G ENERGY OS</small>
          </span>
        </div>
        <button
          className="mobile-close"
          onClick={onClose}
          aria-label={t("메뉴 닫기", "Close menu")}
        >
          <X size={20} />
        </button>

        <p className="nav-kicker">WORKSPACE</p>
        <nav aria-label={t("주요 메뉴", "Primary navigation")}>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={
                view === id ? "nav-item active" : "nav-item"
              }
              onClick={() => {
                onView(id);
                onClose();
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {view === id && (
                <ChevronRight size={16} className="nav-arrow" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="operator">
            <span className="operator-avatar">
              {t("관", "OP")}
            </span>
            <div>
              <strong>
                {t(
                  "통합 운영센터",
                  "Integrated Operations Center",
                )}
              </strong>
              <small>
                {t("제주·호남 권역", "Jeju · Honam Region")}
              </small>
            </div>
            <span
              className="online-dot"
              aria-label={t("온라인", "Online")}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({
  region,
  onRegion,
  onMenu,
  weatherStatus,
  weatherTimestamp,
}: {
  region: Region;
  onRegion: (region: Region) => void;
  onMenu: () => void;
  weatherStatus: WeatherConnection;
  weatherTimestamp: string;
}) {
  const { language, setLanguage } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  const connectionLabel =
    weatherStatus === "live"
      ? t("실시간 기상 연결", "Live Weather Connected")
      : weatherStatus === "loading"
        ? t("기상 연결 중", "Connecting to Weather")
        : t("시연 예보 전환", "Demo Forecast Fallback");

  return (
    <header className="topbar">
      <button
        className="menu-button"
        onClick={onMenu}
        aria-label={t("메뉴 열기", "Open menu")}
      >
        <Menu size={21} />
      </button>
      <div className="region-control">
        <MapPin size={17} />
        <select
          value={region}
          onChange={(event) =>
            onRegion(event.target.value as Region)
          }
          aria-label={t("운영 지역", "Operating region")}
        >
          <option value="jeju">
            {t("제주 전력권역", "Jeju Grid Region")}
          </option>
          <option value="honam">
            {t("호남 전력권역", "Honam Grid Region")}
          </option>
        </select>
      </div>
      <div className="topbar-meta">
        <span
          className={`live-chip ${weatherStatus === "fallback" ? "is-fallback" : ""}`}
        >
          <i /> {connectionLabel}
        </span>
        <span className="timestamp">
          {t(
            `${formatWeatherTimestamp(weatherTimestamp, language)} 기준`,
            `As of ${formatWeatherTimestamp(weatherTimestamp, language)}`,
          )}
        </span>
      </div>
      <div
        className="language-control"
        role="group"
        aria-label={t("언어 선택", "Language selection")}
      >
        <button
          type="button"
          className={language === "ko" ? "active" : ""}
          aria-pressed={language === "ko"}
          aria-label={t(
            "한국어로 전환",
            "Switch to Korean",
          )}
          onClick={() => setLanguage("ko")}
        >
          KO
        </button>
        <button
          type="button"
          className={language === "en" ? "active" : ""}
          aria-pressed={language === "en"}
          aria-label={t(
            "영어로 전환",
            "Switch to English",
          )}
          onClick={() => setLanguage("en")}
        >
          EN
        </button>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
  tone = "mint",
}: {
  label: string;
  value: string | number;
  unit: string;
  detail: string;
  icon: typeof Leaf;
  tone?: "mint" | "blue" | "amber" | "violet";
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="stat-copy">
        <p>{label}</p>
        <strong>
          {value}
          <small>{unit}</small>
        </strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function EnergyChart({
  data,
}: {
  data: ReturnType<typeof runSimulation>["energy"];
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  type EnergySeriesKey =
    | "fixedBase"
    | "renewable"
    | "solar"
    | "wind"
    | "demand"
    | "v2gCharge"
    | "v2gDischarge";
  const [hiddenSeries, setHiddenSeries] = useState<
    Set<EnergySeriesKey>
  >(() => new Set());
  const chartData = data.map((item) => ({
    hour: item.timestamp.slice(11, 16),
    solar: item.solarGenerationKw,
    wind: item.windGenerationKw,
    renewable: item.renewableGenerationKw,
    fixedBase: item.fixedBaseSupplyKw,
    demand: item.electricityDemandKw,
    v2gCharge: item.v2gChargePowerKw,
    v2gDischarge: item.v2gDischargePowerKw,
  }));
  const series: {
    key: EnergySeriesKey;
    label: string;
    color: string;
  }[] = [
    {
      key: "fixedBase",
      label: t("고정 기저공급", "Fixed Base Supply"),
      color: "#8b7463",
    },
    {
      key: "renewable",
      label: t("재생에너지", "Renewables"),
      color: "#27966b",
    },
    {
      key: "solar",
      label: t("태양광", "Solar"),
      color: "#e4a52d",
    },
    {
      key: "wind",
      label: t("풍력", "Wind"),
      color: "#3f91ad",
    },
    {
      key: "demand",
      label: t("수요", "Demand"),
      color: "#24435d",
    },
    {
      key: "v2gCharge",
      label: t("V2G 충전", "V2G Charging"),
      color: "#78c9a8",
    },
    {
      key: "v2gDischarge",
      label: t("V2G 방전", "V2G Discharging"),
      color: "#f2a65a",
    },
  ];
  const toggleSeries = (key: EnergySeriesKey) => {
    setHiddenSeries((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div
      className="chart-wrap"
      aria-label={t(
        "시간대별 에너지 수급 차트",
        "Hourly energy supply and demand chart",
      )}
    >
      <div className="chart-plot">
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 12, left: -16, bottom: 8 }}
        >
          <defs>
            <linearGradient
              id="renewableFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#37a77a"
                stopOpacity={0.26}
              />
              <stop
                offset="100%"
                stopColor="#37a77a"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#e8ece9"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#77817c", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            minTickGap={0}
            tickFormatter={(value) => String(value).slice(0, 2)}
          />
          <YAxis
            tick={{ fill: "#77817c", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e4e9e6",
              borderRadius: 12,
              boxShadow: "0 12px 30px rgba(16, 42, 36, .12)",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${formatPower(Number(value), language)} kW`,
            ]}
          />
          <ReferenceLine y={0} stroke="#b7c1bc" />
          <Line
            type="linear"
            dataKey="fixedBase"
            name={t("고정 기저공급", "Fixed Base Supply")}
            stroke="#8b7463"
            strokeWidth={1.8}
            strokeDasharray="7 4"
            dot={false}
            hide={hiddenSeries.has("fixedBase")}
          />
          <Area
            type="monotone"
            dataKey="renewable"
            name={t("재생에너지", "Renewables")}
            fill="url(#renewableFill)"
            stroke="#27966b"
            strokeWidth={2.4}
            hide={hiddenSeries.has("renewable")}
          />
          <Line
            type="monotone"
            dataKey="solar"
            name={t("태양광", "Solar")}
            stroke="#e4a52d"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            dot={false}
            hide={hiddenSeries.has("solar")}
          />
          <Line
            type="monotone"
            dataKey="wind"
            name={t("풍력", "Wind")}
            stroke="#3f91ad"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            dot={false}
            hide={hiddenSeries.has("wind")}
          />
          <Line
            type="monotone"
            dataKey="demand"
            name={t("수요", "Demand")}
            stroke="#24435d"
            strokeWidth={2.4}
            dot={false}
            hide={hiddenSeries.has("demand")}
          />
          <Bar
            dataKey="v2gCharge"
            name={t("V2G 충전", "V2G Charging")}
            fill="#78c9a8"
            radius={[3, 3, 0, 0]}
            barSize={7}
            hide={hiddenSeries.has("v2gCharge")}
          />
          <Bar
            dataKey="v2gDischarge"
            name={t("V2G 방전", "V2G Discharging")}
            fill="#f2a65a"
            radius={[3, 3, 0, 0]}
            barSize={7}
            hide={hiddenSeries.has("v2gDischarge")}
          />
        </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
        className="energy-legend"
        role="group"
        aria-label={t(
          "차트 데이터 표시 선택",
          "Choose chart datasets to display",
        )}
      >
        {series.map((item) => {
          const isVisible = !hiddenSeries.has(item.key);
          return (
            <button
              key={item.key}
              type="button"
              className={`energy-legend-button${isVisible ? " is-active" : " is-muted"}`}
              aria-pressed={isVisible}
              aria-label={
                isVisible
                  ? t(
                      `${item.label} 숨기기`,
                      `Hide ${item.label}`,
                    )
                  : t(
                      `${item.label} 표시하기`,
                      `Show ${item.label}`,
                    )
              }
              onClick={() => toggleSeries(item.key)}
            >
              <i
                className="energy-legend-swatch"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DashboardView({
  simulation,
  liveWeather,
  weatherStatus,
}: {
  simulation: ReturnType<typeof runSimulation>;
  liveWeather: WeatherHour | null;
  weatherStatus: WeatherConnection;
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  const [surplusExpanded, setSurplusExpanded] = useState(false);
  const [peakSupplyExpanded, setPeakSupplyExpanded] =
    useState(false);
  const [absorptionHorizon, setAbsorptionHorizon] =
    useState<AbsorptionHorizon>("day");
  const [supplyHorizon, setSupplyHorizon] =
    useState<AbsorptionHorizon>("day");
  const { stats, energy, schedules, region } = simulation;
  const fallbackCurrent = energy[DEMO_CURRENT_HOUR];
  const current = liveWeather ?? fallbackCurrent;
  const parsedHour = Number(current.timestamp.slice(11, 13));
  const currentHour = Math.min(
    23,
    Math.max(
      0,
      Number.isInteger(parsedHour)
        ? parsedHour
        : DEMO_CURRENT_HOUR,
    ),
  );
  const demandReference = energy[currentHour];
  const generation =
    getRenewableForecastBreakdown(current);
  const availableChargePowerKw = schedules.reduce(
    (sum, schedule) =>
      schedule.vehicle.isConnected &&
      schedule.vehicle.isV2GEnabled
        ? sum + schedule.vehicle.maxChargePowerKw
        : sum,
    0,
  );
  const estimatedSurplusPowerKw =
    demandReference.fixedBaseSupplyKw +
    generation.renewableGenerationKw -
    demandReference.electricityDemandKw;
  const estimatedChargePowerKw = Math.round(
    Math.min(
      Math.max(0, estimatedSurplusPowerKw),
      availableChargePowerKw,
    ),
  );
  const participatingSchedules = schedules.filter(
    ({ vehicle }) =>
      vehicle.isConnected && vehicle.isV2GEnabled,
  );
  const currentV2gPower = {
    chargeKw: demandReference.v2gChargePowerKw,
    dischargeKw: demandReference.v2gDischargePowerKw,
  };
  const currentDispatch = participatingSchedules.reduce(
    (counts, schedule) => {
      let action =
        schedule.items[currentHour]?.action ?? "standby";
      if (
        (action === "charge" &&
          currentV2gPower.chargeKw <= 0) ||
        (action === "discharge" &&
          currentV2gPower.dischargeKw <= 0)
      ) {
        action = "standby";
      }
      counts[action] += 1;
      return counts;
    },
    { charge: 0, discharge: 0, standby: 0 },
  );
  const gridBalance = calculateGridBalance({
    demandKw: demandReference.electricityDemandKw,
    fixedBaseSupplyKw: demandReference.fixedBaseSupplyKw,
    renewableSupplyKw: generation.renewableGenerationKw,
    v2gChargeKw: currentV2gPower.chargeKw,
    v2gDischargeKw: currentV2gPower.dischargeKw,
  });
  const netV2gPowerKw = gridBalance.netV2gSupplyKw;
  const remainingAdjustmentKw =
    gridBalance.residualAfterV2gKw;
  const currentV2gMode =
    netV2gPowerKw > 0
      ? "discharging"
      : netV2gPowerKw < 0
        ? "charging"
        : "standby";
  const weatherSource =
    weatherStatus === "live"
      ? t("Open-Meteo 현재 모델", "Open-Meteo Current Model")
      : weatherStatus === "loading"
        ? t("현재 기상 연결 중", "Connecting Live Weather")
        : t("시연 예보 대체", "Demo Forecast Fallback");
  const absorption = stats.surplusAbsorption;
  const selectedAbsorption =
    absorption.periods[absorptionHorizon];
  const projectedActiveHours =
    absorption.activeAbsorptionHours * selectedAbsorption.days;
  const peakSupply = stats.peakSupply;
  const selectedPeakSupply =
    peakSupply.periods[supplyHorizon];
  const projectedSupplyHours =
    peakSupply.activeSupplyHours * selectedPeakSupply.days;
  const absorptionHorizons: {
    id: AbsorptionHorizon;
    label: string;
  }[] = [
    { id: "day", label: t("24시간", "24 Hours") },
    { id: "week", label: t("1주", "7 Days") },
    { id: "month", label: t("30일", "30 Days") },
  ];

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <span /> GRID OPERATIONS
          </span>
          <h1>
            {t(
              `${regionNameFor(region, language)} V2G 통합 운영`,
              `${regionNameFor(region, language)} Integrated V2G Operations`,
            )}
          </h1>
          <p>
            {t(
              "재생에너지 수급과 차량 가용성을 함께 고려한 오늘의 운영 계획입니다.",
              "Today’s operating plan balances renewable supply with vehicle availability.",
            )}
          </p>
        </div>
        <div className="forecast-badge">
          <span><i /> {weatherStatus === "live" ? "LIVE FORECAST" : "SAFE FALLBACK"}</span>
          <strong>
            {t(
              `${formatWeatherTimestamp(current.timestamp, language)} 추정`,
              `Estimated at ${formatWeatherTimestamp(current.timestamp, language)}`,
            )}
          </strong>
        </div>
      </section>

      <section
        className="live-generation-grid"
        aria-label={t(
          "현재 날씨 기반 발전 현황",
          "Weather-based generation status",
        )}
      >
        <article className="current-weather-card">
          <div className="weather-card-head">
            <span className="weather-main-icon">
              <CloudSun size={25} />
            </span>
            <div>
              <span>{weatherSource}</span>
              <strong>{current.temperature}°</strong>
              <small>
                {weatherConditionFor(
                  current.condition,
                  language,
                )}
              </small>
            </div>
          </div>
          <div className="weather-factor-list">
            <div>
              <span>
                <Compass size={14} />{" "}
                {t("태양 위치", "Sun Position")}
              </span>
              <strong>
                {compassDirectionFor(
                  generation.sunDirection,
                  language,
                )}{" "}
                · {t("고도", "Altitude")}{" "}
                {generation.sunAltitudeDegrees}°
              </strong>
            </div>
            <div>
              <span>
                <Cloud size={14} />{" "}
                {t("구름량", "Cloud Cover")}
              </span>
              <strong>{current.cloudCover}%</strong>
            </div>
            <div>
              <span>
                <ThermometerSun size={14} />{" "}
                {t("강수", "Precipitation")}
              </span>
              <strong>
                {current.precipitation > 0
                  ? `${current.precipitation}mm`
                  : t("없음", "None")}
              </strong>
            </div>
          </div>
        </article>

        <article className="generation-card solar-generation">
          <div className="generation-card-head">
            <span className="generation-icon"><Sun size={20} /></span>
            <div>
              <span>
                {t(
                  "현재 태양광 예상 출력",
                  "Estimated Solar Output Now",
                )}
              </span>
              <strong>{(generation.solarGenerationKw / 1000).toFixed(2)}<small>MW</small></strong>
            </div>
            <span className="utilization-chip">
              {generation.solarUtilizationPercent}%{" "}
              {t("가동", "of capacity")}
            </span>
          </div>
          <div className="generation-progress">
            <i style={{ width: `${generation.solarUtilizationPercent}%` }} />
          </div>
          <div className="factor-chips">
            <span>{t("일사량", "Solar Irradiance")} <strong>{current.solarRadiation}W/㎡</strong></span>
            <span>{t("태양 고도", "Solar Altitude")} <strong>{generation.sunAltitudeDegrees}°</strong></span>
            <span>{t("운량", "Cloud Cover")} <strong>{current.cloudCover}%</strong></span>
            <span>{t("온도 보정", "Temperature Factor")} <strong>{Math.round(generation.temperatureFactor * 100)}%</strong></span>
          </div>
          <div className="generation-explain">
            <ArrowDownToLine size={16} />
            <p>
              {language === "ko" ? (
                <>
                  현재 발전·수요와 연결 차량을 기준으로{" "}
                  <strong>
                    {formatPower(
                      estimatedChargePowerKw,
                      language,
                    )}kW
                  </strong>
                  를 V2G 충전에 배정할 수 있습니다.
                </>
              ) : (
                <>
                  Based on current generation, demand and
                  connected vehicles,{" "}
                  <strong>
                    {formatPower(
                      estimatedChargePowerKw,
                      language,
                    )}{" "}
                    kW
                  </strong>{" "}
                  can be allocated to V2G charging.
                </>
              )}
            </p>
          </div>
        </article>

        <article className="generation-card wind-generation">
          <div className="generation-card-head">
            <span className="generation-icon"><Wind size={20} /></span>
            <div>
              <span>
                {t(
                  "현재 풍력 예상 출력",
                  "Estimated Wind Output Now",
                )}
              </span>
              <strong>{(generation.windGenerationKw / 1000).toFixed(2)}<small>MW</small></strong>
            </div>
            <span className="utilization-chip">
              {generation.windUtilizationPercent}%{" "}
              {t("가동", "of capacity")}
            </span>
          </div>
          <div className="generation-progress">
            <i style={{ width: `${generation.windUtilizationPercent}%` }} />
          </div>
          <div className="factor-chips">
            <span>{t("허브 풍속", "Hub-height Wind Speed")} <strong>{current.windSpeed}m/s</strong></span>
            <span>{t("기압", "Air Pressure")} <strong>{current.pressure}hPa</strong></span>
            <span>{t("출력계수", "Output Factor")} <strong>{Math.round(generation.windFactor * 100)}%</strong></span>
          </div>
          <div className="generation-explain">
            <Gauge size={16} />
            <p>
              {language === "ko" ? (
                <>
                  <strong>
                    {windZoneFor(
                      generation.windOperatingZone,
                      language,
                    )}
                  </strong>
                  으로 판단해 풍력 설비용량{" "}
                  {formatPower(
                    generation.windCapacityKw,
                    language,
                  )}
                  kW에 출력곡선을 적용했습니다.
                </>
              ) : (
                <>
                  Classified as{" "}
                  <strong>
                    {windZoneFor(
                      generation.windOperatingZone,
                      language,
                    )}
                  </strong>
                  ; the turbine power curve is applied to{" "}
                  {formatPower(
                    generation.windCapacityKw,
                    language,
                  )}{" "}
                  kW of installed wind capacity.
                </>
              )}
            </p>
          </div>
        </article>

        <article
          className={`current-operation-card is-${currentV2gMode}`}
          aria-label={t(
            "현재 전력망과 V2G 운전 상황",
            "Current grid and V2G operating status",
          )}
        >
          <div className="operation-status-head">
            <div>
              <span className="section-label">
                LIVE GRID BALANCE
              </span>
              <h2>
                {t(
                  "현재 수급과 V2G 조정",
                  "Live Supply-Demand & V2G",
                )}
              </h2>
            </div>
            <span
              className={`operation-mode-chip is-${currentV2gMode}`}
            >
              <i aria-hidden="true" />
              {currentV2gMode === "charging"
                ? t("V2G 충전 중", "V2G Charging")
                : currentV2gMode === "discharging"
                  ? t("V2G 방전 중", "V2G Discharging")
                  : t("V2G 대기 중", "V2G Standby")}
            </span>
          </div>
          <div className="operation-metric-grid">
            <div>
              <span>
                <Zap size={15} />
                {t("현재 전력 수요", "Current Demand")}
              </span>
              <strong>
                {(
                  demandReference.electricityDemandKw /
                  1000
                ).toFixed(2)}
                <small>MW</small>
              </strong>
            </div>
            <div>
              <span>
                <Factory size={15} />
                {t("고정 기저공급", "Fixed Base Supply")}
              </span>
              <strong>
                {(
                  demandReference.fixedBaseSupplyKw / 1000
                ).toFixed(2)}
                <small>MW</small>
              </strong>
              <small>
                {t(
                  "화석·계약전원 시연 고정값",
                  "Demo fixed thermal & contracted supply",
                )}
              </small>
            </div>
            <div>
              <span>
                <Leaf size={15} />
                {t(
                  "현재 재생에너지",
                  "Current Renewables",
                )}
              </span>
              <strong>
                {(
                  generation.renewableGenerationKw / 1000
                ).toFixed(2)}
                <small>MW</small>
              </strong>
            </div>
            <div>
              <span>
                {currentV2gMode === "discharging" ? (
                  <ArrowUpFromLine size={15} />
                ) : (
                  <ArrowDownToLine size={15} />
                )}
                {t("V2G 순조정", "Net V2G Adjustment")}
              </span>
              <strong>
                {netV2gPowerKw > 0
                  ? "+"
                  : netV2gPowerKw < 0
                    ? "−"
                    : ""}
                {formatPower(
                  Math.abs(netV2gPowerKw),
                  language,
                )}
                <small>kW</small>
              </strong>
              <small>
                {currentV2gMode === "charging"
                  ? t(
                      `${currentDispatch.charge}대 차량으로 충전`,
                      `${currentDispatch.charge} charging from the grid`,
                    )
                  : currentV2gMode === "discharging"
                    ? t(
                        `${currentDispatch.discharge}대 계통으로 방전`,
                        `${currentDispatch.discharge} discharging to the grid`,
                      )
                    : t("조정 대기", "Awaiting adjustment")}
              </small>
            </div>
            <div>
              <span>
                <CircleGauge size={15} />
                {t(
                  "V2G 후 잔여 조정량",
                  "Remaining Adjustment After V2G",
                )}
              </span>
              <strong>
                {formatPower(
                  Math.abs(remainingAdjustmentKw),
                  language,
                )}
                <small>kW</small>
              </strong>
              <small>
                {Math.abs(remainingAdjustmentKw) <= 10
                  ? t("수급 균형", "Balanced")
                  : remainingAdjustmentKw > 0
                    ? t(
                        "추가 공급 필요",
                        "Additional supply needed",
                      )
                    : t("잉여 전력", "Excess supply")}
              </small>
            </div>
          </div>
          <div className="operation-flow-summary">
            <Info size={15} />
            <p>
              {language === "ko" ? (
                <>
                  수요{" "}
                  <strong>
                    {formatPower(
                      demandReference.electricityDemandKw,
                      language,
                    )}
                    kW
                  </strong>
                  {" − "}고정 기저공급{" "}
                  <strong>
                    {formatPower(
                      demandReference.fixedBaseSupplyKw,
                      language,
                    )}
                    kW
                  </strong>
                  {" − "}재생에너지{" "}
                  <strong>
                    {formatPower(
                      generation.renewableGenerationKw,
                      language,
                    )}
                    kW
                  </strong>
                  {" − "}V2G 방전{" "}
                  <strong>
                    {formatPower(
                      currentV2gPower.dischargeKw,
                      language,
                    )}
                    kW
                  </strong>
                  {" + "}V2G 충전{" "}
                  <strong>
                    {formatPower(
                      currentV2gPower.chargeKw,
                      language,
                    )}
                    kW
                  </strong>
                  {" = "}잔여 조정량{" "}
                  <strong>
                    {remainingAdjustmentKw > 0
                      ? "+"
                      : remainingAdjustmentKw < 0
                        ? "−"
                        : ""}
                    {formatPower(
                      Math.abs(remainingAdjustmentKw),
                      language,
                    )}
                    kW
                  </strong>
                  입니다. 고정 기저공급은 시연에서 조정하지 않고,
                  V2G가 남은 차이를 보완합니다.
                </>
              ) : (
                <>
                  Demand{" "}
                  <strong>
                    {formatPower(
                      demandReference.electricityDemandKw,
                      language,
                    )}{" "}
                    kW
                  </strong>
                  {" − "}fixed base supply{" "}
                  <strong>
                    {formatPower(
                      demandReference.fixedBaseSupplyKw,
                      language,
                    )}{" "}
                    kW
                  </strong>
                  {" − "}renewables{" "}
                  <strong>
                    {formatPower(
                      generation.renewableGenerationKw,
                      language,
                    )}{" "}
                    kW
                  </strong>
                  {" − "}V2G discharge{" "}
                  <strong>
                    {formatPower(
                      currentV2gPower.dischargeKw,
                      language,
                    )}{" "}
                    kW
                  </strong>
                  {" + "}V2G charge{" "}
                  <strong>
                    {formatPower(
                      currentV2gPower.chargeKw,
                      language,
                    )}{" "}
                    kW
                  </strong>
                  {" = "}
                  <strong>
                    {remainingAdjustmentKw > 0
                      ? "+"
                      : remainingAdjustmentKw < 0
                        ? "−"
                        : ""}
                    {formatPower(
                      Math.abs(remainingAdjustmentKw),
                      language,
                    )}{" "}
                    kW
                  </strong>{" "}
                  remaining. Fixed base supply stays constant in this
                  demo; V2G adjusts the residual.
                </>
              )}
            </p>
          </div>
        </article>
      </section>

      <section
        className="stat-grid"
        aria-label={t(
          "핵심 운영 지표",
          "Key operating metrics",
        )}
      >
        <StatCard
          label={t(
            "예상 재생에너지",
            "Forecast Renewable Energy",
          )}
          value={stats.renewableEnergyMWh}
          unit="MWh"
          detail={t(
            "오늘 24시간 합계",
            "Today’s 24-hour Total",
          )}
          icon={Leaf}
        />
        <StatCard
          label={t(
            "예상 전력 수요",
            "Forecast Electricity Demand",
          )}
          value={stats.demandEnergyMWh}
          unit="MWh"
          detail={t(
            `피크 ${stats.peakHour}`,
            `Peak ${stats.peakHour}`,
          )}
          icon={Zap}
          tone="blue"
        />
        <StatCard
          label={t(
            "V2G 참여 차량",
            "Participating V2G Vehicles",
          )}
          value={stats.participatingVehicles}
          unit={t("대", " vehicles")}
          detail={t(
            `전체 ${schedules.length}대 중 연결·동의`,
            `Of ${schedules.length} vehicles · connected and opted in`,
          )}
          icon={CarFront}
          tone="violet"
        />
        <article className="stat-card surplus-stat-card">
          <button
            type="button"
            className="surplus-kpi-button"
            aria-expanded={surplusExpanded}
            aria-controls="surplus-absorption-detail"
            onClick={() =>
              setSurplusExpanded((expanded) => !expanded)
            }
          >
            <span className="stat-icon mint">
              <ArrowDownToLine size={19} />
            </span>
            <span className="stat-copy">
              <span className="stat-label">
                {t(
                  "잉여전력 흡수",
                  "Surplus Energy Absorbed",
                )}
              </span>
              <strong>
                {stats.absorbedEnergyKWh}
                <small>kWh</small>
              </strong>
              <span>
                {t(
                  `출력제어 ${stats.curtailmentReductionKWh}kWh 감소 예상`,
                  `Estimated curtailment avoided: ${stats.curtailmentReductionKWh} kWh`,
                )}
              </span>
            </span>
            <span className="surplus-toggle-label">
              {surplusExpanded
                ? t("접기", "Hide Details")
                : t("자세히 보기", "View Details")}
              <ChevronRight
                size={15}
                aria-hidden="true"
              />
            </span>
          </button>
        </article>
        <article className="stat-card surplus-stat-card peak-supply-stat-card">
          <button
            type="button"
            className="surplus-kpi-button peak-supply-kpi-button"
            aria-expanded={peakSupplyExpanded}
            aria-controls="peak-supply-detail"
            onClick={() =>
              setPeakSupplyExpanded((expanded) => !expanded)
            }
          >
            <span className="stat-icon amber">
              <ArrowUpFromLine size={19} />
            </span>
            <span className="stat-copy">
              <span className="stat-label">
                {t("피크 공급", "Peak Energy Supplied")}
              </span>
              <strong>
                {stats.suppliedEnergyKWh}
                <small>kWh</small>
              </strong>
              <span>
                {t(
                  `최대 ${formatPower(peakSupply.peakSupplyPowerKw, language)}kW 계통 지원`,
                  `Up to ${formatPower(peakSupply.peakSupplyPowerKw, language)} kW of grid support`,
                )}
              </span>
            </span>
            <span className="surplus-toggle-label peak-supply-toggle-label">
              {peakSupplyExpanded
                ? t("접기", "Hide Details")
                : t("자세히 보기", "View Details")}
              <ChevronRight
                size={15}
                aria-hidden="true"
              />
            </span>
          </button>
        </article>
      </section>

      <section
        id="surplus-absorption-detail"
        className="surplus-detail-panel"
        aria-label={t(
          "기간별 잉여전력 흡수 상세",
          "Surplus absorption details by period",
        )}
        hidden={!surplusExpanded}
      >
        <div className="surplus-detail-head">
          <div>
            <span className="section-label">
              SURPLUS ABSORPTION OUTLOOK
            </span>
            <h2>
              {t(
                "기간별 잉여전력 흡수 전망",
                "Surplus Absorption by Period",
              )}
            </h2>
          </div>
          <div
            className="absorption-period-tabs"
            role="tablist"
            aria-label={t("조회 기간", "Projection period")}
          >
            {absorptionHorizons.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`absorption-tab-${id}`}
                aria-selected={absorptionHorizon === id}
                aria-controls="absorption-period-panel"
                tabIndex={absorptionHorizon === id ? 0 : -1}
                className={
                  absorptionHorizon === id ? "active" : ""
                }
                onClick={() => setAbsorptionHorizon(id)}
                onKeyDown={(event) => {
                  const currentIndex =
                    absorptionHorizons.findIndex(
                      (item) => item.id === id,
                    );
                  let nextIndex: number | null = null;

                  if (
                    event.key === "ArrowRight" ||
                    event.key === "ArrowDown"
                  ) {
                    nextIndex =
                      (currentIndex + 1) %
                      absorptionHorizons.length;
                  } else if (
                    event.key === "ArrowLeft" ||
                    event.key === "ArrowUp"
                  ) {
                    nextIndex =
                      (currentIndex -
                        1 +
                        absorptionHorizons.length) %
                      absorptionHorizons.length;
                  } else if (event.key === "Home") {
                    nextIndex = 0;
                  } else if (event.key === "End") {
                    nextIndex =
                      absorptionHorizons.length - 1;
                  }

                  if (nextIndex === null) return;
                  event.preventDefault();
                  const nextHorizon =
                    absorptionHorizons[nextIndex].id;
                  setAbsorptionHorizon(nextHorizon);
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById(
                        `absorption-tab-${nextHorizon}`,
                      )
                      ?.focus();
                  });
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div
          id="absorption-period-panel"
          role="tabpanel"
          aria-labelledby={`absorption-tab-${absorptionHorizon}`}
          className="absorption-metric-grid"
          tabIndex={0}
        >
          <article>
            <span>
              {t("잉여전력 흡수량", "Energy Absorbed")}
            </span>
            <strong>
              {formatPower(
                selectedAbsorption.absorbedEnergyKWh,
                language,
              )}
              <small>kWh</small>
            </strong>
            <p>
              {selectedAbsorption.basis === "daily-forecast"
                ? t(
                    "현재 24시간 운영계획",
                    "Current 24-hour operating plan",
                  )
                : t(
                    "24시간 패턴 단순 환산",
                    "Projection from the 24-hour pattern",
                  )}
            </p>
          </article>
          <article>
            <span>
              {t("출력제어 회피량", "Curtailment Avoided")}
            </span>
            <strong>
              {formatPower(
                selectedAbsorption.curtailmentReductionKWh,
                language,
              )}
              <small>kWh</small>
            </strong>
            <p>
              {t(
                "흡수 전력의 86% 기준",
                "Based on 86% of absorbed energy",
              )}
            </p>
          </article>
          <article>
            <span>
              {t(
                "가구·일 환산",
                "Household-day Equivalent",
              )}
            </span>
            <strong>
              {formatPower(
                selectedAbsorption.householdDayEquivalents,
                language,
              )}
              <small>
                {t("가구·일", " household-days")}
              </small>
            </strong>
            <p>
              {t(
                `약 ${formatPower(selectedAbsorption.householdDayEquivalents, language)}가구의 하루 전기사용량`,
                `One day of electricity for about ${formatPower(selectedAbsorption.householdDayEquivalents, language)} households`,
              )}
            </p>
          </article>
          <article>
            <span>
              {t("흡수 피크 · 활성시간", "Peak · Active Hours")}
            </span>
            <strong>
              {formatPower(
                absorption.peakAbsorptionPowerKw,
                language,
              )}
              <small>kW</small>
            </strong>
            <p>
              {t(
                `${absorption.peakAbsorptionHour} 피크 · ${projectedActiveHours}시간 활성`,
                `Peak at ${absorption.peakAbsorptionHour} · ${projectedActiveHours} active hours`,
              )}
            </p>
          </article>
        </div>
        <div className="surplus-assumptions">
          <Info size={14} />
          <p>
            {t(
              `가구당 하루 ${absorption.assumptions.householdDailyUseKWh}kWh, 출력제어 회피율 ${Math.round(absorption.assumptions.curtailmentAvoidanceRate * 100)}%를 가정했습니다. 1주·30일 수치는 현재 24시간 운영 패턴을 단순 환산한 시연용 전망입니다.`,
              `Assumes ${absorption.assumptions.householdDailyUseKWh} kWh per household per day and an ${Math.round(absorption.assumptions.curtailmentAvoidanceRate * 100)}% curtailment-avoidance rate. The 7- and 30-day figures are demonstration projections extrapolated from the current 24-hour operating pattern.`,
            )}
          </p>
        </div>
      </section>

      <section
        id="peak-supply-detail"
        className="surplus-detail-panel peak-supply-detail-panel"
        aria-label={t(
          "기간별 피크 공급 상세",
          "Peak supply details by period",
        )}
        hidden={!peakSupplyExpanded}
      >
        <div className="surplus-detail-head peak-supply-detail-head">
          <div>
            <span className="section-label">
              PEAK SUPPORT OUTLOOK
            </span>
            <h2>
              {t(
                "기간별 피크 수요 지원 전망",
                "Peak Demand Support by Period",
              )}
            </h2>
          </div>
          <div
            className="absorption-period-tabs peak-supply-period-tabs"
            role="tablist"
            aria-label={t(
              "피크 공급 조회 기간",
              "Peak supply projection period",
            )}
          >
            {absorptionHorizons.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`peak-supply-tab-${id}`}
                aria-selected={supplyHorizon === id}
                aria-controls="peak-supply-period-panel"
                tabIndex={supplyHorizon === id ? 0 : -1}
                className={
                  supplyHorizon === id ? "active" : ""
                }
                onClick={() => setSupplyHorizon(id)}
                onKeyDown={(event) => {
                  const currentIndex =
                    absorptionHorizons.findIndex(
                      (item) => item.id === id,
                    );
                  let nextIndex: number | null = null;

                  if (
                    event.key === "ArrowRight" ||
                    event.key === "ArrowDown"
                  ) {
                    nextIndex =
                      (currentIndex + 1) %
                      absorptionHorizons.length;
                  } else if (
                    event.key === "ArrowLeft" ||
                    event.key === "ArrowUp"
                  ) {
                    nextIndex =
                      (currentIndex -
                        1 +
                        absorptionHorizons.length) %
                      absorptionHorizons.length;
                  } else if (event.key === "Home") {
                    nextIndex = 0;
                  } else if (event.key === "End") {
                    nextIndex =
                      absorptionHorizons.length - 1;
                  }

                  if (nextIndex === null) return;
                  event.preventDefault();
                  const nextHorizon =
                    absorptionHorizons[nextIndex].id;
                  setSupplyHorizon(nextHorizon);
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById(
                        `peak-supply-tab-${nextHorizon}`,
                      )
                      ?.focus();
                  });
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div
          id="peak-supply-period-panel"
          role="tabpanel"
          aria-labelledby={`peak-supply-tab-${supplyHorizon}`}
          className="absorption-metric-grid peak-supply-metric-grid"
          tabIndex={0}
        >
          <article>
            <span>
              {t("차량 방전 공급량", "Vehicle Energy Supplied")}
            </span>
            <strong>
              {formatPower(
                selectedPeakSupply.suppliedEnergyKWh,
                language,
              )}
              <small>kWh</small>
            </strong>
            <p>
              {selectedPeakSupply.basis === "daily-forecast"
                ? t(
                    "현재 24시간 운영계획",
                    "Current 24-hour operating plan",
                  )
                : t(
                    "24시간 패턴 단순 환산",
                    "Projection from the 24-hour pattern",
                  )}
            </p>
          </article>
          <article>
            <span>
              {t(
                "가구·일 환산",
                "Household-day Equivalent",
              )}
            </span>
            <strong>
              {formatPower(
                selectedPeakSupply.householdDayEquivalents,
                language,
              )}
              <small>
                {t("가구·일", " household-days")}
              </small>
            </strong>
            <p>
              {t(
                `약 ${formatPower(selectedPeakSupply.householdDayEquivalents, language)}가구의 하루 전기사용량`,
                `One day of electricity for about ${formatPower(selectedPeakSupply.householdDayEquivalents, language)} households`,
              )}
            </p>
          </article>
          <article>
            <span>
              {t(
                "방전 피크 · 활성시간",
                "Discharge Peak · Active Hours",
              )}
            </span>
            <strong>
              {formatPower(
                peakSupply.peakSupplyPowerKw,
                language,
              )}
              <small>kW</small>
            </strong>
            <p>
              {t(
                `${peakSupply.peakSupplyHour} 피크 · ${projectedSupplyHours}시간 활성`,
                `Peak at ${peakSupply.peakSupplyHour} · ${projectedSupplyHours} active hours`,
              )}
            </p>
          </article>
          <article>
            <span>
              {t(
                "수요 피크 지원 비율",
                "Peak Demand Coverage",
              )}
            </span>
            <strong>
              {peakSupply.peakDemandCoveragePercent}
              <small>%</small>
            </strong>
            <p>
              {t(
                `${peakSupply.peakDemandHour} 수요 피크에 ${formatPower(peakSupply.supplyAtPeakDemandKw, language)}kW 공급`,
                `${formatPower(peakSupply.supplyAtPeakDemandKw, language)} kW supplied at the ${peakSupply.peakDemandHour} demand peak`,
              )}
            </p>
          </article>
        </div>
        <div className="surplus-assumptions peak-supply-assumptions">
          <Info size={14} />
          <p>
            {t(
              `가구당 하루 ${peakSupply.assumptions.householdDailyUseKWh}kWh를 가정했습니다. 수요 피크 지원 비율은 하루 중 예상 수요가 가장 높은 시각의 수요 대비 실제 적용된 V2G 방전 비율이며, 1주·30일 수치는 현재 24시간 운영 패턴을 단순 환산한 시연용 전망입니다.`,
              `Assumes ${peakSupply.assumptions.householdDailyUseKWh} kWh per household per day. Peak-demand coverage compares applied V2G discharge with demand at the day’s highest-demand hour; the 7- and 30-day figures extrapolate the current 24-hour demonstration pattern.`,
            )}
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">
                24H ENERGY FLOW
              </span>
              <h2>
                {t(
                  "1시간 단위 전력 수급",
                  "Hourly Energy Supply & Demand",
                )}
              </h2>
            </div>
            <div className="chart-note">
              <i />{" "}
              {t(
                "재생에너지 우선 충전",
                "Charge with Renewables First",
              )}
            </div>
          </div>
          <EnergyChart data={energy} />
        </article>

        <aside className="panel dispatch-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">
                NOW · {String(currentHour).padStart(2, "0")}:00
              </span>
              <h2>
                {t(
                  "실시간 배차 현황",
                  "Live Dispatch Status",
                )}
              </h2>
            </div>
          </div>
          <div className="dispatch-ring">
            <div className="ring-visual">
              <span>
                <strong>{stats.participatingVehicles}</strong>
                <small>
                  {t("참여 차량", "Participating Vehicles")}
                </small>
              </span>
            </div>
          </div>
          <div className="dispatch-list">
            <div>
              <span>
                <i className="charge-dot" />
                {t("충전 중", "Charging")}
              </span>
              <strong>
                {currentDispatch.charge}
                <small>{t("대", " vehicles")}</small>
              </strong>
            </div>
            <div>
              <span>
                <i className="discharge-dot" />
                {t("방전 중", "Discharging")}
              </span>
              <strong>
                {currentDispatch.discharge}
                <small>{t("대", " vehicles")}</small>
              </strong>
            </div>
            <div>
              <span>
                <i className="standby-dot" />
                {t("대기", "Standby")}
              </span>
              <strong>
                {currentDispatch.standby}
                <small>{t("대", " vehicles")}</small>
              </strong>
            </div>
          </div>
          <div className="grid-signal">
            <Sparkles size={17} />
            <div>
              <strong>
                {t("현재 전력망 신호", "Current Grid Signal")}
              </strong>
              <span>
                {estimatedSurplusPowerKw > 0
                  ? t(
                      "잉여전력 흡수 권장",
                      "Absorb Surplus Energy",
                    )
                  : t(
                      "피크 지원 준비",
                      "Prepare for Peak Support",
                    )}
              </span>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel infrastructure-panel">
        <div className="panel-head infrastructure-head">
          <div>
            <span className="section-label">GRID INFRASTRUCTURE MAP</span>
            <h2>
              {t(
                `${regionNameFor(region, language)} 전력 인프라 지도`,
                `${regionNameFor(region, language)} Power Infrastructure Map`,
              )}
            </h2>
            <p>
              {t(
                "변전소·변환소와 태양광·풍력·화석·수력·원자력 발전설비, 송전선 전압·회선과 지중 케이블을 확인하고 설비를 눌러 공개 태그를 봅니다.",
                "Explore substations, solar, wind, fossil, hydro and nuclear generation, transmission voltage and circuits, and underground cables; select a facility to view its public tags.",
              )}
            </p>
          </div>
          <span className="map-data-chip">
            <Database size={13} />{" "}
            {t(
              "OpenStreetMap 기반",
              "Powered by OpenStreetMap",
            )}
          </span>
        </div>
        <InfrastructureMap
          region={region}
          language={language}
        />
      </section>

      <CloudForecastMap region={region} />
    </>
  );
}

function VehicleTable({
  schedules,
  selectedId,
  onSelect,
  compact = false,
}: {
  schedules: VehicleSchedule[];
  selectedId?: string;
  onSelect: (schedule: VehicleSchedule) => void;
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  return (
    <div className="table-scroll">
      <table className="vehicle-table">
        <thead>
          <tr>
            <th>{t("차량", "Vehicle")}</th>
            <th>{t("현재 SOC", "Current SOC")}</th>
            <th>{t("출발 / 예약", "Departure / Booking")}</th>
            <th>V2G</th>
            <th>{t("현재 상태", "Current Status")}</th>
            {!compact && (
              <th>{t("예상 보상", "Estimated Reward")}</th>
            )}
            <th>
              <span className="sr-only">
                {t("상세", "Details")}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => {
            const { vehicle } = schedule;
            const status = getVehicleDisplayStatus(
              schedule,
              DEMO_CURRENT_HOUR,
            );
            return (
              <tr
                key={vehicle.id}
                className={
                  selectedId === vehicle.id ? "selected-row" : ""
                }
                onClick={() => onSelect(schedule)}
              >
                <td>
                  <span className="vehicle-cell">
                    <i>
                      <CarFront size={16} />
                    </i>
                    <span>
                      <strong>{vehicle.id}</strong>
                      <small>
                        {vehicleModelFor(
                          vehicle.model,
                          language,
                        )}
                      </small>
                    </span>
                  </span>
                </td>
                <td>
                  <strong>{vehicle.currentSoc}%</strong>
                  <span className="soc-bar">
                    <i
                      style={{ width: `${vehicle.currentSoc}%` }}
                    />
                  </span>
                </td>
                <td>{vehicle.departureTime.slice(11, 16)}</td>
                <td>
                  <span
                    className={
                      vehicle.isV2GEnabled
                        ? "consent yes"
                        : "consent"
                    }
                  >
                    {vehicle.isV2GEnabled
                      ? t("동의", "Opted In")
                      : t("미동의", "Not Opted In")}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-pill ${statusClassName[status]}`}
                  >
                    <i />
                    {statusNameFor(status, language)}
                  </span>
                </td>
                {!compact && (
                  <td>
                    {vehicle.isV2GEnabled ? (
                      <strong className="reward">
                        {schedule.rewardPoints.toLocaleString(
                          language === "ko"
                            ? "ko-KR"
                            : "en-US",
                        )}{" "}
                        P
                      </strong>
                    ) : (
                      <span className="reward-ineligible">
                        {t("미적립", "Not eligible")}
                      </span>
                    )}
                  </td>
                )}
                <td>
                  <button
                    className="row-button"
                    aria-label={t(
                      `${vehicle.id} 상세 보기`,
                      `View details for ${vehicle.id}`,
                    )}
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleStrip({
  schedule,
}: {
  schedule: VehicleSchedule;
}) {
  const { language } = useLanguage();
  const activeItems = schedule.items.filter(
    (_, index) => index >= 7 && index <= 22,
  );
  return (
    <div className="schedule-strip">
      {activeItems.map((item) => (
        <div
          key={item.timestamp}
          className={`schedule-hour ${item.action}`}
          title={scheduleReasonFor(item.reason, language)}
        >
          <span>{item.timestamp.slice(11, 13)}</span>
          <i />
        </div>
      ))}
    </div>
  );
}

function VehicleDetail({
  schedule,
}: {
  schedule: VehicleSchedule;
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  const { vehicle } = schedule;
  const nextAction = schedule.items.find(
    (item) =>
      item.action !== "standby" &&
      Number(item.timestamp.slice(11, 13)) >=
        DEMO_CURRENT_HOUR,
  );

  return (
    <aside className="vehicle-detail">
      <div className="detail-title">
        <div className="detail-car">
          <CarFront size={24} />
        </div>
        <div>
          <span>{vehicle.id}</span>
          <h2>{vehicleModelFor(vehicle.model, language)}</h2>
          <p>{t("통합 등록 차량", "Registered Fleet Vehicle")}</p>
        </div>
      </div>

      <div className="battery-card">
        <div className="battery-head">
          <span>{t("현재 배터리", "Current Battery")}</span>
          <strong>{vehicle.currentSoc}%</strong>
        </div>
        <div className="battery-track">
          <i style={{ width: `${vehicle.currentSoc}%` }} />
        </div>
        <div className="battery-labels">
          <span>
            {t("최소", "Minimum")} {vehicle.minimumSoc}%
          </span>
          <span>
            {t("목표", "Target")} {vehicle.targetSoc}%
          </span>
        </div>
      </div>

      <div className="detail-metrics">
        <div>
          <span>
            <CalendarClock size={15} />{" "}
            {t("출발 예정", "Scheduled Departure")}
          </span>
          <strong>{vehicle.departureTime.slice(11, 16)}</strong>
        </div>
        <div>
          <span>
            <CircleGauge size={15} />{" "}
            {t("예상 체류", "Estimated Dwell Time")}
          </span>
          <strong>
            {getStayDurationHours(vehicle)}
            {t("시간", " hours")}
          </strong>
        </div>
        <div>
          <span>
            <BatteryCharging size={15} />{" "}
            {t("충전 예상", "Expected Charge")}
          </span>
          <strong>{schedule.chargeEnergyKWh}kWh</strong>
        </div>
        <div>
          <span>
            <ArrowUpFromLine size={15} />{" "}
            {t("방전 예상", "Expected Discharge")}
          </span>
          <strong>{schedule.dischargeEnergyKWh}kWh</strong>
        </div>
      </div>

      <div className="detail-section reward-settlement-card">
        <div className="detail-section-head">
          <strong>
            {t(
              "공유절감 보상 근거",
              "Shared-Savings Reward Basis",
            )}
          </strong>
          <span>
            {vehicle.isV2GEnabled
              ? `${schedule.rewardPoints.toLocaleString(
                  language === "ko" ? "ko-KR" : "en-US",
                )} P`
              : t("미적립", "Not eligible")}
          </span>
        </div>
        {vehicle.isV2GEnabled ? (
          <div className="settlement-mini-grid">
            <span>
              {t("추가 충전", "Incremental Charge")}
              <strong>
                {schedule.rewardSettlement.eligibleChargeKWh} kWh
              </strong>
            </span>
            <span>
              {t("계통 방전", "Grid Discharge")}
              <strong>
                {schedule.rewardSettlement.eligibleDischargeKWh} kWh
              </strong>
            </span>
            <span>
              {t("창출 편익", "Grid Benefit")}
              <strong>
                {formatMoney(
                  schedule.rewardSettlement.grossGridBenefitWon,
                  language,
                )}
                {t("원", " KRW")}
              </strong>
            </span>
            <span>
              {t("유효 기여 비중", "Eligible Contribution")}
              <strong>
                {schedule.rewardSettlement.shareRate}%
              </strong>
            </span>
          </div>
        ) : (
          <p className="settlement-ineligible-copy">
            {t(
              "V2G 미동의 차량은 제어와 공유절감 보상에서 제외됩니다.",
              "Vehicles that have not opted in are excluded from dispatch and shared-savings rewards.",
            )}
          </p>
        )}
      </div>

      <div className="detail-section">
        <div className="detail-section-head">
          <strong>
            {t("시간대별 추천", "Hourly Recommendation")}
          </strong>
          <span>{t("07—22시", "07:00—22:00")}</span>
        </div>
        <ScheduleStrip schedule={schedule} />
        <div className="schedule-legend">
          <span>
            <i className="charge-dot" />
            {t("충전", "Charge")}
          </span>
          <span>
            <i className="discharge-dot" />
            {t("방전", "Discharge")}
          </span>
          <span>
            <i className="standby-dot" />
            {t("대기", "Standby")}
          </span>
        </div>
      </div>

      <div className="recommendation">
        <span>
          <Sparkles size={17} />
        </span>
        <div>
          <strong>
            {t(
              "다음 권장 제어",
              "Next Recommended Action",
            )}
          </strong>
          <p>
            {nextAction
              ? `${nextAction.timestamp.slice(11, 16)} ${
                  actionNameFor(nextAction.action, language)
                } · ${scheduleReasonFor(nextAction.reason, language)}`
              : t(
                  "출발 전 추가 제어가 필요하지 않습니다.",
                  "No additional control is required before departure.",
                )}
          </p>
        </div>
      </div>

      <div className="departure-guarantee">
        <ShieldCheck size={17} />
        <span>
          {t("출발 예상 SOC", "Expected Departure SOC")}{" "}
          <strong>{schedule.departureSoc}%</strong> ·{" "}
          {t("최소 보장 충족", "Minimum Guarantee Met")}
        </span>
      </div>
    </aside>
  );
}

function FleetView({
  simulation,
}: {
  simulation: ReturnType<typeof runSimulation>;
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  const [selectedId, setSelectedId] = useState(
    simulation.schedules[0].vehicle.id,
  );
  const selected =
    simulation.schedules.find(
      ({ vehicle }) => vehicle.id === selectedId,
    ) ?? simulation.schedules[0];

  return (
    <>
      <section className="page-heading compact-heading">
        <div>
          <span className="eyebrow">
            <span /> VEHICLE ORCHESTRATION
          </span>
          <h1>
            {t(
              "차량·스케줄 관리",
              "Vehicle & Schedule Management",
            )}
          </h1>
          <p>
            {t(
              "차량별 가용시간과 배터리 보호 조건을 확인하고 추천 근거를 검토합니다.",
              "Review each vehicle’s availability, battery safeguards, and recommendation rationale.",
            )}
          </p>
        </div>
      </section>
      <div className="fleet-layout">
        <section className="panel fleet-list-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">
                CONNECTED FLEET
              </span>
              <h2>
                {t(
                  `전체 등록 차량 ${simulation.schedules.length}대`,
                  `${simulation.schedules.length} Total Registered Vehicles`,
                )}
              </h2>
            </div>
            <span className="small-note">
              <i />{" "}
              {t(
                "시연용 합성 데이터",
                "Synthetic Demo Data",
              )}
            </span>
          </div>
          <VehicleTable
            schedules={simulation.schedules}
            selectedId={selected.vehicle.id}
            onSelect={(schedule) =>
              setSelectedId(schedule.vehicle.id)
            }
          />
        </section>
        <VehicleDetail schedule={selected} />
      </div>
    </>
  );
}

function V2GSimulationView({
  simulation,
}: {
  simulation: ReturnType<typeof runSimulation>;
}) {
  const { language } = useLanguage();
  const t = (korean: string, english: string) =>
    textFor(language, korean, english);
  const [currentSoc, setCurrentSoc] = useState(46);
  const [targetSoc, setTargetSoc] = useState(82);
  const [minimumSoc, setMinimumSoc] = useState(35);
  const [departureHour, setDepartureHour] = useState(19);

  const simulationSchedule = useMemo(() => {
    const vehicle: Vehicle = {
      id: "SIM-EV",
      ownerType: "private",
      model: textFor(
        language,
        "시뮬레이션 차량",
        "Simulation EV",
      ),
      batteryCapacityKWh: 72.6,
      currentSoc,
      targetSoc: Math.max(targetSoc, minimumSoc),
      minimumSoc: Math.min(minimumSoc, currentSoc),
      arrivalTime: `${DEMO_DATE}T${String(
        DEMO_CURRENT_HOUR,
      ).padStart(2, "0")}:00:00+09:00`,
      departureTime: `${DEMO_DATE}T${String(
        departureHour,
      ).padStart(2, "0")}:00:00+09:00`,
      isConnected: true,
      isV2GEnabled: true,
      maxChargePowerKw: 7,
      maxDischargePowerKw: 5,
      currentStatus: "standby",
    };
    const actualSchedule = scheduleVehicle(
      vehicle,
      simulation.energy,
    );
    const baselineSchedule = scheduleVehicle(
      { ...vehicle, isV2GEnabled: false },
      simulation.energy,
    );
    return settleSingleVehicleReward(
      simulation.energy,
      actualSchedule,
      baselineSchedule,
    );
  }, [
    currentSoc,
    targetSoc,
    minimumSoc,
    departureHour,
    simulation.energy,
    language,
  ]);

  const chargeHours = simulationSchedule.items.filter(
    (item) => item.action === "charge",
  );
  const dischargeHours = simulationSchedule.items.filter(
    (item) => item.action === "discharge",
  );

  return (
    <>
      <section className="page-heading compact-heading">
        <div>
          <span className="eyebrow">
            <span /> V2G OPERATIONS SIMULATION
          </span>
          <h1>
            {t(
              "V2G 충·방전 운영 시뮬레이션",
              "V2G Charge & Discharge Simulation",
            )}
          </h1>
          <p>
            {t(
              "배터리 조건과 출발 시간을 조정해 V2G 충·방전 일정, 예상 보상, 출발 SOC를 검토합니다.",
              "Adjust battery conditions and departure time to review the projected V2G schedule, rewards, and departure SOC.",
            )}
          </p>
        </div>
      </section>

      <div className="owner-layout">
        <section className="panel owner-form-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">
                SIMULATION INPUTS
              </span>
              <h2>
                {t(
                  "시뮬레이션 조건",
                  "Simulation Inputs",
                )}
              </h2>
            </div>
            <PlugZap size={21} className="panel-icon" />
          </div>

          <SliderField
            id="currentSoc"
            label={t(
              "현재 배터리 잔량",
              "Current Battery Level",
            )}
            value={currentSoc}
            min={20}
            max={90}
            onChange={setCurrentSoc}
          />
          <SliderField
            id="targetSoc"
            label={t(
              "출발 목표 SOC",
              "Departure Target SOC",
            )}
            value={targetSoc}
            min={50}
            max={95}
            onChange={setTargetSoc}
          />
          <SliderField
            id="minimumSoc"
            label={t(
              "최소 보호 SOC",
              "Minimum Protection SOC",
            )}
            value={minimumSoc}
            min={20}
            max={60}
            onChange={setMinimumSoc}
          />

          <label className="time-field">
            <span>
              <CalendarClock size={16} />{" "}
              {t(
                "시뮬레이션 출발 시간",
                "Simulated Departure Time",
              )}
            </span>
            <select
              value={departureHour}
              onChange={(event) =>
                setDepartureHour(Number(event.target.value))
              }
            >
              {[15, 16, 17, 18, 19, 20, 21, 22, 23].map(
                (hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ),
              )}
            </select>
          </label>

        </section>

        <section className="owner-result">
          <article className="reward-hero">
            <span className="reward-kicker">
              {t(
                "시뮬레이션 예상 보상",
                "Estimated Simulation Reward",
              )}
            </span>
            <strong>
              {simulationSchedule.rewardPoints.toLocaleString(
                language === "ko" ? "ko-KR" : "en-US",
              )}
              <small> P</small>
            </strong>
            <p>
              {t(
                "V2G 미운영 대비 줄인 계통비용의 20%를 유효 증분 기여량에 따라 배분합니다. 1P = 1원",
                "20% of verified grid-cost savings versus the no-V2G baseline is shared by eligible incremental contribution. 1P = KRW 1.",
              )}
            </p>
            <div className="reward-energy">
              <span>
                <ArrowDownToLine size={16} />
                {t("보상대상 추가 충전", "Eligible Extra Charge")}{" "}
                {simulationSchedule.rewardSettlement.eligibleChargeKWh}
                kWh
              </span>
              <span>
                <ArrowUpFromLine size={16} />
                {t("보상대상 방전", "Eligible Discharge")}{" "}
                {simulationSchedule.rewardSettlement.eligibleDischargeKWh}
                kWh
              </span>
            </div>
          </article>

          <article className="panel settlement-breakdown-card">
            <div className="panel-head">
              <div>
                <span className="section-label">
                  SHARED-SAVINGS SETTLEMENT
                </span>
                <h2>
                  {t(
                    "보상 산정 내역",
                    "Reward Calculation",
                  )}
                </h2>
              </div>
              <span className="generated-chip">
                {t("시간대별 kWh 정산", "Hourly kWh Settlement")}
              </span>
            </div>
            <div className="settlement-flow">
              <div>
                <span>01</span>
                <small>
                  {t(
                    "출력제한 회피",
                    "Curtailment Avoided",
                  )}
                </small>
                <strong>
                  {
                    simulationSchedule.rewardSettlement
                      .avoidedCurtailmentKWh
                  }{" "}
                  kWh
                </strong>
              </div>
              <i>+</i>
              <div>
                <span>02</span>
                <small>
                  {t(
                    "추가공급 회피",
                    "Supply Avoided",
                  )}
                </small>
                <strong>
                  {
                    simulationSchedule.rewardSettlement
                      .avoidedSupplyKWh
                  }{" "}
                  kWh
                </strong>
              </div>
              <i>→</i>
              <div>
                <span>03</span>
                <small>
                  {t("창출 계통편익", "Grid Benefit")}
                </small>
                <strong>
                  {formatMoney(
                    simulationSchedule.rewardSettlement
                      .grossGridBenefitWon,
                    language,
                  )}
                  {t("원", " KRW")}
                </strong>
              </div>
              <i>× 20%</i>
              <div className="settlement-result">
                <span>04</span>
                <small>
                  {t("최종 예상 포인트", "Estimated Points")}
                </small>
                <strong>
                  {simulationSchedule.rewardPoints.toLocaleString(
                    language === "ko" ? "ko-KR" : "en-US",
                  )}{" "}
                  P
                </strong>
              </div>
            </div>
            <p className="settlement-note">
              {t(
                "기준수요에 포함된 평상시 충전은 제외하고, V2G로 추가된 충전과 계통에 실제 전달된 방전만 인정합니다. 출력제한 회피가치 120원/kWh, 추가공급 회피비용 190원/kWh를 적용한 시연용 추정입니다.",
                "Normal charging already included in baseline demand is excluded. Only incremental V2G charging and discharge delivered to the grid qualify. Demo assumptions use KRW 120/kWh for avoided curtailment and KRW 190/kWh for avoided marginal supply.",
              )}
            </p>
          </article>

          <article className="panel owner-schedule-card">
            <div className="panel-head">
              <div>
                <span className="section-label">
                  V2G DISPATCH PROJECTION
                </span>
                <h2>
                  {t(
                    "예상 충·방전 일정",
                    "Projected Charge & Discharge Schedule",
                  )}
                </h2>
              </div>
              <span className="generated-chip">
                <Sparkles size={13} />{" "}
                {t("조건 반영 결과", "Calculated Result")}
              </span>
            </div>
            <ScheduleStrip schedule={simulationSchedule} />
            <div className="owner-actions">
              <div className="action-box charge">
                <span>
                  <ArrowDownToLine size={17} />
                </span>
                <div>
                  <small>
                    {t(
                      "예상 충전 시간",
                      "Projected Charging Hours",
                    )}
                  </small>
                  <strong>
                    {chargeHours.length
                      ? chargeHours
                          .map((item) =>
                            item.timestamp.slice(11, 16),
                          )
                          .join(", ")
                      : t("없음", "None")}
                  </strong>
                </div>
              </div>
              <div className="action-box discharge">
                <span>
                  <ArrowUpFromLine size={17} />
                </span>
                <div>
                  <small>
                    {t(
                      "예상 방전 시간",
                      "Projected Discharging Hours",
                    )}
                  </small>
                  <strong>
                    {dischargeHours.length
                      ? dischargeHours
                          .map((item) =>
                            item.timestamp.slice(11, 16),
                          )
                          .join(", ")
                      : t("없음", "None")}
                  </strong>
                </div>
              </div>
            </div>
            <div className="soc-outcome">
              <div className="soc-circle">
                <strong>{simulationSchedule.departureSoc}%</strong>
                <span>
                  {t("출발 예상 SOC", "Projected Departure SOC")}
                </span>
              </div>
              <div>
                <strong>
                  {t(
                    "출발 시점 목표 SOC 충족 예상",
                    "Departure SOC Target Expected to Be Met",
                  )}
                </strong>
                <p>
                  {t(
                    `설정한 최소 보호 SOC ${minimumSoc}% 아래로 방전하지 않으며, 출발 시점 목표 SOC를 우선하도록 계산했습니다.`,
                    `The schedule avoids discharging below the configured ${minimumSoc}% protection floor and prioritizes the departure SOC target.`,
                  )}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="slider-field">
      <div>
        <label htmlFor={id}>{label}</label>
        <strong>{value}%</strong>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="range-labels">
        <span>{min}%</span>
        <span>{max}%</span>
      </span>
    </div>
  );
}

export function HoneyChargeApp() {
  const [language, setLanguage] = useState<Language>("ko");
  const [region, setRegion] = useState<Region>("jeju");
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weatherState, setWeatherState] = useState<{
    region: Region;
    status: "live" | "fallback";
    data?: WeatherHour;
  } | null>(null);
  const weatherStatus: WeatherConnection =
    weatherState?.region === region
      ? weatherState.status
      : "loading";
  const liveWeather =
    weatherState?.region === region &&
    weatherState.status === "live"
      ? weatherState.data ?? null
      : null;
  const simulation = useMemo(
    () => runSimulation(region, liveWeather ?? undefined),
    [region, liveWeather],
  );
  const weatherTimestamp =
    liveWeather?.timestamp ??
    simulation.energy[DEMO_CURRENT_HOUR].timestamp;
  const languageContextValue = useMemo(
    () => ({ language, setLanguage }),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = textFor(
      language,
      "HoneyCharge | 제주·호남 V2G 에너지 운영",
      "HoneyCharge | Jeju & Honam V2G Energy Operations",
    );
  }, [language]);

  useEffect(() => {
    let active = true;
    let requestController: AbortController | null = null;
    let requestTimeout: number | null = null;

    const refreshWeather = () => {
      requestController = new AbortController();
      requestTimeout = window.setTimeout(
        () => requestController?.abort(),
        8_000,
      );

      void getLiveWeather(region, requestController.signal)
        .then((data) => {
          if (active) {
            setWeatherState({ region, status: "live", data });
          }
        })
        .catch(() => {
          if (active) {
            setWeatherState({ region, status: "fallback" });
          }
        })
        .finally(() => {
          if (requestTimeout !== null) {
            window.clearTimeout(requestTimeout);
          }
        });
    };

    refreshWeather();
    const refreshInterval = window.setInterval(
      refreshWeather,
      15 * 60 * 1_000,
    );

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      if (requestTimeout !== null) {
        window.clearTimeout(requestTimeout);
      }
      requestController?.abort();
    };
  }, [region]);

  return (
    <LanguageContext.Provider value={languageContextValue}>
      <div className="app-shell">
        <Sidebar
          view={view}
          onView={setView}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="app-main">
          <Header
            region={region}
            onRegion={setRegion}
            onMenu={() => setSidebarOpen(true)}
            weatherStatus={weatherStatus}
            weatherTimestamp={weatherTimestamp}
          />
          <main className="content">
            {view === "dashboard" && (
              <DashboardView
                simulation={simulation}
                liveWeather={liveWeather}
                weatherStatus={weatherStatus}
              />
            )}
            {view === "fleet" && (
              <FleetView simulation={simulation} />
            )}
            {view === "simulation" && (
              <V2GSimulationView simulation={simulation} />
            )}
            <footer className="data-notice">
              <Info size={15} />
              <span>
                {language === "ko" ? (
                  <>
                    현재 기상은{" "}
                    <a
                      href="https://open-meteo.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open-Meteo
                    </a>{" "}
                    모델값이며 발전량·수요·차량 데이터는 서비스
                    검증을 위한 시연용 추정값입니다. 실제 계통 운영
                    또는 정산에 사용할 수 없습니다.
                  </>
                ) : (
                  <>
                    Current weather uses{" "}
                    <a
                      href="https://open-meteo.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open-Meteo
                    </a>{" "}
                    model data. Generation, demand, and vehicle
                    data are demonstration estimates for service
                    validation and must not be used for actual grid
                    operations or settlement.
                  </>
                )}
              </span>
              {view === "dashboard" && (
                <span className="map-data-notice">
                  {textFor(
                    language,
                    "지도 데이터는 OpenStreetMap 기여자가 구축한 공개 데이터이며 실제 설비 현황과 차이가 있을 수 있습니다. 지도 설계·분석 © OpenInfraMap.",
                    "Map data is contributed by the OpenStreetMap community and may differ from actual infrastructure. Map design and analysis © OpenInfraMap.",
                  )}
                </span>
              )}
            </footer>
          </main>
        </div>
      </div>
    </LanguageContext.Provider>
  );
}
