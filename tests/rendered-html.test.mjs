import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

async function loadDashboardService() {
  const sourceUrl = new URL(
    "../lib/services/dashboardService.ts",
    import.meta.url,
  );
  const source = await readFile(sourceUrl, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourceUrl.pathname,
  });
  const moduleRecord = { exports: {} };
  const requireFromTest = (specifier) => {
    if (specifier === "@/lib/data/mockData") {
      return { DEMO_CURRENT_HOUR: 11 };
    }
    throw new Error(`Unexpected test dependency: ${specifier}`);
  };
  const executeModule = vm.runInThisContext(
    `(function (require, module, exports) { ${outputText}\n})`,
    { filename: sourceUrl.pathname },
  );
  executeModule(
    requireFromTest,
    moduleRecord,
    moduleRecord.exports,
  );
  return moduleRecord.exports;
}

async function loadGridBalanceService() {
  const sourceUrl = new URL(
    "../lib/services/gridBalanceService.ts",
    import.meta.url,
  );
  const source = await readFile(sourceUrl, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourceUrl.pathname,
  });
  const moduleRecord = { exports: {} };
  const executeModule = vm.runInThisContext(
    `(function (require, module, exports) { ${outputText}\n})`,
    { filename: sourceUrl.pathname },
  );
  executeModule(() => ({}), moduleRecord, moduleRecord.exports);
  return moduleRecord.exports;
}

async function loadV2gScheduler() {
  const sourceUrl = new URL(
    "../lib/services/v2gScheduler.ts",
    import.meta.url,
  );
  const source = await readFile(sourceUrl, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourceUrl.pathname,
  });
  const moduleRecord = { exports: {} };
  const requireFromTest = (specifier) => {
    if (specifier === "@/lib/services/stayDurationService") {
      return { isVehicleAvailable: () => true };
    }
    throw new Error(`Unexpected test dependency: ${specifier}`);
  };
  const executeModule = vm.runInThisContext(
    `(function (require, module, exports) { ${outputText}\n})`,
    { filename: sourceUrl.pathname },
  );
  executeModule(
    requireFromTest,
    moduleRecord,
    moduleRecord.exports,
  );
  return moduleRecord.exports;
}

async function loadRewardSettlementService() {
  const sourceUrl = new URL(
    "../lib/services/rewardSettlementService.ts",
    import.meta.url,
  );
  const source = await readFile(sourceUrl, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourceUrl.pathname,
  });
  const moduleRecord = { exports: {} };
  const executeModule = vm.runInThisContext(
    `(function (require, module, exports) { ${outputText}\n})`,
    { filename: sourceUrl.pathname },
  );
  executeModule(() => ({}), moduleRecord, moduleRecord.exports);
  return moduleRecord.exports;
}

async function loadVehicleStatusService() {
  const sourceUrl = new URL(
    "../lib/services/vehicleStatusService.ts",
    import.meta.url,
  );
  const source = await readFile(sourceUrl, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourceUrl.pathname,
  });
  const moduleRecord = { exports: {} };
  const executeModule = vm.runInThisContext(
    `(function (require, module, exports) { ${outputText}\n})`,
    { filename: sourceUrl.pathname },
  );
  executeModule(() => ({}), moduleRecord, moduleRecord.exports);
  return moduleRecord.exports;
}

