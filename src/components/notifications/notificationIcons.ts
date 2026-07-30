import {
  Zap,
  CheckCircle2,
  ArrowUpFromLine,
  Coins,
  Clock3,
  CalendarClock,
  BatteryWarning,
  CloudSun,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@/types';

export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  '충전 시작': Zap,
  '충전 완료': CheckCircle2,
  'V2G 시작': ArrowUpFromLine,
  'V2G 완료': ArrowUpFromLine,
  '포인트 적립': Coins,
  '포인트 만료': Clock3,
  '예약 알림': CalendarClock,
  '배터리 경고': BatteryWarning,
  '날씨 기반 추천': CloudSun,
  '재생에너지 과잉 알림': Sparkles,
};
