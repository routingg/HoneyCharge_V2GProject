# GridFlow V2G MVP 실행 요구사항

## 1. 필수 환경

- 운영체제: Windows 10/11, macOS 또는 Linux
- Node.js: 22.13.0 이상
- npm: Node.js에 포함된 버전 사용
- 메모리: 개발 실행 기준 4GB 이상 권장
- 브라우저: 최신 Chrome, Edge, Safari 또는 Firefox
- 네트워크: 현재 기상과 전력 인프라 지도 사용 시 인터넷 연결 필요

Python과 별도의 데이터베이스는 필요하지 않습니다.

## 2. 설치 및 실행

압축을 해제한 폴더에서 다음 명령을 실행합니다.

```bash
npm install
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:3000
```

## 3. 검증 명령

```bash
npm run build
npm run lint
npm test
```

## 4. 주요 패키지

- React 19
- Next.js 16 호환 vinext 런타임
- TypeScript 5
- Tailwind CSS 4
- Recharts
- Lucide React
- MapLibre GL JS 5.12
- Cloudflare Workers/Vite 배포 도구

정확한 버전과 전체 의존성은 `package.json`과 `package-lock.json`에 고정되어 있습니다.

## 5. 환경변수

현재 MVP는 별도 API 키 없이 실행됩니다. 현재 기상은 Open-Meteo 공개 API에서 가져오고, 지도는 OpenFreeMap 배경 스타일과 OpenInfraMap·OpenStreetMap 공개 데이터를 사용합니다. 발전·수요·차량 정보는 시연용 추정 또는 합성 데이터입니다.

기상청 API를 추후 연결할 경우 API 키를 코드에 직접 작성하지 말고 프로젝트 루트의 `.env.local`에 저장해야 합니다. `.env.local`은 Git 및 전달용 압축 파일에 포함하지 않습니다.

예시:

```text
KMA_SERVICE_KEY=발급받은_키
```

Open-Meteo를 사용할 경우 기본 예보 API는 별도 키가 필요하지 않습니다.

Open-Meteo 현재 모델과 OpenInfraMap 지도를 불러오지 못하면 대시보드는 기존 합성 기상으로 전환하고 지도에는 원본 지도 링크를 표시합니다. 상업 환경에서는 각 데이터 공급자의 이용 조건과 호출량 정책을 별도로 확인해야 합니다.

## 6. 시연 데이터 및 제한사항

- 렌터카 22대와 일반 전기차 10대는 실제 고객 정보가 아닌 합성 데이터입니다.
- 발전량·전력 수요·V2G 보상은 서비스 시연을 위한 추정값입니다.
- 잉여전력 상세의 7일·30일 수치는 24시간 예측을 확장한 비교값입니다. 1가구 하루 10kWh, 흡수량의 86%를 출력제어 회피로 보는 시연 가정을 사용합니다.
- 실제 충전기 제어, 전력시장 거래, 결제, 정산 및 인증은 포함하지 않습니다.
- 실제 운영에 사용하려면 실측 데이터 보정, 보안 검토, 배터리 제조사 정책 및 전력시장 규정 검토가 추가로 필요합니다.

## 7. 핵심 폴더

```text
app/            화면 진입점과 전역 스타일
components/     관리자·차량·차주 화면
lib/data/       차량 합성 데이터
lib/services/   날씨·발전량·수요·스케줄링 로직
tests/          서버 렌더링 테스트
```

상세한 기능과 알고리즘 가정은 `README.md`를 참고하세요.
