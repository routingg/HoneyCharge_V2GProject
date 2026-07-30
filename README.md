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
- 충전 시뮬레이션 tick 간격이 4초 → 2초로 단축되어 배터리 잔량/포인트가 더 빠르게 증가합니다.
- "데모 데이터 초기화" 버튼으로 데모용 상태를 다시 초기화할 수 있습니다.
- 발표 중 충전 완료까지 약 20~30초 정도 소요되도록 설계되어 있습니다.
- 위치 배지가 **데모 위치**로 표시되며, 브라우저 위치 권한을 요청하지 않습니다.

---

## 위치 기준 (글로스터호텔 함덕)

앱의 기본 사용자 위치는 **글로스터호텔 함덕**(Gloucester Hotel Hamdeok)입니다.

| 항목 | 값 |
|---|---|
| 장소명 | 글로스터호텔 함덕 |
| 주소 | 제주특별자치도 제주시 조천읍 조함해안로 502 |
| 위도 / 경도 | `33.5434` / `126.6693` |
| 기본 확대 수준 | 15 (호텔 주변 충전소·매장이 함께 보이는 수준) |

> ⚠️ 좌표는 위 주소를 함덕 해안도로 구간에 대응시킨 **근사 좌표**이며, 지오코딩 API로 검증한 값이 아닙니다.
> 상수는 [`src/data/location.ts`](./src/data/location.ts)의 `DEFAULT_USER_LOCATION` 한 곳에서 관리합니다.

### 위치 상태(`LocationSource`)와 권한 처리

`type LocationSource = 'browser' | 'hotel-default' | 'demo'`

| 상태 | 배지 문구 | 동작 |
|---|---|---|
| `hotel-default` | 글로스터호텔 함덕 기준 | 기본값. 지도 진입 시 권한을 **먼저 요청하지 않습니다**. |
| `browser` | 실제 현재 위치 | "실제 위치 사용" 클릭 → 권한 허용 시 실제 좌표 적용 |
| `demo` | 데모 위치 | 데모 모드 ON + 호텔 기본 위치일 때 표시 |

- **허용**: 지도 중심 이동 → 사용자 마커 재배치 → 모든 충전소 거리 재계산 → 가까운 순 정렬 갱신
- **거부·미지원·타임아웃**: 오류 화면으로 전환하지 않고 호텔 기본 위치를 유지하며 토스트 안내
  → `"위치 권한을 사용할 수 없어 글로스터호텔 함덕을 기준으로 보여드려요."`
- **로딩 중**: `"현재 위치를 확인하고 있어요"` 배지 + 내 위치 버튼 스피너
- 진입점: 지도(`/map`) 상단, 설정(`/settings`) → "위치 기준" 카드

거리 표기는 전 화면 공통 규칙을 씁니다 — **1km 미만은 `350m`, 1km 이상은 `1.2km`**
(`src/utils/calculateDistance.ts`의 `formatDistance`). 거리는 하버사인 공식으로 좌표에서 계산하며,
mock 데이터의 `distanceKm` 초기값은 `applyDistances()`가 사용자 위치 기준 계산값으로 덮어씁니다.

---

## 기술 스택

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 (`@theme` 기반 디자인 토큰)
- React Router v7
- Zustand (persist 미들웨어로 localStorage 동기화)
- Recharts (배터리 잔량/발전량/포인트 차트)
- Framer Motion (스플래시, 모달, 바텀시트, 페이지 전환 애니메이션)
- React Leaflet + OpenStreetMap (충전소 지도)
- Lucide React (아이콘)

---

## 구현된 페이지 (35개 라우트)

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
| 35 | 실시간 채팅 상담 (Claude API) | `/support/chat` |

이 외 `*` 경로는 404(`NotFound`) 페이지로 연결됩니다.

---

## 실시간 채팅 상담 (Claude API 연동)

`/support/chat`은 이 프로토타입에서 **유일하게 실제 외부 API를 호출하는 기능**입니다.
Anthropic Messages API(`claude-opus-5`)로 FAQ와 서비스 컨텍스트에 근거한 상담 답변을 스트리밍합니다.

### 설정

