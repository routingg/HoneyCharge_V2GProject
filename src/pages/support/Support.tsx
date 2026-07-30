import { useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, Mail, HelpCircle, ChevronRight } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';

export default function Support() {
  const navigate = useNavigate();
  const { notReady } = useToast();

  const CONTACTS = [
    { icon: Phone, label: '전화 문의', desc: '평일 09:00 - 18:00', action: notReady, highlight: false },
    {
      icon: MessageCircle,
      label: '실시간 채팅 상담',
      desc: 'AI 상담원이 24시간 답변해요',
      action: () => navigate(PATHS.supportChat),
      highlight: true,
    },
    { icon: Mail, label: '이메일 문의', desc: 'support@honeycharge.kr', action: notReady, highlight: false },
  ];

  return (
    <MobileLayout title="고객지원" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <button
          type="button"
          onClick={() => navigate(PATHS.supportFaq)}
          className="flex w-full items-center gap-3 rounded-card border border-primary/40 bg-light-yellow p-4 text-left"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-dark-gold">
            <HelpCircle size={20} aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-dark-gold">자주 묻는 질문</span>
            <span className="block text-xs text-text-secondary">궁금한 점을 빠르게 확인해 보세요</span>
          </span>
          <ChevronRight size={18} className="text-dark-gold" aria-hidden="true" />
        </button>

        <Card padded={false} className="divide-y divide-border">
          {CONTACTS.map((c) => (
            <button key={c.label} type="button" onClick={c.action} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span
                className={
                  c.highlight
                    ? 'flex h-11 w-11 items-center justify-center rounded-full bg-light-yellow text-dark-gold'
                    : 'flex h-11 w-11 items-center justify-center rounded-full bg-bg text-text-secondary'
                }
              >
                <c.icon size={18} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-text">{c.label}</span>
                <span className="block text-xs text-text-secondary">{c.desc}</span>
              </span>
              <ChevronRight size={16} className="text-text-secondary" aria-hidden="true" />
            </button>
          ))}
        </Card>
      </div>
    </MobileLayout>
  );
}
