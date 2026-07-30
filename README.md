# HoneyCharge 🍯⚡

전기차 스마트 충전 및 V2G(Vehicle-to-Grid) 서비스 **HoneyCharge**의 모바일 웹 인터랙티브 프로토타입입니다.
재생에너지 발전량, 전력 수요, 출발 예정 시간, 배터리 잔량을 분석해 충전·방전을 추천하고,
참여에 대한 보상을 포인트로 지급하는 서비스를 발표용으로 시연할 수 있도록 구현했습니다.

실제 백엔드는 존재하지 않으며, 모든 데이터는 `src/data/`의 mock 데이터와 `zustand` + `localStorage`로 동작합니다.

---

## 실행 방법

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
```

### 테스트 계정

| 항목 | 값 |
|---|---|
| 이메일 | `demo@honeycharge.kr` |
| 비밀번호 | `honey1234` |

로그인 화면의 **"데모 계정으로 시작"** 버튼을 누르면 위 계정으로 즉시 로그인됩니다.

### 데모 모드

설정(`/settings`) 화면에서 **데모 모드**를 켜면:
- 충전 시뮬레이션 tick 간격이 4초 → 2초로 단축되어 SOC/포인트가 더 빠르게 증가합니다.
- "데모 데이터 초기화" 버튼으로 데모용 상태를 다시 초기화할 수 있습니다.
- 발표 중 충전 완료까지 약 20~30초 정도 소요되도록 설계되어 있습니다.

---

## 기술 스택

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 (`@theme` 기반 디자인 토큰)
- React Router v7
- Zustand (persist 미들웨어로 localStorage 동기화)
- Recharts (SOC/발전량/포인트 차트)
- Framer Motion (스플래시, 모달, 바텀시트, 페이지 전환 애니메이션)
- React Leaflet + OpenStreetMap (충전소 지도)
- Lucide React (아이콘)

---

## 구현된 페이지 (34개 라우트)

| # | 이름 | 경로 |
|---|---|---|
| 1 | 스플래시 | `/splash` |
| 2 | 온보딩 - 에너지 | `/onboarding/energy` |
| 3 | 온보딩 - 리워드 | `/onboarding/reward` |
| 4 | 온보딩 - 차량 | `/onboarding/vehicle` |
| 5 | 로그인 | `/login` |
| 6 | 회원가입 | `/signup` |
| 7 | 홈 대시보드 | `/` |
| 8 | AI 추천 상세 | `/ai-schedule` |
| 9 | 충전·V2G 참여 설정 | `/participate` |
| 10 | 참여 확인 | `/participate/confirm` |
| 11 | 충전 진행 | `/charging/session` |
| 12 | 충전 완료 결과 | `/charging/result` |
| 13 | 주변 충전소 지도 | `/map` |
| 14 | 충전소 목록 | `/stations` |
| 15 | 충전소 상세 | `/stations/:stationId` |
| 16 | 충전 예약 | `/stations/:stationId/reserve` |
| 17 | 예약 완료 | `/reservation/success` |
| 18 | 리워드 메인 | `/rewards` |
| 19 | 리워드 상품 상세 | `/rewards/:rewardId` |
| 20 | 포인트 교환 확인 | `/rewards/:rewardId/exchange` |
| 21 | 포인트 사용 완료 | `/rewards/exchange-success` |
| 22 | 포인트 내역 | `/rewards/history` |
| 23 | 내 차량 | `/vehicle` |
| 24 | 차량 등록 | `/vehicle/register` |
| 25 | 차량 상세 | `/vehicle/detail` |
| 26 | 배터리 분석 | `/vehicle/battery-health` |
| 27 | 알림 목록 | `/notifications` |
| 28 | 알림 상세 | `/notifications/:notificationId` |
| 29 | 마이페이지 | `/profile` |
| 30 | 환경 기여 리포트 | `/impact` |
| 31 | 월간 리포트 | `/report/monthly` |
| 32 | 설정 (데모 모드 포함) | `/settings` |
| 33 | 고객지원 | `/support` |
| 34 | FAQ | `/support/faq` |

이 외 `*` 경로는 404(`NotFound`) 페이지로 연결됩니다.

## 주요 사용자 플로우

- **A. 충전 추천 적용**: 스플래시 → 온보딩 → 로그인 → 홈 → AI 추천 상세 → 스케줄 적용 → 참여 확인 → 충전 진행(실시간 SOC/포인트) → 충전 완료
- **B. 예약**: 홈 → 지도(마커 클릭 → 바텀시트) → 충전소 상세 → 예약 → 예약 완료
- **C. 리워드 교환**: 리워드 → 상품 상세 → 교환 확인(포인트 차감) → 교환 완료 → 포인트 내역
- **D. 차량 관리**: 내 차량 → 차량 상세 → 배터리 분석 → 충전 설정 변경
- **E. 알림**: 알림 목록 → 읽음 처리 → 알림 상세 → 전체 읽음
- **F. 데모 모드**: 설정 → 데모 모드 on → 충전 진행에서 가속된 SOC/포인트 확인 → 데모 데이터 초기화

## 실제로 동작하는 인터랙션

페이지 이동/뒤로가기/하단 탭 · 로그인·회원가입 폼 검증 · 온보딩 완료 저장 · SOC 슬라이더 + 스테퍼 · 토글 · date/time picker ·
필터 칩 · 정렬 · 검색 · 지도 확대·축소·드래그 · 마커 선택 · 바텀시트 · 모달 · 즐겨찾기 · 예약 생성/취소 ·
V2G 참여 · 충전 일시정지/재개/종료 · SOC·포인트 실시간 변화(setInterval 기반 시뮬레이션) · 리워드 교환 및 포인트 차감 ·
알림 읽음 처리 · 토스트 메시지 · 로딩 스켈레톤 · 빈 상태(empty state) · localStorage 상태 유지 · 전체 데이터 초기화.

아직 실제 백엔드가 필요한 기능(길찾기, 카카오 로그인, 실시간 채팅 상담 등)은 "아직 준비 중인 기능이에요" 토스트로 피드백을 제공합니다.

---

## 외부 이미지 출처

모든 외부 이미지는 [Unsplash License](https://unsplash.com/license)(출처 표기 없이 자유 이용 가능, 상업적 이용 허용) 하에
`images.unsplash.com` CDN에서 직접 서빙되는 사진을 사용했습니다. 검색 페이지가 아닌 실제 이미지 리소스 URL만 사용했으며,
전체 목록은 [`src/data/imageSources.ts`](./src/data/imageSources.ts)에 정리되어 있습니다.

| 용도 | 설명 | 출처 |
|---|---|---|
| 전기차 충전 | 충전 커넥터 클로즈업 (2종) | images.unsplash.com/photo-1593941707874-ef25b8b4a92b, photo-1593941707882-a5bba14938c7 |
| 전기차 | 전시장 전기 스포츠카, 브랜드 로고 앞 세단, 헤드라이트 클로즈업 | photo-1617788138017-80ad40651399, photo-1617704548623-340376564e68, photo-1554744512-d6c603f27c54 |
| 렌터카(일반 승용차) | 세단/해치백/프리미엄 세단/왜건 | photo-1638618164682-12b986ec2a75, photo-1541899481282-d53bffe3c35d, photo-1601362840469-51e4d8d58785, photo-1606664515524-ed2f786a0bd6 |
| 태양광 패널 | 지상 태양광 단지 (3종) | photo-1509391366360-2e959784a276, photo-1508514177221-188b1cf16e9d, photo-1497440001374-f26997328c1b |
| 풍력발전기 | 육상/해상 풍력 | photo-1466611653911-95081537e5b7, photo-1548337138-e87d889cc369 |
| 송전선 | 노을 배경 송전탑 | photo-1473341304170-971dccb5ac1e |
| 스마트 주차장 | 실내 주차장 (2종) | photo-1573348722427-f1d6819fdf98, photo-1590674899484-d5640e854abe |
| 카페 | 온실형 카페, 카페 내부 | photo-1445116572660-236099ec97a0, photo-1554118811-1e0d58224f24 |
| 편의점 | 매대 진열 | photo-1604719312566-8912e9227c6a |
| 친환경 세차장 | 세차 중인 차량 | photo-1520340356584-f9917d1eea6f |
| 숙박시설 | 리조트 수영장, 객실 | photo-1566073771259-6a8506099945, photo-1611892440504-42a792e24d32 |
| 관광지/자연 경관 (장식용) | 해돋이 해변, 산 능선 노을, 호숫가 캠핑, 전통시장 야경 | photo-1507525428034-b723cf961d3e, photo-1500534623283-312aade485b7, photo-1602391833977-358a52198938, photo-1517154421773-0529f29ea451 |
| 공항 | 비행기 날개 | photo-1436491865332-7a61a109cc05 |
| 대학교 | 캠퍼스 졸업식 | photo-1541339907198-e08756dedf3f |
| 경기장 | 축구 경기장 | photo-1522778119026-d647f0596c20 |

> ⚠️ 해변/산/전통시장 야경 등 일부 이미지는 제주·호남의 **특정 실제 랜드마크를 촬영한 사진이 아니라**,
> 분위기를 전달하기 위한 장식용 이미지입니다. 충전소 이름(성산일출봉, 표선해수욕장 등)은 mock 데이터의 텍스트 라벨이며,
> 사진이 해당 장소의 실제 모습임을 주장하지 않습니다.

프로필 아바타는 [DiceBear](https://www.dicebear.com/) `notionists` 스타일을 SVG API로 실시간 생성해 사용했습니다(오픈소스, MIT 라이선스).

폰트는 [Pretendard](https://cactus.tistory.com/306) (SIL OFL 1.1)를 jsDelivr CDN을 통해 로드합니다.

---

## Mock 데이터 (도메인별 분리)

```
src/data/
  users.ts            사용자 1명 + 데모 계정
  vehicles.ts         차량 3대 (배터리 건강도, 통계 포함)
  stations.ts         제주 지역 충전소 15개
  reviews.ts          충전소 리뷰 10개
  rewards.ts          리워드 상품 12개
  notifications.ts    알림 13개
  chargingHistory.ts  충전 기록 11개
  pointsHistory.ts    포인트 내역 17개
  reservations.ts     예약 내역 5개
  energyData.ts       일별 에너지 데이터 32일 + 시간대별 24시간
  aiSchedules.ts       AI 추천 스케줄 3개
  imageSources.ts     외부 이미지 URL 및 출처 정리
