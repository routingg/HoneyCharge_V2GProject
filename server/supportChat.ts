import Anthropic from '@anthropic-ai/sdk'
import {
  SUPPORT_MAX_CHARS,
  SUPPORT_MAX_MESSAGES,
  SUPPORT_SYSTEM_PROMPT,
} from '../src/data/supportContext.ts'

/**
 * 실시간 채팅 상담의 런타임 비의존 핸들러.
 *
 * Vite 개발 서버 미들웨어(Node)와 Netlify Function(Web Request/Response)이
 * 이 파일을 공유한다. 검증·레이트 리밋·암호 게이트가 한 곳에만 존재하도록 해
 * 두 환경의 보안 수준이 갈라지지 않게 한다.
 *
 * ANTHROPIC_API_KEY는 호출자가 환경변수에서 읽어 넘기며, 클라이언트 번들에는
 * 절대 포함되지 않는다(`VITE_` 접두사 없음).
 */

export const PASSCODE_HEADER = 'x-support-passcode'
export const MAX_BODY_BYTES = 256_000

/** 응답 코드 — 클라이언트가 암호 입력 화면을 띄울지 판단하는 데 사용 */
export const ERROR_CODES = {
  passcodeRequired: 'passcode_required',
  passcodeInvalid: 'passcode_invalid',
  notConfigured: 'not_configured',
  rateLimited: 'rate_limited',
} as const

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SupportChatEnv {
  apiKey: string
  /** SUPPORT_CHAT_PASSCODE. null이면 게이트 비활성(로컬 개발용) */
  passcode: string | null
  /**
   * true면 암호가 설정되지 않았을 때 요청을 거부한다(fail-closed).
   * 공개 배포 환경에서 켜서, 환경변수 누락으로 무방비 공개되는 사고를 막는다.
   */
  requirePasscodeConfigured: boolean
}

export interface SupportChatInput {
  method: string
  rawBody: string
  passcode: string | null
  /** 레이트 리밋 키(클라이언트 IP 등) */
  clientId: string
}

export type SupportChatOutcome =
  | { kind: 'error'; status: number; body: { error: string; code?: string } }
  | { kind: 'stream'; stream: ReadableStream<Uint8Array> }

// ── 레이트 리밋 ───────────────────────────────────────────────────────────────
// 서버리스에서는 인스턴스마다 메모리가 분리되므로 이 제한은 **best-effort**다.
// 무차별 호출의 속도를 늦추는 용도이며, 실질적인 방어선은 암호 게이트다.

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8
const GLOBAL_WINDOW_MS = 3_600_000
const MAX_GLOBAL_PER_WINDOW = 300

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let globalBucket: Bucket = { count: 0, resetAt: 0 }

function takeToken(bucket: Bucket, now: number, windowMs: number, max: number): Bucket & { allowed: boolean } {
  if (now >= bucket.resetAt) return { count: 1, resetAt: now + windowMs, allowed: true }
  if (bucket.count >= max) return { ...bucket, allowed: false }
  return { count: bucket.count + 1, resetAt: bucket.resetAt, allowed: true }
}

function checkRateLimit(clientId: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  // 만료된 항목 정리 (메모리 누수 방지)
  if (buckets.size > 500) {
    for (const [key, value] of buckets) if (now >= value.resetAt) buckets.delete(key)
  }

  const globalNext = takeToken(globalBucket, now, GLOBAL_WINDOW_MS, MAX_GLOBAL_PER_WINDOW)
  if (!globalNext.allowed) {
    return { allowed: false, retryAfterSec: Math.ceil((globalBucket.resetAt - now) / 1000) }
  }

  const current = buckets.get(clientId) ?? { count: 0, resetAt: 0 }
  const next = takeToken(current, now, WINDOW_MS, MAX_PER_WINDOW)
  if (!next.allowed) {
    return { allowed: false, retryAfterSec: Math.ceil((current.resetAt - now) / 1000) }
  }

  globalBucket = { count: globalNext.count, resetAt: globalNext.resetAt }
  buckets.set(clientId, { count: next.count, resetAt: next.resetAt })
  return { allowed: true, retryAfterSec: 0 }
}

// ── 암호 비교 ────────────────────────────────────────────────────────────────

/** 길이가 같을 때 조기 종료하지 않는 비교(타이밍 차이 축소). */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ── 입력 검증 ────────────────────────────────────────────────────────────────

