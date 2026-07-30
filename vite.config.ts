import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  handleSupportChat,
  MAX_BODY_BYTES,
  PASSCODE_HEADER,
  STREAM_HEADERS,
} from './server/supportChat.ts'

const SUPPORT_CHAT_ROUTE = '/api/support-chat'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
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

/**
 * 개발/프리뷰 서버용 채팅 상담 프록시.
 *
 * 프로덕션(Netlify Function)과 **동일한 핸들러**(`server/supportChat.ts`)를 써서
 * 검증·레이트 리밋·암호 게이트 로직이 두 환경에서 갈라지지 않도록 한다.
 * 로컬에서는 암호가 설정되지 않아도 열리도록 fail-closed를 끈다.
 */
function supportChatPlugin(apiKey: string, passcode: string | null): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    let rawBody = ''
    if (req.method === 'POST') {
      try {
        rawBody = await readBody(req)
      } catch {
        res.statusCode = 413
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: '요청이 너무 커요.' }))
        return
      }
    }

    const headerValue = req.headers[PASSCODE_HEADER]
    const outcome = await handleSupportChat(
      {
        method: req.method ?? 'GET',
        rawBody,
        passcode: Array.isArray(headerValue) ? (headerValue[0] ?? null) : (headerValue ?? null),
        clientId: req.socket.remoteAddress ?? 'local',
      },
      { apiKey, passcode, requirePasscodeConfigured: false }
    )

    if (outcome.kind === 'error') {
      res.statusCode = outcome.status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(outcome.body))
      return
    }

    res.statusCode = 200
    for (const [key, value] of Object.entries(STREAM_HEADERS)) res.setHeader(key, value)

    const reader = outcome.stream.getReader()
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
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
  const passcode = env.SUPPORT_CHAT_PASSCODE || process.env.SUPPORT_CHAT_PASSCODE || null

  return {
    plugins: [react(), tailwindcss(), supportChatPlugin(apiKey, passcode)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