```

## 상태 관리

`src/store/useAppStore.ts` 하나의 Zustand 스토어(persist 미들웨어, key: `honeycharge-storage`)에서
로그인 사용자, 온보딩 완료 여부, 차량 목록/대표 차량, 충전 설정/세션, 포인트/쿠폰, 즐겨찾기, 예약, 알림, 앱 설정(데모 모드 포함)을
모두 관리하며 localStorage와 자동 동기화됩니다. 최초 실행 시 mock 데이터로 초기화됩니다.

## 프로젝트 구조

```
src/
  assets/            (미사용, 외부 이미지는 CDN 직결)
  components/
    common/          Card, PrimaryButton, Toggle, Modal, BottomSheet, ImageWithFallback 등
    layout/          MobileLayout, AppHeader, ErrorBoundary
    navigation/      BottomNavigation
    charts/          Timeline, ChartCard
    charging/        BatteryGauge
    stations/        StationCard
    map/             stationIcon (Leaflet 커스텀 마커)
    rewards/         RewardCard
    vehicle/         VehicleCard
    notifications/   notificationIcons
  pages/             onboarding / auth / home / charging / stations / rewards / vehicle /
                     notifications / reports / profile / support
  data/              도메인별 mock 데이터
  hooks/             useToast (토스트 컨텍스트)
  store/             useAppStore (zustand)
  types/             전체 도메인 타입 정의
  utils/             cn, format, stationFilters
  routes/            paths, RequireAuth, RootGate