function parseMessages(raw: string): ChatMessage[] | string {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return '요청 형식이 올바르지 않아요.'
  }
  const messages = (parsed as { messages?: unknown })?.messages
  if (!Array.isArray(messages) || messages.length === 0) return '메시지가 비어 있어요.'
  if (messages.length > SUPPORT_MAX_MESSAGES) return '대화가 너무 길어졌어요. 새로 시작해 주세요.'

  const cleaned: ChatMessage[] = []
  for (const item of messages) {
    const role = (item as { role?: unknown })?.role
    const content = (item as { content?: unknown })?.content
    if (role !== 'user' && role !== 'assistant') return '메시지 형식이 올바르지 않아요.'
    if (typeof content !== 'string' || content.trim().length === 0) return '메시지 내용이 비어 있어요.'
    if (content.length > SUPPORT_MAX_CHARS) return '메시지가 너무 길어요.'
    cleaned.push({ role, content })
  }
  if (cleaned[cleaned.length - 1].role !== 'user') return '마지막 메시지는 사용자 메시지여야 해요.'
  return cleaned
}

// ── NDJSON 스트림 ────────────────────────────────────────────────────────────

function ndjsonStream(
  run: (write: (payload: unknown) => void) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      }
      try {
        await run(write)
      } catch (error) {
        write({ type: 'error', message: describeError(error) })
        // eslint-disable-next-line no-console
        console.error('[support-chat]', error)
      } finally {
        controller.close()
      }
    },
  })
}

function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return 'API 키가 올바르지 않아요. 서버 환경변수를 확인해 주세요.'
  }
  if (error instanceof Anthropic.RateLimitError) {
    return '요청이 많아 잠시 후 다시 시도해 주세요.'
  }
  if (error instanceof Anthropic.APIError) {
    return `상담 서버 오류가 발생했어요. (${error.status})`
  }
  return '상담 연결에 실패했어요. 잠시 후 다시 시도해 주세요.'
}

// ── 핸들러 ───────────────────────────────────────────────────────────────────

export async function handleSupportChat(
  input: SupportChatInput,
  env: SupportChatEnv
): Promise<SupportChatOutcome> {
  if (input.method !== 'POST') {
    return { kind: 'error', status: 405, body: { error: 'POST만 지원해요.' } }
  }

  // 1) 암호 게이트 — 공개 URL에서 API 크레딧이 무단 소모되는 것을 막는 주 방어선
  if (env.passcode) {
    if (!input.passcode) {
      return {
        kind: 'error',
        status: 401,
        body: { error: '발표용 접속 암호가 필요해요.', code: ERROR_CODES.passcodeRequired },
      }
    }
    if (!constantTimeEquals(input.passcode, env.passcode)) {
      return {
        kind: 'error',
        status: 401,
        body: { error: '암호가 올바르지 않아요.', code: ERROR_CODES.passcodeInvalid },
      }
    }
  } else if (env.requirePasscodeConfigured) {
    // fail-closed: 공개 환경인데 암호가 설정되지 않았다면 아예 열지 않는다.
    return {
      kind: 'error',
      status: 503,
      body: {
        error: '상담 기능이 아직 설정되지 않았어요.',
        code: ERROR_CODES.notConfigured,
      },
    }
  }

  if (!env.apiKey) {
    return {
      kind: 'error',
      status: 503,
      body: { error: '상담 서버가 설정되지 않았어요.', code: ERROR_CODES.notConfigured },
    }
  }

  // 2) 레이트 리밋
  const limit = checkRateLimit(input.clientId)
  if (!limit.allowed) {
    return {
      kind: 'error',
      status: 429,
      body: {
        error: `요청이 너무 잦아요. ${limit.retryAfterSec}초 후 다시 시도해 주세요.`,
        code: ERROR_CODES.rateLimited,
      },
    }
  }

  // 3) 본문 검증
  if (input.rawBody.length > MAX_BODY_BYTES) {
    return { kind: 'error', status: 413, body: { error: '요청이 너무 커요.' } }
  }
  const messages = parseMessages(input.rawBody)
  if (typeof messages === 'string') {
    return { kind: 'error', status: 400, body: { error: messages } }
  }

  // 4) 스트리밍 응답
  const client = new Anthropic({ apiKey: env.apiKey })
  const stream = ndjsonStream(async (write) => {
    const message = client.messages.stream({
      model: 'claude-opus-5',
      // 대기 시간을 줄이려 낮은 effort를 쓰되 thinking은 켜 둔다.
      // (Opus 5에서 thinking을 끄면 <thinking> 태그가 새어 나올 수 있음)
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      max_tokens: 8192,
      system: SUPPORT_SYSTEM_PROMPT,
      messages,
    })

    message.on('text', (delta) => write({ type: 'delta', text: delta }))
    const final = await message.finalMessage()

    if (final.stop_reason === 'refusal') {
      write({
        type: 'error',
        message: '이 주제는 답변드리기 어려워요. support@honeycharge.kr로 문의해 주세요.',
      })
    } else {
      write({ type: 'done', stopReason: final.stop_reason })
    }
  })

  return { kind: 'stream', stream }
}

/** 스트리밍 응답에 공통으로 붙이는 헤더 */
export const STREAM_HEADERS: Record<string, string> = {
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}
