import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RotateCcw, Info, FileText, ShieldCheck, MapPin } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { Toggle } from '@/components/common/Toggle';
import { Modal } from '@/components/common/Modal';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { LocationSourceBadge } from '@/components/map/LocationSourceBadge';
import { LocationPermissionNotice } from '@/components/map/LocationPermissionNotice';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { requestBrowserLocation } from '@/utils/location';
import { PATHS } from '@/routes/paths';

export default function Settings() {
  const navigate = useNavigate();
  const { showToast, notReady } = useToast();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAllData = useAppStore((s) => s.resetAllData);
  const userLocation = useAppStore((s) => s.userLocation);
  const locationSource = useAppStore((s) => s.locationSource);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const resetUserLocationToDefault = useAppStore((s) => s.resetUserLocationToDefault);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [locating, setLocating] = useState(false);
  /** 이전 위치 요청 결과가 최신 상태를 덮어쓰지 않도록 하는 시퀀스 번호 */
  const locationRequestId = useRef(0);

  const effectiveSource =
    settings.demoMode && locationSource === 'hotel-default' ? 'demo' : locationSource;

  const handleUseBrowserLocation = async () => {
    const requestId = ++locationRequestId.current;
    setLocating(true);
    const result = await requestBrowserLocation();
    if (requestId !== locationRequestId.current) return;
    setLocating(false);
    setUserLocation(result.location, result.source);
    showToast(result.message, result.ok ? 'success' : 'warning');
  };

  const handleReset = () => {
    resetAllData();
    window.localStorage.removeItem('honeycharge-storage');
    setShowResetConfirm(false);
    showToast('모든 데이터가 초기화되었어요', 'success');
    navigate(PATHS.splash, { replace: true });
  };

  return (
    <MobileLayout title="설정" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="border-primary/50 bg-light-yellow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-dark-gold" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-dark-gold">데모 모드</p>
                <p className="text-xs text-text-secondary">발표용 빠른 충전·V2G 시뮬레이션</p>
              </div>
            </div>
            <Toggle checked={settings.demoMode} onChange={(v) => updateSettings({ demoMode: v })} label="데모 모드" />
          </div>
          {settings.demoMode && (
            <button
              type="button"
              onClick={() => showToast('데모 데이터가 초기화되었어요', 'success')}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-button border border-dark-gold/40 text-sm font-semibold text-dark-gold"
            >
              <RotateCcw size={15} aria-hidden="true" />
              데모 데이터 초기화
            </button>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-text">
                <MapPin size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
                위치 기준
              </h3>
              <p className="mt-0.5 truncate text-xs text-text-secondary">{userLocation.name}</p>
              <p className="truncate text-[11px] text-text-secondary">{userLocation.address}</p>
            </div>
            <LocationSourceBadge source={effectiveSource} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <LocationPermissionNotice
              source={effectiveSource}
              loading={locating}
              onUseBrowserLocation={handleUseBrowserLocation}
              onUseHotelLocation={() => {
                locationRequestId.current += 1;
                setLocating(false);
                resetUserLocationToDefault();
                showToast('글로스터호텔 함덕 기준으로 되돌렸어요', 'info');
              }}
            />
            <button
              type="button"
              onClick={() => navigate(PATHS.map)}
              className="inline-flex min-h-[28px] items-center rounded-chip border border-border px-2.5 text-[11px] font-bold text-text"
            >
              지도에서 확인
            </button>
          </div>
        </Card>

        <Card className="flex flex-col divide-y divide-border">
          <h3 className="pb-2.5 text-[15px] font-bold text-text">알림</h3>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm text-text">푸시 알림</p>
            <Toggle checked={settings.pushEnabled} onChange={(v) => updateSettings({ pushEnabled: v })} label="푸시 알림" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm text-text">충전 완료 알림</p>
            <Toggle checked={settings.chargeCompleteAlert} onChange={(v) => updateSettings({ chargeCompleteAlert: v })} label="충전 완료 알림" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm text-text">V2G 알림</p>
            <Toggle checked={settings.v2gAlert} onChange={(v) => updateSettings({ v2gAlert: v })} label="V2G 알림" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm text-text">마케팅 알림</p>
            <Toggle checked={settings.marketingAlert} onChange={(v) => updateSettings({ marketingAlert: v })} label="마케팅 알림" />
          </div>
        </Card>

        <Card className="flex flex-col divide-y divide-border">
          <h3 className="pb-2.5 text-[15px] font-bold text-text">화면 · 단위</h3>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm text-text">다크 모드</p>
            <Toggle
              checked={settings.darkMode}
              onChange={(v) => {
                updateSettings({ darkMode: v });
                notReady();
              }}
              label="다크 모드"
            />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm text-text">거리 단위</p>
            <div className="flex overflow-hidden rounded-full border border-border">
              <button
                type="button"
                onClick={() => updateSettings({ unit: 'km' })}
                className={`min-h-[36px] px-3.5 text-xs font-semibold ${settings.unit === 'km' ? 'bg-primary text-[#202124]' : 'text-text-secondary'}`}
              >
                km
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ unit: 'mi' })}
                className={`min-h-[36px] px-3.5 text-xs font-semibold ${settings.unit === 'mi' ? 'bg-primary text-[#202124]' : 'text-text-secondary'}`}
              >
                mi
              </button>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col divide-y divide-border">
          <button type="button" onClick={notReady} className="flex min-h-[48px] items-center gap-2 py-2 text-sm text-text">
            <ShieldCheck size={16} className="text-text-secondary" aria-hidden="true" />
            개인정보 관리
          </button>
          <button type="button" onClick={notReady} className="flex min-h-[48px] items-center gap-2 py-2 text-sm text-text">
            <FileText size={16} className="text-text-secondary" aria-hidden="true" />
            서비스 이용약관
          </button>
          <button type="button" onClick={notReady} className="flex min-h-[48px] items-center gap-2 py-2 text-sm text-text">
            <Info size={16} className="text-text-secondary" aria-hidden="true" />
            앱 정보 (v1.0.0)
          </button>
        </Card>

        <SecondaryButton tone="danger" onClick={() => setShowResetConfirm(true)}>
          모든 데이터 초기화
        </SecondaryButton>
      </div>

      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="데이터를 초기화할까요?">
        <p className="text-sm text-text-secondary">
          로그인 정보, 차량, 포인트, 예약 등 모든 데이터가 초기 상태로 되돌아가요. 이 작업은 되돌릴 수 없어요.
        </p>
        <div className="mt-4 flex gap-2">
          <SecondaryButton onClick={() => setShowResetConfirm(false)}>취소</SecondaryButton>
          <PrimaryButton className="bg-danger text-white" onClick={handleReset}>
            초기화
          </PrimaryButton>
        </div>
      </Modal>
    </MobileLayout>
  );
}
