import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BatteryCharging,
  Database,
  Loader2,
  PauseCircle,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Toggle } from '@/components/common/Toggle';
import { Stepper } from '@/components/common/Stepper';
import { PredictionCard } from '@/components/prediction/PredictionCard';
import {
  EnergyApiError,
  fetchHealth,
  predictEnergy,
  type HealthResponse,
  type PredictResponse,
  type RecommendationStatus,
} from '@/services/energyPredictionApi';
import { BATTERY_LABELS } from '@/utils/formatBatteryText';

const RECOMMENDATION_STYLE: Record<
  RecommendationStatus,
  { tone: string; icon: typeof Zap; label: string }
> = {
  CHARGE: { tone: 'border-success/40 bg-success/5 text-success', icon: BatteryCharging, label: '충전 권장' },
  V2G_AVAILABLE: { tone: 'border-info/40 bg-info/5 text-info', icon: Zap, label: 'V2G 참여 가능' },
  HOLD: { tone: 'border-border bg-bg text-text-secondary', icon: PauseCircle, label: '대기 권장' },
  INSUFFICIENT_DATA: { tone: 'border-danger/40 bg-danger/5 text-danger', icon: AlertCircle, label: '데이터 확인 필요' },
};

export default function AIEnergyDemo() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; missing: string[] } | null>(null);

  const [currentSoc, setCurrentSoc] = useState(45);
  const [targetSoc, setTargetSoc] = useState(80);
  const [minimumSoc, setMinimumSoc] = useState(30);
  const [v2gSupported, setV2gSupported] = useState(true);
  const [simHour, setSimHour] = useState(13);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e: EnergyApiError) => setHealthError(e.message));
  }, []);

  const availableTime = health?.data.available_times?.[0];

  const run = async () => {
    if (minimumSoc >= targetSoc) {
      setError({ message: '최소 보장 배터리는 목표 충전량보다 낮아야 해요.', missing: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await predictEnergy({
        target_time: availableTime,
        current_soc: currentSoc,
        target_soc: targetSoc,
        minimum_soc: minimumSoc,
        v2g_supported: v2gSupported,
        simulate_hour: simHour,
      });
      setResult(data);
    } catch (e) {
      const err = e as EnergyApiError;
      setError({ message: err.message, missing: err.missingFeatures });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const unitLabel = result?.data_info.units_comparable ? result.data_info.unit : '지수';
  const maxValue = result
    ? Math.max(
        result.predictions.demand,
        result.predictions.solar_generation,
        result.predictions.wind_generation
      )
    : 1;

  return (
    <MobileLayout title="AI 에너지 예측" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-6">
        <div>
          <h1 className="text-lg font-extrabold text-text">AI 에너지 예측</h1>
          <p className="mt-1 text-sm text-text-secondary">
            공공데이터 기반으로 제주 지역의 전력수요와 태양광·풍력 발전량을 예측합니다.
          </p>
        </div>

        {/* 서버 상태 */}
        {healthError && (
          <Card className="border-danger/40 bg-danger/5">
            <p className="flex items-start gap-2 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {healthError}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              백엔드를 먼저 실행해 주세요: <code>cd backend &amp;&amp; uvicorn main:app --port 8001</code>
            </p>
          </Card>
        )}

        {health && (
          <Card className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-xs">
            <span className="font-semibold text-text">모델</span>
            {Object.entries(health.models).map(([key, value]) => (
              <span key={key} className={value === 'loaded' ? 'text-success' : 'text-danger'}>
                {key} {value === 'loaded' ? '✓' : '✗'}
              </span>
            ))}
            <span className="ml-auto text-text-secondary">단위 {health.unit}</span>
          </Card>
        )}

        {/* 입력 */}
        <Card className="flex flex-col gap-3">
          <h2 className="text-[15px] font-bold text-text">차량 조건</h2>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{BATTERY_LABELS.current}</span>
            <Stepper value={currentSoc} onChange={setCurrentSoc} min={0} max={100} step={5} unit="%" label={BATTERY_LABELS.current} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{BATTERY_LABELS.target}</span>
            <Stepper value={targetSoc} onChange={setTargetSoc} min={0} max={100} step={5} unit="%" label={BATTERY_LABELS.target} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{BATTERY_LABELS.minimum}</span>
            <Stepper value={minimumSoc} onChange={setMinimumSoc} min={0} max={100} step={5} unit="%" label={BATTERY_LABELS.minimum} />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-text-secondary">V2G 지원 차량</span>
            <Toggle checked={v2gSupported} onChange={setV2gSupported} label="V2G 지원 차량" />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-text-secondary">시뮬레이션 시각</span>
            <Stepper value={simHour} onChange={setSimHour} min={0} max={23} step={1} unit="시" label="시뮬레이션 시각" />
          </div>
          {availableTime && (
            <p className="rounded-2xl bg-bg p-2.5 text-xs text-text-secondary">
              실측 기준 시각: <strong className="text-text">{availableTime.replace('T', ' ')}</strong>
              <br />
              위 시각 슬라이더를 움직이면 태양광 일사량·전력수요를 시간대별 곡선으로
              근사해 재계산합니다(실측 관측치 아님).
            </p>
          )}
        </Card>

        <PrimaryButton onClick={run} loading={loading} disabled={loading || !!healthError}>
          {loading ? '예측 중…' : 'AI 예측 실행'}
        </PrimaryButton>

        {/* 오류 */}
        {error && (
          <Card className="border-danger/40 bg-danger/5">
            <p className="flex items-start gap-2 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error.message}
            </p>
            {error.missing.length > 0 && (
              <p className="mt-2 text-xs text-text-secondary">
                누락된 피처: {error.missing.join(', ')}
              </p>
            )}
          </Card>
        )}

        {/* 로딩 */}
        {loading && !result && (
          <Card className="flex items-center justify-center gap-2 py-8 text-sm text-text-secondary">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            모델을 실행하고 있어요
          </Card>
        )}

        {/* 결과 */}
        {result && !loading && (
          <>
            <div className="grid grid-cols-1 gap-3">
              <PredictionCard
                label="예상 전력수요"
                value={result.predictions.demand}
                unit={unitLabel}
                icon={<Zap size={13} />}
                accentClassName="text-text"
                ratio={result.predictions.demand / maxValue}
              />
              <div className="grid grid-cols-2 gap-3">
                <PredictionCard
                  label="예상 태양광"
                  value={result.predictions.solar_generation}
                  unit={unitLabel}
                  icon={<Sun size={13} />}
                  accentClassName="text-dark-gold"
                  ratio={result.predictions.solar_generation / maxValue}
                />
                <PredictionCard
                  label="예상 풍력"
                  value={result.predictions.wind_generation}
                  unit={unitLabel}
                  icon={<Wind size={13} />}
                  accentClassName="text-info"
                  ratio={result.predictions.wind_generation / maxValue}
                />
              </div>
            </div>

            {/* 종합 추천 */}
            {(() => {
              const style = RECOMMENDATION_STYLE[result.recommendation.status];
              const Icon = style.icon;
              return (
                <Card className={style.tone}>
                  <p className="flex items-center gap-1.5 text-xs font-bold">
                    <Icon size={14} aria-hidden="true" />
                    {style.label}
                  </p>
                  <p className="mt-1.5 text-[15px] font-extrabold text-text">
                    {result.recommendation.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {result.recommendation.description}
                  </p>
                </Card>
              );
            })()}

            {/* 재생에너지 요약 */}
            <Card className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary">재생에너지 합계</p>
                <p className="font-extrabold text-text">
                  {result.renewable_generation.total.toLocaleString('ko-KR')} {unitLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">수요 대비 차이</p>
                <p
                  className={`font-extrabold ${
                    result.renewable_generation.energy_gap >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {result.renewable_generation.energy_gap >= 0 ? '+' : ''}
                  {result.renewable_generation.energy_gap.toLocaleString('ko-KR')} {unitLabel}
                </p>
              </div>
            </Card>

            {/* 데이터 출처 */}
            <Card className="text-xs leading-relaxed text-text-secondary">
              <p className="mb-1.5 flex items-center gap-1.5 font-bold text-text">
                <Database size={13} aria-hidden="true" />
                데이터 출처
              </p>
              <p>{result.data_info.source}</p>
              <p className="mt-1">
                예측 기준 시각 <strong className="text-text">{result.data_info.reference_time.replace('T', ' ')}</strong>
              </p>
              <p>
                데이터 유형{' '}
                {result.data_info.is_simulated ? '시간대 시뮬레이션(근사)' : '과거 관측 데이터 기반'}
              </p>
              <p className="mt-2 text-[11px]">{result.data_info.note}</p>
              <p className="mt-2 font-semibold text-text">
                공공데이터에서 수집한 실제 과거 데이터를 기반으로 산출한 예측 결과입니다.
              </p>
            </Card>
          </>
        )}

        {!result && !loading && !error && !healthError && (
          <Card className="py-8 text-center text-sm text-text-secondary">
            차량 조건을 설정하고 «AI 예측 실행»을 눌러주세요.
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
