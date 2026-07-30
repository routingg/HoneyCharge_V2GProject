import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { PATHS } from '@/routes/paths';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <MobileLayout title="페이지를 찾을 수 없음" showBack showBottomNav={false}>
      <EmptyState
        icon={Compass}
        title="페이지를 찾을 수 없어요"
        description="주소를 다시 확인하시거나 홈으로 이동해 주세요."
        action={
          <PrimaryButton fullWidth={false} className="mt-2 px-8" onClick={() => navigate(PATHS.home)}>
            홈으로 이동
          </PrimaryButton>
        }
      />
    </MobileLayout>
  );
}
