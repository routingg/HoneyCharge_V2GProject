import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CloudSun, Sparkles, Sun, Wind, Zap, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ChartCard } from '@/components/charts/ChartCard';
import { Timeline } from '@/components/charts/Timeline';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { AI_SCHEDULES } from '@/data/aiSchedules';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import { EnergyApiError, predictEnergy, type PredictResponse } from '@/services/energyPredictionApi';
import { PredictionCard } from '@/components/prediction/PredictionCard';

const ML_RECOMMENDATION_LABEL: Record<PredictResponse['recommendation']['status'], string> = {
  CHARGE: '충전 권장',
  V2G_AVAILABLE: 'V2G 참여 가능',
  HOLD: '대기 권장',
  INSUFFICIENT_DATA: '데이터 확인 필요',
};

export default function AiScheduleDetail() {
  const navigate = useNavigate();
  const schedule = AI_SCHEDULES[0];
  const updateChargingSettings = useAppStore((s) => s.updateChargingSettings);
  const { showToast } = useToast();

  const [mlResult, setMlResult] = useState<PredictResponse | null>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMlLoading(true);
    predictEnergy({
      current_soc: schedule.currentSoc,
      target_soc: schedule.targetSoc,
      minimum_soc: schedule.minSoc,
      v2g_supported: schedule.estimatedV2gHours > 0,
      simulate_hour: new Date().getHours(),
    })
      .then((data) => {
        if (!cancelled) setMlResult(data);
      })
      .catch((e: EnergyApiError) => {
        if (!cancelled) setMlError(e.message);
      })
      .finally(() => {
        if (!cancelled) setMlLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = schedule.hourly.map((h) => ({
    hour: `${h.hour}시`,
    '배터리 잔량': h.socForecast,
    재생에너지: h.renewableRatio,
    단가: h.priceWon,
  }));

  const applySchedule = () => {
    updateChargingSettings({
      targetSoc: schedule.targetSoc,
      minSoc: schedule.minSoc,
      departureTime: schedule.departureTime,
      allowV2g: schedule.estimatedV2gHours > 0,
    });
    showToast('추천 스케줄이 적용되었어요', 'success');
    navigate(PATHS.participate);
  };

  return (
    <MobileLayout title="AI 추천 상세" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="bg-light-yellow">
          <div className="flex items-center gap-2">
            <CloudSun size={20} className="text-dark-gold" aria-hidden="true" />
            <p className="text-sm font-bold text-dark-gold">{schedule.weather}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text">{schedule.reason}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-extrabold text-text">{schedule.estimatedChargeHours}h</p>
              <p className="text-[11px] text-text-secondary">충전 시간</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-text">{schedule.estimatedV2gHours}h</p>
              <p className="text-[11px] text-text-secondary">V2G 시간</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-dark-gold">{formatPoints(schedule.estimatedPoints)}</p>
              <p className="text-[11px] text-text-secondary">예상 포인트</p>
            </div>
          </div>
        </Card>

        {/* 실시간 AI 모델 검증 */}
        <Card className="border-info/30 bg-info/5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-info" aria-hidden="true" />
              <h3 className="text-[15px] font-bold text-text">실시간 AI 예측으로 검증</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate(PATHS.aiEnergyDemo)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-info"
            >
              직접 조정
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>

          {mlLoading && (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              공공데이터 기반 모델을 실행하고 있어요
            </p>
          )}

          {!mlLoading && mlError && (
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              지금은 실시간 예측을 불러올 수 없어요. 위 추천은 저장된 스케줄 기준입니다.
            </p>
          )}

          {!mlLoading && !mlError && mlResult && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <PredictionCard
                  label="전력수요"
                  value={mlResult.predictions.demand}
                  unit={mlResult.data_info.unit}
                  icon={<Zap size={12} />}
                  accentClassName="text-text"
                />
                <PredictionCard
                  label="태양광"
                  value={mlResult.predictions.solar_generation}
                  unit={mlResult.data_info.unit}
                  icon={<Sun size={12} />}
                  accentClassName="text-dark-gold"
                />
                <PredictionCard
                  label="풍력"
                  value={mlResult.predictions.wind_generation}
                  unit={mlResult.data_info.unit}
                  icon={<Wind size={12} />}
                  accentClassName="text-info"
                />
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-text">
                <span className="font-bold text-info">
                  {ML_RECOMMENDATION_LABEL[mlResult.recommendation.status]}
                </span>
                {' — '}
                {mlResult.recommendation.description}
              </p>
            </>
          )}
        </Card>

        <ChartCard title="시간대별 배터리 잔량 · 재생에너지 비율" subtitle="24시간 예측 데이터">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F2" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#70757A' }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#70757A' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E8EA' }} />
                <Area type="monotone" dataKey="재생에너지" fill="#FFF4BF" stroke="#B88A00" strokeWidth={1.5} fillOpacity={0.7} />
                <Line type="monotone" dataKey="배터리 잔량" stroke="#1976D2" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="시간대별 전력 단가" subtitle="원/kWh 기준 예측">
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F2" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#70757A' }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#70757A' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E8EA' }} />
                <Line type="stepAfter" dataKey="단가" stroke="#DC2626" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card>
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles size={16} className="text-dark-gold" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">추천 타임라인</h3>
          </div>
          <Timeline events={schedule.timeline} />
        </Card>

        <div className="flex flex-col gap-2.5 pt-1">
          <PrimaryButton onClick={applySchedule}>이 스케줄 적용</PrimaryButton>
          <SecondaryButton onClick={() => navigate(PATHS.participate)}>설정 직접 변경</SecondaryButton>
          <SecondaryButton
            tone="danger"
            onClick={() => {
              showToast('다음 추천에 반영할게요', 'info');
              navigate(PATHS.home);
            }}
          >
            추천 거절
          </SecondaryButton>
        </div>
      </div>
    </MobileLayout>
  );
}
