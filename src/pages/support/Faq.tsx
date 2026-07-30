import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { SUPPORT_FAQS as FAQS } from '@/data/supportFaq';
import { cn } from '@/utils/cn';

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
