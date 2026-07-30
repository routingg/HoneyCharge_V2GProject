import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import Anthropic from '@anthropic-ai/sdk'
import {
  SUPPORT_MAX_CHARS,
  SUPPORT_MAX_MESSAGES,
  SUPPORT_SYSTEM_PROMPT,
} from './src/data/supportContext.ts'

const SUPPORT_CHAT_ROUTE = '/api/support-chat'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function readBody(req: IncomingMessage, limitBytes = 256_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function writeLine(res: ServerResponse, payload: unknown) {
  res.write(`${JSON.stringify(payload)}\n`)
}

function sendError(res: ServerResponse, status: number, message: string) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: message }))
}

/** 요청 본문에서 대화 기록을 꺼내 검증한다. 실패하면 문자열 사유를 돌려준다. */
function parseMessages(raw: string): ChatMessage[] | string {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return '요청 형식이 올바르지 않아요.'
  }
  const messages = (parsed as { messages?: unknown })?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return '메시지가 비어 있어요.'
  }
  if (messages.length > SUPPORT_MAX_MESSAGES) {
    return '대화가 너무 길어졌어요. 새로 시작해 주세요.'
  }
  const cleaned: ChatMessage[] = []
  for (const item of messages) {
    const role = (item as { role?: unknown })?.role
    const content = (item as { content?: unknown })?.content
    if (role !== 'user' && role !== 'assistant') return '메시지 형식이 올바르지 않아요.'
    if (typeof content !== 'string' || content.trim().length === 0) {
      return '메시지 내용이 비어 있어요.'
    }
    if (content.length > SUPPORT_MAX_CHARS) return '메시지가 너무 길어요.'
    cleaned.push({ role, content })
  }
  if (cleaned[cleaned.length - 1].role !== 'user') {
    return '마지막 메시지는 사용자 메시지여야 해요.'
  }
  return cleaned
}

/**
 * 실시간 채팅 상담 프록시.
 *
 * ANTHROPIC_API_KEY는 이 Node 프로세스 안에서만 사용되고 클라이언트 번들에는
 * 포함되지 않는다(`VITE_` 접두사가 없으므로 Vite가 주입하지 않음).
 * 응답은 NDJSON 스트림으로 흘려보낸다: {"type":"delta"|"done"|"error", ...}
 */
function supportChatPlugin(apiKey: string): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      sendError(res, 405, 'POST만 지원해요.')
      return
    }
    if (!apiKey) {
      sendError(res, 503, 'ANTHROPIC_API_KEY가 설정되지 않아 상담을 시작할 수 없어요.')
      return
    }

    let raw: string
    try {
      raw = await readBody(req)
    } catch {
      sendError(res, 413, '요청이 너무 커요.')
      return
    }

    const messages = parseMessages(raw)
    if (typeof messages === 'string') {
      sendError(res, 400, messages)
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')

    const client = new Anthropic({ apiKey })
    try {
      const stream = client.messages.stream({
        model: 'claude-opus-5',
        // 대기 시간을 줄이기 위해 낮은 effort를 쓰되 thinking은 켜 둔다.
        // (Opus 5에서 thinking을 끄면 <thinking> 태그가 새어 나올 수 있음)
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' },
        max_tokens: 8192,
        system: SUPPORT_SYSTEM_PROMPT,
        messages,
      })

      stream.on('text', (delta) => writeLine(res, { type: 'delta', text: delta }))

      const final = await stream.finalMessage()

      if (final.stop_reason === 'refusal') {
        writeLine(res, {
          type: 'error',
          message: '이 주제는 답변드리기 어려워요. support@honeycharge.kr로 문의해 주세요.',
        })
      } else {
        writeLine(res, { type: 'done', stopReason: final.stop_reason })
      }
    } catch (error) {
      const message =
        error instanceof Anthropic.AuthenticationError
          ? 'API 키가 올바르지 않아요. .env의 ANTHROPIC_API_KEY를 확인해 주세요.'
          : error instanceof Anthropic.RateLimitError
            ? '요청이 많아 잠시 후 다시 시도해 주세요.'
            : error instanceof Anthropic.APIError
              ? `상담 서버 오류가 발생했어요. (${error.status})`
              : '상담 연결에 실패했어요. 잠시 후 다시 시도해 주세요.'
      // 헤더를 이미 보냈으면 스트림 안에서 오류를 알린다.
      if (res.headersSent) writeLine(res, { type: 'error', message })
      else sendError(res, 502, message)
      // eslint-disable-next-line no-console
      console.error('[support-chat]', error)
    } finally {
      res.end()
    }
  }

  return {
    name: 'honeycharge-support-chat',
    configureServer(server) {
      server.middlewares.use(SUPPORT_CHAT_ROUTE, handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(SUPPORT_CHAT_ROUTE, handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 접두사 ''로 로드해야 VITE_가 붙지 않은 변수까지 읽는다(서버 전용).
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? ''

  return {
    plugins: [react(), tailwindcss(), supportChatPlugin(apiKey)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
