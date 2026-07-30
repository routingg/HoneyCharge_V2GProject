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

function makeEnergyTimeline() {
  const chargeByHour = new Map([
    [2, 125],
    [5, 80],
    [11, 250],
    [17, 100],
    [21, 84],
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
    electricityDemandKw: 0,
    surplusPowerKw: 0,
    v2gChargePowerKw: chargeByHour.get(hour) ?? 0,
    v2gDischargePowerKw: 0,
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

test("server-renders the GridFlow operations dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );

  const html = await response.text();
  assert.match(
    html,
    /<title>GridFlow \| 제주·호남 V2G 에너지 운영<\/title>/i,
  );
  assert.match(html, /제주.*V2G 통합 운영/);
  assert.match(html, /예상 재생에너지/);
  assert.match(html, /현재 태양광 예상 출력/);
  assert.match(html, /현재 풍력 예상 출력/);
  assert.match(html, /전력 인프라 지도/);
  assert.match(html, /OpenInfraMap에서 크게 보기/);
  assert.match(html, /Open-Meteo/);
  assert.match(html, /차량·스케줄/);
  assert.match(html, /자세히 보기/);
  assert.match(html, /잉여전력 흡수 상세/);
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

test("renders owner and fleet experiences in the application shell", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /운영 대시보드/);
  assert.match(html, /차주 참여/);
  assert.match(html, /사용자 이동권/);
  assert.match(html, /규칙 기반/);
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
