import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

const FAQS = [
  { q: 'V2G 참여 시 배터리에 무리가 가지 않나요?', a: '배터리 보호 모드를 켜두면 설정한 최소 보장 SOC 이하로는 방전되지 않으며, 배터리 열화를 최소화하는 방식으로 방전량을 제어합니다.' },
  { q: '충전·V2G로 적립된 포인트는 언제 지급되나요?', a: '충전 세션이 종료되면 즉시 포인트가 적립됩니다. 다만 정산금(현금화)은 최대 1영업일이 소요될 수 있습니다.' },
  { q: '포인트 유효기간이 있나요?', a: '적립일로부터 12개월간 유효하며, 만료 30일 전 알림을 통해 안내해 드립니다.' },
  { q: '여러 대의 차량을 등록할 수 있나요?', a: '네, 여러 대의 차량을 등록하고 그중 한 대를 대표 차량으로 지정할 수 있습니다.' },
  { q: '충전 예약을 취소하고 싶어요', a: '마이페이지의 예약 내역에서 예약을 취소할 수 있으며, 이용 시간 1시간 전까지 무료로 취소 가능합니다.' },
  { q: '데모 모드는 무엇인가요?', a: '발표나 시연을 위해 충전·V2G 진행 속도를 빠르게 시뮬레이션하는 기능으로, 설정 메뉴에서 켜고 끌 수 있습니다.' },
  { q: '커넥티드카 연결은 필수인가요?', a: '커넥티드카로 연결하면 실시간 SOC 조회와 원격 충전 제어가 가능해지며, 연결하지 않아도 수동으로 참여할 수 있습니다.' },
  { q: '재생에너지 발전량은 어떻게 반영되나요?', a: '기상청 예보와 지역 발전 데이터를 기반으로 태양광·풍력 발전량을 예측해 충전 스케줄에 반영합니다.' },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <MobileLayout title="자주 묻는 질문" showBack showBottomNav={false}>
      <div className="flex flex-col gap-2.5 pb-4">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <Card key={i} padded={false}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex min-h-[52px] w-full items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-text">{item.q}</span>
                <ChevronDown size={16} className={cn('shrink-0 text-text-secondary transition-transform', open && 'rotate-180')} aria-hidden="true" />
              </button>
              {open && <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-text-secondary">{item.a}</p>}
            </Card>
          );
        })}
      </div>
    </MobileLayout>
  );
}
