# HoneyCharge — 제주·호남 V2G 운영 MVP

> 이 문서는 한국어·영어·중국어 3개 언어로 동일한 내용을 제공합니다. 원하는 언어 섹션으로 바로 이동하세요.
> This document provides the same content in Korean, English, and Chinese. Jump to the language section you need.
> 本文档以韩语、英语、中文三种语言提供相同内容。请跳转至所需的语言章节。

**[한국어](#한국어)** · **[English](#english)** · **[中文](#中文)**

---

## 한국어

HoneyCharge는 제주·호남의 재생에너지 잉여 전력과 주차 중인 전기차 배터리를 연결하는 V2G(Vehicle-to-Grid) 운영 시뮬레이터입니다. 실제 충전기·전력망·정산 시스템에는 연결하지 않으며, 해커톤 시연을 위해 설명 가능한 규칙 기반 로직과 합성 데이터를 사용합니다.

하나의 저장소 안에 성격이 다른 화면 세 개가 함께 배포됩니다.

| 경로 | 대상 | 설명 |
| --- | --- | --- |
| `/` | 전력망 운영자 | 대시보드 — 발전·수요·V2G 통합 시뮬레이션과 인프라 지도 |
| `/mobile` | 전기차 운전자 | Next.js로 만든 모바일 웹 데모 (E-pit / myHyundai 두 가지 앱 스킨) |
| `/app` | 전기차 운전자 | 별도로 빌드된 HoneyCharge 드라이버 SPA (정적 산출물로 포함) |

### `/` — 운영 대시보드

`app/page.tsx` → `components/HoneyChargeApp.tsx`가 렌더링하는 화면으로, 아래 "주요 기능"에서 설명하는 지역 전환, 24시간 시뮬레이션, 인프라 지도, 차량별 스케줄, 참여·보상 계산 등을 담당합니다. 전력망 운영자·기획자가 "지금 계통에 무슨 일이 일어나고 있고 왜 이 차를 충전/방전시키는지"를 설명하기 위한 화면입니다.

### `/mobile` — 운전자 모바일 웹 데모 (상세)

`app/mobile/page.tsx`가 `components/mobile/MobileApp.tsx`를 렌더링하는 Next.js 라우트입니다. 실제 서비스 두 곳을 흉내 낸 **두 가지 스킨**을 화면 전환 없이 실시간으로 바꿔가며 비교 시연할 수 있도록 만들어졌습니다.

- **E-pit 스킨** — 충전 네트워크 사업자 앱을 흉내 낸 스킨. 홈, V2G 스케줄, SOC 설정, 충전소 지도, 리워드에 더해 **Focus 모드**(충전 중 몰입 화면)와 **PnC(Plug & Charge) 흐름**(케이블만 꽂으면 인증·결제가 자동으로 이루어지는 흐름)을 포함합니다.
- **myHyundai 스킨** — 완성차 제조사 앱을 흉내 낸 스킨. 홈, V2G 스케줄, SOC 설정, 충전소 지도, 지갑(포인트), 마이카(차량 정보) 화면으로 구성됩니다.
- 상단 `SkinSwitcher`로 두 스킨을 즉시 전환할 수 있고, `SkinSettings` 화면에서도 선택할 수 있습니다.
- **"시연 시각" 프리셋 바**: 11:00(여유) / 16:00(대기) / 18:00(공유) / 21:00(보호) 네 시점을 버튼 한 번으로 이동하며, 시간대에 따라 에너지 상태 문구·추천 SOC·V2G 참여 창이 즉시 재계산되는 것을 시연할 수 있습니다.
- 화면 아래 `BottomNav`로 홈 / V2G / 내 차 / 충전소 / 리워드 사이를 이동합니다.
- 데이터 흐름: `lib/services/simulationService.ts`의 그리드 시뮬레이션 결과를 `lib/services/mobileHomeService.ts`가 홈 화면에 필요한 뷰모델(SOC, 예상 주행거리, 충전 완료 예정 시각, 오늘의 V2G 참여 창, 리워드 포인트 등)로 가공해 전달합니다.
- 대시보드(`/`)와 달리 **운전자 1인칭 시점**으로, "내 차가 지금 무엇을 하고 있고 얼마를 벌고 있는지"를 보여주는 데 초점을 둡니다.

### `/app` — HoneyCharge 드라이버 앱 (별도 SPA, 상세)

`/app`은 이 Next.js 프로젝트의 일부가 아니라 **완전히 별도의 Vite + React SPA**(프로젝트명 `honeycharge_app`, 이 저장소와 무관한 자체 git 히스토리)를 빌드해서 `public/app/`에 정적 산출물(JS/CSS 번들, favicon, `index.html`, 제주 관광명소 이미지 30장)로 그대로 포함시킨 것입니다.

- **서빙 방식**: Next.js(vinext)는 정적 `public/` 경로로의 rewrite를 지원하지 않기 때문에, `worker/index.ts`의 Cloudflare Worker `fetch` 핸들러가 요청 단계에서 직접 라우팅합니다. 마지막 경로 조각에 확장자가 있으면(`.js`, `.css`, `.jpg` 등) 정적 자산 요청으로 보고 그대로 서빙하고, 확장자가 없으면 클라이언트 라우팅(react-router) 경로로 보고 `/app/index.html`로 폴백합니다.
- **로그인/온보딩**: 이메일 기반 로그인·회원가입 폼(시연용 목업, 실제 인증 서버 없음).
- **충전 흐름과 스마트 제안**: 급속 충전소 찾기, 목표 충전량 낮추기·출발 시간 늦추기 같은 완속/급속 전환 제안 등 충전 세션을 조정하는 화면.
- **리워드/포인트**: 충전을 통해 쌓은 포인트를 충전소 도보 3분 거리의 제휴 카페 쿠폰(아메리카노, 스콘 등) 같은 혜택으로 교환하는 화면(시연용 가상 매장).
- **제주 관광명소 탐색**: 용두암·이호테우해변 등 제주 명소 30곳을 위치, 카테고리, 평균 체류시간, 입장료, 사진 출처(CC 라이선스 명시)와 함께 제공해, "충전 대기 시간 동안 근처에서 무엇을 할 수 있는지"를 안내합니다. `averageStayMinutes`로 예상 충전 완료 시각과 견주어 볼 수 있도록 설계되어 있습니다.
- **즐겨찾기** 등 부가 기능도 포함되어 있습니다.
- 이 SPA 자체의 소스 코드는 이 저장소에 없고 빌드 산출물만 포함되어 있어, 로직을 수정하려면 `honeycharge_app` 원본 프로젝트에서 작업 후 다시 `public/app/`에 빌드해 넣어야 합니다.

### 주요 기능

- 제주/호남 권역 전환과 24시간 날씨·발전량·수요 시뮬레이션
- Open-Meteo 현재 기상 모델을 이용한 기온·운량·일사량·풍속 자동 갱신
- 태양 위치·일사량·운량·기온 기반 태양광 추정과 허브 높이 풍속 출력곡선 기반 풍력 추정
- OpenFreeMap 배경 지도와 OpenInfraMap 공개 데이터를 이용한 변전소·발전소·고전압 선로 지도
- 전력 과잉/부족 및 V2G 충전·방전량 통합 차트
- 잉여전력 흡수량의 24시간·7일·30일 환산과 출력제어 회피·가구 사용량 비교
- 렌터카 22대, 일반 차주 차량 10대의 차량별 스케줄
- 차량별 SOC, 체류시간, 충·방전 예상량, 추천 사유 상세
- 차주 입력값에 따라 즉시 다시 계산되는 참여·보상 화면
- 출발 목표와 최소 보장 SOC를 전력망 요청보다 우선하는 안전 규칙
- 우측 상단에서 전 화면을 한국어와 영어로 전환하는 언어 선택
- `/mobile`의 E-pit / myHyundai 듀얼 스킨과 시연 시각 이동 데모
- `/app`의 드라이버 리워드·제주 관광명소 연계 데모

### 실행 방법

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 아래 주소를 엽니다.

- `http://localhost:3000` — 운영 대시보드
- `http://localhost:3000/mobile` — 운전자 모바일 웹 데모
- `http://localhost:3000/app` — HoneyCharge 드라이버 SPA (정적 산출물이므로 프로덕션 빌드 결과와 동일하게 보임)

검증:

```bash
npm run build
npm test
npm run lint
```

### 구조

```text
app/
  page.tsx                 운영 대시보드(/) 진입점
  layout.tsx                메타데이터와 한국어 문서 설정
  mobile/
    page.tsx                 운전자 모바일 웹 데모(/mobile) 진입점
    mobile.css
components/
  HoneyChargeApp.tsx        대시보드·차량 상세·차주 참여 UI
  InfrastructureMap.tsx     전력 인프라 MapLibre 지도
  CloudForecastMap.tsx      24시간 구름·일사량 지도
  mobile/
    MobileApp.tsx            /mobile 화면 라우팅과 상태 관리
    SkinProvider.tsx         E-pit / myHyundai 스킨 전환 컨텍스트
    EpitHome.tsx, EpitV2GSchedule.tsx, EpitSocSettings.tsx,
    EpitStationMap.tsx, EpitRewards.tsx, EpitFocusScreen.tsx,
    EpitPncFlow.tsx          E-pit 스킨 화면들
    MyHyundaiHome.tsx, MyHyundaiV2GSchedule.tsx,
    MyHyundaiSocSettings.tsx, MyHyundaiStationMap.tsx,
    MyHyundaiWallet.tsx, MyHyundaiVehicle.tsx
                             myHyundai 스킨 화면들
    BottomNav.tsx, SkinSwitcher.tsx, SkinSettings.tsx,
    PlaceholderScreen.tsx, VehicleGlyph.tsx, StationMap.tsx
                             공통 UI 부품
lib/
  types.ts                  공통 데이터 모델
  i18n.ts                   한국어/영어 문구 사전
  data/
    mockData.ts              차량 32대 합성 데이터
    chargingStations.ts      충전소 목업 데이터
    coupons.ts                리워드 쿠폰 목업 데이터
  services/
    weatherService.ts, liveWeatherService.ts,
    renewableForecastService.ts, demandForecastService.ts,
    shortTermForecastService.ts, kmaForecastServer.ts
                             날씨·발전량 예측
    demandForecastService.ts, stayDurationService.ts,
    vehicleService.ts, vehicleStatusService.ts,
    v2gScheduler.ts, simulationService.ts,
    dashboardService.ts, gridBalanceService.ts
                             수요·차량·V2G 스케줄링·대시보드 집계
    mobileHomeService.ts     /mobile 홈 화면 뷰모델 변환
    rewardSettlementService.ts
                             보상 포인트 정산
worker/
  index.ts                  Cloudflare Worker 엔트리 — /api, /app 정적 SPA
                             라우팅, 이미지 최적화 프록시 처리
public/
  app/                       honeycharge_app SPA 빌드 산출물(정적 파일)
tests/
  rendered-html.test.mjs    배포 빌드 렌더링 검증
```

### MVP 가정과 판단 기준

- 모든 데이터는 실제 측정값이 아닌 시연용 합성값입니다.
- 발전·수요 단위는 kW, 시간 간격은 1시간이므로 시간대 합산값은 kWh로 해석합니다.
- 재생에너지 발전이 수요보다 180kW 이상 많으면 충전을 우선합니다.
- 수요가 발전보다 240kW 이상 많으면, V2G 동의·연결·양방향 충전 가능 차량에 방전을 검토합니다.
- 충전 효율은 92%, 방전 효율은 90%로 가정합니다.
- 출발 목표 SOC 확보에 필요한 시간이 부족해지면 계통 신호와 무관하게 충전을 우선합니다.
- 최소 보장 SOC 이하로 방전하지 않으며, 출발 전 목표 SOC 회복 가능성이 없으면 방전하지 않습니다.
- 보상은 시연값으로 방전 1kWh당 42P, 잉여전력 충전 1kWh당 8P입니다.
- 잉여전력 상세의 7일·30일 값은 24시간 예측을 각각 7일·30일로 환산한 값이며, 실제 누적 실적이 아닙니다.
- 가구 비교는 1가구 하루 10kWh, 출력제어 회피량은 흡수 전력의 86%라는 시연 가정을 사용합니다.
- `/app`의 리워드 매장·쿠폰, `/mobile`의 충전소·차량 정보는 모두 시연용 목업 데이터이며 실제 제휴·재고와 무관합니다.

### 외부 날씨 API 연결

대시보드 첫 화면은 브라우저에서 Open-Meteo 공개 API의 현재 모델값을 가져옵니다. 연결에 실패하거나 8초 안에 응답하지 않으면 `weatherService`의 지역별 합성 예보로 자동 전환합니다. 무료 비상업 공개 API는 키 없이 사용할 수 있으며, 상업 운영 시에는 Open-Meteo 이용 조건에 맞는 서버 프록시와 API 키 관리가 필요합니다. 기상청 API를 연결할 경우에도 키를 코드에 넣지 말고 `.env.local`의 환경변수로 관리해야 합니다.

### 전력 인프라 지도

지도는 MapLibre GL JS로 렌더링하며 OpenFreeMap 배경 스타일과 OpenInfraMap 전력 벡터 타일을 사용합니다. 변전소·변환소, 태양광·풍력 발전시설, 고전압 가공선로와 지중 케이블을 구분해 표시합니다. 전력 레이어는 배경 지도와 독립적으로 불러오므로 일부 외부 타일이 지연되더라도 기본 지도를 가리지 않습니다. 외부 지도 데이터는 인터넷 연결이 필요하며, 표시 범위는 OpenStreetMap에 등록된 데이터와 확대 수준에 따라 달라집니다.

### 범위 밖

실제 전력시장 거래, 충전기 제어, 결제·정산, 인증, 장기 데이터 저장, 실측 발전량 보정은 이 MVP에 포함하지 않습니다.

---

## English

HoneyCharge is a V2G (Vehicle-to-Grid) operations simulator that connects surplus renewable power in Jeju and Honam with the batteries of parked electric vehicles. It does not connect to real chargers, power grids, or settlement systems, and uses explainable rule-based logic and synthetic data for hackathon demonstration.

One repository serves three distinct surfaces:

| Path | Audience | Description |
| --- | --- | --- |
| `/` | Grid operator | Dashboard — combined generation/demand/V2G simulation and infrastructure map |
| `/mobile` | EV driver | Next.js mobile web demo (two app skins: E-pit / myHyundai) |
| `/app` | EV driver | Separately built HoneyCharge driver SPA (bundled as static output) |

### `/` — Operator Dashboard

Rendered by `app/page.tsx` → `components/HoneyChargeApp.tsx`. It covers the region switching, 24-hour simulation, infrastructure map, per-vehicle schedules, and participation/reward calculations described under "Key Features" below. This screen is built for grid operators/planners to explain "what's happening on the grid right now, and why this vehicle is being charged or discharged."

### `/mobile` — Driver Mobile Web Demo (Detailed)

A Next.js route where `app/mobile/page.tsx` renders `components/mobile/MobileApp.tsx`. It lets a presenter switch, in real time and without navigating away, between **two skins** that mimic two different real-world products.

- **E-pit skin** — mimics a charging-network operator's app. In addition to Home, V2G Schedule, SOC Settings, Station Map, and Rewards, it includes a **Focus mode** (an immersive screen shown while charging) and a **PnC (Plug & Charge) flow** (authentication and payment happen automatically as soon as the cable is plugged in).
- **myHyundai skin** — mimics an automaker's app. It consists of Home, V2G Schedule, SOC Settings, Station Map, Wallet (points), and My Vehicle screens.
- The `SkinSwitcher` at the top lets you toggle skins instantly; the same choice is also available from the `SkinSettings` screen.
- **"Demo time" preset bar**: four presets — 11:00 (relaxed), 16:00 (waiting), 18:00 (sharing), 21:00 (protected) — let you jump between times of day with one tap, instantly recalculating the energy-state copy, recommended SOC, and today's V2G participation window.
- The `BottomNav` at the bottom moves between Home / V2G / My Vehicle / Stations / Rewards.
- Data flow: `lib/services/mobileHomeService.ts` converts the grid simulation output from `lib/services/simulationService.ts` into the view model the Home screen needs (SOC, estimated range, projected charge-complete time, today's V2G window, reward points, etc.).
- Unlike the dashboard (`/`), this is a **first-person driver view**, focused on showing "what is my car doing right now, and how much am I earning."

### `/app` — HoneyCharge Driver App (Separate SPA, Detailed)

`/app` is not part of this Next.js project at all — it is a **completely separate Vite + React SPA** (project name `honeycharge_app`, with its own git history unrelated to this repository), built and included as static output (JS/CSS bundle, favicon, `index.html`, and 30 Jeju tourist-attraction photos) under `public/app/`.

- **How it's served**: Next.js (vinext) does not support rewriting to a static `public/` path, so `worker/index.ts`'s Cloudflare Worker `fetch` handler routes it directly at the request level. If the last path segment has an extension (`.js`, `.css`, `.jpg`, etc.) it's treated as a static asset request and passed straight through; otherwise it's treated as a client-side (react-router) route and falls back to `/app/index.html`.
- **Login/onboarding**: an email-based login/sign-up form (a demo mock — there is no real auth backend).
- **Charging flow and smart suggestions**: finding fast chargers, and suggestions like lowering the target charge level or delaying departure time to adjust a charging session.
- **Rewards/points**: redeeming points earned from charging for perks such as coupons (Americano, scones, etc.) at partner cafés within a 3-minute walk of the charging station (demo/mock storefronts).
- **Jeju attraction discovery**: 30 Jeju attractions (Yongduam Rock, Iho Tewoo Beach, and more) with location, category, average visit duration, admission fee, and photo credit (CC-licensed), so drivers can see what's nearby "while charging." The `averageStayMinutes` field is designed to be compared against the projected charge-complete time.
- Also includes a **favorites** feature, among others.
- The SPA's own source code is not in this repository — only the build output is included — so changing its logic requires working in the original `honeycharge_app` project and rebuilding into `public/app/`.

### Key Features

- Switching between the Jeju and Honam regions with 24-hour weather, generation, and demand simulation
- Automatic updates of temperature, cloud cover, solar irradiance, and wind speed using the Open-Meteo current weather model
- Solar generation estimates based on sun position, irradiance, cloud cover, and temperature, and wind generation estimates based on hub-height wind speed power curves
- A substation, generation, and high-voltage line map using the OpenFreeMap base map and OpenInfraMap public data
- Combined charts for power surplus/deficit and V2G charge/discharge volume
- 24-hour, 7-day, and 30-day projections of surplus power absorption, with curtailment-avoidance and household-usage comparisons
- Per-vehicle schedules for 22 rental cars and 10 privately owned vehicles
- Per-vehicle details on SOC, stay duration, expected charge/discharge volume, and recommendation rationale
- A participation/reward screen that recalculates instantly based on vehicle owner input
- Safety rules that prioritize departure targets and guaranteed minimum SOC over grid requests
- A language toggle in the top right that switches the entire screen between Korean and English
- `/mobile`'s E-pit / myHyundai dual-skin and demo-time-travel presentation
- `/app`'s driver rewards and Jeju attraction discovery demo

### How to Run

Node.js 22.13 or later is required.

```bash
npm install
npm run dev
```

Open in your browser:

- `http://localhost:3000` — operator dashboard
- `http://localhost:3000/mobile` — driver mobile web demo
- `http://localhost:3000/app` — HoneyCharge driver SPA (static output, so it looks identical to the production build)

Verification:

```bash
npm run build
npm test
npm run lint
```

### Structure

```text
app/
  page.tsx                 Operator dashboard (/) entry point
  layout.tsx                Metadata and Korean document settings
  mobile/
    page.tsx                 Driver mobile web demo (/mobile) entry point
    mobile.css
components/
  HoneyChargeApp.tsx        Dashboard, vehicle detail, and owner participation UI
  InfrastructureMap.tsx     MapLibre map of power infrastructure
  CloudForecastMap.tsx      24-hour cloud/irradiance map
  mobile/
    MobileApp.tsx            /mobile screen routing and state
    SkinProvider.tsx         E-pit / myHyundai skin-switching context
    EpitHome.tsx, EpitV2GSchedule.tsx, EpitSocSettings.tsx,
    EpitStationMap.tsx, EpitRewards.tsx, EpitFocusScreen.tsx,
    EpitPncFlow.tsx          E-pit skin screens
    MyHyundaiHome.tsx, MyHyundaiV2GSchedule.tsx,
    MyHyundaiSocSettings.tsx, MyHyundaiStationMap.tsx,
    MyHyundaiWallet.tsx, MyHyundaiVehicle.tsx
                             myHyundai skin screens
    BottomNav.tsx, SkinSwitcher.tsx, SkinSettings.tsx,
    PlaceholderScreen.tsx, VehicleGlyph.tsx, StationMap.tsx
                             Shared UI pieces
lib/
  types.ts                  Shared data model
  i18n.ts                   Korean/English copy dictionary
  data/
    mockData.ts              Synthetic data for 32 vehicles
    chargingStations.ts      Mock charging station data
    coupons.ts                Mock reward coupon data
  services/
    weatherService.ts, liveWeatherService.ts,
    renewableForecastService.ts, demandForecastService.ts,
    shortTermForecastService.ts, kmaForecastServer.ts
                             Weather and generation forecasting
    demandForecastService.ts, stayDurationService.ts,
    vehicleService.ts, vehicleStatusService.ts,
    v2gScheduler.ts, simulationService.ts,
    dashboardService.ts, gridBalanceService.ts
                             Demand, vehicles, V2G scheduling, dashboard aggregation
    mobileHomeService.ts     /mobile home screen view-model conversion
    rewardSettlementService.ts
                             Reward point settlement
worker/
  index.ts                  Cloudflare Worker entry point — /api routing,
                             /app static SPA routing, image optimization proxy
public/
  app/                       Build output of the honeycharge_app SPA (static files)
tests/
  rendered-html.test.mjs    Deployment build render verification
```

### MVP Assumptions and Criteria

- All data is synthetic demonstration data, not real measurements.
- Generation and demand are in kW with a 1-hour interval, so hourly sums are interpreted as kWh.
- Charging is prioritized when renewable generation exceeds demand by 180 kW or more.
- When demand exceeds generation by 240 kW or more, discharge is considered for vehicles that have opted into V2G, are connected, and support bidirectional charging.
- Charging efficiency is assumed at 92% and discharging efficiency at 90%.
- If there isn't enough time left to reach the departure target SOC, charging is prioritized regardless of the grid signal.
- Vehicles never discharge below the guaranteed minimum SOC, and do not discharge if there's no possibility of recovering the target SOC before departure.
- Rewards are demonstration values: 42P per kWh discharged and 8P per kWh charged from surplus power.
- The 7-day and 30-day figures in the surplus absorption details are the 24-hour forecast scaled to 7 and 30 days respectively, not actual cumulative performance.
- Household comparisons assume 10 kWh per household per day, and curtailment avoidance assumes 86% of absorbed power, both as demonstration assumptions.
- `/app`'s reward stores/coupons and `/mobile`'s charging stations/vehicle data are all demo mock data unrelated to any real partnership or inventory.

### External Weather API Connection

The dashboard's first screen fetches current model values from the Open-Meteo public API in the browser. If the connection fails or doesn't respond within 8 seconds, it automatically falls back to `weatherService`'s regional synthetic forecast. The free, non-commercial public API can be used without a key; commercial operation would require a server proxy and API key management compliant with Open-Meteo's terms of use. If connecting the KMA (Korea Meteorological Administration) API, keys must be managed as environment variables in `.env.local` rather than hardcoded.

### Power Infrastructure Map

The map is rendered with MapLibre GL JS, using the OpenFreeMap base style and OpenInfraMap power vector tiles. It distinguishes substations/converter stations, solar/wind generation facilities, high-voltage overhead lines, and underground cables. The power layer loads independently of the base map, so the base map remains visible even if some external tiles are delayed. External map data requires an internet connection, and the coverage shown depends on data registered in OpenStreetMap and the zoom level.

### Out of Scope

Real power market trading, charger control, payment/settlement, authentication, long-term data storage, and measured-generation calibration are not included in this MVP.

---

## 中文

HoneyCharge 是一个 V2G（车辆到电网）运营模拟器，用于连接济州和湖南地区的可再生能源盈余电力与停放中的电动汽车电池。本系统不连接实际充电设备、电网或结算系统，为便于黑客松演示，使用可解释的基于规则的逻辑和合成数据。

同一个代码仓库中同时部署了三个用途不同的界面：

| 路径 | 面向对象 | 说明 |
| --- | --- | --- |
| `/` | 电网运营方 | 仪表盘 —— 发电/需求/V2G 综合模拟与基础设施地图 |
| `/mobile` | 电动车车主 | 基于 Next.js 的移动端网页演示（E-pit / myHyundai 两种应用皮肤） |
| `/app` | 电动车车主 | 单独构建的 HoneyCharge 车主端 SPA（以静态产物形式内置） |

### `/` —— 运营仪表盘

由 `app/page.tsx` → `components/HoneyChargeApp.tsx` 渲染，负责下方"主要功能"中所述的区域切换、24 小时模拟、基础设施地图、逐车调度以及参与/奖励计算。该界面面向电网运营方/规划人员，用于说明"电网当前发生了什么，以及为什么要给这辆车充电或放电"。

### `/mobile` —— 车主移动端网页演示（详细说明）

这是一个 Next.js 路由：`app/mobile/page.tsx` 渲染 `components/mobile/MobileApp.tsx`。演示者无需切换页面，即可实时在模拟两种真实产品的**两种皮肤**之间切换对比。

- **E-pit 皮肤** —— 模拟充电网络运营商的应用。除了首页、V2G 调度、SOC 设置、充电站地图、奖励之外，还包含**专注模式**（充电时的沉浸式画面）与 **PnC（即插即充）流程**（插上充电枪后自动完成认证与支付）。
- **myHyundai 皮肤** —— 模拟整车厂应用，由首页、V2G 调度、SOC 设置、充电站地图、钱包（积分）、我的车辆等画面组成。
- 顶部的 `SkinSwitcher` 可即时切换两种皮肤，`SkinSettings` 画面中也可以进行同样的选择。
- **"演示时间"预设条**：11:00（充裕）/ 16:00（等待）/ 18:00（共享）/ 21:00（保护）四个时间点，一键跳转即可实时重新计算能源状态文案、建议 SOC 以及当日 V2G 参与时段。
- 底部的 `BottomNav` 用于在首页 / V2G / 我的车辆 / 充电站 / 奖励之间切换。
- 数据流：`lib/services/mobileHomeService.ts` 将 `lib/services/simulationService.ts` 输出的电网模拟结果，转换为首页所需的视图模型（SOC、预计续航、预计充电完成时间、当日 V2G 时段、奖励积分等）。
- 与仪表盘（`/`）不同，这里是**车主第一人称视角**，重点展示"我的车现在在做什么、能赚多少"。

### `/app` —— HoneyCharge 车主端应用（独立 SPA，详细说明）

`/app` 完全不属于这个 Next.js 项目本身，而是一个**完全独立的 Vite + React SPA**（项目名为 `honeycharge_app`，拥有与本仓库无关的独立 git 历史），其构建产物（JS/CSS 打包文件、favicon、`index.html`，以及 30 张济州旅游景点照片）以静态文件形式包含在 `public/app/` 目录下。

- **服务方式**：由于 Next.js（vinext）不支持向静态 `public/` 路径的 rewrite，因此由 `worker/index.ts` 中的 Cloudflare Worker `fetch` 处理函数在请求层直接完成路由。若路径最后一段带有扩展名（如 `.js`、`.css`、`.jpg`），则视为静态资源请求直接放行；若不带扩展名，则视为客户端路由（react-router）路径，回退到 `/app/index.html`。
- **登录/引导**：基于邮箱的登录/注册表单（演示用模拟数据，没有真实的认证后端）。
- **充电流程与智能建议**：查找快充站，以及"降低目标充电量""推迟出发时间"等调整充电会话的建议。
- **积分/奖励**：将充电获得的积分兑换为充电站步行 3 分钟范围内合作咖啡馆的优惠券（美式咖啡、司康饼等，均为演示用虚拟商家）。
- **济州景点探索**：提供龙头岩、梨湖泰宇海滩等 30 个济州景点，附带位置、类别、平均游览时长、门票价格及照片来源（标注 CC 许可），帮助车主了解"充电等待期间附近能做什么"。`averageStayMinutes` 字段设计用于与预计充电完成时间进行比对。
- 还包含**收藏**等附加功能。
- 该 SPA 本身的源代码不在本仓库中，仓库里只包含构建产物，如需修改其逻辑，需要在原始的 `honeycharge_app` 项目中进行开发，然后重新构建并放入 `public/app/`。

### 主要功能

- 在济州与湖南两个区域之间切换，并进行 24 小时天气、发电量、需求量模拟
- 利用 Open-Meteo 当前气象模型自动更新气温、云量、日照量、风速
- 基于太阳位置、日照量、云量、气温的太阳能发电估算，以及基于轮毂高度风速功率曲线的风力发电估算
- 使用 OpenFreeMap 底图和 OpenInfraMap 公开数据显示变电站、发电站、高压线路地图
- 电力盈余/不足及 V2G 充放电量综合图表
- 盈余电力吸收量的 24 小时、7 天、30 天换算，以及限电规避量、家庭用电量对比
- 22 辆租赁车与 10 辆私家车的单车调度计划
- 每辆车的 SOC、停留时间、预计充放电量、推荐理由详情
- 根据车主输入即时重新计算的参与与奖励页面
- 将出发目标与最低保障 SOC 置于电网请求之上的安全规则
- 右上角语言切换，可将整个界面在韩语与英语之间切换
- `/mobile` 的 E-pit / myHyundai 双皮肤与演示时间跳转展示
- `/app` 的车主奖励与济州景点探索演示

### 运行方法

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

在浏览器中打开：

- `http://localhost:3000` —— 运营仪表盘
- `http://localhost:3000/mobile` —— 车主移动端网页演示
- `http://localhost:3000/app` —— HoneyCharge 车主端 SPA（静态产物，与生产构建效果一致）

验证：

```bash
npm run build
npm test
npm run lint
```

### 项目结构

```text
app/
  page.tsx                 运营仪表盘 (/) 入口
  layout.tsx                元数据与韩语文档设置
  mobile/
    page.tsx                 车主移动端演示 (/mobile) 入口
    mobile.css
components/
  HoneyChargeApp.tsx        仪表盘、车辆详情、车主参与界面
  InfrastructureMap.tsx     基于 MapLibre 的电力基础设施地图
  CloudForecastMap.tsx      24 小时云量/日照量地图
  mobile/
    MobileApp.tsx            /mobile 页面路由与状态管理
    SkinProvider.tsx         E-pit / myHyundai 皮肤切换上下文
    EpitHome.tsx, EpitV2GSchedule.tsx, EpitSocSettings.tsx,
    EpitStationMap.tsx, EpitRewards.tsx, EpitFocusScreen.tsx,
    EpitPncFlow.tsx          E-pit 皮肤各画面
    MyHyundaiHome.tsx, MyHyundaiV2GSchedule.tsx,
    MyHyundaiSocSettings.tsx, MyHyundaiStationMap.tsx,
    MyHyundaiWallet.tsx, MyHyundaiVehicle.tsx
                             myHyundai 皮肤各画面
    BottomNav.tsx, SkinSwitcher.tsx, SkinSettings.tsx,
    PlaceholderScreen.tsx, VehicleGlyph.tsx, StationMap.tsx
                             通用 UI 组件
lib/
  types.ts                  通用数据模型
  i18n.ts                   韩语/英语文案词典
  data/
    mockData.ts              32 辆车的合成数据
    chargingStations.ts      充电站模拟数据
    coupons.ts                奖励优惠券模拟数据
  services/
    weatherService.ts, liveWeatherService.ts,
    renewableForecastService.ts, demandForecastService.ts,
    shortTermForecastService.ts, kmaForecastServer.ts
                             天气与发电量预测
    demandForecastService.ts, stayDurationService.ts,
    vehicleService.ts, vehicleStatusService.ts,
    v2gScheduler.ts, simulationService.ts,
    dashboardService.ts, gridBalanceService.ts
                             需求、车辆、V2G 调度、仪表盘汇总
    mobileHomeService.ts     /mobile 首页视图模型转换
    rewardSettlementService.ts
                             奖励积分结算
worker/
  index.ts                  Cloudflare Worker 入口 —— /api 路由、
                             /app 静态 SPA 路由、图片优化代理
public/
  app/                       honeycharge_app SPA 的构建产物（静态文件）
tests/
  rendered-html.test.mjs    部署构建渲染验证
```

### MVP 假设与判断标准

- 所有数据均为演示用合成数据，并非实际测量值。
- 发电量与需求量单位为 kW，时间间隔为 1 小时，因此各时段合计值以 kWh 解读。
- 当可再生能源发电量比需求高出 180kW 以上时，优先进行充电。
- 当需求比发电量高出 240kW 以上时，将对已同意参与 V2G、已连接且支持双向充电的车辆考虑放电。
- 假设充电效率为 92%，放电效率为 90%。
- 若出发前达成目标 SOC 所需时间不足，则不论电网信号如何均优先充电。
- 车辆不会放电至低于最低保障 SOC，且若出发前无法恢复目标 SOC，则不进行放电。
- 奖励为演示数值：每放电 1kWh 可获 42P，每以盈余电力充电 1kWh 可获 8P。
- 盈余电力详情中的 7 天、30 天数值分别是将 24 小时预测按 7 天、30 天换算得出，并非实际累计业绩。
- 家庭用电对比假设每户每日用电 10kWh，限电规避量假设为吸收电量的 86%，均为演示假设。
- `/app` 中的奖励商家/优惠券与 `/mobile` 中的充电站/车辆信息均为演示用模拟数据，与任何真实合作或库存无关。

### 外部天气 API 连接

仪表盘首屏会在浏览器中获取 Open-Meteo 公开 API 的当前模型数值。如连接失败或 8 秒内无响应，将自动切换为 `weatherService` 中按地区提供的合成预报。免费非商业公开 API 无需密钥即可使用；如用于商业运营，则需按照 Open-Meteo 使用条款配置服务器代理并管理 API 密钥。若接入韩国气象厅（KMA）API，密钥也不应写入代码，而应通过 `.env.local` 中的环境变量进行管理。

### 电力基础设施地图

地图使用 MapLibre GL JS 渲染，采用 OpenFreeMap 底图样式与 OpenInfraMap 电力矢量瓦片。地图上区分显示变电站/换流站、太阳能与风力发电设施、高压架空线路及地下电缆。电力图层与底图独立加载，因此即使部分外部瓦片加载延迟，也不会遮挡基础地图。外部地图数据需要联网，显示范围取决于 OpenStreetMap 中登记的数据及缩放级别。

### 范围之外

本 MVP 不包含实际电力市场交易、充电桩控制、支付结算、身份认证、长期数据存储及实测发电量校准。
