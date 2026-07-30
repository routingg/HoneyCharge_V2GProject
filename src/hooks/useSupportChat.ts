import { useCallback, useRef, useState } from 'react';
import { SUPPORT_GREETING } from '@/data/supportContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface StreamChunk {
  type: 'delta' | 'done' | 'error';
  text?: string;
  message?: string;
}

const ENDPOINT = '/api/support-chat';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 실시간 채팅 상담 상태.
 *
 * 서버(Vite 미들웨어)가 NDJSON 스트림을 흘려보내면 한 줄씩 파싱해
 * `streamingText`를 갱신하고, 완료되면 메시지 목록에 확정한다.
 * API 키는 서버 쪽에만 있으므로 이 훅은 키를 알지 못한다.
 */
export function useSupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', role: 'assistant', content: SUPPORT_GREETING },
  ]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([{ id: 'greeting', role: 'assistant', content: SUPPORT_GREETING }]);
    setStreamingText('');
    setIsStreaming(false);
    setError(null);
  }, [stop]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = { id: createId('u'), role: 'user', content: trimmed };
      // 인사말은 서버로 보내지 않는다(시스템 프롬프트가 이미 역할을 정의함).
      const history = [...messages.filter((m) => m.id !== 'greeting'), userMessage];

      setMessages((prev) => [...prev, userMessage]);
      setStreamingText('');
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = '';
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error ?? '상담 서버에 연결하지 못했어요.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            newlineIndex = buffer.indexOf('\n');
            if (!line) continue;

            let chunk: StreamChunk;
            try {
              chunk = JSON.parse(line) as StreamChunk;
            } catch {
              continue;
            }

            if (chunk.type === 'delta' && chunk.text) {
              accumulated += chunk.text;
              setStreamingText(accumulated);
            } else if (chunk.type === 'error') {
              throw new Error(chunk.message ?? '상담 중 오류가 발생했어요.');
            }
          }
        }

        if (accumulated.trim()) {
          setMessages((prev) => [
            ...prev,
            { id: createId('a'), role: 'assistant', content: accumulated.trim() },
          ]);
        } else {
          setError('답변을 받지 못했어요. 다시 시도해 주세요.');
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          // 사용자가 중단한 경우: 여기까지 받은 내용을 남긴다.
          if (accumulated.trim()) {
            setMessages((prev) => [
              ...prev,
              { id: createId('a'), role: 'assistant', content: accumulated.trim() },
            ]);
          }
        } else {
          setError((e as Error).message);
        }
      } finally {
        setStreamingText('');
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  return { messages, streamingText, isStreaming, error, send, stop, reset };
}
