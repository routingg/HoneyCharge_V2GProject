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
const PASSCODE_HEADER = 'x-support-passcode';
/** sessionStorage — 탭을 닫으면 사라지므로 공용 PC에 암호가 남지 않는다. */
const PASSCODE_STORAGE_KEY = 'honeycharge-support-passcode';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredPasscode(): string | null {
  try {
    return window.sessionStorage.getItem(PASSCODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storePasscode(code: string | null) {
  try {
    if (code) window.sessionStorage.setItem(PASSCODE_STORAGE_KEY, code);
    else window.sessionStorage.removeItem(PASSCODE_STORAGE_KEY);
  } catch {
    /* private 모드 등 storage 접근 불가 — 메모리 값으로만 동작 */
  }
}

const greeting = (): ChatMessage => ({
  id: 'greeting',
  role: 'assistant',
  content: SUPPORT_GREETING,
});

/**
 * 실시간 채팅 상담 상태.
 *
 * 서버가 NDJSON 스트림을 흘려보내면 한 줄씩 파싱해 `streamingText`를 갱신하고,
 * 완료되면 메시지 목록에 확정한다.
 *
 * 배포 환경에서는 서버가 접속 암호를 요구한다(401 + code). 그때 `needsPasscode`가
 * 켜지고, 사용자가 암호를 입력하면 실패했던 요청을 그대로 재시도한다.
 * API 키는 서버에만 있으므로 이 훅은 키를 알지 못한다.
 */
export function useSupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([greeting()]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const passcodeRef = useRef<string | null>(readStoredPasscode());
  /** 암호 입력 후 재시도할 대화 기록 */
  const pendingHistoryRef = useRef<ChatMessage[] | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([greeting()]);
    setStreamingText('');
    setIsStreaming(false);
    setError(null);
    setNeedsPasscode(false);
    setPasscodeError(null);
    pendingHistoryRef.current = null;
  }, [stop]);

  const runRequest = useCallback(async (history: ChatMessage[]) => {
    setStreamingText('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (passcodeRef.current) headers[PASSCODE_HEADER] = passcodeRef.current;

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        const detail = await response.json().catch(() => null);
        // 저장된 암호가 틀렸다면 지우고 다시 입력받는다.
        if (detail?.code === 'passcode_invalid') {
          passcodeRef.current = null;
          storePasscode(null);
          setPasscodeError(detail?.error ?? '암호가 올바르지 않아요.');
        } else {
          setPasscodeError(null);
        }
        pendingHistoryRef.current = history;
        setNeedsPasscode(true);
        return;
      }

      if (!response.ok || !response.body) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? '상담 서버에 연결하지 못했어요.');
      }

      setNeedsPasscode(false);
      setPasscodeError(null);
      pendingHistoryRef.current = null;

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
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = { id: createId('u'), role: 'user', content: trimmed };
      // 인사말은 서버로 보내지 않는다(시스템 프롬프트가 이미 역할을 정의함).
      const history = [...messages.filter((m) => m.id !== 'greeting'), userMessage];

      setMessages((prev) => [...prev, userMessage]);
      await runRequest(history);
    },
    [messages, isStreaming, runRequest]
  );

  const submitPasscode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      passcodeRef.current = trimmed;
      storePasscode(trimmed);
      setPasscodeError(null);
      setNeedsPasscode(false);

      const history = pendingHistoryRef.current;
      if (history) await runRequest(history);
    },
    [runRequest]
  );

  const dismissPasscode = useCallback(() => {
    setNeedsPasscode(false);
    // 전송하지 못한 사용자 메시지는 목록에서 되돌린다.
    const history = pendingHistoryRef.current;
    if (history) {
      const lastId = history[history.length - 1]?.id;
      setMessages((prev) => prev.filter((m) => m.id !== lastId));
    }
    pendingHistoryRef.current = null;
  }, []);

  return {
    messages,
    streamingText,
    isStreaming,
    error,
    needsPasscode,
    passcodeError,
    send,
    stop,
    reset,
    submitPasscode,
    dismissPasscode,
  };
}