프로젝트 루트에 `.env`를 만들고 키를 넣습니다(`.gitignore`에 `*.env`가 등록되어 있습니다).

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **`VITE_` 접두사를 붙이지 마세요.** Vite는 `VITE_`가 붙은 변수만 클라이언트 번들에 주입합니다.
> 접두사 없이 두면 키는 Node 프로세스 안에만 존재하고 `dist/`에는 포함되지 않습니다.

키가 없으면 채팅 화면은 정상적으로 열리되 전송 시 `503`과 안내 문구를 표시합니다.

### 구조

```
브라우저  ──POST /api/support-chat──▶  로컬: Vite 미들웨어 (vite.config.ts)
             + x-support-passcode        배포: Netlify Function
                                              │
                                       server/supportChat.ts  ← 공용 핸들러
                                              │  ANTHROPIC_API_KEY (서버 전용)
                                              ▼
                                       Anthropic Messages API
          ◀──────  NDJSON 스트림  ────────────┘
```

| 파일 | 역할 |
|---|---|
| `server/supportChat.ts` | **공용 핸들러** — 검증·암호 게이트·레이트 리밋·스트리밍 |
| `netlify/functions/support-chat.ts` | 프로덕션 진입점 (Netlify Functions 2.0) |
| `vite.config.ts` | 개발·프리뷰 진입점 (동일 핸들러 사용) |
| `src/data/supportFaq.ts` | FAQ 원본 — 화면과 시스템 프롬프트가 공유 |
| `src/data/supportContext.ts` | 시스템 프롬프트, 입력 제한, 추천 질문 |
| `src/hooks/useSupportChat.ts` | 스트림 파싱, 대화 상태, 암호 재시도 |
| `src/pages/support/SupportChat.tsx` | 채팅 UI + 암호 입력 모달 |

개발과 배포가 **같은 핸들러 파일**을 쓰므로 두 환경의 보안 검증이 갈라지지 않습니다.

- 모델 `claude-opus-5`, `effort: 'low'` + adaptive thinking, `max_tokens: 8192`, 스트리밍
- 응답 형식: `{"type":"delta"|"done"|"error", ...}` 줄 단위 JSON
- 시스템 프롬프트에 "SOC 금지", "가상 데이터임을 밝힐 것", "모르면 지어내지 말 것" 규칙 포함

### 보안 설계

공개 URL에 배포하면 `/api/support-chat`이 인터넷에 열리고, **호출 비용은 API 키 소유자에게 청구**됩니다.
다음 방어를 적용했습니다.

| 방어 | 내용 |
|---|---|
| **접속 암호** | `SUPPORT_CHAT_PASSCODE` 환경변수. 클라이언트가 `x-support-passcode` 헤더로 전송하고 서버가 상수 시간 비교로 검증합니다. 주 방어선입니다. |
| **fail-closed** | 배포 환경에서 암호가 설정되지 않으면 `503`으로 **아예 열지 않습니다**. 환경변수 누락으로 무방비 공개되는 사고를 막습니다. |
| **레이트 리밋** | IP당 분당 8회, 인스턴스당 시간당 300회. 서버리스라 인스턴스별 메모리이므로 **best-effort**입니다. |
| **입력 검증** | 메시지 수 30개, 길이 2,000자, 본문 256KB, `POST`만 허용 |
| **키 격리** | `VITE_` 접두사 없음 → 번들 미포함. `@anthropic-ai/sdk`는 `devDependencies`(서버 전용) |
| **보안 헤더** | `netlify.toml`에 CSP, `X-Frame-Options: DENY`, `Referrer-Policy` 등 |

암호는 `sessionStorage`에 저장되어 탭을 닫으면 사라집니다. 발표 후에는 Netlify 환경변수에서
`ANTHROPIC_API_KEY`를 지우면 채팅만 비활성화되고 나머지 화면은 그대로 동작합니다.

### Netlify 배포

