import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, X } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FilterChip } from '@/components/common/FilterChip';
import { EmptyState } from '@/components/common/EmptyState';
import { NOTIFICATION_ICONS } from '@/components/notifications/notificationIcons';
import { NOTIFICATION_TYPES } from '@/data/notifications';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import { PATHS } from '@/routes/paths';

export default function NotificationsList() {
  const navigate = useNavigate();
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const removeNotification = useAppStore((s) => s.removeNotification);
  const [filter, setFilter] = useState<string>('전체');

  const filtered = useMemo(
    () => (filter === '전체' ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter]
  );

  return (
    <MobileLayout title="알림" showBack showBottomNav={false}>
      <div className="flex flex-col gap-3 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">읽지 않은 알림 {notifications.filter((n) => !n.read).length}개</p>
          <button type="button" onClick={markAllNotificationsRead} className="flex items-center gap-1 text-sm font-semibold text-info">
            <CheckCheck size={15} aria-hidden="true" />
            전체 읽음
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {NOTIFICATION_TYPES.map((t) => (
            <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)}>
              {t}
            </FilterChip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="알림이 없어요" />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type];
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 rounded-card border border-border bg-card p-3.5 shadow-card',
                    !n.read && 'bg-light-yellow/40'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigate(PATHS.notificationDetail(n.id));
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
                      <Icon size={17} aria-hidden="true" />
                      {!n.read && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-danger" aria-label="읽지 않음" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-text">{n.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-text-secondary">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-text-secondary">{n.createdAt}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="알림 삭제"
                    onClick={() => removeNotification(n.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
