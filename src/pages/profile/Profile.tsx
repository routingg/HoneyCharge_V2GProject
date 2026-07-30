import { useNavigate } from 'react-router-dom';
import { Star, CalendarCheck, Ticket, Settings as SettingsIcon, LifeBuoy, LogOut, Award, ChevronRight } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { STATIONS } from '@/data/stations';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useAppStore((s) => s.user);
  const vehicles = useAppStore((s) => s.vehicles);
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const favoriteStationIds = useAppStore((s) => s.favoriteStationIds);
  const reservations = useAppStore((s) => s.reservations);
  const coupons = useAppStore((s) => s.coupons);
  const logout = useAppStore((s) => s.logout);

  const favoriteStations = STATIONS.filter((s) => favoriteStationIds.includes(s.id));

  const handleLogout = () => {
    logout();
    showToast('로그아웃되었어요', 'info');
    navigate(PATHS.login, { replace: true });
  };

  return (
    <MobileLayout title="마이페이지" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="flex items-center gap-3">
          <ImageWithFallback
            src={user?.profileImage ?? ''}
            alt="프로필 이미지"
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            wrapperClassName="h-16 w-16 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-text">{user?.name ?? '꿀차지'}</p>
            <p className="truncate text-sm text-text-secondary">{user?.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-chip bg-light-yellow px-2 py-0.5 text-xs font-bold text-dark-gold">
              <Award size={12} aria-hidden="true" />
              {user?.memberGrade ?? '골드'} 회원
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-lg font-extrabold text-text">{vehicles.length}대</p>
            <p className="text-[11px] text-text-secondary">등록 차량</p>
          </Card>
          <Card className="text-center">
            <p className="text-lg font-extrabold text-dark-gold">{formatPoints(pointsBalance)}</p>
            <p className="text-[11px] text-text-secondary">누적 포인트</p>
          </Card>
          <Card className="text-center">
            <p className="text-lg font-extrabold text-text">{coupons.length}개</p>
            <p className="text-[11px] text-text-secondary">보유 쿠폰</p>
          </Card>
        </div>

        <Card>
          <div className="mb-2 flex items-center gap-1.5">
            <Star size={16} className="text-primary" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">즐겨찾기 충전소</h3>
          </div>
          {favoriteStations.length === 0 ? (
            <EmptyState title="즐겨찾는 충전소가 없어요" description="지도에서 하트를 눌러 추가해 보세요" />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {favoriteStations.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(PATHS.stationDetail(s.id))}
                  className="flex min-h-[48px] items-center justify-between py-2 text-left text-sm font-semibold text-text"
                >
                  {s.name}
                  <ChevronRight size={15} className="text-text-secondary" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-1.5">
            <CalendarCheck size={16} className="text-info" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">예약 내역</h3>
          </div>
          {reservations.length === 0 ? (
            <EmptyState title="예약 내역이 없어요" />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {reservations.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(PATHS.stationDetail(r.stationId))}
                  className="flex min-h-[48px] items-center justify-between py-2 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold text-text">{r.stationName}</span>
                    <span className="block text-xs text-text-secondary">
                      {r.date} {r.time} · {r.status}
                    </span>
                  </span>
                  <ChevronRight size={15} className="text-text-secondary" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-1.5">
            <Ticket size={16} className="text-dark-gold" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">쿠폰함</h3>
          </div>
          {coupons.length === 0 ? (
            <EmptyState title="보유한 쿠폰이 없어요" description="리워드에서 포인트로 교환해 보세요" />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="block text-sm font-semibold text-text">{c.rewardName}</span>
                    <span className="block text-xs text-text-secondary">{c.expiresAt}까지 · {c.used ? '사용완료' : '사용가능'}</span>
                  </span>
                  <span className="font-mono text-xs text-text-secondary">{c.couponCode}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate(PATHS.settings)}
            className="flex min-h-[48px] items-center gap-2 rounded-button border border-border bg-card px-4 text-sm font-semibold text-text"
          >
            <SettingsIcon size={16} aria-hidden="true" />
            설정
          </button>
          <button
            type="button"
            onClick={() => navigate(PATHS.support)}
            className="flex min-h-[48px] items-center gap-2 rounded-button border border-border bg-card px-4 text-sm font-semibold text-text"
          >
            <LifeBuoy size={16} aria-hidden="true" />
            고객지원
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[48px] items-center gap-2 rounded-button border border-border bg-card px-4 text-sm font-semibold text-danger"
          >
            <LogOut size={16} aria-hidden="true" />
            로그아웃
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
