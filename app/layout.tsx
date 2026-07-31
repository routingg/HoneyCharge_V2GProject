import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://gridflow-v2g-korea.jaesung7471.chatgpt.site",
  ),
  title: "HoneyCharge | 제주·호남 V2G 에너지 운영",
  description:
    "재생에너지 잉여 전력과 전기차 유휴 배터리를 연결하는 설명 가능한 V2G 운영 대시보드",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "HoneyCharge | 제주·호남 V2G 통합 운영",
    description:
      "실시간 기상 기반 재생에너지 예측과 전력 인프라 지도를 한 화면에서 확인하세요.",
    images: [
      {
        url: "/honeycharge-social-preview.png",
        width: 1733,
        height: 909,
        alt: "HoneyCharge 제주 V2G 통합 운영, 전력 인프라와 24시간 구름 예보",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HoneyCharge | 제주·호남 V2G 통합 운영",
    description:
      "실시간 기상 기반 재생에너지 예측과 전력 인프라 지도",
    images: ["/honeycharge-social-preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
