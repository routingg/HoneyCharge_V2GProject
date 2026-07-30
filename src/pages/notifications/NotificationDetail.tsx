import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { NOTIFICATION_ICONS } from '@/components/notifications/notificationIcons';
import { useAppStore } from '@/store/useAppStore';
import { PATHS } from '@/routes/paths';

export default function NotificationDetail() {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const notification = notifications.find((n) => n.id === notificationId);

  useEffect(() => {
    if (notification && !notification.read) markNotificationRead(notification.id);
  }, [notification, markNotificationRead]);

  if (!notification) {
    return (
      <MobileLayout title="알림 상세" showBack showBottomNav={false}>
        <EmptyState title="알림을 찾을 수 없어요" />
      </MobileLayout>
    );
  }

  const Icon = NOTIFICATION_ICONS[notification.type];

  return (
    <MobileLayout title="알림 상세" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="flex flex-col items-center py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
            <Icon size={28} aria-hidden="true" />
          </span>
          <p className="mt-3 text-xs font-semibold text-dark-gold">{notification.type}</p>
          <h1 className="mt-1 text-lg font-extrabold text-text">{notification.title}</h1>
          <p className="mt-1 text-xs text-text-secondary">{notification.createdAt}</p>
        </Card>
        <Card>
          <p className="text-sm leading-relaxed text-text">{notification.detail ?? notification.message}</p>
        </Card>
        <PrimaryButton onClick={() => navigate(PATHS.notifications)}>목록으로 돌아가기</PrimaryButton>
      </div>
    </MobileLayout>
  );
}
