# GridFlow — 제주·호남 V2G 운영 MVP

GridFlow는 제주·호남의 재생에너지 잉여 전력과 주차 중인 전기차 배터리를 연결하는 웹 기반 V2G 시뮬레이터입니다. 실제 충전기·전력망·정산 시스템에는 연결하지 않으며, 해커톤 시연을 위해 설명 가능한 규칙 기반 로직과 합성 데이터를 사용합니다.

## 주요 기능

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

## 실행 방법

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

## 구조

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

## MVP 가정과 판단 기준

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

## 외부 날씨 API 연결

대시보드 첫 화면은 브라우저에서 Open-Meteo 공개 API의 현재 모델값을 가져옵니다. 연결에 실패하거나 8초 안에 응답하지 않으면 `weatherService`의 지역별 합성 예보로 자동 전환합니다. 무료 비상업 공개 API는 키 없이 사용할 수 있으며, 상업 운영 시에는 Open-Meteo 이용 조건에 맞는 서버 프록시와 API 키 관리가 필요합니다. 기상청 API를 연결할 경우에도 키를 코드에 넣지 말고 `.env.local`의 환경변수로 관리해야 합니다.

## 전력 인프라 지도

지도는 MapLibre GL JS로 렌더링하며 OpenFreeMap 배경 스타일과 OpenInfraMap 전력 벡터 타일을 사용합니다. 변전소·변환소, 태양광·풍력 발전시설, 고전압 가공선로와 지중 케이블을 구분해 표시합니다. 전력 레이어는 배경 지도와 독립적으로 불러오므로 일부 외부 타일이 지연되더라도 기본 지도를 가리지 않습니다. 외부 지도 데이터는 인터넷 연결이 필요하며, 표시 범위는 OpenStreetMap에 등록된 데이터와 확대 수준에 따라 달라집니다.

## 범위 밖

실제 전력시장 거래, 충전기 제어, 결제·정산, 인증, 장기 데이터 저장, 실측 발전량 보정은 이 MVP에 포함하지 않습니다.
