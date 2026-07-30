import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Navigation, Star, Share2, MapPin, Clock, Zap, ParkingCircle, Tag, MessageSquareText } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { createStationIcon } from '@/components/map/stationIcon';
import { STATIONS } from '@/data/stations';
import { reviewsForStation } from '@/data/reviews';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';

export default function StationDetail() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { showToast, notReady } = useToast();
  const favorites = useAppStore((s) => s.favoriteStationIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavoriteStation);
  const station = STATIONS.find((s) => s.id === stationId);
  const reviews = station ? reviewsForStation(station.id) : [];

  if (!station) {
    return (
      <MobileLayout title="충전소 상세" showBack showBottomNav={false}>
        <EmptyState title="충전소 정보를 찾을 수 없어요" />
      </MobileLayout>
    );
  }

  const isFavorite = favorites.includes(station.id);

  return (
    <MobileLayout title={station.name} showBack showBottomNav={false} noPadding>
      <div className="flex flex-col pb-6">
        <ImageWithFallback
          src={station.image}
          alt={`${station.name} 전경`}
          className="h-52 w-full object-cover"
          wrapperClassName="h-52 w-full"
        />
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-extrabold text-text">{station.name}</h1>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  onClick={() => {
                    toggleFavorite(station.id);
                    showToast(isFavorite ? '즐겨찾기에서 제거했어요' : '즐겨찾기에 추가했어요', 'success');
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
                >
                  <Star size={17} className={isFavorite ? 'fill-primary text-primary' : 'text-text-secondary'} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="공유하기"
                  onClick={() => showToast('공유 링크가 복사되었어요', 'success')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
                >
                  <Share2 size={16} className="text-text-secondary" aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
              <MapPin size={13} aria-hidden="true" />
              {station.address} · {station.distanceKm}km
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge label={`사용가능 ${station.availableChargers}/${station.totalChargers}`} tone={station.availableChargers === 0 ? 'danger' : 'success'} />
              {station.v2gAvailable && <StatusBadge label="V2G 지원" tone="neutral" />}
              <StatusBadge label={station.congestion} tone={station.congestion === '혼잡' ? 'warning' : 'success'} />
            </div>
          </div>

          <Card className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-text-secondary" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">운영 시간</p>
                <p className="text-sm font-semibold text-text">{station.operatingHours}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-text-secondary" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">충전 속도</p>
                <p className="text-sm font-semibold text-text">{station.chargeSpeedKw}kW</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ParkingCircle size={16} className="text-text-secondary" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">주차 요금</p>
                <p className="text-sm font-semibold text-text">{station.parkingFee}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-text-secondary" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">예상 포인트</p>
                <p className="text-sm font-semibold text-dark-gold">+{station.expectedPoints}P</p>
              </div>
            </div>
          </Card>

          {station.partnerBenefit && (
            <Card className="bg-light-yellow">
              <p className="text-sm font-semibold text-dark-gold">제휴 매장 혜택</p>
              <p className="mt-1 text-sm text-text">{station.partnerBenefit}</p>
            </Card>
          )}

          <Card padded={false} className="overflow-hidden">
            <div className="h-36 w-full">
              <MapContainer
                center={[station.lat, station.lng]}
                zoom={14}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                attributionControl={false}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[station.lat, station.lng]} icon={createStationIcon(station, true)} />
              </MapContainer>
            </div>
            <button
              type="button"
              onClick={() => navigate(PATHS.map)}
              className="flex min-h-[44px] w-full items-center justify-center text-sm font-semibold text-info"
            >
              지도에서 크게 보기
            </button>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-1.5">
              <MessageSquareText size={16} className="text-text-secondary" aria-hidden="true" />
              <h3 className="text-[15px] font-bold text-text">
                이용자 리뷰 ({station.rating} · {station.reviewCount})
              </h3>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-text-secondary">아직 등록된 리뷰가 없어요.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {reviews.map((r) => (
                  <div key={r.id} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text">{r.userName}</p>
                      <span className="text-xs text-text-secondary">{r.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2.5 border-t border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={notReady}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-button border border-border text-sm font-semibold text-text"
        >
          <Navigation size={16} aria-hidden="true" />
          길찾기
        </button>
        <PrimaryButton className="flex-1" onClick={() => navigate(PATHS.stationReserve(station.id))}>
          참여 예약
        </PrimaryButton>
      </div>
    </MobileLayout>
  );
}