```bash
# 1) Netlify에서 GitHub 저장소 연결 (routingg/HoneyCharge_V2GProject)
#    빌드 설정은 netlify.toml이 자동 적용됩니다:
#      build command : npm run build
#      publish       : dist
#      functions     : netlify/functions

# 2) Site configuration → Environment variables 에 2개 등록
ANTHROPIC_API_KEY      = sk-ant-...
SUPPORT_CHAT_PASSCODE  = <발표용 암호>

# 3) 배포 후 확인
#    https://<site>.netlify.app/            앱 로딩
#    https://<site>.netlify.app/map         새로고침해도 404 아님 (SPA 리다이렉트)
#    https://<site>.netlify.app/support/chat 암호 모달 → 입력 → 답변 스트리밍
```

로컬에서 암호 게이트를 재현하려면 `.env`에 `SUPPORT_CHAT_PASSCODE`를 추가하면 됩니다.
설정하지 않으면 로컬에서는 암호 없이 열립니다(개발 편의).

### 제약

- 대화 내용은 저장되지 않으며 새로고침하면 초기화됩니다.
- 레이트 리밋은 서버리스 인스턴스 메모리 기반이라 완전한 차단을 보장하지 않습니다.
  실서비스라면 Netlify Blobs·Upstash 등 외부 저장소 기반으로 교체해야 합니다.

## 주요 사용자 플로우

- **A. 충전 추천 적용**: 스플래시 → 온보딩 → 로그인 → 홈 → AI 추천 상세 → 스케줄 적용 → 참여 확인 → 충전 진행(실시간 배터리 잔량/포인트) → 충전 완료
- **B. 예약**: 홈 → 지도(마커 클릭 → 바텀시트) → 충전소 상세 → 예약 → 예약 완료
- **C. 리워드 교환**: 리워드 → 상품 상세 → 교환 확인(포인트 차감) → 교환 완료 → 포인트 내역
- **D. 차량 관리**: 내 차량 → 차량 상세 → 배터리 분석 → 충전 설정 변경
- **E. 알림**: 알림 목록 → 읽음 처리 → 알림 상세 → 전체 읽음
- **F. 데모 모드**: 설정 → 데모 모드 on → 충전 진행에서 가속된 배터리 잔량/포인트 확인 → 데모 데이터 초기화
- **G. 위치 기준 전환**: 지도 진입(호텔 기준) → "실제 위치 사용" → 권한 허용/거부 → 거리 재계산 → 가까운 순 정렬 변경
- **H. 충전 보장 확인**: 홈 보장 카드 → 설정 변경(목표 충전량·출발 시간) → 보장 문구/예상 완료 시간 변경 → 보장 불가 시 "급속 충전소 찾기" → `/map?filter=fast`
- **I. 주변 혜택**: 충전소 선택 → 홈 "충전소 근처 추천 혜택" → 리워드 홈 "주변 추천" 탭 → 정렬·필터 → 리워드 상세 → 포인트 교환

## 실제로 동작하는 인터랙션

페이지 이동/뒤로가기/하단 탭 · 로그인·회원가입 폼 검증 · 온보딩 완료 저장 · 배터리 슬라이더 + 스테퍼 · 토글 · date/time picker ·
필터 칩 · 정렬 · 검색 · 지도 확대·축소·드래그 · 마커 선택 · 바텀시트 · 모달 · 즐겨찾기 · 예약 생성/취소 ·
V2G 참여 · 충전 일시정지/재개/종료 · 배터리 잔량·포인트 실시간 변화(setInterval 기반 시뮬레이션) · 리워드 교환 및 포인트 차감 ·
알림 읽음 처리 · 토스트 메시지 · 로딩 스켈레톤 · 빈 상태(empty state) · localStorage 상태 유지 · 전체 데이터 초기화 ·
브라우저 Geolocation 허용/거부 처리 · 좌표 기반 거리 계산과 가까운 순 정렬 · 기준 충전소(selectedStation) 전역 연동 ·
충전 보장 계산 및 보장 불가 시 대안 액션 · 주변 매장 추천 정렬(거리/가치/시간 적합) 및 카테고리·교환 가능 필터 ·
매장 위치 지도 표시(`/map?store=...`).

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
  stations.ts         제주 지역 충전소 20개 (함덕 주변 5개 추가)
  location.ts         기본 사용자 위치(글로스터호텔 함덕) 상수
  partnerStores.ts    함덕 주변 가상 제휴 매장 10곳
  reviews.ts          충전소 리뷰 10개
  rewards.ts          리워드 상품 22개 (제휴 매장 혜택 10개 포함)
  notifications.ts    알림 13개
  chargingHistory.ts  충전 기록 11개
  pointsHistory.ts    포인트 내역 17개
  reservations.ts     예약 내역 5개
  energyData.ts       일별 에너지 데이터 32일 + 시간대별 24시간
  aiSchedules.ts       AI 추천 스케줄 3개
  imageSources.ts     외부 이미지 URL 및 출처 정리
