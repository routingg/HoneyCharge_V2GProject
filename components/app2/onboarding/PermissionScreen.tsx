"use client";

import { Bell, Camera, Fingerprint, Image as ImageIcon, MapPin, Phone } from "lucide-react";
import { useApp2Session } from "@/components/app2/auth/AuthProvider";

const PERMISSION_ITEMS = [
  {
    icon: MapPin,
    title: "위치 정보",
    description:
      "내 주변 충전소 검색, 충전소 길 안내 및 사용자 위치 기반 충전기 탐색을 위해 필요합니다.",
  },
  {
    icon: Camera,
    title: "카메라",
    description:
      "충전기 QR 코드 스캔, 결제 카드 등록 및 고장·장애 신고 사진 촬영을 위해 필요합니다.",
  },
  {
    icon: ImageIcon,
    title: "사진 앨범",
    description:
      "충전기 고장 신고, 1:1 문의 사진 첨부 및 충전 영수증 저장을 위해 필요합니다.",
  },
  {
    icon: Bell,
    title: "알림",
    description:
      "충전 시작·완료 현황, 과충전 방지 안내, 결제 완료 및 맞춤 혜택 알림을 위해 필요합니다.",
  },
  {
    icon: Fingerprint,
    title: "생체인증",
    description: "원클릭 간편 결제 승인과 안전한 본인 확인을 위해 필요합니다.",
  },
  {
    icon: Phone,
    title: "전화",
    description:
      "충전 오류 발생 시 고객센터 연결 및 기기 인증 관련 기능을 위해 필요합니다.",
  },
] as const;

/**
 * §7–§9: informational only — no OS permission dialogs are triggered here.
 * "꿀차지 시작하기" just accepts terms + marks onboarding complete. Each
 * optional permission (location, camera, notifications, ...) is requested
 * later, at the point the matching feature is actually used — see
 * StationListScreen.tsx (location) for the one currently wired up.
 */
export function PermissionScreen() {
  const { completeOnboarding } = useApp2Session();

  return (
    <div className="a2-permission-screen">
      <div className="a2-permission-scroll">
        <h1 className="a2-permission-title">
          꿀차지 이용을 위해
          <br />
          아래 권한을 사용할 수 있어요
        </h1>
        <p className="a2-permission-subtitle">
          선택 권한에 동의하지 않아도 꿀차지를 이용할 수 있습니다.
          <br />
          필요한 기능을 사용할 때 다시 요청드릴 수 있어요.
        </p>

        <ul className="a2-permission-list">
          {PERMISSION_ITEMS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="a2-permission-item">
              <span className="a2-permission-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <div className="a2-permission-copy">
                <p className="a2-permission-item-title">
                  <span className="a2-permission-badge">선택</span> {title}
                </p>
                <p className="a2-permission-item-desc">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="a2-permission-cta-bar">
        <button type="button" className="a2-permission-cta" onClick={completeOnboarding}>
          꿀차지 시작하기
        </button>
      </div>
    </div>
  );
}
