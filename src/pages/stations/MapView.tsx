import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { Search, List, X, Star, Zap, MapPin, Footprints } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FilterChip } from '@/components/common/FilterChip';
import { BottomSheet } from '@/components/common/BottomSheet';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import {
  createStationIcon,
  createUserLocationIcon,
  createPartnerStoreIcon,
} from '@/components/map/stationIcon';
import { LocationSourceBadge } from '@/components/map/LocationSourceBadge';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { LocationPermissionNotice } from '@/components/map/LocationPermissionNotice';
import { STATIONS, STATION_FILTERS } from '@/data/stations';
import { partnerStoreById, partnerStoresForStation } from '@/data/partnerStores';
import { DEFAULT_MAP_ZOOM } from '@/data/location';
import { filterStations } from '@/utils/stationFilters';
import { applyDistances, formatDistance } from '@/utils/calculateDistance';
import { requestBrowserLocation } from '@/utils/location';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';

export default function MapView() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const favorites = useAppStore((s) => s.favoriteStationIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavoriteStation);
  const userLocation = useAppStore((s) => s.userLocation);
  const locationSource = useAppStore((s) => s.locationSource);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const resetUserLocationToDefault = useAppStore((s) => s.resetUserLocationToDefault);
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);
  const demoMode = useAppStore((s) => s.settings.demoMode);

  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(() =>
    searchParams.get('filter') === 'fast' ? ['급속'] : []
  );
  const [locating, setLocating] = useState(false);
  /**
   * Leaflet 인스턴스는 ref가 아니라 state로 들고 있는다.
   * ref로 두면 최초 렌더의 effect 시점에 아직 null이라 딥링크 중심 이동이 조용히 무시된다.
   */
  const [map, setMap] = useState<LeafletMap | null>(null);
  /** 이전 위치 요청 결과가 최신 상태를 덮어쓰지 않도록 하는 시퀀스 번호 */
  const locationRequestId = useRef(0);
  const didMountRef = useRef(false);

  const focusedStoreId = searchParams.get('store');
  const focusedStore = useMemo(() => partnerStoreById(focusedStoreId), [focusedStoreId]);

  const center: [number, number] = [userLocation.latitude, userLocation.longitude];
  const effectiveSource = demoMode && locationSource === 'hotel-default' ? 'demo' : locationSource;

  // 사용자 위치 기준으로 거리 재계산
  const stationsWithDistance = useMemo(() => applyDistances(STATIONS, userLocation), [userLocation]);
  const filtered = useMemo(
    () => filterStations(stationsWithDistance, activeFilters, query),
    [stationsWithDistance, activeFilters, query]
  );
  const selected = stationsWithDistance.find((s) => s.id === selectedStationId) ?? null;
  const [sheetOpen, setSheetOpen] = useState(false);

  // 급속 필터 딥링크(/map?filter=fast)
  useEffect(() => {
    if (searchParams.get('filter') === 'fast') {
      setActiveFilters((prev) => (prev.includes('급속') ? prev : [...prev, '급속']));
      showToast('급속 충전 필터를 적용했어요', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('filter')]);

  // 제휴 매장 딥링크(/map?store=ps-001)
  useEffect(() => {
    if (!focusedStore || !map) return;
    map.setView([focusedStore.latitude, focusedStore.longitude], 16, { animate: true });
    showToast(`${focusedStore.name} 위치를 지도에 표시했어요`, 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedStore?.id, map]);

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleMyLocation = () => {
    map?.setView(center, DEFAULT_MAP_ZOOM, { animate: true });
    showToast(`${userLocation.name} 기준으로 이동했어요`, 'info');
  };

  const handleUseBrowserLocation = async () => {
    const requestId = ++locationRequestId.current;
    setLocating(true);
    const result = await requestBrowserLocation();
    // 더 최신 요청(또는 호텔 기준 전환)이 있었다면 결과를 버린다
    if (requestId !== locationRequestId.current) return;
    setLocating(false);
    setUserLocation(result.location, result.source);
    map?.setView([result.location.latitude, result.location.longitude], DEFAULT_MAP_ZOOM, {
      animate: true,
    });
    showToast(result.message, result.ok ? 'success' : 'warning');
  };

  const handleUseHotelLocation = () => {
    locationRequestId.current += 1;
    setLocating(false);
    resetUserLocationToDefault();
    showToast('글로스터호텔 함덕 기준으로 되돌렸어요', 'info');
  };

  // 기준 위치가 "바뀌면" 지도 중심도 따라간다.
  // 최초 마운트는 MapContainer의 center prop이 이미 처리하므로 건너뛴다.
  // (건너뛰지 않으면 /map?store=... 딥링크의 매장 중심 이동을 덮어쓴다)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    map?.setView(center, DEFAULT_MAP_ZOOM, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation.latitude, userLocation.longitude]);

  const handleSelectStation = (id: string) => {
    setSelectedStation(id);
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);

  const clearStoreFocus = () => {
    if (!focusedStoreId) return;
    const next = new URLSearchParams(searchParams);
    next.delete('store');
    setSearchParams(next, { replace: true });
  };

  // 제휴 매장 마커는 "길찾기"로 특정 매장을 지정해 들어온 경우에만 표시한다
  // (충전소 선택만으로 전부 띄우면 라벨이 겹쳐 충전소 마커를 가린다)
  const storeMarkers = focusedStore ? [focusedStore] : [];

  return (
    <MobileLayout title="주변 충전소" noPadding scrollable={false}>
      <div className="absolute inset-0 z-0">
        <MapContainer
          ref={setMap}
          center={center}
          zoom={DEFAULT_MAP_ZOOM}
          scrollWheelZoom
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomleft" />

          <Marker position={center} icon={createUserLocationIcon(userLocation.name)} zIndexOffset={800}>
            <Popup>
              <strong>{userLocation.name}</strong>
              <br />
              {userLocation.address}
            </Popup>
          </Marker>

          {storeMarkers.map((store) => (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={createPartnerStoreIcon(store.name)}
              zIndexOffset={600}
            >
              <Popup>
                <strong>{store.name}</strong>
                <br />
                {store.benefitDescription}
                <br />
                도보 {store.walkingMinutes}분 · 시연용 가상 매장
              </Popup>
            </Marker>
          ))}

          {filtered.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createStationIcon(station, station.id === selectedStationId)}
              eventHandlers={{ click: () => handleSelectStation(station.id) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Top overlay: search + filters + location status */}
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

        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <LocationSourceBadge source={effectiveSource} />
          <LocationPermissionNotice
            source={effectiveSource}
            loading={locating}
            onUseBrowserLocation={handleUseBrowserLocation}
            onUseHotelLocation={handleUseHotelLocation}
          />
          <span className="shrink-0 whitespace-nowrap rounded-chip bg-card px-2.5 py-1 text-[11px] font-bold text-text shadow-card">
            {filtered.length}개 충전소
          </span>
          {focusedStore && (
            <button
              type="button"
              onClick={clearStoreFocus}
              className="inline-flex min-h-[28px] shrink-0 items-center gap-1 whitespace-nowrap rounded-chip bg-primary px-2.5 py-1 text-[11px] font-bold text-[#202124] shadow-card"
            >
              {focusedStore.name}
              <X size={11} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="absolute bottom-5 right-4 z-[15] flex flex-col gap-2.5">
        <CurrentLocationButton onClick={handleMyLocation} loading={locating} />
        <button
          type="button"
          onClick={() => navigate(PATHS.stations)}
          className="flex h-12 items-center gap-1.5 rounded-full bg-[#202124] px-4 text-sm font-semibold text-white shadow-elevated"
        >
          <List size={17} aria-hidden="true" />
          목록보기
        </button>
      </div>

      <BottomSheet open={sheetOpen && !!selected} onClose={closeSheet}>
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
                    <Star
                      size={18}
                      className={favorites.includes(selected.id) ? 'fill-primary text-primary' : 'text-border'}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
                  <MapPin size={12} aria-hidden="true" />
                  {selected.address}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-info">
                  {userLocation.name}에서 {formatDistance(selected.distanceKm)}
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
                {selected.chargeSpeedKw}kW {selected.chargeSpeedKw >= 100 ? '급속' : '충전'}
              </span>
              <span className="font-semibold text-dark-gold">+{selected.expectedPoints}P 예상</span>
            </div>

            {partnerStoresForStation(selected.id).length > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
                <Footprints size={12} aria-hidden="true" />
                주변 제휴 매장 {partnerStoresForStation(selected.id).length}곳 · 충전 중 이용 가능
              </p>
            )}

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
