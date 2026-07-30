import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { PATHS } from '@/routes/paths';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ title, showBack = false, onBack }: AppHeaderProps) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(56px + env(safe-area-inset-top))' }}
    >
      {showBack ? (
        <>
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text active:bg-bg"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-bold text-text">{title}</h1>
        </>
      ) : (
        <button
          type="button"
          onClick={() => navigate(PATHS.profile)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ImageWithFallback
            src={user?.profileImage ?? ''}
            alt="프로필 이미지"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            wrapperClassName="h-9 w-9 shrink-0 rounded-full"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-text">{user?.name ?? '꿀차지'}</p>
            {title && <p className="truncate text-[11px] leading-tight text-text-secondary">{title}</p>}
          </div>
        </button>
      )}
      <button
        type="button"
        aria-label="알림"
        onClick={() => navigate(PATHS.notifications)}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text active:bg-bg"
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" aria-label={`읽지 않은 알림 ${unreadCount}개`} />
        )}
      </button>
    </header>
  );
}