function makeEnergyTimeline() {
  const chargeByHour = new Map([
    [2, 125],
    [5, 80],
    [11, 250],
    [17, 100],
    [21, 84],
  ]);
  const dischargeByHour = new Map([
    [8, 100],
    [18, 300],
    [19, 200],
  ]);

  return Array.from({ length: 24 }, (_, hour) => ({
    timestamp: `2026-07-30T${String(hour).padStart(2, "0")}:00:00+09:00`,
    region: "jeju",
    temperature: 28,
    precipitation: 0,
    cloudCover: 20,
    solarRadiation: 500,
    windSpeed: 5,
    windDirection: 180,
    pressure: 1008,
    condition: "대체로 맑음",
    solarGenerationKw: 0,
    windGenerationKw: 0,
    renewableGenerationKw: 0,
    fixedBaseSupplyKw: 1200,
    electricityDemandKw: hour === 19 ? 2500 : 2000,
    surplusPowerKw: 0,
    v2gChargePowerKw: chargeByHour.get(hour) ?? 0,
    v2gDischargePowerKw:
      dischargeByHour.get(hour) ?? 0,
  }));
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () =>
          new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the HoneyCharge operations dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );

  const html = await response.text();
  assert.match(
    html,
    /<title>HoneyCharge \| 제주·호남 V2G 에너지 운영<\/title>/i,
  );
  assert.match(html, /제주.*V2G 통합 운영/);
  assert.match(html, /예상 재생에너지/);
  assert.match(html, /현재 태양광 예상 출력/);
  assert.match(html, /현재 풍력 예상 출력/);
  assert.match(html, /현재 수급과 V2G 조정/);
  assert.match(html, /고정 기저공급/);
  assert.match(html, /V2G 후 잔여 조정량/);
  assert.match(html, /1시간 단위 전력 수급/);
  assert.match(html, /전력 인프라 지도/);
  assert.match(html, /표시 레이어 · 눌러서 켜기\/끄기/);
  assert.match(html, /화석연료 발전/);
  assert.match(html, /원자력 발전/);
  assert.match(html, /3D로 전환/);
  assert.doesNotMatch(html, /표시 중|숨김|입체 보기|2D 보기/);
  assert.match(html, /OpenInfraMap에서 크게 보기/);
  assert.match(html, /단기예보 지도 · 다음 24시간/);
  assert.match(html, /색이 짙을수록 해당 격자의 예상 운량이 높습니다/);
  assert.match(html, /운량 색상 농도/);
  assert.match(html, /24시간 태양광/);
  assert.match(html, /외부 예보 연결에 실패해/);
  assert.match(html, /Open-Meteo/);
  assert.match(html, /차량·스케줄/);
  assert.match(html, /자세히 보기/);
  assert.match(html, /잉여전력 흡수 상세/);
  assert.match(html, /피크 공급 상세/);
  assert.match(html, /24시간/);
  assert.match(html, /1주/);
  assert.match(html, /30일/);
  assert.doesNotMatch(html, /렌터카 운영 스케줄/);
  assert.match(html, /시연용 추정값/);
  assert.doesNotMatch(
    html,
    /codex-preview|Your site is taking shape/i,
  );
});