```

---

## 실제 API 연결 시 교체할 파일

| 목적 | 현재 mock 위치 | 교체 방법 |
|---|---|---|
| 인증 | `store/useAppStore.ts`의 `login/signup` | 실제 API 호출 후 토큰 저장으로 교체 |
| 차량/충전소/리워드/알림 조회 | `data/*.ts` | REST/GraphQL fetch 결과로 교체, 타입은 `types/index.ts` 그대로 재사용 가능 |
| 충전 세션 실시간 값 | `pages/charging/ChargingSession.tsx`의 `setInterval` 시뮬레이션 | WebSocket/폴링으로 실제 충전기 데이터 수신 |
| 예약/포인트 교환 | `store/useAppStore.ts`의 `addReservation/spendPoints` | 서버 트랜잭션 API 호출 후 성공 시 상태 갱신 |
| 지도 위치 | `pages/stations/MapView.tsx`의 `JEJU_CENTER` 고정값 | `navigator.geolocation` 연동 |

## 아직 mock으로 남아있는 기능

- 카카오 로그인, 길찾기, 전화/실시간 채팅 상담, 다크 모드, 개인정보/약관 상세 화면 → 클릭 시 "준비 중입니다" 토스트만 표시
- 정산금(현금화)은 화면 표시용 고정값이며 실제 결제/송금 연동 없음
- 리뷰 작성 기능은 없고 조회만 가능

## npm run build 결과

```
tsc -b && vite build
✓ 2896 modules transformed
dist/index.html                     0.82 kB
dist/assets/index-*.css            51.53 kB (gzip 13.72 kB)
dist/assets/index-*.js           1,110.26 kB (gzip 324.62 kB)
✓ built in < 1s
```

번들 크기가 500kB 경고 기준을 넘습니다(Recharts + Leaflet + Framer Motion 포함). 발표용 프로토타입 특성상
코드 스플리팅은 적용하지 않았으며, 실제 서비스 전환 시 라우트 단위 `React.lazy` 적용을 권장합니다.
