import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FilterChip } from '@/components/common/FilterChip';
import { StationCard } from '@/components/stations/StationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { STATIONS, STATION_FILTERS, STATION_SORTS } from '@/data/stations';
import { filterStations, sortStations } from '@/utils/stationFilters';
import { useAppStore } from '@/store/useAppStore';
import { PATHS } from '@/routes/paths';

export default function StationsList() {
  const navigate = useNavigate();
  const favorites = useAppStore((s) => s.favoriteStationIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavoriteStation);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>('가까운 순');

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const stations = useMemo(() => {
    const filtered = filterStations(STATIONS, activeFilters, query);
    return sortStations(filtered, sortKey);
  }, [activeFilters, query, sortKey]);

  return (
    <MobileLayout title="충전소 목록">
      <div className="flex flex-col gap-3 pb-2">
        <div className="flex items-center gap-2 rounded-button border border-border bg-card px-3.5">
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

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATION_FILTERS.map((f) => (
            <FilterChip key={f} active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>
              {f}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">{stations.length}개 충전소</p>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="정렬 기준"
            className="rounded-button border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-text"
          >
            {STATION_SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {stations.length === 0 ? (
          <EmptyState title="조건에 맞는 충전소가 없어요" description="필터를 조정하거나 검색어를 바꿔보세요" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                isFavorite={favorites.includes(station.id)}
                onToggleFavorite={toggleFavorite}
                onClick={() => navigate(PATHS.stationDetail(station.id))}
              />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