```

### ⚠️ 함덕 주변 mock 충전소

`st-016` ~ `st-020`은 글로스터호텔 함덕 주변 시나리오를 위해 추가한 **프로토타입용 가상 충전소**입니다.
데이터에 `isMock: true`로 표시되어 있으며, 충전소 상세 화면 하단에도 안내 문구가 표시됩니다.
**실제 운영 여부·충전기 수·요금·제휴 혜택을 검증하지 않았습니다.**

| id | 이름 | 출력 | 호텔 기준 거리 |
|---|---|---|---|
| `st-016` | 글로스터호텔 함덕 주차장 | 11kW (AC 완속) | 약 110m |
| `st-017` | 함덕해수욕장 공영주차장 충전소 | 100kW | 약 200m |
| `st-018` | 함덕환승정류장 충전소 | 50kW | 약 400m |
| `st-019` | 조천읍사무소 전기차 충전소 | 50kW | 약 3.2km |
| `st-020` | 함덕 하나로마트 충전소 | 100kW | 약 450m |

기존 `st-004`(함덕해수욕장 충전소)와 `st-014`(함덕 공영주차장 충전소)를 포함하면 함덕 일대에 7개 충전소가 있습니다.
(`st-004`는 호텔 좌표와 거의 겹쳐 있어 해변 쪽으로 좌표를 조정했습니다.)

### ⚠️ 제휴 매장과 혜택은 서비스 시연을 위한 가상 데이터입니다.

`src/data/partnerStores.ts`의 매장 10곳은 **실존 업체가 아니며 실제 제휴 계약도 없습니다.**
상호명은 실존 업체로 오해되지 않도록 발표용으로 창작했습니다. 모든 항목에 `isMock: true`가 설정되어 있습니다.

함덕 블루웨이브 카페 · 서우봉 베이커리 · 함덕 바다식탁 · 제주바람 기념품점 · 오션뷰 셀프세차 ·
돌담길 편의점 · 서우봉 산책 라운지 · 함덕 모빌리티 스테이션 · 조천 감귤창고 로스터리 · 함덕 올레 기념품 공방

각 매장은 `rewardId`로 리워드 상품(`rw-101` ~ `rw-110`)과 1:1로 연결되어 기존 교환 플로우를 그대로 사용합니다.

## 충전 보장 계산 (`src/utils/chargingGuarantee.ts`)

홈 최상단 "충전 보장" 카드는 전역 상태(`chargingSettings`, `chargingSession`)와 기준 충전소 출력으로 계산합니다.

```
필요 충전량(kWh) = 배터리 용량 × (목표 충전량 − 현재 배터리) / 100
예상 충전 시간   = 필요 충전량 / 유효 충전 출력
도달 가능 배터리 = 현재 배터리 + (출발까지 남은 시간 × 유효 충전 출력) / 배터리 용량 × 100
보장 가능 여부   = 도달 가능 배터리 ≥ 목표 충전량
출발 시 배터리   = max(최소 보장 배터리, 기준 배터리 − V2G 예상 방전량 환산 %)
```

- 유효 충전 출력은 `min(충전소 출력, 50kW)`로 상한 처리합니다(`effectiveChargingPowerKw`).
  → 11kW 호텔 주차장과 100kW 급속 충전소에서 보장 결과가 달라지고, "급속 충전소 찾기"가 의미를 갖습니다.
- V2G 방전량은 출발까지의 여유 시간과 최대 나눔 출력으로 산출하되(`estimateV2gDischargeKwh`, 최대 1.5시간),
  **최소 보장 배터리 아래로는 절대 내려가지 않습니다.**
- 보장 상태 badge: `보장 가능` / `충전 중` / `목표 달성` / `확인 필요`
- 보장 불가 시 3가지 액션 제공: **목표 충전량 낮추기**(−10%p) · **출발 시간 늦추기**(+1시간) · **급속 충전소 찾기**(`/map?filter=fast`)

복잡한 전력 모델이 아니라 **입력값이 바뀌면 결과가 일관되게 바뀌는 것**을 목표로 한 프로토타입 계산식입니다.

## 리워드 가치 · 시간 적합도 (`src/utils/rewardValue.ts`)

```
1P당 가치 = 예상 원화 가치 / 필요 포인트          예) 4,500원 ÷ 3,000P ≈ 1.5원
왕복 소요 = 도보 시간 × 2 + 예상 체류 시간
```

충전 완료까지 남은 시간(R)과 왕복 소요(T)를 비교해 적합도를 매깁니다.

| 조건 | badge |
|---|---|
| `R ≥ T + 20분` | 여유 있게 이용 가능 |
| `T − 5분 ≤ R < T + 20분` | 시간 딱 맞음 |
| `도보 왕복 + 10분 ≤ R < T − 5분` | 짧게 이용 가능 |
| 그 외 | 충전 후 이용 추천 |

종합 점수 = 가치 35% + 시간 적합 25% + 거리 20% + 교환 가능 여부 20% (+ 선호 카테고리 보정, 품절 시 0.3배)

> 원화 표기는 항상 **"약 / 상당 / 예상 가치"** 로 노출합니다. 현금 환급률이나 정산 금액이 아닙니다.

## 사용자 노출 용어 (SOC 제거)

내부 변수명(`soc`, `targetSoc`, `minSoc`)은 호환성을 위해 유지하고, **화면 텍스트에서만** 교체했습니다.
문구는 [`src/utils/formatBatteryText.ts`](./src/utils/formatBatteryText.ts)에서 관리합니다.

| 기존 | 변경 |
|---|---|
| SOC / 현재 SOC | 배터리 잔량 / 현재 배터리 |
| 목표 SOC | 목표 충전량 |
| 최소 보장 SOC | 최소 보장 배터리 |
| 예상 SOC | 예상 배터리 |
| 출발 SOC / 출발 예상 SOC | 출발 시 배터리 |
| V2G 방전 중 | 차량 전력을 전력망에 나누는 중이에요 |
| 방전량 | 전력망에 나눈 양 |
| 예상 정산금 | 포인트 예상 가치 |
| 리워드 교환소 | 충전 중 누리는 주변 혜택 |

- 예외: **배터리 분석** 화면의 차트 제목만 `최근 7일 배터리 잔량(SOC) 추이`로 한 번 병기합니다.
- **V2G**는 서비스 핵심 용어이므로 유지하되, 참여 설정·참여 확인 화면에서 최초 노출 시
  `"V2G는 전기차 배터리의 남는 전력을 전력망과 나누고 보상받는 기능이에요."` 설명을 함께 표시합니다.

## 상태 관리

`src/store/useAppStore.ts` 하나의 Zustand 스토어(persist 미들웨어, key: `honeycharge-storage`)에서
로그인 사용자, 온보딩 완료 여부, 차량 목록/대표 차량, 충전 설정/세션, 포인트/쿠폰, 즐겨찾기, 예약, 알림, 앱 설정(데모 모드 포함)을
모두 관리하며 localStorage와 자동 동기화됩니다. 최초 실행 시 mock 데이터로 초기화됩니다.

이번 개선으로 다음 상태가 추가되어 화면 간 연동에 사용됩니다.

| 상태 | 설명 | 사용 화면 |
|---|---|---|
| `userLocation` | 현재 기준 좌표 (기본값: 글로스터호텔 함덕) | 지도 · 충전소 목록/상세 · 홈 · 리워드 · 설정 |
| `locationSource` | `browser` / `hotel-default` / `demo` | 지도 배지 · 설정 |
| `selectedStationId` | 사용자가 선택한 기준 충전소 | 홈 · 지도 · 충전소 상세 · 참여 확인 · 충전 진행 · 리워드 홈/상세 |

`selectedStation`이 없을 때의 폴백 순서 (`resolveSelectedStation`):
**① 현재 위치에서 가장 가까운 충전소 → ② 글로스터호텔 함덕 주차장(`st-016`) → ③ 목록 첫 번째 충전소**

## 프로젝트 구조

```
src/
  assets/            (미사용, 외부 이미지는 CDN 직결)
  components/
    common/          Card, PrimaryButton, Toggle, Modal, BottomSheet, ImageWithFallback 등
    layout/          MobileLayout, AppHeader, ErrorBoundary
    navigation/      BottomNavigation
    charts/          Timeline, ChartCard
    charging/        BatteryGauge, ChargingGuaranteeCard
    stations/        StationCard, SelectedStationSummary
    map/             stationIcon (Leaflet 커스텀 마커), LocationSourceBadge,
                     CurrentLocationButton, LocationPermissionNotice
    rewards/         RewardCard, NearbyRewardSection, NearbyRewardCard,
                     PartnerStoreCard, RewardValueBadge, ChargingTimeFitBadge
    vehicle/         VehicleCard
    notifications/   notificationIcons
  pages/             onboarding / auth / home / charging / stations / rewards / vehicle /
                     notifications / reports / profile / support
  data/              도메인별 mock 데이터
  hooks/             useToast (토스트 컨텍스트)
  store/             useAppStore (zustand)
  types/             전체 도메인 타입 정의
  utils/             cn, format, stationFilters, calculateDistance,
                     chargingGuarantee, rewardValue, formatBatteryText, location
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
| 기본 위치 좌표 | `data/location.ts`의 `DEFAULT_USER_LOCATION` | 지오코딩 API로 검증한 좌표로 교체 |
| 제휴 매장·혜택 | `data/partnerStores.ts` (전부 가상 데이터) | 실제 제휴 매장 API 및 위치 기반 검색으로 교체 |
| 충전 보장 계산 | `utils/chargingGuarantee.ts` (단순 선형 모델) | 충전 곡선·배터리 온도·요금제를 반영한 서버 계산으로 교체 |
| 길찾기 | `/map?store=...`로 매장 위치만 표시 | 카카오/티맵 등 경로 안내 SDK 연동 |

