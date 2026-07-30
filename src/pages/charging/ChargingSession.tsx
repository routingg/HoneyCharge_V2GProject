import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowUpFromLine, Pause, Play, Square, Clock, Coins } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { BatteryGauge } from '@/components/charging/BatteryGauge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Modal } from '@/components/common/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import type { ChargingResult } from '@/types';

export default function ChargingSession() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const session = useAppStore((s) => s.chargingSession);
  const updateChargingSession = useAppStore((s) => s.updateChargingSession);
  const clearChargingSession = useAppStore((s) => s.clearChargingSession);
  const setLastChargingResult = useAppStore((s) => s.setLastChargingResult);
  const addPoints = useAppStore((s) => s.addPoints);
  const updateVehicleSoc = useAppStore((s) => s.updateVehicleSoc);
  const demoMode = useAppStore((s) => s.settings.demoMode);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!session && !finishedRef.current) {
      navigate(PATHS.participate, { replace: true });
    }
  }, [session, navigate]);

  const finishSession = () => {
    const state = useAppStore.getState();
    const s = state.chargingSession;
    if (!s || finishedRef.current) return;
    finishedRef.current = true;
    const durationMin = Math.max(1, Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000));
    const result: ChargingResult = {
      startSoc: s.startSoc,
      endSoc: Math.round(s.currentSoc),
      chargedKwh: Math.round(s.totalChargedKwh * 10) / 10,
      dischargedKwh: Math.round(s.totalDischargedKwh * 10) / 10,
      durationMin,
      pointsEarned: s.pointsEarned,
      carbonSavedKg: Math.round((s.totalChargedKwh * 0.233 + s.totalDischargedKwh * 0.1) * 10) / 10,
      stationName: s.stationName,
      completedAt: new Date().toISOString(),
    };
    if (s.pointsEarned > 0) addPoints(s.pointsEarned, `${s.stationName} 충전·V2G 참여 적립`);
    updateVehicleSoc(s.vehicleId, Math.round(s.currentSoc));
    setLastChargingResult(result);
    clearChargingSession();
    navigate(PATHS.chargingResult, { replace: true });
  };

  useEffect(() => {
    const tickMs = demoMode ? 2000 : 4000;
    const id = window.setInterval(() => {
      const state = useAppStore.getState();
      const s = state.chargingSession;
      if (!s || s.isPaused || s.phase === 'completed') return;
      const vehicle = state.vehicles.find((v) => v.id === s.vehicleId);
      const capacity = vehicle?.batteryCapacityKwh ?? 77;
      const allowV2g = state.chargingSettings.allowV2g;
      const chargeStep = demoMode ? 4 : 2;
      const dischargeStep = demoMode ? 3 : 1.5;
      const dischargeKwh = (dischargeStep / 100) * capacity;

      if (s.phase === 'charging') {
        const nextSocRaw = s.currentSoc + chargeStep;
        const nextSoc = Math.min(nextSocRaw, s.targetSoc);
        const cappedStepKwh = ((nextSoc - s.currentSoc) / 100) * capacity;
        const newPoints = s.pointsEarned + Math.max(1, Math.round(cappedStepKwh * 38));
        const newCharged = s.totalChargedKwh + cappedStepKwh;
        if (nextSoc >= s.targetSoc) {
          if (allowV2g && s.totalDischargedKwh === 0) {
            state.updateChargingSession({
              currentSoc: nextSoc,
              totalChargedKwh: newCharged,
              pointsEarned: newPoints,
              phase: 'v2g',
              currentKw: -Math.round(capacity * (dischargeStep / 100) * 12),
            });
          } else {
            state.updateChargingSession({
              currentSoc: nextSoc,
              totalChargedKwh: newCharged,
              pointsEarned: newPoints,
              phase: 'completed',
            });
          }
        } else {
          state.updateChargingSession({
            currentSoc: nextSoc,
            totalChargedKwh: newCharged,
            pointsEarned: newPoints,
            currentKw: Math.round(capacity * (chargeStep / 100) * 12),
          });
        }
      } else if (s.phase === 'v2g') {
        const nextSoc = Math.max(s.minSoc, s.currentSoc - dischargeStep);
        const newPoints = s.pointsEarned + Math.max(1, Math.round(dischargeKwh * 55));
        const newDischarged = s.totalDischargedKwh + dischargeKwh;
        const shouldReturnToCharging = nextSoc <= s.minSoc || newDischarged >= capacity * 0.08;
        state.updateChargingSession({
          currentSoc: nextSoc,
          totalDischargedKwh: newDischarged,
          pointsEarned: newPoints,
          phase: shouldReturnToCharging ? 'charging' : 'v2g',
          currentKw: -Math.round(capacity * (dischargeStep / 100) * 12),
        });
      }
    }, tickMs);
    return () => window.clearInterval(id);
  }, [demoMode]);

  useEffect(() => {
    if (session?.phase === 'completed' && !finishedRef.current) {
      finishSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase]);

  if (!session) return null;

  const isV2g = session.phase === 'v2g';
  const remainingMin = Math.max(0, Math.round((new Date(session.estimatedCompletionAt).getTime() - Date.now()) / 60000));

  return (
    <MobileLayout title="충전 진행 중" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="flex flex-col items-center py-6">
          <StatusBadge label={isV2g ? 'V2G 방전 중' : session.isPaused ? '일시정지' : '충전 중'} tone={isV2g ? 'warning' : session.isPaused ? 'neutral' : 'success'} />
          <div className="mt-4">
            <BatteryGauge soc={session.currentSoc} minSoc={session.minSoc} targetSoc={session.targetSoc} charging={!session.isPaused} size={188} />
          </div>
          <motion.div
            key={session.currentKw}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold"
          >
            {isV2g ? (
              <ArrowUpFromLine size={16} className="text-info" aria-hidden="true" />
            ) : (
              <Zap size={16} className="text-primary-gold" aria-hidden="true" />
            )}
            <span className={isV2g ? 'text-info' : 'text-dark-gold'}>{Math.abs(session.currentKw)}kW {isV2g ? '방전' : '충전'} 중</span>
          </motion.div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-text-secondary">누적 충전량</p>
            <p className="mt-1 text-lg font-extrabold text-text">{session.totalChargedKwh.toFixed(1)}kWh</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">누적 방전량</p>
            <p className="mt-1 text-lg font-extrabold text-text">{session.totalDischargedKwh.toFixed(1)}kWh</p>
          </Card>
          <Card>
            <p className="flex items-center gap-1 text-xs text-text-secondary">
              <Clock size={12} aria-hidden="true" />
              예상 완료까지
            </p>
            <p className="mt-1 text-lg font-extrabold text-text">{remainingMin}분</p>
          </Card>
          <Card>
            <p className="flex items-center gap-1 text-xs text-text-secondary">
              <Coins size={12} aria-hidden="true" />
              실시간 적립
            </p>
            <p className="mt-1 text-lg font-extrabold text-dark-gold">{formatPoints(session.pointsEarned)}</p>
          </Card>
        </div>

        <Card>
          <p className="text-sm text-text-secondary">충전 장소</p>
          <p className="font-semibold text-text">{session.stationName}</p>
        </Card>

        <div className="flex gap-2.5 pt-1">
          {session.isPaused ? (
            <PrimaryButton
              onClick={() => {
                updateChargingSession({ isPaused: false });
                showToast('충전을 재개했어요', 'info');
              }}
              className="flex-1"
            >
              <Play size={17} aria-hidden="true" />
              재개
            </PrimaryButton>
          ) : (
            <SecondaryButton
              onClick={() => {
                updateChargingSession({ isPaused: true });
                showToast('충전을 일시정지했어요', 'info');
              }}
              className="flex-1"
            >
              <Pause size={17} aria-hidden="true" />
              일시정지
            </SecondaryButton>
          )}
          <SecondaryButton tone="danger" className="flex-1" onClick={() => setShowEndConfirm(true)}>
            <Square size={16} aria-hidden="true" />
            충전 종료
          </SecondaryButton>
        </div>
      </div>

      <Modal open={showEndConfirm} onClose={() => setShowEndConfirm(false)} title="충전을 종료할까요?">
        <p className="text-sm text-text-secondary">
          지금까지 {session.totalChargedKwh.toFixed(1)}kWh를 충전하고 {formatPoints(session.pointsEarned)}를 적립했어요.
        </p>
        <div className="mt-4 flex gap-2">
          <SecondaryButton onClick={() => setShowEndConfirm(false)}>계속 충전</SecondaryButton>
          <PrimaryButton onClick={() => finishSession()}>종료하기</PrimaryButton>
        </div>
      </Modal>
    </MobileLayout>
  );
}
