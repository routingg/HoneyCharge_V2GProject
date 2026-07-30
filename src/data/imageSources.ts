// External image sources used throughout HoneyCharge.
// All images are served directly from images.unsplash.com (Unsplash),
// a stable CDN that hosts freely usable photos under the Unsplash License
// (https://unsplash.com/license): free to use, no permission required,
// attribution appreciated but not mandatory. Each entry links back to the
// original asset URL used in the app. See README.md for the full credit list.
//
// NOTE: some images (beach/mountain/market/campus/stadium shots) are used as
// atmospheric, decorative backgrounds for mock station/reward cards rather
// than literal photographs of the named real-world location — the station
// name text conveys the identity, the photo conveys mood only.

export interface ImageSource {
  url: string;
  alt: string;
  credit: string;
}

function img(url: string, alt: string): ImageSource {
  return { url: `${url}?auto=format&fit=crop&w=1200&q=75`, alt, credit: `Unsplash (${url})` };
}

export const IMAGES = {
  // Electric vehicles & charging
  evChargingPlugCloseup: img('https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b', '전기차 충전 커넥터가 차량에 연결된 모습'),
  evChargingPlugAngle: img('https://images.unsplash.com/photo-1593941707882-a5bba14938c7', '전기차 충전구에 꽂힌 충전 케이블 클로즈업'),
  evTeslaShowroom: img('https://images.unsplash.com/photo-1617788138017-80ad40651399', '전시장에 있는 흰색 전기 스포츠카'),
  evTeslaModelS: img('https://images.unsplash.com/photo-1617704548623-340376564e68', '전기차 브랜드 로고 벽 앞에 주차된 세단형 전기차'),
  evRedHeadlight: img('https://images.unsplash.com/photo-1554744512-d6c603f27c54', '빨간색 전기차의 헤드라이트 클로즈업'),

  // Rental cars (generic passenger vehicles)
  rentalSedanWhite: img('https://images.unsplash.com/photo-1638618164682-12b986ec2a75', '도로 옆에 주차된 흰색 세단'),
  rentalHatchbackBlue: img('https://images.unsplash.com/photo-1541899481282-d53bffe3c35d', '거리에 주차된 파란색 소형 해치백'),
  rentalSedanPremium: img('https://images.unsplash.com/photo-1601362840469-51e4d8d58785', '강변에 주차된 은색 프리미엄 세단'),
  rentalWagon: img('https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6', '시골길에 정차된 검은색 왜건형 승용차'),

  // Renewable energy
  solarFarmClouds: img('https://images.unsplash.com/photo-1509391366360-2e959784a276', '구름 낀 하늘 아래 넓게 설치된 태양광 패널'),
  solarFarmSky: img('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d', '푸른 하늘 아래 줄지어 선 태양광 패널'),
  solarFarmAerial: img('https://images.unsplash.com/photo-1497440001374-f26997328c1b', '위에서 내려다본 태양광 발전 단지'),
  windOnshoreSunset: img('https://images.unsplash.com/photo-1466611653911-95081537e5b7', '노을 지는 들판의 풍력발전기'),
  windOffshore: img('https://images.unsplash.com/photo-1548337138-e87d889cc369', '바다 위에 설치된 해상 풍력발전기'),
  powerLinesSunset: img('https://images.unsplash.com/photo-1473341304170-971dccb5ac1e', '노을을 배경으로 한 송전탑과 전력선'),

  // Parking / stations
  parkingGarageDark: img('https://images.unsplash.com/photo-1573348722427-f1d6819fdf98', '조명이 켜진 어두운 실내 주차장'),
  parkingGarageBright: img('https://images.unsplash.com/photo-1590674899484-d5640e854abe', '노란색 안내선이 있는 지하 주차장'),

  // Cafe
  cafeGreenhouse: img('https://images.unsplash.com/photo-1445116572660-236099ec97a0', '식물이 가득한 온실형 카페 테이블'),
  cafeInterior: img('https://images.unsplash.com/photo-1554118811-1e0d58224f24', '아늑한 분위기의 카페 내부'),

  // Convenience store
  convenienceAisle: img('https://images.unsplash.com/photo-1604719312566-8912e9227c6a', '상품이 진열된 편의점 매대'),

  // Car wash
  ecoCarWash: img('https://images.unsplash.com/photo-1520340356584-f9917d1eea6f', '세차 중인 자동차에 물이 뿌려지는 모습'),

  // Hotel / accommodation
  hotelResortPool: img('https://images.unsplash.com/photo-1566073771259-6a8506099945', '수영장이 있는 리조트 숙소 전경'),
  hotelRoomCozy: img('https://images.unsplash.com/photo-1611892440504-42a792e24d32', '아늑하게 꾸며진 호텔 객실'),

  // Tourism / scenery (decorative, mood-only — see file header note)
  beachSunrise: img('https://images.unsplash.com/photo-1507525428034-b723cf961d3e', '해돋이가 보이는 해변 풍경'),
  mountainSunset: img('https://images.unsplash.com/photo-1500534623283-312aade485b7', '노을이 지는 산 능선 실루엣'),
  lakeMountainCamp: img('https://images.unsplash.com/photo-1602391833977-358a52198938', '산으로 둘러싸인 호숫가 캠핑 풍경'),
  marketStreetNight: img('https://images.unsplash.com/photo-1517154421773-0529f29ea451', '간판 불빛이 켜진 전통시장 골목 야경'),
  airplaneWing: img('https://images.unsplash.com/photo-1436491865332-7a61a109cc05', '구름 위를 나는 비행기 날개'),
  campusGraduation: img('https://images.unsplash.com/photo-1541339907198-e08756dedf3f', '캠퍼스에서 학사모를 던지는 학생들'),
  footballStadium: img('https://images.unsplash.com/photo-1522778119026-d647f0596c20', '관중석이 가득 찬 축구 경기장'),
} as const;

export type ImageKey = keyof typeof IMAGES;