## 아직 mock으로 남아있는 데이터·기능

- **제휴 매장 10곳과 혜택 전부** — 실존 업체가 아닌 발표용 가상 데이터 (`isMock: true`)
- **충전소 20곳 전부** — 실제 운영 여부·충전기 수·요금 미검증. 특히 `st-016` ~ `st-020`은 시연용으로 추가
- **글로스터호텔 함덕 좌표** — 주소 기반 근사 좌표이며 지오코딩 미검증
- 리워드의 **예상 원화 가치**와 "포인트 예상 가치"(1P ≈ 1.2원 가정) — 추정값이며 실제 정산·환급률 아님
- 홈의 환경 기여 수치(2,140kWh / 512kg / 36회), 리워드 홈의 "이번 달 적립·기여도" — 화면 표시용 고정값
- 사용자 선호 카테고리(`MOCK_PREFERRED_CATEGORIES`) — 이용 이력 학습이 아닌 고정값
- 충전 세션의 실시간 값은 `setInterval` 시뮬레이션 (실제 충전기 연동 없음)
- 카카오 로그인, 경로 안내, 전화·이메일 문의, 다크 모드, 개인정보/약관 상세 화면
  → 클릭 시 "준비 중입니다" 토스트만 표시
  (**실시간 채팅 상담은 실제 Claude API로 동작합니다** — 위 섹션 참고)
- 리뷰 작성 기능은 없고 조회만 가능

## npm run build 결과

```
tsc -b && vite build
✓ 2913 modules transformed
dist/index.html                     0.82 kB
dist/assets/index-*.css            52.61 kB (gzip 13.89 kB)
dist/assets/index-*.js           1,164.33 kB (gzip 338.02 kB)
✓ built in 1.8s
```

번들 크기가 500kB 경고 기준을 넘습니다(Recharts + Leaflet + Framer Motion 포함). 발표용 프로토타입 특성상
코드 스플리팅은 적용하지 않았으며, 실제 서비스 전환 시 라우트 단위 `React.lazy` 적용을 권장합니다.