test("keeps English dashboard labels readable without ellipsis", async () => {
  const component = await readFile(
    new URL("../components/HoneyChargeApp.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /Forecast Renewable Energy/);
  assert.match(component, /Forecast Electricity Demand/);
  assert.match(component, /Participating V2G Vehicles/);
  assert.match(
    css,
    /\.stat-copy p\s*\{[^}]*white-space:\s*normal;/s,
  );
  assert.match(
    css,
    /\.stat-copy span\s*\{[^}]*white-space:\s*normal;/s,
  );
  assert.doesNotMatch(
    css,
    /\.stat-copy p\s*\{[^}]*text-overflow:\s*ellipsis;/s,
  );
});

test("keeps infrastructure map controls compact", async () => {
  const component = await readFile(
    new URL(
      "../components/InfrastructureMap.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    component,
    /layerOn|layerOff|"표시 중"|"Visible"|"Hidden"/,
  );
  assert.doesNotMatch(component, /"입체 보기"|"2D 보기"/);
  assert.match(component, /\{isTilted \? "2D" : "3D"\}/);
});

test("builds peak supply insights for each forecast horizon", async () => {
  const { buildPeakSupplyInsight } =
    await loadDashboardService();
  const insight = buildPeakSupplyInsight(
    makeEnergyTimeline(),
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(insight.periods)),
    {
      day: {
        horizon: "day",
        days: 1,
        suppliedEnergyKWh: 600,
        householdDayEquivalents: 60,
        basis: "daily-forecast",
      },
      week: {
        horizon: "week",
        days: 7,
        suppliedEnergyKWh: 4200,
        householdDayEquivalents: 420,
        basis: "scaled-projection",
      },
      month: {
        horizon: "month",
        days: 30,
        suppliedEnergyKWh: 18000,
        householdDayEquivalents: 1800,
        basis: "scaled-projection",
      },
    },
  );
  assert.equal(insight.peakSupplyPowerKw, 300);
  assert.equal(insight.peakSupplyHour, "18:00");
  assert.equal(insight.activeSupplyHours, 3);
  assert.equal(insight.averageActiveSupplyPowerKw, 200);
  assert.equal(insight.peakDemandHour, "19:00");
  assert.equal(insight.supplyAtPeakDemandKw, 200);
  assert.equal(insight.peakDemandCoveragePercent, 8);
  assert.deepEqual(
    JSON.parse(JSON.stringify(insight.assumptions)),
    { householdDailyUseKWh: 10 },
  );
});

test("renders fleet and V2G simulation entry points", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /운영 대시보드/);
  assert.match(html, /V2G 시뮬레이션/);
  assert.doesNotMatch(html, /차주 앱 미리보기/);
  assert.doesNotMatch(html, /운영 안전 기준/);
  assert.doesNotMatch(html, /사용자 이동권/);
  assert.doesNotMatch(html, /모델 v0\.1/);
  assert.doesNotMatch(
    html,
    /Open-Meteo 현재 모델\s*→\s*발전량\s*→\s*V2G 배차/,
  );
});

