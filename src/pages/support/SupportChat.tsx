import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Bot, RotateCcw, Send, Square } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useSupportChat } from '@/hooks/useSupportChat';
import { SUPPORT_MAX_CHARS, SUPPORT_SUGGESTIONS } from '@/data/supportContext';
import { cn } from '@/utils/cn';

export default function SupportChat() {
  const { messages, streamingText, isStreaming, error, send, stop, reset } = useSupportChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText, error]);

  const submit = (text: string) => {
    if (!text.trim() || isStreaming) return;
    void send(text);
    setInput('');
    inputRef.current?.focus();
  };

  const showSuggestions = messages.length === 1 && !isStreaming;

  return (
    <MobileLayout title="실시간 채팅 상담" showBack showBottomNav={false} noPadding scrollable={false}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-3">
            {messages.map((m) =>
              m.role === 'assistant' ? (
                <AssistantBubble key={m.id} text={m.content} />
              ) : (
                <UserBubble key={m.id} text={m.content} />
              )
            )}

            {isStreaming && <AssistantBubble text={streamingText} pending />}

            {error && (
              <div className="flex items-start gap-2 rounded-card border border-danger/30 bg-danger/5 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {showSuggestions && (
              <div className="mt-1 flex flex-col gap-2">
                <p className="text-xs text-text-secondary">이런 걸 물어보실 수 있어요</p>
                {SUPPORT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-card border border-border bg-card px-3.5 py-2.5 text-left text-sm text-text shadow-card active:scale-[0.99]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-2 text-center text-[11px] leading-relaxed text-text-secondary">
              AI 상담원이 답변하며, 잘못된 내용이 포함될 수 있어요.
              <br />
              충전소·제휴 매장·포인트는 시연용 가상 데이터입니다.
            </p>
            <div ref={bottomRef} />
          </div>
        </div>

        <div
          className="shrink-0 border-t border-border bg-card px-3 py-2.5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
        >
          <div className="flex items-end gap-2">
            <button
              type="button"
              aria-label="대화 새로 시작"
              onClick={reset}
              disabled={isStreaming}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary disabled:opacity-40"
            >
              <RotateCcw size={17} aria-hidden="true" />
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, SUPPORT_MAX_CHARS))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder="궁금한 점을 입력해 주세요"
              aria-label="상담 메시지 입력"
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-button border border-border bg-bg px-3.5 py-3 text-sm text-text outline-none placeholder:text-text-secondary"
            />

            {isStreaming ? (
              <button
                type="button"
                aria-label="답변 중지"
                onClick={stop}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#202124] text-white"
              >
                <Square size={15} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="메시지 보내기"
                onClick={() => submit(input)}
                disabled={!input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-[#202124] disabled:opacity-40"
              >
                <Send size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function AssistantBubble({ text, pending = false }: { text: string; pending?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
        <Bot size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 max-w-[85%] rounded-card rounded-tl-md border border-border bg-card px-3.5 py-2.5 shadow-card">
        {text ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">
            {text}
            {pending && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
          </p>
        ) : (
          <span className="flex items-center gap-1 py-1" aria-label="답변을 작성하고 있어요">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary/50"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          'max-w-[85%] rounded-card rounded-tr-md bg-primary px-3.5 py-2.5',
          'whitespace-pre-wrap break-words text-sm leading-relaxed text-[#202124]'
        )}
      >
        {text}
      </div>
    </div>
  );
}
