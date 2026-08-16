# GridFlow — 제주·호남 V2G 운영 MVP

> 이 문서는 [README.md](./README.md)를 한국어·영어·중국어 3개 언어로 제공합니다. 언어별 내용은 동일합니다.
> This document provides [README.md](./README.md) in Korean, English, and Chinese. The content is identical across languages.
> 本文档以韩语、英语、中文三种语言提供 [README.md](./README.md) 的内容，各语言内容相同。

---

## 한국어

GridFlow는 제주·호남의 재생에너지 잉여 전력과 주차 중인 전기차 배터리를 연결하는 웹 기반 V2G 시뮬레이터입니다. 실제 충전기·전력망·정산 시스템에는 연결하지 않으며, 해커톤 시연을 위해 설명 가능한 규칙 기반 로직과 합성 데이터를 사용합니다.

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

### 실행 방법

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

검증:

```bash
npm run build
npm test
npm run lint
```

### 구조

```text
app/
  page.tsx                 앱 진입점
  layout.tsx               메타데이터와 한국어 문서 설정
components/
  GridFlowApp.tsx          대시보드·차량 상세·차주 참여 UI
  InfrastructureMap.tsx    전력 인프라 MapLibre 지도
lib/
  types.ts                 공통 데이터 모델
  data/mockData.ts         차량 32대 합성 데이터
  services/
    weatherService.ts      시간대별 날씨 정규화 경계
    liveWeatherService.ts  Open-Meteo 현재 기상 연결
    renewableForecastService.ts
    demandForecastService.ts
    stayDurationService.ts
    vehicleService.ts
    v2gScheduler.ts
    simulationService.ts
    dashboardService.ts
tests/
  rendered-html.test.mjs   배포 빌드 렌더링 검증
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

### 외부 날씨 API 연결

대시보드 첫 화면은 브라우저에서 Open-Meteo 공개 API의 현재 모델값을 가져옵니다. 연결에 실패하거나 8초 안에 응답하지 않으면 `weatherService`의 지역별 합성 예보로 자동 전환합니다. 무료 비상업 공개 API는 키 없이 사용할 수 있으며, 상업 운영 시에는 Open-Meteo 이용 조건에 맞는 서버 프록시와 API 키 관리가 필요합니다. 기상청 API를 연결할 경우에도 키를 코드에 넣지 말고 `.env.local`의 환경변수로 관리해야 합니다.

### 전력 인프라 지도

지도는 MapLibre GL JS로 렌더링하며 OpenFreeMap 배경 스타일과 OpenInfraMap 전력 벡터 타일을 사용합니다. 변전소·변환소, 태양광·풍력 발전시설, 고전압 가공선로와 지중 케이블을 구분해 표시합니다. 전력 레이어는 배경 지도와 독립적으로 불러오므로 일부 외부 타일이 지연되더라도 기본 지도를 가리지 않습니다. 외부 지도 데이터는 인터넷 연결이 필요하며, 표시 범위는 OpenStreetMap에 등록된 데이터와 확대 수준에 따라 달라집니다.

### 범위 밖

실제 전력시장 거래, 충전기 제어, 결제·정산, 인증, 장기 데이터 저장, 실측 발전량 보정은 이 MVP에 포함하지 않습니다.

---

## English

GridFlow is a web-based V2G simulator that connects surplus renewable power in Jeju and Honam with the batteries of parked electric vehicles. It does not connect to real chargers, power grids, or settlement systems, and uses explainable rule-based logic and synthetic data for hackathon demonstration.

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

### How to Run

Node.js 22.13 or later is required.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

Verification:

```bash
npm run build
npm test
npm run lint
```

### Structure

```text
app/
  page.tsx                 App entry point
  layout.tsx               Metadata and Korean document settings
components/
  GridFlowApp.tsx          Dashboard, vehicle detail, and owner participation UI
  InfrastructureMap.tsx    MapLibre map of power infrastructure