test("keeps the V2G simulator unified and always participating", async () => {
  const component = await readFile(
    new URL("../components/HoneyChargeApp.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /V2G 충·방전 운영 시뮬레이션/);
  assert.match(component, /V2G Charge & Discharge Simulation/);
  assert.match(component, /isV2GEnabled:\s*true/);
  assert.match(component, /schedules=\{simulation\.schedules\}/);
  assert.doesNotMatch(
    component,
    /차주용 V2G|DRIVER EXPERIENCE|DRIVER APP INPUT|Driver App Preview/,
  );
  assert.doesNotMatch(
    component,
    /consent-toggle|setV2gEnabled|\["all",\s*"rental",\s*"private"\]/,
  );
  assert.doesNotMatch(
    component,
    /"렌터카"|"일반 차주"|"Rentals"|"Private Owners"/,
  );
  assert.doesNotMatch(css, /\.consent-toggle|\.filter-tabs/);
});

test("separates V2G non-participation from standby", async () => {
  const { getVehicleDisplayStatus } =
    await loadVehicleStatusService();
  const vehicle = {
    id: "OWN-006",
    ownerType: "private",
    model: "테슬라 Model 3",
    batteryCapacityKWh: 60,
    currentSoc: 50,
    targetSoc: 80,
    minimumSoc: 30,
    arrivalTime: "2026-07-30T00:00:00+09:00",
    departureTime: "2026-07-30T22:00:00+09:00",
    isConnected: true,
    isV2GEnabled: false,
    maxChargePowerKw: 7,
    maxDischargePowerKw: 5,
    currentStatus: "standby",
  };
  const item = {
    vehicleId: vehicle.id,
    timestamp: "2026-07-30T11:00:00+09:00",
    action: "standby",
    powerKw: 0,
    expectedSocBefore: 50,
    expectedSocAfter: 50,
    reason: "V2G 미동의 차량",
  };
  const schedule = {
    vehicle,
    items: [item],
    chargeEnergyKWh: 0,
    dischargeEnergyKWh: 0,
    departureSoc: 50,
    rewardPoints: 0,
  };

  assert.equal(getVehicleDisplayStatus(schedule, 0), "not-enrolled");
  assert.equal(
    getVehicleDisplayStatus(
      {
        ...schedule,
        vehicle: { ...vehicle, isConnected: false },
      },
      0,
    ),
    "offline",
  );
  assert.equal(
    getVehicleDisplayStatus(
      {
        ...schedule,
        items: [
          {
            ...item,
            action: "charge",
            powerKw: 7,
            expectedSocAfter: 60,
          },
        ],
      },
      0,
    ),
    "charging",
  );
  assert.equal(
    getVehicleDisplayStatus(
      {
        ...schedule,
        vehicle: { ...vehicle, isV2GEnabled: true },
        items: [{ ...item, expectedSocAfter: 95 }],
      },
      0,
    ),
    "full",
  );
  assert.equal(
    getVehicleDisplayStatus(
      {
        ...schedule,
        vehicle: { ...vehicle, isV2GEnabled: true },
      },
      0,
    ),
    "standby",
  );
});

test("calculates residual demand after fixed supply, renewables, and V2G", async () => {
  const { calculateGridBalance, getFixedBaseSupplyKw } =
    await loadGridBalanceService();
  const result = calculateGridBalance({
    demandKw: 1550,
    fixedBaseSupplyKw: 1200,
    renewableSupplyKw: 240,
    v2gChargeKw: 20,
    v2gDischargeKw: 50,
  });

  assert.equal(getFixedBaseSupplyKw("jeju"), 1200);
  assert.equal(getFixedBaseSupplyKw("honam"), 1450);
  assert.equal(result.residualBeforeV2gKw, 110);
  assert.equal(result.netV2gSupplyKw, 30);
  assert.equal(result.residualAfterV2gKw, 80);
});

test("awards only shared savings to an opted-in vehicle", async () => {
  const { scheduleVehicle } = await loadV2gScheduler();
  const { settleSharedSavingsRewards } =
    await loadRewardSettlementService();
  const energy = makeEnergyTimeline().map((hour) => ({
    ...hour,
    renewableGenerationKw: 1800,
    surplusPowerKw: 500,
  }));
  const baseVehicle = {
    id: "OWN-006",
    ownerType: "private",
    model: "테슬라 Model 3",
    batteryCapacityKWh: 60,
    currentSoc: 50,
    targetSoc: 80,
    minimumSoc: 30,
    arrivalTime: "2026-07-30T00:00:00+09:00",
    departureTime: "2026-07-30T22:00:00+09:00",
    isConnected: true,
    maxChargePowerKw: 7,
    maxDischargePowerKw: 5,
    currentStatus: "standby",
  };
  const notOptedIn = scheduleVehicle(
    { ...baseVehicle, isV2GEnabled: false },
    energy,
  );
  const optedIn = scheduleVehicle(
    {
      ...baseVehicle,
      id: "OWN-007",
      isV2GEnabled: true,
    },
    energy,
  );
  const baseline = scheduleVehicle(
    {
      ...baseVehicle,
      id: "OWN-007",
      isV2GEnabled: false,
    },
    energy,
  );
  const settled = settleSharedSavingsRewards(
    energy,
    [optedIn],
    [baseline],
  );

  assert.equal(notOptedIn.rewardPoints, 0);
  assert.equal(notOptedIn.dischargeEnergyKWh, 0);
  assert.equal(optedIn.rewardPoints, 0);
  assert.ok(settled.schedules[0].rewardPoints > 0);
  assert.equal(
    settled.schedules[0].rewardSettlement.rewardWon,
    settled.schedules[0].rewardPoints,
  );
  assert.equal(
    settled.summary.assumptions.benefitShareRate,
    0.2,
  );
});

test("nets opposing actions before sharing verified grid savings", async () => {
  const { settleSharedSavingsRewards } =
    await loadRewardSettlementService();
  const vehicle = {
    id: "EV-001",
    ownerType: "private",
    model: "테스트 차량",
    batteryCapacityKWh: 70,
    currentSoc: 60,
    targetSoc: 80,
    minimumSoc: 30,
    arrivalTime: "2026-07-30T00:00:00+09:00",
    departureTime: "2026-07-30T23:00:00+09:00",
    isConnected: true,
    isV2GEnabled: true,
    maxChargePowerKw: 40,
    maxDischargePowerKw: 50,
    currentStatus: "standby",
  };
  const emptySettlement = {
    eligibleChargeKWh: 0,
    eligibleDischargeKWh: 0,
    avoidedCurtailmentKWh: 0,
    avoidedSupplyKWh: 0,
    grossGridBenefitWon: 0,
    sharedRewardPoolWon: 0,
    rewardWon: 0,
    shareRate: 0,
  };
  const makeSchedule = (id, actions, isV2GEnabled = true) => ({
    vehicle: { ...vehicle, id, isV2GEnabled },
    items: actions.map((action, hour) => ({
      vehicleId: id,
      timestamp: `2026-07-30T0${hour}:00:00+09:00`,
      action: action.type,
      powerKw: action.powerKw,
      expectedSocBefore: 60,
      expectedSocAfter: 60,
      reason: "test",
    })),
    chargeEnergyKWh: 0,
    dischargeEnergyKWh: 0,
    departureSoc: 60,
    rewardPoints: 0,
    rewardSettlement: emptySettlement,
  });
  const energy = [
    {
      ...makeEnergyTimeline()[0],
      renewableGenerationKw: 1000,
      fixedBaseSupplyKw: 500,
      electricityDemandKw: 900,
    },
    {
      ...makeEnergyTimeline()[1],
      renewableGenerationKw: 100,
      fixedBaseSupplyKw: 500,
      electricityDemandKw: 900,
    },
  ];
  const actual = [
    makeSchedule("EV-001", [
      { type: "charge", powerKw: 40 },
      { type: "discharge", powerKw: 50 },
    ]),
    makeSchedule("EV-002", [
      { type: "discharge", powerKw: 10 },
      { type: "charge", powerKw: 10 },
    ]),
  ];
  const baseline = [
    makeSchedule(
      "EV-001",
      [
        { type: "standby", powerKw: 0 },
        { type: "standby", powerKw: 0 },
      ],
      false,
    ),
    makeSchedule(
      "EV-002",
      [
        { type: "standby", powerKw: 0 },
        { type: "standby", powerKw: 0 },
      ],
      false,
    ),
  ];
  const settled = settleSharedSavingsRewards(
    energy,
    actual,
    baseline,
  );

  assert.equal(settled.summary.avoidedCurtailmentKWh, 30);
  assert.equal(settled.summary.avoidedAdditionalSupplyKWh, 40);
  assert.equal(settled.summary.grossGridBenefitWon, 11200);
  assert.equal(settled.summary.sharedRewardPoolWon, 2240);
  assert.equal(settled.schedules[0].rewardPoints, 2240);
  assert.equal(settled.schedules[1].rewardPoints, 0);
});

test("builds surplus absorption insights for each forecast horizon", async () => {
  const { buildSurplusAbsorptionInsight } =
    await loadDashboardService();
  const insight = buildSurplusAbsorptionInsight(
    makeEnergyTimeline(),
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(insight.periods)),
    {
      day: {
        horizon: "day",
        days: 1,
        absorbedEnergyKWh: 639,
        curtailmentReductionKWh: 550,
        householdDayEquivalents: 64,
        basis: "daily-forecast",
      },
      week: {
        horizon: "week",
        days: 7,
        absorbedEnergyKWh: 4473,
        curtailmentReductionKWh: 3847,
        householdDayEquivalents: 447,
        basis: "scaled-projection",
      },
      month: {
        horizon: "month",
        days: 30,
        absorbedEnergyKWh: 19170,
        curtailmentReductionKWh: 16486,
        householdDayEquivalents: 1917,
        basis: "scaled-projection",
      },
    },
  );
  assert.equal(insight.peakAbsorptionPowerKw, 250);
  assert.equal(insight.peakAbsorptionHour, "11:00");
  assert.equal(insight.activeAbsorptionHours, 5);
  assert.deepEqual(
    JSON.parse(JSON.stringify(insight.assumptions)),
    {
      householdDailyUseKWh: 10,
      curtailmentAvoidanceRate: 0.86,
    },
  );
});
