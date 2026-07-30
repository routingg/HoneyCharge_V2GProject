import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { Search, LocateFixed, List, X, Star, Zap, MapPin } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FilterChip } from '@/components/common/FilterChip';
import { BottomSheet } from '@/components/common/BottomSheet';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { createStationIcon, createUserLocationIcon } from '@/components/map/stationIcon';
import { STATIONS, STATION_FILTERS } from '@/data/stations';
import { filterStations } from '@/utils/stationFilters';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';

const JEJU_CENTER: [number, number] = [33.42, 126.58];

export default function MapView() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const favorites = useAppStore((s) => s.favoriteStationIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavoriteStation);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const filtered = useMemo(() => filterStations(STATIONS, activeFilters, query), [activeFilters, query]);
  const selected = STATIONS.find((s) => s.id === selectedId) ?? null;

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleMyLocation = () => {
    mapRef.current?.setView(JEJU_CENTER, 11, { animate: true });
    showToast('현재 위치로 이동했어요', 'info');
  };

  return (
    <MobileLayout title="주변 충전소" noPadding scrollable={false}>
      <div className="absolute inset-0 z-0">
        <MapContainer ref={mapRef} center={JEJU_CENTER} zoom={11} scrollWheelZoom zoomControl={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomleft" />
          <Marker position={JEJU_CENTER} icon={createUserLocationIcon()}>
            <Popup>현재 위치 (모의)</Popup>
          </Marker>
          {filtered.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createStationIcon(station, station.id === selectedId)}
              eventHandlers={{ click: () => setSelectedId(station.id) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Top overlay: search + filters */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] flex flex-col gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-button border border-border bg-card px-3.5 shadow-card">
          <Search size={16} className="text-text-secondary" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="충전소, 지역명으로 검색"
            aria-label="충전소 검색"
            className="min-h-[44px] flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-secondary"
          />
          {query && (
            <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')} className="text-text-secondary">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="pointer-events-auto flex gap-2 overflow-x-auto scrollbar-hide">
          {STATION_FILTERS.map((f) => (
            <FilterChip key={f} active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>
              {f}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="absolute bottom-5 right-4 z-[15] flex flex-col gap-2.5">
        <button
          type="button"
          aria-label="내 위치로 이동"
          onClick={handleMyLocation}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-text shadow-elevated"
        >
          <LocateFixed size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => navigate(PATHS.stations)}
          className="flex h-12 items-center gap-1.5 rounded-full bg-[#202124] px-4 text-sm font-semibold text-white shadow-elevated"
        >
          <List size={17} aria-hidden="true" />
          목록보기
        </button>
      </div>

      <div className="absolute left-4 top-[104px] z-[15] rounded-chip bg-card px-3 py-1.5 text-xs font-semibold text-text shadow-card">
        {filtered.length}개 충전소
      </div>

      <BottomSheet open={!!selected} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="pb-2">
            <div className="flex gap-3">
              <ImageWithFallback
                src={selected.image}
                alt={`${selected.name} 전경`}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                wrapperClassName="h-20 w-20 shrink-0 rounded-2xl"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-base font-bold text-text">{selected.name}</h3>
                  <button
                    type="button"
                    aria-label={favorites.includes(selected.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    onClick={() => toggleFavorite(selected.id)}
                  >
                    <Star size={18} className={favorites.includes(selected.id) ? 'fill-primary text-primary' : 'text-border'} aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
                  <MapPin size={12} aria-hidden="true" />
                  {selected.address}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge
                    label={`사용가능 ${selected.availableChargers}/${selected.totalChargers}`}
                    tone={selected.availableChargers === 0 ? 'danger' : 'success'}
                  />
                  {selected.v2gAvailable && <StatusBadge label="V2G 가능" tone="neutral" />}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-bg p-3 text-sm">
              <span className="inline-flex items-center gap-1 font-semibold text-dark-gold">
                <Zap size={14} aria-hidden="true" />
                {selected.chargeSpeedKw}kW 급속
              </span>
              <span className="font-semibold text-dark-gold">+{selected.expectedPoints}P 예상</span>
            </div>
            <div className="mt-3 flex gap-2">
              <SecondaryButton onClick={() => navigate(PATHS.stationDetail(selected.id))}>상세보기</SecondaryButton>
              <PrimaryButton onClick={() => navigate(PATHS.stationReserve(selected.id))}>예약하기</PrimaryButton>
            </div>
          </div>
        )}
      </BottomSheet>
    </MobileLayout>
  );
}