lib/
  types.ts                 Shared data model
  data/mockData.ts         Synthetic data for 32 vehicles
  services/
    weatherService.ts      Hourly weather normalization boundaries
    liveWeatherService.ts  Open-Meteo current weather connection
    renewableForecastService.ts
    demandForecastService.ts
    stayDurationService.ts
    vehicleService.ts
    v2gScheduler.ts
    simulationService.ts
    dashboardService.ts
tests/
  rendered-html.test.mjs   Deployment build render verification
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

### External Weather API Connection

The dashboard's first screen fetches current model values from the Open-Meteo public API in the browser. If the connection fails or doesn't respond within 8 seconds, it automatically falls back to `weatherService`'s regional synthetic forecast. The free, non-commercial public API can be used without a key; commercial operation would require a server proxy and API key management compliant with Open-Meteo's terms of use. If connecting the KMA (Korea Meteorological Administration) API, keys must be managed as environment variables in `.env.local` rather than hardcoded.

### Power Infrastructure Map

The map is rendered with MapLibre GL JS, using the OpenFreeMap base style and OpenInfraMap power vector tiles. It distinguishes substations/converter stations, solar/wind generation facilities, high-voltage overhead lines, and underground cables. The power layer loads independently of the base map, so the base map remains visible even if some external tiles are delayed. External map data requires an internet connection, and the coverage shown depends on data registered in OpenStreetMap and the zoom level.

### Out of Scope

Real power market trading, charger control, payment/settlement, authentication, long-term data storage, and measured-generation calibration are not included in this MVP.

---

## 中文

GridFlow 是一个基于网页的 V2G（车辆到电网）模拟器，用于连接济州和湖南地区的可再生能源盈余电力与停放中的电动汽车电池。本系统不连接实际充电设备、电网或结算系统，为便于黑客松演示，使用可解释的基于规则的逻辑和合成数据。

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

### 运行方法

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

在浏览器中打开 `http://localhost:3000`。

验证：

```bash
npm run build
npm test
npm run lint
```

### 项目结构

```text
app/
  page.tsx                 应用入口
  layout.tsx               元数据与韩语文档设置
components/
  GridFlowApp.tsx          仪表盘、车辆详情、车主参与界面
  InfrastructureMap.tsx    基于 MapLibre 的电力基础设施地图
lib/
  types.ts                 通用数据模型
  data/mockData.ts         32 辆车的合成数据
  services/
    weatherService.ts      按小时的天气标准化边界
    liveWeatherService.ts  Open-Meteo 实时天气连接
    renewableForecastService.ts
    demandForecastService.ts
    stayDurationService.ts
    vehicleService.ts
    v2gScheduler.ts
    simulationService.ts
    dashboardService.ts
tests/
  rendered-html.test.mjs   部署构建渲染验证
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

### 外部天气 API 连接

仪表盘首屏会在浏览器中获取 Open-Meteo 公开 API 的当前模型数值。如连接失败或 8 秒内无响应，将自动切换为 `weatherService` 中按地区提供的合成预报。免费非商业公开 API 无需密钥即可使用；如用于商业运营，则需按照 Open-Meteo 使用条款配置服务器代理并管理 API 密钥。若接入韩国气象厅（KMA）API，密钥也不应写入代码，而应通过 `.env.local` 中的环境变量进行管理。

### 电力基础设施地图

地图使用 MapLibre GL JS 渲染，采用 OpenFreeMap 底图样式与 OpenInfraMap 电力矢量瓦片。地图上区分显示变电站/换流站、太阳能与风力发电设施、高压架空线路及地下电缆。电力图层与底图独立加载，因此即使部分外部瓦片加载延迟，也不会遮挡基础地图。外部地图数据需要联网，显示范围取决于 OpenStreetMap 中登记的数据及缩放级别。

### 范围之外

本 MVP 不包含实际电力市场交易、充电桩控制、支付结算、身份认证、长期数据存储及实测发电量校准。
